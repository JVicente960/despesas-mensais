/* =====================================================================
   app.js · Controlador da interface
   Usa: window.Store (dados) e window.Charts (gráficos)
   ===================================================================== */
(function () {
  'use strict';

  /* ============================ ESTADO ============================ */
  var data = null;
  var view = new Date();
  var $ = function (id) { return document.getElementById(id); };

  var MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  var MONTHS_SHORT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

  // Paleta de cores (19 opções) para categorias e investimentos
  var SWATCHES = [
    '#ff2d78','#b94dff','#8257ff','#3366ff','#19b9ff','#00d6b4','#2fdd76','#c2ee2e','#ff9f1c','#ff5f6d',
    '#f43f9d','#7c3aed','#4f46e5','#0284c7','#06b6d4','#10b981','#84cc16','#f59e0b','#dc2626'
  ];

  var INV_TYPES = ['Renda Fixa','Ações','FII','Cripto','Fundos','Tesouro','Previdência','Outros'];

  // ícones reutilizáveis (svg)
  var ICON_EDIT = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M4 20h4l10-10-4-4L4 16v4zM14 6l4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_DEL  = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  /* --------------------------- utilitários -------------------------- */
  function money(n, opts) {
    opts = opts || {};
    var cur = (data && data.currency) || 'BRL';
    var locale = cur === 'BRL' ? 'pt-BR' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency', currency: cur,
      minimumFractionDigits: opts.cents ? 2 : 0,
      maximumFractionDigits: opts.cents ? 2 : 0
    }).format(n || 0);
  }

  function monthKey(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
  function shortDate(iso) { var p = iso.split('-'); return Number(p[2]) + ' ' + MONTHS_SHORT[Number(p[1]) - 1]; }
  function todayStr() { return new Date().toISOString().slice(0, 10); }
  function viewDateStr() {
    var last = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    var day = Math.min(new Date().getDate(), last);
    return monthKey(view) + '-' + String(day).padStart(2, '0');
  }

  function catById(id) {
    return data.categories.find(function (c) { return c.id === id; }) || { name: 'Sem categoria', color: '#888' };
  }
  function budgetFor(d) {
    var k = monthKey(d);
    return data.monthBudgets[k] != null ? data.monthBudgets[k] : data.budget;
  }
  function investedOf(inv) {
    return inv.movements.reduce(function (s, m) { return s + (m.kind === 'saque' ? -m.amount : m.amount); }, 0);
  }

  // despesas com lançamentos no mês -> [{ exp, entries, total, lastDate }]
  function monthGroups(d) {
    var key = monthKey(d), groups = [];
    data.expenses.forEach(function (exp) {
      var ents = exp.entries.filter(function (e) { return e.date.slice(0, 7) === key; });
      if (ents.length) {
        var total = ents.reduce(function (s, e) { return s + e.amount; }, 0);
        var lastDate = ents.map(function (e) { return e.date; }).sort().pop();
        groups.push({ exp: exp, entries: ents, total: total, lastDate: lastDate });
      }
    });
    groups.sort(function (a, b) { return b.lastDate.localeCompare(a.lastDate); });
    return groups;
  }

  // total por categoria no mês -> [{cat, total}] desc
  function categoryTotals(d) {
    var key = monthKey(d), map = {};
    data.expenses.forEach(function (exp) {
      exp.entries.forEach(function (e) {
        if (e.date.slice(0, 7) === key) map[exp.categoryId] = (map[exp.categoryId] || 0) + e.amount;
      });
    });
    return data.categories
      .map(function (c) { return { cat: c, total: map[c.id] || 0 }; })
      .filter(function (x) { return x.total > 0; })
      .sort(function (a, b) { return b.total - a.total; });
  }

  // salvamento com debounce (deixa o app mais rápido em edições seguidas)
  var saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      Store.saveData(data).catch(function (e) { console.error('Falha ao salvar:', e); });
    }, 400);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ======================== AUTENTICAÇÃO ========================= */
  var authMode = 'login';

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
      $('auth-submit').disabled = true;
      var user = $('auth-user').value, pass = $('auth-pass').value;
      var res = authMode === 'login' ? await Store.login(user, pass) : await Store.register(user, pass);
      if (!res.ok) { $('auth-error').textContent = res.error; $('auth-submit').disabled = false; return; }
      if (authMode === 'register') {
        var lr = await Store.login(user, pass);
        if (!lr.ok) { $('auth-error').textContent = lr.error; $('auth-submit').disabled = false; return; }
      }
      await startApp();
      $('auth-submit').disabled = false;
    });
  }

  /* ===================== INICIALIZAÇÃO ==================== */
  async function startApp() {
    try { data = await Store.fetchData(); }
    catch (e) {
      await Store.logout();
      $('app').hidden = true; $('auth-screen').hidden = false;
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
    injectHistoryControls();
    renderAll();
  }

  function renderAll() {
    $('month-label').textContent = MONTHS[view.getMonth()] + ' ' + view.getFullYear();
    renderOverview();
    renderInvestments();
    renderHistory();
    renderCategories();
  }

  /* ========================= NAVEGAÇÃO ========================== */
  function setupNav() {
    $('month-prev').addEventListener('click', function () { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); renderAll(); });
    $('month-next').addEventListener('click', function () { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); renderAll(); });
    document.querySelectorAll('.tab').forEach(function (tab) {
      tab.addEventListener('click', function () { switchView(tab.dataset.view); });
    });
  }

  function switchView(name) {
    document.querySelectorAll('.tab').forEach(function (t) { t.classList.toggle('is-active', t.dataset.view === name); });
    document.querySelectorAll('.view').forEach(function (v) {
      var active = v.dataset.view === name;
      v.classList.toggle('is-active', active);
      v.hidden = !active;
    });
  }

  // controles do histórico (seletor de mês + setas) — injetados uma vez
  function injectHistoryControls() {
    var head = document.querySelector('.view--history .card__head');
    if (!head || head.querySelector('.histnav')) return;
    var nav = document.createElement('div');
    nav.className = 'histnav';
    nav.innerHTML =
      '<button class="iconbtn" id="hist-prev" aria-label="Mês anterior"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
      '<input type="month" id="hist-month" class="histnav__input" aria-label="Escolher mês">' +
      '<button class="iconbtn" id="hist-next" aria-label="Próximo mês"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';
    head.appendChild(nav);

    $('hist-prev').addEventListener('click', function () { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); renderAll(); });
    $('hist-next').addEventListener('click', function () { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); renderAll(); });
    $('hist-month').addEventListener('change', function () {
      var v = this.value; if (!v) return;
      view = new Date(Number(v.slice(0, 4)), Number(v.slice(5, 7)) - 1, 1);
      renderAll();
    });
  }

  /* ======================= VISÃO GERAL ========================== */
  function renderOverview() {
    var totals = categoryTotals(view);
    var spent = totals.reduce(function (s, x) { return s + x.total; }, 0);
    var budget = budgetFor(view);
    var left = budget - spent;

    Charts.donut($('donut'),
      totals.map(function (x) { return { value: x.total, color: x.cat.color }; }),
      { caption: 'GASTO', value: money(spent), sub: 'de ' + money(budget) });

    $('legend').innerHTML = totals.map(function (x) {
      return '<div class="legend__item">' +
        '<span class="legend__dot" style="background:' + x.cat.color + '"></span>' +
        '<span class="legend__name">' + escapeHtml(x.cat.name) + '</span>' +
        '<span class="legend__value">' + money(x.total) + '</span></div>';
    }).join('') || '<p class="empty">Nenhuma despesa neste mês.</p>';

    $('stat-left').textContent = money(left);
    $('stat-left').className = 'stat ' + (left >= 0 ? 'stat--green' : '');
    $('stat-left').style.color = left < 0 ? '#ff6b8a' : '';
    var pctLeft = budget > 0 ? Math.round((left / budget) * 100) : 0;
    $('stat-left-hint').textContent = pctLeft + '% do orçamento';

    var today = new Date();
    var sameMonth = view.getMonth() === today.getMonth() && view.getFullYear() === today.getFullYear();
    var daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    var days = sameMonth ? today.getDate() : daysInMonth;
    $('stat-daily').textContent = money(spent / days);
    $('stat-daily-hint').textContent = 'em ' + days + ' dias';

    var groups = monthGroups(view);
    $('activity').innerHTML = groups.map(function (g) {
      var c = catById(g.exp.categoryId);
      var meta = g.entries.length > 1
        ? c.name + ' · ' + g.entries.length + ' lançamentos'
        : c.name + ' · ' + shortDate(g.entries[0].date);
      return '<li class="activity__item">' +
        '<span class="activity__dot" style="background:' + c.color + '"></span>' +
        '<div class="activity__info">' +
          '<span class="activity__title">' + escapeHtml(g.exp.merchant) + '</span>' +
          '<span class="activity__meta">' + escapeHtml(meta) + '</span></div>' +
        '<span class="activity__amount">-' + money(g.total, { cents: true }) + '</span>' +
        '<button class="rowbtn rowbtn--edit" data-edit-exp="' + g.exp.id + '" aria-label="Editar">' + ICON_EDIT + '</button>' +
        '<button class="rowbtn rowbtn--del" data-del-exp="' + g.exp.id + '" aria-label="Remover">' + ICON_DEL + '</button>' +
      '</li>';
    }).join('') || '<p class="empty">Nenhuma despesa. Toque em “+ Despesa”.</p>';
  }

  /* ======================= INVESTIMENTOS ======================== */
  function renderInvestments() {
    var inv = data.investments;
    var invested = inv.reduce(function (s, x) { return s + investedOf(x); }, 0);
    var current = inv.reduce(function (s, x) { return s + x.current; }, 0);
    var ret = current - invested;
    var pct = invested > 0 ? (ret / invested) * 100 : 0;

    $('inv-invested').textContent = money(invested);
    $('inv-current').textContent = money(current);
    $('inv-return').textContent = (ret >= 0 ? '+' : '') + money(ret);
    $('inv-return').className = 'stat ' + (ret >= 0 ? 'stat--green' : '');
    $('inv-return').style.color = ret < 0 ? '#ff6b8a' : '';
    $('inv-return-pct').textContent = (ret >= 0 ? '+' : '') + pct.toFixed(1) + '%';

    Charts.donut($('inv-donut'),
      inv.map(function (x) { return { value: x.current, color: x.color }; }),
      { caption: 'CARTEIRA', value: money(current), sub: inv.length + ' ativos' });

    $('inv-legend').innerHTML = inv.map(function (x) {
      return '<div class="legend__item">' +
        '<span class="legend__dot" style="background:' + x.color + '"></span>' +
        '<span class="legend__name">' + escapeHtml(x.name) + '</span>' +
        '<span class="legend__value">' + money(x.current) + '</span></div>';
    }).join('') || '';

    $('inv-list').innerHTML = inv.map(function (x) {
      var ap = investedOf(x);
      var r = x.current - ap;
      var rp = ap > 0 ? (r / ap) * 100 : 0;
      return '<li class="activity__item">' +
        '<span class="activity__dot" style="background:' + x.color + '"></span>' +
        '<div class="activity__info">' +
          '<span class="activity__title">' + escapeHtml(x.name) + '</span>' +
          '<span class="activity__meta">' + escapeHtml(x.type) + ' · aplicado ' + money(ap) + '</span></div>' +
        '<span class="activity__amount ' + (r >= 0 ? 'is-positive' : 'is-negative') + '">' + (r >= 0 ? '+' : '') + rp.toFixed(1) + '%</span>' +
        '<button class="rowbtn rowbtn--edit" data-edit-inv="' + x.id + '" aria-label="Editar">' + ICON_EDIT + '</button>' +
        '<button class="rowbtn rowbtn--del" data-del-inv="' + x.id + '" aria-label="Remover">' + ICON_DEL + '</button>' +
      '</li>';
    }).join('') || '<p class="empty">Nenhum investimento cadastrado.</p>';
  }

  /* ========================= HISTÓRICO ========================== */
  function renderHistory() {
    if ($('hist-month')) $('hist-month').value = monthKey(view);

    var series = [];
    for (var i = 5; i >= 0; i--) {
      var d = new Date(view.getFullYear(), view.getMonth() - i, 1);
      var total = categoryTotals(d).reduce(function (s, x) { return s + x.total; }, 0);
      series.push({ label: MONTHS_SHORT[d.getMonth()], value: total, active: i === 0, date: d });
    }
    Charts.bars($('barchart'), series, function (v) { return money(v); }, function (idx) {
      view = new Date(series[idx].date); renderAll();
    });

    $('history-month-label').textContent = 'Detalhes · ' + MONTHS[view.getMonth()] + ' ' + view.getFullYear();
    var totals = categoryTotals(view);
    $('history-breakdown').innerHTML = totals.map(function (x) {
      return '<li class="activity__item">' +
        '<span class="activity__dot" style="background:' + x.cat.color + '"></span>' +
        '<div class="activity__info"><span class="activity__title">' + escapeHtml(x.cat.name) + '</span></div>' +
        '<span class="activity__amount">' + money(x.total) + '</span></li>';
    }).join('') || '<p class="empty">Sem despesas neste mês.</p>';
  }

  /* ========================= CATEGORIAS ========================= */
  function renderCategories() {
    var allTotals = {};
    data.expenses.forEach(function (exp) {
      exp.entries.forEach(function (e) { allTotals[exp.categoryId] = (allTotals[exp.categoryId] || 0) + e.amount; });
    });
    $('catlist').innerHTML = data.categories.map(function (c) {
      return '<li class="catlist__item">' +
        '<span class="catlist__dot" style="background:' + c.color + '"></span>' +
        '<span class="catlist__name">' + escapeHtml(c.name) + '</span>' +
        '<span class="catlist__total">' + money(allTotals[c.id] || 0) + ' no total</span>' +
        '<button class="rowbtn rowbtn--edit" data-edit-cat="' + c.id + '" aria-label="Editar">' + ICON_EDIT + '</button>' +
        '<button class="rowbtn rowbtn--del" data-del-cat="' + c.id + '" aria-label="Remover">' + ICON_DEL + '</button>' +
      '</li>';
    }).join('');
  }

  /* ===================== MODAIS E FORMULÁRIOS ==================== */
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
    enhanceModalForm();
    var first = $('modal-form').querySelector('input, select');
    if (first) first.focus();
  }
  function closeModal() { $('modal').hidden = true; modalSubmit = null; }

  function enhanceModalForm() {
    var form = $('modal-form');
    // seletor de cor
    var swatches = form.querySelectorAll('.swatch');
    swatches.forEach(function (sw) {
      sw.onclick = function () {
        swatches.forEach(function (s) { s.classList.remove('is-selected'); });
        sw.classList.add('is-selected');
        form.dataset.color = sw.dataset.color;
      };
    });
    // adicionar lançamento / movimentação
    var addEntry = form.querySelector('#entry-add');
    if (addEntry) addEntry.onclick = function () {
      form.querySelector('#entry-list').insertAdjacentHTML('beforeend', entryRow(viewDateStr(), ''));
    };
    var addMov = form.querySelector('#mov-add');
    if (addMov) addMov.onclick = function () {
      form.querySelector('#mov-list').insertAdjacentHTML('beforeend', movRow('aporte', todayStr(), ''));
    };
  }

  function categoryOptions(sel) {
    return data.categories.map(function (c) {
      return '<option value="' + c.id + '"' + (c.id === sel ? ' selected' : '') + '>' + escapeHtml(c.name) + '</option>';
    }).join('');
  }
  function typeOptions(sel) {
    return INV_TYPES.map(function (t) { return '<option' + (t === sel ? ' selected' : '') + '>' + t + '</option>'; }).join('');
  }
  function swatchesHtml(sel) {
    return '<div class="swatches">' + SWATCHES.map(function (c) {
      return '<span class="swatch' + (c === sel ? ' is-selected' : '') + '" data-color="' + c + '" style="background:' + c + '"></span>';
    }).join('') + '</div>';
  }
  function entryRow(date, amount) {
    return '<div class="modal-row">' +
      '<input type="date" class="row-date" value="' + (date || '') + '">' +
      '<input type="number" step="0.01" min="0" class="row-amount" placeholder="0,00" value="' + (amount != null ? amount : '') + '">' +
      '<button type="button" class="row-del" aria-label="Remover lançamento">' + ICON_DEL + '</button></div>';
  }
  function movRow(kind, date, amount) {
    return '<div class="modal-row">' +
      '<select class="row-kind"><option value="aporte"' + (kind !== 'saque' ? ' selected' : '') + '>Aporte</option><option value="saque"' + (kind === 'saque' ? ' selected' : '') + '>Saque</option></select>' +
      '<input type="date" class="row-date" value="' + (date || '') + '">' +
      '<input type="number" step="0.01" min="0" class="row-amount" placeholder="0,00" value="' + (amount != null ? amount : '') + '">' +
      '<button type="button" class="row-del" aria-label="Remover">' + ICON_DEL + '</button></div>';
  }
  function readEntries(form) {
    return Array.prototype.map.call(form.querySelectorAll('#entry-list .modal-row'), function (r) {
      return { date: r.querySelector('.row-date').value, amount: parseFloat(r.querySelector('.row-amount').value) };
    }).filter(function (e) { return e.date && !isNaN(e.amount) && e.amount > 0; })
      .map(function (e) { return { id: Store.uid(), date: e.date, amount: e.amount }; });
  }
  function readMovs(form) {
    return Array.prototype.map.call(form.querySelectorAll('#mov-list .modal-row'), function (r) {
      return { kind: r.querySelector('.row-kind').value, date: r.querySelector('.row-date').value, amount: parseFloat(r.querySelector('.row-amount').value) };
    }).filter(function (m) { return m.date && !isNaN(m.amount) && m.amount > 0; })
      .map(function (m) { return { id: Store.uid(), kind: m.kind, date: m.date, amount: m.amount }; });
  }

  /* ---- Despesa (criar/editar) ---- */
  function openExpense(exp) {
    var editing = !!exp;
    var sel = editing ? exp.categoryId : data.categories[0].id;
    var rows = editing
      ? exp.entries.map(function (e) { return entryRow(e.date, e.amount); }).join('')
      : entryRow(viewDateStr(), '');

    openModal(editing ? 'Editar despesa' : 'Nova despesa',
      '<label class="field"><span class="field__label">Descrição</span>' +
        '<input class="field__input" name="merchant" required placeholder="Ex.: Padaria" value="' + (editing ? escapeHtml(exp.merchant) : '') + '"></label>' +
      '<label class="field"><span class="field__label">Categoria</span><select name="categoryId">' + categoryOptions(sel) + '</select></label>' +
      '<div class="field"><div class="field__label rowhead"><span>Lançamentos</span>' +
        '<button type="button" class="link" id="entry-add">+ Adicionar</button></div>' +
        '<div id="entry-list">' + rows + '</div></div>',
      function (form) {
        var entries = readEntries(form);
        if (!entries.length) { alert('Adicione ao menos um lançamento com valor.'); return false; }
        var merchant = form.merchant.value.trim() || 'Despesa';
        var categoryId = form.categoryId.value;
        if (editing) { exp.merchant = merchant; exp.categoryId = categoryId; exp.entries = entries; }
        else { data.expenses.push({ id: Store.uid(), merchant: merchant, categoryId: categoryId, entries: entries }); }
        save();
        var latest = entries.map(function (e) { return e.date; }).sort().pop();
        view = new Date(Number(latest.slice(0, 4)), Number(latest.slice(5, 7)) - 1, 1);
        renderAll();
      });
  }

  async function deleteExpense(id) {
    var exp = data.expenses.find(function (e) { return e.id === id; });
    if (!exp) return;
    if (!(await confirmDialog('Remover a despesa "' + exp.merchant + '" e todos os seus lançamentos?'))) return;
    data.expenses = data.expenses.filter(function (e) { return e.id !== id; });
    save(); renderAll();
  }

  /* ---- Investimento (criar/editar) ---- */
  function openInvestment(inv) {
    var editing = !!inv;
    var rows = editing
      ? inv.movements.map(function (m) { return movRow(m.kind, m.date, m.amount); }).join('')
      : movRow('aporte', todayStr(), '');

    openModal(editing ? 'Editar investimento' : 'Novo investimento',
      '<label class="field"><span class="field__label">Nome</span>' +
        '<input class="field__input" name="name" required placeholder="Ex.: Tesouro Selic" value="' + (editing ? escapeHtml(inv.name) : '') + '"></label>' +
      '<div class="field__row">' +
        '<label class="field"><span class="field__label">Tipo</span><select name="type">' + typeOptions(editing ? inv.type : 'Renda Fixa') + '</select></label>' +
        '<label class="field"><span class="field__label">Valor atual</span>' +
          '<input class="field__input" name="current" type="number" step="0.01" min="0" placeholder="0,00" value="' + (editing ? inv.current : '') + '"></label>' +
      '</div>' +
      '<div class="field"><div class="field__label rowhead"><span>Aportes / saques</span>' +
        '<button type="button" class="link" id="mov-add">+ Adicionar</button></div>' +
        '<div id="mov-list">' + rows + '</div></div>' +
      '<div class="field"><span class="field__label">Cor</span>' + swatchesHtml(editing ? inv.color : SWATCHES[4]) + '</div>',
      function (form) {
        var movements = readMovs(form);
        if (!movements.length) { alert('Adicione ao menos um aporte.'); return false; }
        var name = form.name.value.trim() || 'Investimento';
        var type = form.type.value;
        var color = form.dataset.color || (editing ? inv.color : SWATCHES[4]);
        var net = movements.reduce(function (s, m) { return s + (m.kind === 'saque' ? -m.amount : m.amount); }, 0);
        var current = form.current.value ? Math.abs(parseFloat(form.current.value)) : net;
        if (editing) { inv.name = name; inv.type = type; inv.color = color; inv.movements = movements; inv.current = current; }
        else { data.investments.push({ id: Store.uid(), name: name, type: type, color: color, current: current, movements: movements }); }
        save(); renderInvestments();
      });
    if (!editing) $('modal-form').dataset.color = SWATCHES[4];
  }

  async function deleteInvestment(id) {
    var inv = data.investments.find(function (x) { return x.id === id; });
    if (!inv) return;
    if (!(await confirmDialog('Remover o investimento "' + inv.name + '"?'))) return;
    data.investments = data.investments.filter(function (x) { return x.id !== id; });
    save(); renderInvestments();
  }

  /* ---- Categoria (criar/editar/remover) ---- */
  function openCategory(cat) {
    var editing = !!cat;
    openModal(editing ? 'Editar categoria' : 'Nova categoria',
      '<label class="field"><span class="field__label">Nome</span>' +
        '<input class="field__input" name="name" required placeholder="Ex.: Educação" value="' + (editing ? escapeHtml(cat.name) : '') + '"></label>' +
      '<div class="field"><span class="field__label">Cor</span>' + swatchesHtml(editing ? cat.color : SWATCHES[0]) + '</div>',
      function (form) {
        var color = form.dataset.color || (editing ? cat.color : SWATCHES[0]);
        var name = form.name.value.trim() || 'Categoria';
        if (editing) { cat.name = name; cat.color = color; }
        else { data.categories.push({ id: 'cat-' + Store.uid(), name: name, color: color }); }
        save(); renderAll();
      });
    if (!editing) $('modal-form').dataset.color = SWATCHES[0];
  }

  async function deleteCategory(id) {
    if (data.categories.length <= 1) { await confirmDialog('Mantenha ao menos uma categoria.', true); return; }
    var cat = catById(id);
    if (!(await confirmDialog('Remover a categoria "' + cat.name + '"? As despesas dela vão para outra categoria.'))) return;
    var fallback = data.categories.find(function (c) { return c.id !== id && /outros/i.test(c.name); })
                || data.categories.find(function (c) { return c.id !== id; });
    data.expenses.forEach(function (exp) { if (exp.categoryId === id) exp.categoryId = fallback.id; });
    data.categories = data.categories.filter(function (c) { return c.id !== id; });
    save(); renderAll();
  }

  /* ---- Orçamento (por mês ou padrão) ---- */
  function openBudget() {
    var k = monthKey(view);
    var isDefault = data.monthBudgets[k] == null;
    openModal('Orçamento · ' + MONTHS[view.getMonth()] + ' ' + view.getFullYear(),
      '<label class="field"><span class="field__label">Valor do orçamento</span>' +
        '<input class="field__input" name="budget" type="number" step="0.01" min="0" required value="' + budgetFor(view) + '"></label>' +
      '<label class="check"><input type="checkbox" name="allmonths"' + (isDefault ? ' checked' : '') + '>' +
        '<span>Usar como padrão para todos os meses</span></label>' +
      '<p class="field__hint">Desmarcado, o valor vale só para este mês.</p>',
      function (form) {
        var val = Math.abs(parseFloat(form.budget.value) || 0);
        if (form.allmonths.checked) { data.budget = val; delete data.monthBudgets[k]; }
        else { data.monthBudgets[k] = val; }
        save(); renderOverview();
      });
  }

  /* ---- Confirmação estilizada (substitui o confirm() do navegador) ---- */
  function confirmDialog(message, alertOnly) {
    return new Promise(function (resolve) {
      var el = document.createElement('div');
      el.className = 'confirm';
      el.innerHTML =
        '<div class="confirm__backdrop"></div>' +
        '<div class="confirm__box" role="alertdialog">' +
          '<p class="confirm__msg">' + escapeHtml(message) + '</p>' +
          '<div class="confirm__actions">' +
            (alertOnly ? '' : '<button class="btn" data-no>Cancelar</button>') +
            '<button class="btn ' + (alertOnly ? 'btn--primary' : 'btn--danger') + '" data-yes>' + (alertOnly ? 'OK' : 'Remover') + '</button>' +
          '</div></div>';
      document.body.appendChild(el);
      function done(v) { el.remove(); resolve(v); }
      el.querySelector('[data-yes]').onclick = function () { done(true); };
      var no = el.querySelector('[data-no]'); if (no) no.onclick = function () { done(false); };
      el.querySelector('.confirm__backdrop').onclick = function () { done(false); };
    });
  }

  /* ===================== EVENTOS / WIRING =================== */
  function setupEvents() {
    $('add-expense').addEventListener('click', function () { openExpense(null); });
    $('add-investment').addEventListener('click', function () { openInvestment(null); });
    $('add-category').addEventListener('click', function () { openCategory(null); });
    $('edit-categories').addEventListener('click', function () { switchView('categories'); });

    // submit do modal
    $('modal-form').addEventListener('submit', function (e) {
      e.preventDefault();
      if (!modalSubmit) return;
      var keepOpen = modalSubmit($('modal-form'));
      if (keepOpen !== false) closeModal();
    });
    // remover linha de lançamento/movimentação (delegado, registrado uma vez)
    $('modal-form').addEventListener('click', function (e) {
      var del = e.target.closest('.row-del');
      if (del) { e.preventDefault(); del.closest('.modal-row').remove(); }
    });
    // fechar modal
    $('modal').addEventListener('click', function (e) { if (e.target.hasAttribute('data-close')) closeModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('modal').hidden) closeModal(); });

    // ações nas listas (editar/remover) — delegado
    document.addEventListener('click', function (e) {
      var t;
      if ((t = e.target.closest('[data-edit-exp]'))) { var ex = data.expenses.find(function (x) { return x.id === t.dataset.editExp; }); if (ex) openExpense(ex); return; }
      if ((t = e.target.closest('[data-del-exp]')))  { deleteExpense(t.dataset.delExp); return; }
      if ((t = e.target.closest('[data-edit-inv]'))) { var iv = data.investments.find(function (x) { return x.id === t.dataset.editInv; }); if (iv) openInvestment(iv); return; }
      if ((t = e.target.closest('[data-del-inv]')))  { deleteInvestment(t.dataset.delInv); return; }
      if ((t = e.target.closest('[data-edit-cat]'))) { var ct = catById(t.dataset.editCat); openCategory(ct); return; }
      if ((t = e.target.closest('[data-del-cat]')))  { deleteCategory(t.dataset.delCat); return; }
    });

    // menu da conta
    var avatar = $('avatar-btn'), menu = $('account-menu');
    avatar.addEventListener('click', function (e) { if (e.target.closest('.menu')) return; menu.hidden = !menu.hidden; });
    avatar.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); menu.hidden = !menu.hidden; } });
    document.addEventListener('click', function (e) { if (!e.target.closest('.avatar')) menu.hidden = true; });

    $('menu-budget').addEventListener('click', function () { menu.hidden = true; openBudget(); });
    $('menu-currency').addEventListener('click', function () {
      data.currency = data.currency === 'BRL' ? 'USD' : 'BRL';
      save(); updateCurrencyLabel(); renderAll(); menu.hidden = true;
    });
    $('menu-logout').addEventListener('click', function () {
      Store.logout(); data = null;
      $('app').hidden = true; $('auth-screen').hidden = false;
      $('auth-user').value = ''; $('auth-pass').value = ''; $('auth-error').textContent = '';
    });
  }

  function updateCurrencyLabel() {
    $('menu-currency').textContent = 'Moeda: ' + (data.currency === 'BRL' ? 'R$' : 'US$');
  }

  /* ============================ BOOT ============================ */
  function boot() {
    setupAuth();
    setupNav();
    setupEvents();
    if (Store.currentUser()) startApp();
    else $('auth-screen').hidden = false;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
