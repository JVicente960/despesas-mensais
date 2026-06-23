/* =====================================================================
   app.js · Controlador da interface
   Usa: window.Store (dados) e window.Charts (gráficos)
   ---------------------------------------------------------------------
   Seções:
   A. Estado e utilitários
   B. Autenticação (tela de login)
   C. Inicialização do app
   D. Navegação (mês + abas)
   E. Render: Visão geral
   F. Render: Investimentos
   G. Render: Histórico
   H. Render: Categorias
   I. Modais e formulários
   ===================================================================== */
(function () {
  'use strict';

  /* ============================ A. ESTADO ============================ */
  var data = null;              // dados do usuário logado
  var view = new Date();        // mês/ano sendo visualizado
  var $ = function (id) { return document.getElementById(id); };

  var MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  var MONTHS_SHORT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  var SWATCHES = ['#ff2d78','#b94dff','#8257ff','#3366ff','#19b9ff','#00d6b4','#2fdd76','#c2ee2e','#ff9f1c','#ff5f6d'];

  // Formata dinheiro respeitando a moeda escolhida
  function money(n, opts) {
    opts = opts || {};
    var cur = (data && data.currency) || 'BRL';
    var locale = cur === 'BRL' ? 'pt-BR' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency', currency: cur,
      minimumFractionDigits: opts.cents ? 2 : 0,
      maximumFractionDigits: opts.cents ? 2 : 0
    }).format(n);
  }

  function monthKey(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
  function txnMonthKey(iso) { return iso.slice(0, 7); }
  function shortDate(iso) { var p = iso.split('-'); return Number(p[2]) + ' ' + MONTHS_SHORT[Number(p[1]) - 1]; }

  function catById(id) {
    return data.categories.find(function (c) { return c.id === id; })
        || { name: 'Sem categoria', color: '#888' };
  }

  // Transações de um mês específico
  function txnsOf(d) {
    var key = monthKey(d);
    return data.transactions.filter(function (t) { return txnMonthKey(t.date) === key; });
  }

  // Total por categoria no mês (retorna [{cat, total}] ordenado desc)
  function categoryTotals(d) {
    var txns = txnsOf(d), map = {};
    txns.forEach(function (t) { map[t.categoryId] = (map[t.categoryId] || 0) + t.amount; });
    return data.categories
      .map(function (c) { return { cat: c, total: map[c.id] || 0 }; })
      .filter(function (x) { return x.total > 0; })
      .sort(function (a, b) { return b.total - a.total; });
  }

  function save() {
    // grava no servidor em segundo plano (a tela já atualizou com os dados em memória)
    Store.saveData(data).catch(function (e) { console.error('Falha ao salvar:', e); });
  }

  /* ======================== B. AUTENTICAÇÃO ========================= */
  var authMode = 'login'; // 'login' | 'register'

  function setupAuth() {
    var form = $('auth-form');
    var switchBtn = $('auth-switch-btn');

    switchBtn.addEventListener('click', function () {
      authMode = authMode === 'login' ? 'register' : 'login';
      var login = authMode === 'login';
      $('auth-title').textContent = login ? 'Entrar' : 'Criar conta';
      $('auth-subtitle').textContent = login ? 'Acesse seu painel de despesas.' : 'Comece a controlar seus gastos.';
      $('auth-submit').textContent = login ? 'Entrar' : 'Criar conta';
      $('auth-switch-text').textContent = login ? 'Não tem conta?' : 'Já tem conta?';
      switchBtn.textContent = login ? 'Criar conta' : 'Entrar';
      $('auth-error').textContent = '';
    });

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var user = $('auth-user').value;
      var pass = $('auth-pass').value;
      var res = authMode === 'login'
        ? await Store.login(user, pass)
        : await Store.register(user, pass);

      if (!res.ok) { $('auth-error').textContent = res.error; return; }
      if (authMode === 'register') {
        var loginRes = await Store.login(user, pass);
        if (!loginRes.ok) { $('auth-error').textContent = loginRes.error; return; }
      }
      await startApp();
    });
  }

  /* ===================== C. INICIALIZAÇÃO DO APP ==================== */
  async function startApp() {
    try {
      data = await Store.fetchData();   // carrega do servidor (semeia se for novo)
    } catch (e) {
      // sessão expirada / sem conexão -> volta pro login
      await Store.logout();
      $('app').hidden = true;
      $('auth-screen').hidden = false;
      $('auth-error').textContent = e.message || 'Não foi possível carregar seus dados.';
      return;
    }

    view = new Date();
    $('auth-screen').hidden = true;
    $('app').hidden = false;

    var user = Store.currentUser();
    $('avatar-initials').textContent = user.slice(0, 2).toUpperCase();
    $('menu-username').textContent = user;
    updateCurrencyLabel();

    renderAll();
  }

  function renderAll() {
    $('month-label').textContent = MONTHS[view.getMonth()] + ' ' + view.getFullYear();
    renderOverview();
    renderInvestments();
    renderHistory();
    renderCategories();
  }

  /* ========================= D. NAVEGAÇÃO ========================== */
  function setupNav() {
    $('month-prev').addEventListener('click', function () {
      view = new Date(view.getFullYear(), view.getMonth() - 1, 1); renderAll();
    });
    $('month-next').addEventListener('click', function () {
      view = new Date(view.getFullYear(), view.getMonth() + 1, 1); renderAll();
    });

    // abas
    document.querySelectorAll('.tab').forEach(function (tab) {
      tab.addEventListener('click', function () { switchView(tab.dataset.view); });
    });
  }

  function switchView(name) {
    document.querySelectorAll('.tab').forEach(function (t) {
      t.classList.toggle('is-active', t.dataset.view === name);
    });
    document.querySelectorAll('.view').forEach(function (v) {
      var active = v.dataset.view === name;
      v.classList.toggle('is-active', active);
      v.hidden = !active;
    });
  }

  /* ======================= E. VISÃO GERAL ========================== */
  function renderOverview() {
    var totals = categoryTotals(view);
    var spent = totals.reduce(function (s, x) { return s + x.total; }, 0);
    var budget = data.budget;
    var left = budget - spent;

    // donut
    Charts.donut($('donut'),
      totals.map(function (x) { return { value: x.total, color: x.cat.color }; }),
      { caption: 'GASTO', value: money(spent), sub: 'de ' + money(budget) }
    );

    // legenda
    $('legend').innerHTML = totals.map(function (x) {
      return '<div class="legend__item">' +
        '<span class="legend__dot" style="background:' + x.cat.color + '"></span>' +
        '<span class="legend__name">' + escapeHtml(x.cat.name) + '</span>' +
        '<span class="legend__value">' + money(x.total) + '</span>' +
      '</div>';
    }).join('') || '<p class="empty">Nenhuma despesa neste mês.</p>';

    // estatística: disponível
    $('stat-left').textContent = money(left);
    $('stat-left').className = 'stat ' + (left >= 0 ? 'stat--green' : '');
    if (left < 0) $('stat-left').style.color = '#ff6b8a'; else $('stat-left').style.color = '';
    var pctLeft = budget > 0 ? Math.round((left / budget) * 100) : 0;
    $('stat-left-hint').textContent = pctLeft + '% do orçamento';

    // estatística: média diária
    var today = new Date();
    var sameMonth = view.getMonth() === today.getMonth() && view.getFullYear() === today.getFullYear();
    var daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    var days = sameMonth ? today.getDate() : daysInMonth;
    $('stat-daily').textContent = money(spent / days);
    $('stat-daily-hint').textContent = 'em ' + days + ' dias';

    // atividade recente
    var txns = txnsOf(view).sort(function (a, b) { return b.date.localeCompare(a.date); });
    $('activity').innerHTML = txns.map(function (t) {
      var c = catById(t.categoryId);
      return '<li class="activity__item">' +
        '<span class="activity__dot" style="background:' + c.color + '"></span>' +
        '<div class="activity__info">' +
          '<span class="activity__title">' + escapeHtml(t.merchant) + '</span>' +
          '<span class="activity__meta">' + escapeHtml(c.name) + ' · ' + shortDate(t.date) + '</span>' +
        '</div>' +
        '<span class="activity__amount">-' + money(t.amount, { cents: true }) + '</span>' +
        '<button class="activity__del" data-del-txn="' + t.id + '" aria-label="Remover">' +
          '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
        '</button>' +
      '</li>';
    }).join('') || '<p class="empty">Nenhuma despesa. Toque em “+ Despesa”.</p>';
  }

  /* ======================= F. INVESTIMENTOS ======================== */
  function renderInvestments() {
    var inv = data.investments;
    var invested = inv.reduce(function (s, x) { return s + x.invested; }, 0);
    var current = inv.reduce(function (s, x) { return s + x.current; }, 0);
    var ret = current - invested;
    var pct = invested > 0 ? (ret / invested) * 100 : 0;

    $('inv-invested').textContent = money(invested);
    $('inv-current').textContent = money(current);
    $('inv-return').textContent = (ret >= 0 ? '+' : '') + money(ret);
    $('inv-return').className = 'stat ' + (ret >= 0 ? 'stat--green' : '');
    $('inv-return-pct').textContent = (ret >= 0 ? '+' : '') + pct.toFixed(1) + '%';

    Charts.donut($('inv-donut'),
      inv.map(function (x) { return { value: x.current, color: x.color }; }),
      { caption: 'CARTEIRA', value: money(current), sub: inv.length + ' ativos' }
    );

    $('inv-legend').innerHTML = inv.map(function (x) {
      return '<div class="legend__item">' +
        '<span class="legend__dot" style="background:' + x.color + '"></span>' +
        '<span class="legend__name">' + escapeHtml(x.name) + '</span>' +
        '<span class="legend__value">' + money(x.current) + '</span>' +
      '</div>';
    }).join('') || '';

    $('inv-list').innerHTML = inv.map(function (x) {
      var r = x.current - x.invested;
      var rp = x.invested > 0 ? (r / x.invested) * 100 : 0;
      return '<li class="activity__item">' +
        '<span class="activity__dot" style="background:' + x.color + '"></span>' +
        '<div class="activity__info">' +
          '<span class="activity__title">' + escapeHtml(x.name) + '</span>' +
          '<span class="activity__meta">' + x.type + ' · investido ' + money(x.invested) + '</span>' +
        '</div>' +
        '<span class="activity__amount ' + (r >= 0 ? 'is-positive' : '') + '">' +
          (r >= 0 ? '+' : '') + rp.toFixed(1) + '%</span>' +
        '<button class="activity__del" data-del-inv="' + x.id + '" aria-label="Remover">' +
          '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
        '</button>' +
      '</li>';
    }).join('') || '<p class="empty">Nenhum investimento cadastrado.</p>';
  }

  /* ========================= G. HISTÓRICO ========================== */
  function renderHistory() {
    // últimos 6 meses terminando no mês visualizado
    var series = [];
    for (var i = 5; i >= 0; i--) {
      var d = new Date(view.getFullYear(), view.getMonth() - i, 1);
      var total = txnsOf(d).reduce(function (s, t) { return s + t.amount; }, 0);
      series.push({ label: MONTHS_SHORT[d.getMonth()], value: total, active: i === 0, date: d });
    }

    Charts.bars($('barchart'), series, function (v) { return money(v); }, function (idx) {
      view = new Date(series[idx].date);
      renderAll();
    });

    // detalhamento por categoria do mês visualizado
    $('history-month-label').textContent = 'Detalhes · ' + MONTHS[view.getMonth()] + ' ' + view.getFullYear();
    var totals = categoryTotals(view);
    $('history-breakdown').innerHTML = totals.map(function (x) {
      return '<li class="activity__item">' +
        '<span class="activity__dot" style="background:' + x.cat.color + '"></span>' +
        '<div class="activity__info"><span class="activity__title">' + escapeHtml(x.cat.name) + '</span></div>' +
        '<span class="activity__amount">' + money(x.total) + '</span>' +
      '</li>';
    }).join('') || '<p class="empty">Sem despesas neste mês.</p>';
  }

  /* ========================= H. CATEGORIAS ========================= */
  function renderCategories() {
    // total gasto por categoria considerando TODOS os meses
    var allTotals = {};
    data.transactions.forEach(function (t) { allTotals[t.categoryId] = (allTotals[t.categoryId] || 0) + t.amount; });

    $('catlist').innerHTML = data.categories.map(function (c) {
      return '<li class="catlist__item">' +
        '<span class="catlist__dot" style="background:' + c.color + '"></span>' +
        '<span class="catlist__name">' + escapeHtml(c.name) + '</span>' +
        '<span class="catlist__total">' + money(allTotals[c.id] || 0) + ' no total</span>' +
        '<button class="catlist__del" data-del-cat="' + c.id + '" aria-label="Remover ' + escapeHtml(c.name) + '">' +
          '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
        '</button>' +
      '</li>';
    }).join('');
  }

  /* ===================== I. MODAIS E FORMULÁRIOS ==================== */
  var modalSubmit = null;

  function openModal(title, bodyHtml, onSubmit) {
    $('modal-title').textContent = title;
    $('modal-form').innerHTML = bodyHtml +
      '<div class="modal__actions">' +
        '<button type="button" class="btn" data-close>Cancelar</button>' +
        '<button type="submit" class="btn btn--primary">Salvar</button>' +
      '</div>';
    modalSubmit = onSubmit;
    $('modal').hidden = false;

    // ativa o seletor de cor, se existir
    var swatches = $('modal-form').querySelectorAll('.swatch');
    swatches.forEach(function (sw) {
      sw.addEventListener('click', function () {
        swatches.forEach(function (s) { s.classList.remove('is-selected'); });
        sw.classList.add('is-selected');
        $('modal-form').dataset.color = sw.dataset.color;
      });
    });

    var first = $('modal-form').querySelector('input, select');
    if (first) first.focus();
  }

  function closeModal() { $('modal').hidden = true; modalSubmit = null; }

  function categoryOptions(selected) {
    return data.categories.map(function (c) {
      return '<option value="' + c.id + '"' + (c.id === selected ? ' selected' : '') + '>' + escapeHtml(c.name) + '</option>';
    }).join('');
  }

  function swatchesHtml(selected) {
    return '<div class="swatches">' + SWATCHES.map(function (c) {
      return '<span class="swatch' + (c === selected ? ' is-selected' : '') + '" data-color="' + c + '" style="background:' + c + '"></span>';
    }).join('') + '</div>';
  }

  // -- Adicionar despesa --
  function openAddExpense() {
    var defDay = Math.min(new Date().getDate(), new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate());
    var defDate = monthKey(view) + '-' + String(defDay).padStart(2, '0');
    openModal('Nova despesa',
      '<label class="field"><span class="field__label">Descrição</span>' +
        '<input class="field__input" name="merchant" required placeholder="Ex.: Supermercado"></label>' +
      '<label class="field"><span class="field__label">Categoria</span>' +
        '<select name="categoryId">' + categoryOptions(data.categories[0].id) + '</select></label>' +
      '<div class="field__row">' +
        '<label class="field"><span class="field__label">Valor</span>' +
          '<input class="field__input" name="amount" type="number" step="0.01" min="0" required placeholder="0,00"></label>' +
        '<label class="field"><span class="field__label">Data</span>' +
          '<input class="field__input" name="date" type="date" value="' + defDate + '" required></label>' +
      '</div>',
      function (f) {
        data.transactions.push({
          id: Store.uid(),
          merchant: f.merchant.trim() || 'Despesa',
          categoryId: f.categoryId,
          amount: Math.abs(parseFloat(f.amount) || 0),
          date: f.date
        });
        save();
        view = new Date(Number(f.date.slice(0, 4)), Number(f.date.slice(5, 7)) - 1, 1);
        renderAll();
      });
  }

  // -- Adicionar categoria --
  function openAddCategory() {
    openModal('Nova categoria',
      '<label class="field"><span class="field__label">Nome</span>' +
        '<input class="field__input" name="name" required placeholder="Ex.: Educação"></label>' +
      '<div class="field"><span class="field__label">Cor</span>' + swatchesHtml(SWATCHES[0]) + '</div>',
      function (f) {
        var color = $('modal-form').dataset.color || SWATCHES[0];
        data.categories.push({ id: 'cat-' + Store.uid(), name: f.name.trim() || 'Categoria', color: color });
        save();
        renderAll();
      });
    $('modal-form').dataset.color = SWATCHES[0];
  }

  // -- Adicionar investimento --
  function openAddInvestment() {
    var types = ['Renda Fixa', 'Ações', 'FII', 'Cripto', 'Fundos', 'Outros'];
    openModal('Novo investimento',
      '<label class="field"><span class="field__label">Nome</span>' +
        '<input class="field__input" name="name" required placeholder="Ex.: Tesouro Selic"></label>' +
      '<label class="field"><span class="field__label">Tipo</span><select name="type">' +
        types.map(function (t) { return '<option>' + t + '</option>'; }).join('') + '</select></label>' +
      '<div class="field__row">' +
        '<label class="field"><span class="field__label">Investido</span>' +
          '<input class="field__input" name="invested" type="number" step="0.01" min="0" required placeholder="0,00"></label>' +
        '<label class="field"><span class="field__label">Valor atual</span>' +
          '<input class="field__input" name="current" type="number" step="0.01" min="0" placeholder="0,00"></label>' +
      '</div>' +
      '<div class="field"><span class="field__label">Cor</span>' + swatchesHtml(SWATCHES[3]) + '</div>',
      function (f) {
        var color = $('modal-form').dataset.color || SWATCHES[3];
        var invested = Math.abs(parseFloat(f.invested) || 0);
        var current = f.current ? Math.abs(parseFloat(f.current)) : invested;
        data.investments.push({
          id: Store.uid(), name: f.name.trim() || 'Investimento',
          type: f.type, invested: invested, current: current,
          date: new Date().toISOString().slice(0, 10), color: color
        });
        save();
        renderInvestments();
      });
    $('modal-form').dataset.color = SWATCHES[3];
  }

  // -- Definir orçamento --
  function openBudget() {
    openModal('Orçamento mensal',
      '<label class="field"><span class="field__label">Valor do orçamento</span>' +
        '<input class="field__input" name="budget" type="number" step="0.01" min="0" required value="' + data.budget + '"></label>',
      function (f) {
        data.budget = Math.abs(parseFloat(f.budget) || 0);
        save();
        renderOverview();
      });
  }

  // -- Remover categoria (reatribui transações para "Outros" / primeira restante) --
  function deleteCategory(id) {
    if (data.categories.length <= 1) { alert('Mantenha ao menos uma categoria.'); return; }
    var cat = catById(id);
    if (!confirm('Remover a categoria "' + cat.name + '"? As despesas dela vão para outra categoria.')) return;

    var fallback = data.categories.find(function (c) { return c.id !== id && /outros/i.test(c.name); })
                || data.categories.find(function (c) { return c.id !== id; });
    data.transactions.forEach(function (t) { if (t.categoryId === id) t.categoryId = fallback.id; });
    data.categories = data.categories.filter(function (c) { return c.id !== id; });
    save();
    renderAll();
  }

  /* ===================== EVENTOS GLOBAIS / WIRING =================== */
  function setupEvents() {
    // botões de abrir modais
    $('add-expense').addEventListener('click', openAddExpense);
    $('add-investment').addEventListener('click', openAddInvestment);
    $('add-category').addEventListener('click', openAddCategory);
    $('edit-categories').addEventListener('click', function () { switchView('categories'); });

    // submit do modal
    $('modal-form').addEventListener('submit', function (e) {
      e.preventDefault();
      if (!modalSubmit) return;
      var f = {};
      new FormData(e.target).forEach(function (v, k) { f[k] = v; });
      modalSubmit(f);
      closeModal();
    });

    // fechar modal (backdrop, X, cancelar, Esc)
    $('modal').addEventListener('click', function (e) {
      if (e.target.hasAttribute('data-close')) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !$('modal').hidden) closeModal();
    });

    // delegação: remover itens (despesa / investimento / categoria)
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-del-txn]');
      if (t) {
        var id = t.getAttribute('data-del-txn');
        data.transactions = data.transactions.filter(function (x) { return x.id !== id; });
        save(); renderAll(); return;
      }
      var inv = e.target.closest('[data-del-inv]');
      if (inv) {
        var iid = inv.getAttribute('data-del-inv');
        data.investments = data.investments.filter(function (x) { return x.id !== iid; });
        save(); renderInvestments(); return;
      }
      var cat = e.target.closest('[data-del-cat]');
      if (cat) { deleteCategory(cat.getAttribute('data-del-cat')); return; }
    });

    // menu da conta
    var avatar = $('avatar-btn');
    var menu = $('account-menu');
    function toggleMenu(open) { menu.hidden = open === undefined ? !menu.hidden : !open; }
    avatar.addEventListener('click', function (e) {
      if (e.target.closest('.menu')) return; // cliques dentro do menu
      toggleMenu();
    });
    avatar.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMenu(); } });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.avatar')) menu.hidden = true;
    });

    $('menu-budget').addEventListener('click', function () { menu.hidden = true; openBudget(); });
    $('menu-currency').addEventListener('click', function () {
      data.currency = data.currency === 'BRL' ? 'USD' : 'BRL';
      save(); updateCurrencyLabel(); renderAll(); menu.hidden = true;
    });
    $('menu-logout').addEventListener('click', function () {
      Store.logout();
      data = null;
      $('app').hidden = true;
      $('auth-screen').hidden = false;
      $('auth-user').value = ''; $('auth-pass').value = ''; $('auth-error').textContent = '';
    });
  }

  function updateCurrencyLabel() {
    $('menu-currency').textContent = 'Moeda: ' + (data.currency === 'BRL' ? 'R$' : 'US$');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ============================ BOOT ============================ */
 async function boot() {
    document.title = 'BOOT RODOU';   // marca de teste
    setupAuth();
    setupNav();
    setupEvents();
    if (Store.currentUser()) {
      await startApp();
    } else {
      $('auth-screen').hidden = false;
      document.getElementById('modal').hidden = true;   // garante modal escondido
    }
  }

  setTimeout(boot, 0);
})();
