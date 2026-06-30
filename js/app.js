/* =====================================================================
   app.js · Controlador da interface
   Usa: window.Store (dados) e window.Charts (gráficos)
   ===================================================================== */
(function () {
  'use strict';

  /* ============================ ESTADO ============================ */
  var data = null;
  var view = new Date();
  var lang = 'pt';
  var $ = function (id) { return document.getElementById(id); };

  // Client ID do Google (público). Mesmo valor configurado no backend.
  var GOOGLE_CLIENT_ID = '528000890824-kgndiholp2r5kq91f1hsn4i4ls2jddia.apps.googleusercontent.com';

  /* ============================ IDIOMAS =========================== */
  var LANGS = ['pt', 'en', 'es'];
  var LANG_NAMES = { pt: 'Português', en: 'English', es: 'Español' };
  var LOCALE = { pt: 'pt-BR', en: 'en-US', es: 'es-ES' };

  var I18N = {
    pt: {
      app_title: 'Aurora · Controle de despesas',
      login_title: 'Entrar', register_title: 'Criar conta',
      login_sub: 'Acesse seu painel de despesas.', register_sub: 'Comece a controlar seus gastos.',
      login_btn: 'Entrar', register_btn: 'Criar conta',
      no_account: 'Não tem conta?', have_account: 'Já tem conta?', or: 'ou',
      user_label: 'Usuário', pass_label: 'Senha',
      load_error: 'Não foi possível carregar seus dados.',
      menu_budget: 'Definir orçamento', menu_currency: 'Moeda', menu_language: 'Idioma', menu_logout: 'Sair',
      menu_privacy: 'Política de privacidade', privacy: 'Privacidade',
      saving: 'Salvando…', saved: 'Salvo', save_error: 'Falha ao salvar', retry: 'Tentar de novo',
      menu_export: 'Exportar dados', export_title: 'Exportar dados',
      export_desc: 'Baixe um backup completo (JSON) ou planilhas legíveis (CSV) das suas despesas e investimentos.',
      export_backup: 'Backup completo (JSON)', export_expenses: 'Despesas (CSV)', export_investments: 'Investimentos (CSV)',
      col_date: 'Data', col_amount: 'Valor', col_month: 'Mês', col_invested: 'Aplicado',
      show_more: 'Mostrar mais ({n})', show_less: 'Mostrar menos',
      menu_fixas: 'Despesas fixas', fixas_pending: 'Fixas a lançar', fixas_new: '+ Nova despesa fixa', fixas_edit: 'Editar despesa fixa',
      fixas_desc: 'Cadastre despesas que se repetem. Quando vencem, aparecem na Visão geral pra você lançar com um toque.',
      fixas_empty: 'Nenhuma despesa fixa ainda.',
      launch_one: 'Lançar', launch_all: 'Lançar todas',
      f_frequency: 'Frequência', f_next_due: 'Próximo vencimento',
      freq_monthly: 'Mensal', freq_weekly: 'Semanal', freq_yearly: 'Anual',
      del_fixa: 'Remover a despesa fixa "{x}"?',
      prev_month: 'Mês anterior', next_month: 'Próximo mês', select_month: 'Escolher mês', account_menu: 'Menu da conta', close: 'Fechar',
      tab_overview: 'Visão geral', tab_investments: 'Investimentos', tab_history: 'Histórico', tab_categories: 'Categorias',
      available: 'Disponível', daily_avg: 'Média diária', recent_activity: 'Atividade recente',
      add_expense: '+ Despesa', edit_categories: 'Editar categorias',
      donut_spent: 'GASTO', of_amount: 'de {x}', pct_of_budget: '{n}% do orçamento', days_count: 'em {n} dias',
      entries_count: '{n} lançamentos', no_expenses_cta: 'Nenhuma despesa. Toque em "+ Despesa".', no_expenses_month: 'Nenhuma despesa neste mês.',
      total_invested: 'Total investido', current_value: 'Valor atual', return_label: 'Rendimento',
      my_investments: 'Meus investimentos', add_investment: '+ Investimento',
      portfolio: 'CARTEIRA', assets_count: '{n} ativos', applied: 'aplicado', no_investments: 'Nenhum investimento cadastrado.',
      spending_by_month: 'Gastos por mês', details_prefix: 'Detalhes · ', month_details: 'Detalhes do mês', no_expenses_hist: 'Sem despesas neste mês.',
      your_categories: 'Suas categorias', add_category: '+ Categoria', total_suffix: '{x} no total',
      cancel: 'Cancelar', save: 'Salvar', remove: 'Remover', ok: 'OK', add_more: '+ Adicionar',
      f_description: 'Descrição', f_category: 'Categoria', f_entries: 'Lançamentos', f_name: 'Nome', f_type: 'Tipo',
      f_current: 'Valor atual', f_movements: 'Aportes / saques', f_color: 'Cor',
      kind_deposit: 'Aporte', kind_withdraw: 'Saque',
      f_budget: 'Valor do orçamento', budget_all: 'Usar como padrão para todos os meses', budget_hint: 'Desmarcado, o valor vale só para este mês.',
      new_expense: 'Nova despesa', edit_expense: 'Editar despesa',
      new_investment: 'Novo investimento', edit_investment: 'Editar investimento',
      new_category: 'Nova categoria', edit_category: 'Editar categoria',
      budget_prefix: 'Orçamento · ', currency_title: 'Escolher moeda', language_title: 'Escolher idioma',
      need_entry: 'Adicione ao menos um lançamento com valor.', need_deposit: 'Adicione ao menos um aporte.',
      keep_one_cat: 'Mantenha ao menos uma categoria.',
      del_expense: 'Remover a despesa "{x}" e todos os seus lançamentos?',
      del_investment: 'Remover o investimento "{x}"?',
      del_category: 'Remover a categoria "{x}"? As despesas dela vão para outra categoria.',
      ph_expense: 'Ex.: Padaria', ph_investment: 'Ex.: Tesouro Selic', ph_category: 'Ex.: Educação',
      def_expense: 'Despesa', def_investment: 'Investimento', def_category: 'Categoria', no_category: 'Sem categoria',
      remove_entry: 'Remover lançamento', remove_label: 'Remover', edit_label: 'Editar',
      inv_fixed: 'Renda Fixa', inv_stocks: 'Ações', inv_fii: 'FII', inv_crypto: 'Cripto', inv_funds: 'Fundos', inv_treasury: 'Tesouro', inv_pension: 'Previdência', inv_other: 'Outros'
    },
    en: {
      app_title: 'Aurora · Expense tracker',
      login_title: 'Sign in', register_title: 'Create account',
      login_sub: 'Access your expense dashboard.', register_sub: 'Start tracking your spending.',
      login_btn: 'Sign in', register_btn: 'Create account',
      no_account: "Don't have an account?", have_account: 'Already have an account?', or: 'or',
      user_label: 'Username', pass_label: 'Password',
      load_error: "Couldn't load your data.",
      menu_budget: 'Set budget', menu_currency: 'Currency', menu_language: 'Language', menu_logout: 'Log out',
      menu_privacy: 'Privacy policy', privacy: 'Privacy',
      saving: 'Saving…', saved: 'Saved', save_error: "Couldn't save", retry: 'Retry',
      menu_export: 'Export data', export_title: 'Export data',
      export_desc: 'Download a full backup (JSON) or readable spreadsheets (CSV) of your expenses and investments.',
      export_backup: 'Full backup (JSON)', export_expenses: 'Expenses (CSV)', export_investments: 'Investments (CSV)',
      col_date: 'Date', col_amount: 'Amount', col_month: 'Month', col_invested: 'Invested',
      show_more: 'Show more ({n})', show_less: 'Show less',
      menu_fixas: 'Recurring expenses', fixas_pending: 'Recurring to add', fixas_new: '+ New recurring expense', fixas_edit: 'Edit recurring expense',
      fixas_desc: 'Set up expenses that repeat. When they come due, they appear on the Overview to add with one tap.',
      fixas_empty: 'No recurring expenses yet.',
      launch_one: 'Add', launch_all: 'Add all',
      f_frequency: 'Frequency', f_next_due: 'Next due date',
      freq_monthly: 'Monthly', freq_weekly: 'Weekly', freq_yearly: 'Yearly',
      del_fixa: 'Remove the recurring expense "{x}"?',
      prev_month: 'Previous month', next_month: 'Next month', select_month: 'Choose month', account_menu: 'Account menu', close: 'Close',
      tab_overview: 'Overview', tab_investments: 'Investments', tab_history: 'History', tab_categories: 'Categories',
      available: 'Available', daily_avg: 'Daily average', recent_activity: 'Recent activity',
      add_expense: '+ Expense', edit_categories: 'Edit categories',
      donut_spent: 'SPENT', of_amount: 'of {x}', pct_of_budget: '{n}% of budget', days_count: 'in {n} days',
      entries_count: '{n} entries', no_expenses_cta: 'No expenses. Tap "+ Expense".', no_expenses_month: 'No expenses this month.',
      total_invested: 'Total invested', current_value: 'Current value', return_label: 'Return',
      my_investments: 'My investments', add_investment: '+ Investment',
      portfolio: 'PORTFOLIO', assets_count: '{n} assets', applied: 'invested', no_investments: 'No investments yet.',
      spending_by_month: 'Spending by month', details_prefix: 'Details · ', month_details: 'Month details', no_expenses_hist: 'No expenses this month.',
      your_categories: 'Your categories', add_category: '+ Category', total_suffix: '{x} total',
      cancel: 'Cancel', save: 'Save', remove: 'Remove', ok: 'OK', add_more: '+ Add',
      f_description: 'Description', f_category: 'Category', f_entries: 'Entries', f_name: 'Name', f_type: 'Type',
      f_current: 'Current value', f_movements: 'Deposits / withdrawals', f_color: 'Color',
      kind_deposit: 'Deposit', kind_withdraw: 'Withdrawal',
      f_budget: 'Budget amount', budget_all: 'Use as default for all months', budget_hint: 'Unchecked, the value applies to this month only.',
      new_expense: 'New expense', edit_expense: 'Edit expense',
      new_investment: 'New investment', edit_investment: 'Edit investment',
      new_category: 'New category', edit_category: 'Edit category',
      budget_prefix: 'Budget · ', currency_title: 'Choose currency', language_title: 'Choose language',
      need_entry: 'Add at least one entry with an amount.', need_deposit: 'Add at least one deposit.',
      keep_one_cat: 'Keep at least one category.',
      del_expense: 'Remove the expense "{x}" and all its entries?',
      del_investment: 'Remove the investment "{x}"?',
      del_category: 'Remove the category "{x}"? Its expenses will move to another category.',
      ph_expense: 'e.g. Bakery', ph_investment: 'e.g. Treasury bond', ph_category: 'e.g. Education',
      def_expense: 'Expense', def_investment: 'Investment', def_category: 'Category', no_category: 'No category',
      remove_entry: 'Remove entry', remove_label: 'Remove', edit_label: 'Edit',
      inv_fixed: 'Fixed income', inv_stocks: 'Stocks', inv_fii: 'REIT', inv_crypto: 'Crypto', inv_funds: 'Funds', inv_treasury: 'Treasury', inv_pension: 'Pension', inv_other: 'Other'
    },
    es: {
      app_title: 'Aurora · Control de gastos',
      login_title: 'Iniciar sesión', register_title: 'Crear cuenta',
      login_sub: 'Accede a tu panel de gastos.', register_sub: 'Empieza a controlar tus gastos.',
      login_btn: 'Iniciar sesión', register_btn: 'Crear cuenta',
      no_account: '¿No tienes cuenta?', have_account: '¿Ya tienes cuenta?', or: 'o',
      user_label: 'Usuario', pass_label: 'Contraseña',
      load_error: 'No se pudieron cargar tus datos.',
      menu_budget: 'Definir presupuesto', menu_currency: 'Moneda', menu_language: 'Idioma', menu_logout: 'Salir',
      menu_privacy: 'Política de privacidad', privacy: 'Privacidad',
      saving: 'Guardando…', saved: 'Guardado', save_error: 'No se pudo guardar', retry: 'Reintentar',
      menu_export: 'Exportar datos', export_title: 'Exportar datos',
      export_desc: 'Descarga una copia de seguridad completa (JSON) o planillas legibles (CSV) de tus gastos e inversiones.',
      export_backup: 'Copia completa (JSON)', export_expenses: 'Gastos (CSV)', export_investments: 'Inversiones (CSV)',
      col_date: 'Fecha', col_amount: 'Importe', col_month: 'Mes', col_invested: 'Aplicado',
      show_more: 'Mostrar más ({n})', show_less: 'Mostrar menos',
      menu_fixas: 'Gastos fijos', fixas_pending: 'Fijos por registrar', fixas_new: '+ Nuevo gasto fijo', fixas_edit: 'Editar gasto fijo',
      fixas_desc: 'Configura gastos que se repiten. Cuando vencen, aparecen en el Resumen para registrarlos con un toque.',
      fixas_empty: 'Sin gastos fijos todavía.',
      launch_one: 'Registrar', launch_all: 'Registrar todos',
      f_frequency: 'Frecuencia', f_next_due: 'Próximo vencimiento',
      freq_monthly: 'Mensual', freq_weekly: 'Semanal', freq_yearly: 'Anual',
      del_fixa: '¿Eliminar el gasto fijo "{x}"?',
      prev_month: 'Mes anterior', next_month: 'Mes siguiente', select_month: 'Elegir mes', account_menu: 'Menú de la cuenta', close: 'Cerrar',
      tab_overview: 'Resumen', tab_investments: 'Inversiones', tab_history: 'Historial', tab_categories: 'Categorías',
      available: 'Disponible', daily_avg: 'Promedio diario', recent_activity: 'Actividad reciente',
      add_expense: '+ Gasto', edit_categories: 'Editar categorías',
      donut_spent: 'GASTO', of_amount: 'de {x}', pct_of_budget: '{n}% del presupuesto', days_count: 'en {n} días',
      entries_count: '{n} movimientos', no_expenses_cta: 'Sin gastos. Toca "+ Gasto".', no_expenses_month: 'Sin gastos este mes.',
      total_invested: 'Total invertido', current_value: 'Valor actual', return_label: 'Rendimiento',
      my_investments: 'Mis inversiones', add_investment: '+ Inversión',
      portfolio: 'CARTERA', assets_count: '{n} activos', applied: 'invertido', no_investments: 'Sin inversiones.',
      spending_by_month: 'Gastos por mes', details_prefix: 'Detalles · ', month_details: 'Detalles del mes', no_expenses_hist: 'Sin gastos este mes.',
      your_categories: 'Tus categorías', add_category: '+ Categoría', total_suffix: '{x} en total',
      cancel: 'Cancelar', save: 'Guardar', remove: 'Eliminar', ok: 'OK', add_more: '+ Añadir',
      f_description: 'Descripción', f_category: 'Categoría', f_entries: 'Movimientos', f_name: 'Nombre', f_type: 'Tipo',
      f_current: 'Valor actual', f_movements: 'Aportes / retiros', f_color: 'Color',
      kind_deposit: 'Aporte', kind_withdraw: 'Retiro',
      f_budget: 'Monto del presupuesto', budget_all: 'Usar como predeterminado para todos los meses', budget_hint: 'Sin marcar, el valor aplica solo a este mes.',
      new_expense: 'Nuevo gasto', edit_expense: 'Editar gasto',
      new_investment: 'Nueva inversión', edit_investment: 'Editar inversión',
      new_category: 'Nueva categoría', edit_category: 'Editar categoría',
      budget_prefix: 'Presupuesto · ', currency_title: 'Elegir moneda', language_title: 'Elegir idioma',
      need_entry: 'Añade al menos un movimiento con valor.', need_deposit: 'Añade al menos un aporte.',
      keep_one_cat: 'Mantén al menos una categoría.',
      del_expense: '¿Eliminar el gasto "{x}" y todos sus movimientos?',
      del_investment: '¿Eliminar la inversión "{x}"?',
      del_category: '¿Eliminar la categoría "{x}"? Sus gastos pasarán a otra categoría.',
      ph_expense: 'Ej.: Panadería', ph_investment: 'Ej.: Bono del tesoro', ph_category: 'Ej.: Educación',
      def_expense: 'Gasto', def_investment: 'Inversión', def_category: 'Categoría', no_category: 'Sin categoría',
      remove_entry: 'Eliminar movimiento', remove_label: 'Eliminar', edit_label: 'Editar',
      inv_fixed: 'Renta fija', inv_stocks: 'Acciones', inv_fii: 'FII', inv_crypto: 'Cripto', inv_funds: 'Fondos', inv_treasury: 'Tesoro', inv_pension: 'Pensión', inv_other: 'Otros'
    }
  };

  function tr(key, params) {
    var s = (I18N[lang] && I18N[lang][key]);
    if (s == null) s = I18N.pt[key];
    if (s == null) s = key;
    if (params) for (var k in params) s = s.replace('{' + k + '}', params[k]);
    return s;
  }
  function detectLang() {
    var l = (navigator.language || 'pt').slice(0, 2).toLowerCase();
    return LANGS.indexOf(l) >= 0 ? l : 'pt';
  }
  function applyStaticI18n() {
    document.documentElement.lang = LOCALE[lang];
    document.title = tr('app_title');
    document.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = tr(el.getAttribute('data-i18n')); });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) { el.setAttribute('placeholder', tr(el.getAttribute('data-i18n-ph'))); });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) { el.setAttribute('aria-label', tr(el.getAttribute('data-i18n-aria'))); });
  }

  // Paleta de cores (19 opções) para categorias e investimentos
  var SWATCHES = [
    '#ff2d78','#b94dff','#8257ff','#3366ff','#19b9ff','#00d6b4','#2fdd76','#c2ee2e','#ff9f1c','#ff5f6d',
    '#f43f9d','#4f46e5','#dc2626'
  ];

  function invTypes() {
    return ['inv_fixed','inv_stocks','inv_fii','inv_crypto','inv_funds','inv_treasury','inv_pension','inv_other']
      .map(function (k) { return tr(k); });
  }

  // moedas disponíveis no seletor
  var CURRENCIES = ['BRL','USD','EUR','GBP','JPY','CHF','CAD','AUD','ARS','MXN','CNY','INR','IDR'];
  function currencyName(code) {
    try { return new Intl.DisplayNames([LOCALE[lang]], { type: 'currency' }).of(code); } catch (e) { return code; }
  }
  function currencySymbol(code) {
    try {
      var parts = new Intl.NumberFormat(LOCALE[lang], { style: 'currency', currency: code, maximumFractionDigits: 0 }).formatToParts(0);
      for (var i = 0; i < parts.length; i++) if (parts[i].type === 'currency') return parts[i].value;
    } catch (e) {}
    return code;
  }

  // ícones reutilizáveis (svg)
  var ICON_EDIT = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M4 20h4l10-10-4-4L4 16v4zM14 6l4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_DEL  = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  /* --------------------------- utilitários -------------------------- */
  function money(n, opts) {
    opts = opts || {};
    var cur = (data && data.currency) || 'BRL';
    return new Intl.NumberFormat(LOCALE[lang], {
      style: 'currency', currency: cur,
      minimumFractionDigits: opts.cents ? 2 : 0,
      maximumFractionDigits: opts.cents ? 2 : 0
    }).format(n || 0);
  }

  function monthName(i, short) {
    var s = new Intl.DateTimeFormat(LOCALE[lang], { month: short ? 'short' : 'long' }).format(new Date(2021, i, 1)).replace('.', '');
    if (short) return s.toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function monthLabel(d) { return monthName(d.getMonth()) + ' ' + d.getFullYear(); }

  function monthKey(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
  function shortDate(iso) { var p = iso.split('-'); return Number(p[2]) + ' ' + monthName(Number(p[1]) - 1, true); }
  function todayStr() { return new Date().toISOString().slice(0, 10); }
  function isoOf(dt) { return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0'); }
  // próximo vencimento de uma recorrência (avança 1 período a partir do atual)
  function advanceDue(rec) {
    var p = rec.nextDue.split('-').map(Number);
    var y = p[0], m = p[1] - 1, d = p[2];
    if (rec.freq === 'weekly') { var dt = new Date(y, m, d); dt.setDate(dt.getDate() + 7); return isoOf(dt); }
    if (rec.freq === 'yearly') { y += 1; } else { m += 1; if (m > 11) { m = 0; y += 1; } }
    var day = Math.min(rec.day || d, new Date(y, m + 1, 0).getDate());
    return isoOf(new Date(y, m, day));
  }
  function viewDateStr() {
    var last = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    var day = Math.min(new Date().getDate(), last);
    return monthKey(view) + '-' + String(day).padStart(2, '0');
  }

  function catById(id) {
    return data.categories.find(function (c) { return c.id === id; }) || { name: tr('no_category'), color: '#888' };
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

  // salvamento com debounce + feedback visual (salvando / salvo / falha)
  var saveTimer = null, saveHideTimer = null;
  function save() {
    clearTimeout(saveTimer);
    setSaveStatus('saving');
    saveTimer = setTimeout(flushSave, 400);
  }
  function flushSave() {
    clearTimeout(saveTimer);
    setSaveStatus('saving');
    Store.saveData(data)
      .then(function () { setSaveStatus('saved'); })
      .catch(function (e) { console.error('Falha ao salvar:', e); setSaveStatus('error'); });
  }
  function setSaveStatus(state) {
    var el = $('save-status'); if (!el) return;
    clearTimeout(saveHideTimer);
    el.classList.remove('savestatus--saving', 'savestatus--saved', 'savestatus--error');
    var icon = $('save-status-icon'), text = $('save-status-text'), retry = $('save-status-retry');
    retry.hidden = true;
    if (state === 'saving') {
      el.classList.add('savestatus--saving');
      icon.className = 'savestatus__icon savestatus__spin'; icon.textContent = '';
      text.textContent = tr('saving');
    } else if (state === 'saved') {
      el.classList.add('savestatus--saved');
      icon.className = 'savestatus__icon'; icon.textContent = '✓';
      text.textContent = tr('saved');
      saveHideTimer = setTimeout(hideSaveStatus, 1800);
    } else {
      el.classList.add('savestatus--error');
      icon.className = 'savestatus__icon'; icon.textContent = '!';
      text.textContent = tr('save_error');
      retry.hidden = false; retry.textContent = tr('retry');
    }
    el.hidden = false;
    void el.offsetWidth;            // força reflow para animar a entrada
    el.classList.add('is-visible');
  }
  function hideSaveStatus() {
    var el = $('save-status'); if (!el) return;
    el.classList.remove('is-visible');
    saveHideTimer = setTimeout(function () { el.hidden = true; }, 280);
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
      $('auth-title').textContent = login ? tr('login_title') : tr('register_title');
      $('auth-subtitle').textContent = login ? tr('login_sub') : tr('register_sub');
      $('auth-submit').textContent = login ? tr('login_btn') : tr('register_btn');
      $('auth-switch-text').textContent = login ? tr('no_account') : tr('have_account');
      switchBtn.textContent = login ? tr('register_btn') : tr('login_btn');
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

  /* ---------------------- Login com Google ---------------------- */
  async function onGoogleCredential(resp) {
    if (!resp || !resp.credential) return;
    $('auth-error').textContent = '';
    var r = await Store.loginWithGoogle(resp.credential);
    if (!r.ok) { $('auth-error').textContent = r.error; return; }
    await startApp();
  }

  function setupGoogle(tries) {
    tries = tries || 0;
    var el = $('google-btn');
    if (!el) return;
    if (!(window.google && window.google.accounts && window.google.accounts.id)) {
      if (tries < 25) setTimeout(function () { setupGoogle(tries + 1); }, 300); // espera o script async carregar
      return;
    }
    if (el.dataset.ready) return;
    el.dataset.ready = '1';
    window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: onGoogleCredential });
    window.google.accounts.id.renderButton(el, {
      theme: 'filled_black', size: 'large', shape: 'pill', text: 'continue_with',
      locale: LOCALE[lang]
    });
  }

  /* ===================== INICIALIZAÇÃO ==================== */
  async function startApp() {
    try { data = await Store.fetchData(); }
    catch (e) {
      await Store.logout();
      $('app').hidden = true; $('auth-screen').hidden = false;
      $('auth-error').textContent = e.message || tr('load_error');
      return;
    }
    lang = (data.lang && LANGS.indexOf(data.lang) >= 0) ? data.lang : detectLang();
    view = new Date();
    $('auth-screen').hidden = true;
    $('app').hidden = false;

    var user = Store.currentUser();
    $('avatar-initials').textContent = user.slice(0, 2).toUpperCase();
    $('menu-username').textContent = user;
    applyStaticI18n();
    updateMenuLabels();
    injectHistoryControls();
    renderAll();
  }

  function renderAll() {
    $('month-label').textContent = monthLabel(view);
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
      '<button class="iconbtn" id="hist-prev" aria-label="' + tr('prev_month') + '"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
      '<input type="month" id="hist-month" class="histnav__input" aria-label="' + tr('select_month') + '">' +
      '<button class="iconbtn" id="hist-next" aria-label="' + tr('next_month') + '"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';
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
    renderPendingFixas();
    var totals = categoryTotals(view);
    var spent = totals.reduce(function (s, x) { return s + x.total; }, 0);
    var budget = budgetFor(view);
    var left = budget - spent;

    Charts.donut($('donut'),
      totals.map(function (x) { return { value: x.total, color: x.cat.color }; }),
      { caption: tr('donut_spent'), value: money(spent), sub: tr('of_amount', { x: money(budget) }) });

    $('legend').innerHTML = totals.map(function (x) {
      return '<div class="legend__item">' +
        '<span class="legend__dot" style="background:' + x.cat.color + '"></span>' +
        '<span class="legend__name">' + escapeHtml(x.cat.name) + '</span>' +
        '<span class="legend__value">' + money(x.total) + '</span></div>';
    }).join('') || '<p class="empty">' + tr('no_expenses_month') + '</p>';

    $('stat-left').textContent = money(left);
    $('stat-left').className = 'stat ' + (left >= 0 ? 'stat--green' : '');
    $('stat-left').style.color = left < 0 ? '#ff6b8a' : '';
    var pctLeft = budget > 0 ? Math.round((left / budget) * 100) : 0;
    $('stat-left-hint').textContent = tr('pct_of_budget', { n: pctLeft });

    var today = new Date();
    var sameMonth = view.getMonth() === today.getMonth() && view.getFullYear() === today.getFullYear();
    var daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    var days = sameMonth ? today.getDate() : daysInMonth;
    $('stat-daily').textContent = money(spent / days);
    $('stat-daily-hint').textContent = tr('days_count', { n: days });

    var groups = monthGroups(view);
    $('activity').innerHTML = groups.map(function (g) {
      var c = catById(g.exp.categoryId);
      var multi = g.entries.length > 1;
      var dateOrCount = multi ? tr('entries_count', { n: g.entries.length }) : shortDate(g.entries[0].date);
      return '<li class="activity__item">' +
        '<span class="activity__dot" style="background:' + c.color + '"></span>' +
        '<div class="activity__info">' +
          '<span class="activity__title">' + escapeHtml(g.exp.merchant) + '</span>' +
          '<span class="activity__meta">' + escapeHtml(c.name) + '</span>' +
          '<span class="activity__date">' + escapeHtml(dateOrCount) + '</span></div>' +
        '<span class="activity__amount">-' + money(g.total, { cents: true }) + '</span>' +
        '<button class="rowbtn rowbtn--edit" data-edit-exp="' + g.exp.id + '" aria-label="' + tr('edit_label') + '">' + ICON_EDIT + '</button>' +
        '<button class="rowbtn rowbtn--del" data-del-exp="' + g.exp.id + '" aria-label="' + tr('remove_label') + '">' + ICON_DEL + '</button>' +
      '</li>';
    }).join('') || '<p class="empty">' + tr('no_expenses_cta') + '</p>';
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
      { caption: tr('portfolio'), value: money(current), sub: tr('assets_count', { n: inv.length }) });

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
          '<span class="activity__meta">' + escapeHtml(x.type) + ' · ' + tr('applied') + ' ' + money(ap) + '</span></div>' +
        '<span class="activity__amount ' + (r >= 0 ? 'is-positive' : 'is-negative') + '">' + (r >= 0 ? '+' : '') + rp.toFixed(1) + '%</span>' +
        '<button class="rowbtn rowbtn--edit" data-edit-inv="' + x.id + '" aria-label="' + tr('edit_label') + '">' + ICON_EDIT + '</button>' +
        '<button class="rowbtn rowbtn--del" data-del-inv="' + x.id + '" aria-label="' + tr('remove_label') + '">' + ICON_DEL + '</button>' +
      '</li>';
    }).join('') || '<p class="empty">' + tr('no_investments') + '</p>';
  }

  /* ========================= HISTÓRICO ========================== */
  function renderHistory() {
    if ($('hist-month')) $('hist-month').value = monthKey(view);

    var series = [];
    for (var i = 5; i >= 0; i--) {
      var d = new Date(view.getFullYear(), view.getMonth() - i, 1);
      var total = categoryTotals(d).reduce(function (s, x) { return s + x.total; }, 0);
      series.push({ label: monthName(d.getMonth(), true), value: total, active: i === 0, date: d });
    }
    Charts.bars($('barchart'), series, function (v) {
      return new Intl.NumberFormat(LOCALE[lang], { maximumFractionDigits: 0 }).format(v || 0);
    }, function (idx) {
      view = new Date(series[idx].date); renderAll();
    });

    $('history-month-label').textContent = tr('details_prefix') + monthLabel(view);
    var totals = categoryTotals(view);
    $('history-breakdown').innerHTML = totals.map(function (x) {
      return '<li class="activity__item">' +
        '<span class="activity__dot" style="background:' + x.cat.color + '"></span>' +
        '<div class="activity__info"><span class="activity__title">' + escapeHtml(x.cat.name) + '</span></div>' +
        '<span class="activity__amount">' + money(x.total) + '</span></li>';
    }).join('') || '<p class="empty">' + tr('no_expenses_hist') + '</p>';
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
        '<span class="catlist__total">' + tr('total_suffix', { x: money(allTotals[c.id] || 0) }) + '</span>' +
        '<button class="rowbtn rowbtn--edit" data-edit-cat="' + c.id + '" aria-label="' + tr('edit_label') + '">' + ICON_EDIT + '</button>' +
        '<button class="rowbtn rowbtn--del" data-del-cat="' + c.id + '" aria-label="' + tr('remove_label') + '">' + ICON_DEL + '</button>' +
      '</li>';
    }).join('');
  }

  /* ===================== MODAIS E FORMULÁRIOS ==================== */
  var modalSubmit = null;
  var lastFocus = null;

  // elementos focáveis e visíveis dentro de um container (p/ prender o Tab)
  function visibleFocusables(container) {
    var sel = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.prototype.filter.call(container.querySelectorAll(sel), function (el) {
      return !el.hidden && !el.closest('[hidden]');
    });
  }
  function trapFocus(container, e) {
    var f = visibleFocusables(container);
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1], active = document.activeElement;
    if (e.shiftKey) {
      if (active === first || !container.contains(active)) { e.preventDefault(); last.focus(); }
    } else {
      if (active === last || !container.contains(active)) { e.preventDefault(); first.focus(); }
    }
  }

  function openModal(title, bodyHtml, onSubmit) {
    if ($('modal').hidden) lastFocus = document.activeElement;   // guarda quem abriu
    $('modal-title').textContent = title;
    $('modal-form').innerHTML = bodyHtml +
      '<div class="modal__actions">' +
        '<button type="button" class="btn" data-close>' + tr('cancel') + '</button>' +
        '<button type="submit" class="btn btn--primary">' + tr('save') + '</button>' +
      '</div>';
    modalSubmit = onSubmit;
    $('modal').hidden = false;
    enhanceModalForm();
    var first = $('modal-form').querySelector('input, select');
    if (first) first.focus();
  }
  function closeModal() {
    $('modal').hidden = true; modalSubmit = null;
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
    lastFocus = null;
  }

  // Renderiza linhas mostrando as 3 mais recentes; o resto fica atrás de "Mostrar mais"
  function collapsibleRows(listId, rowsArr) {
    var LIMIT = 3;
    if (rowsArr.length <= LIMIT) return '<div id="' + listId + '">' + rowsArr.join('') + '</div>';
    var n = rowsArr.length - LIMIT;
    return '<div id="' + listId + '">' +
      rowsArr.slice(0, LIMIT).join('') +
      '<div class="morewrap" hidden>' + rowsArr.slice(LIMIT).join('') + '</div>' +
      '<button type="button" class="link morebtn" data-more>' + tr('show_more', { n: n }) + '</button>' +
    '</div>';
  }

  function enhanceModalForm() {
    var form = $('modal-form');
    var swatches = form.querySelectorAll('.swatch');
    swatches.forEach(function (sw) {
      sw.onclick = function () {
        swatches.forEach(function (s) { s.classList.remove('is-selected'); });
        sw.classList.add('is-selected');
        form.dataset.color = sw.dataset.color;
      };
    });
    var addEntry = form.querySelector('#entry-add');
    if (addEntry) addEntry.onclick = function () {
      form.querySelector('#entry-list').insertAdjacentHTML('afterbegin', entryRow(viewDateStr(), ''));
    };
    var addMov = form.querySelector('#mov-add');
    if (addMov) addMov.onclick = function () {
      form.querySelector('#mov-list').insertAdjacentHTML('afterbegin', movRow('aporte', todayStr(), ''));
    };
  }

  function categoryOptions(sel) {
    return data.categories.map(function (c) {
      return '<option value="' + c.id + '"' + (c.id === sel ? ' selected' : '') + '>' + escapeHtml(c.name) + '</option>';
    }).join('');
  }
  function typeOptions(sel) {
    var list = invTypes();
    if (sel && list.indexOf(sel) < 0) list = [sel].concat(list);
    return list.map(function (ty) { return '<option' + (ty === sel ? ' selected' : '') + '>' + escapeHtml(ty) + '</option>'; }).join('');
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
      '<button type="button" class="row-del" aria-label="' + tr('remove_entry') + '">' + ICON_DEL + '</button></div>';
  }
  function movRow(kind, date, amount) {
    return '<div class="modal-row">' +
      '<select class="row-kind"><option value="aporte"' + (kind !== 'saque' ? ' selected' : '') + '>' + tr('kind_deposit') + '</option><option value="saque"' + (kind === 'saque' ? ' selected' : '') + '>' + tr('kind_withdraw') + '</option></select>' +
      '<input type="date" class="row-date" value="' + (date || '') + '">' +
      '<input type="number" step="0.01" min="0" class="row-amount" placeholder="0,00" value="' + (amount != null ? amount : '') + '">' +
      '<button type="button" class="row-del" aria-label="' + tr('remove_label') + '">' + ICON_DEL + '</button></div>';
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
    var monthOf = monthKey(view);
    // Só os lançamentos do mês visível aparecem no modal (os outros meses ficam preservados)
    var visible = editing
      ? exp.entries.filter(function (e) { return e.date.slice(0, 7) === monthOf; })
          .sort(function (a, b) { return b.date.localeCompare(a.date); })
      : [];
    var sel = editing ? exp.categoryId : data.categories[0].id;
    var rowsArr = (editing && visible.length)
      ? visible.map(function (e) { return entryRow(e.date, e.amount); })
      : [entryRow(viewDateStr(), '')];

    openModal(editing ? tr('edit_expense') : tr('new_expense'),
      '<label class="field"><span class="field__label">' + tr('f_description') + '</span>' +
        '<input class="field__input" name="merchant" required placeholder="' + tr('ph_expense') + '" value="' + (editing ? escapeHtml(exp.merchant) : '') + '"></label>' +
      '<label class="field"><span class="field__label">' + tr('f_category') + '</span><select name="categoryId">' + categoryOptions(sel) + '</select></label>' +
      '<div class="field"><div class="field__label rowhead"><span>' + tr('f_entries') + '</span>' +
        '<button type="button" class="link" id="entry-add">' + tr('add_more') + '</button></div>' +
        collapsibleRows('entry-list', rowsArr) + '</div>',
      function (form) {
        var formEntries = readEntries(form);
        var others = editing ? exp.entries.filter(function (e) { return e.date.slice(0, 7) !== monthOf; }) : [];
        if (!formEntries.length && !others.length) { alert(tr('need_entry')); return false; }
        var merchant = form.elements.merchant.value.trim() || tr('def_expense');
        var categoryId = form.elements.categoryId.value;
        var allEntries = others.concat(formEntries);
        if (editing) { exp.merchant = merchant; exp.categoryId = categoryId; exp.entries = allEntries; }
        else { data.expenses.push({ id: Store.uid(), merchant: merchant, categoryId: categoryId, entries: allEntries }); }
        save();
        var latest = allEntries.map(function (e) { return e.date; }).sort().pop();
        if (latest) view = new Date(Number(latest.slice(0, 4)), Number(latest.slice(5, 7)) - 1, 1);
        renderAll();
      });
  }

  async function deleteExpense(id) {
    var exp = data.expenses.find(function (e) { return e.id === id; });
    if (!exp) return;
    if (!(await confirmDialog(tr('del_expense', { x: exp.merchant })))) return;
    data.expenses = data.expenses.filter(function (e) { return e.id !== id; });
    save(); renderAll();
  }

  /* ---- Investimento (criar/editar) ---- */
  function openInvestment(inv) {
    var editing = !!inv;
    var movs = editing
      ? inv.movements.slice().sort(function (a, b) { return b.date.localeCompare(a.date); })
      : [];
    var rowsArr = (editing && movs.length)
      ? movs.map(function (m) { return movRow(m.kind, m.date, m.amount); })
      : [movRow('aporte', todayStr(), '')];

    openModal(editing ? tr('edit_investment') : tr('new_investment'),
      '<label class="field"><span class="field__label">' + tr('f_name') + '</span>' +
        '<input class="field__input" name="name" required placeholder="' + tr('ph_investment') + '" value="' + (editing ? escapeHtml(inv.name) : '') + '"></label>' +
      '<div class="field__row">' +
        '<label class="field"><span class="field__label">' + tr('f_type') + '</span><select name="type">' + typeOptions(editing ? inv.type : tr('inv_fixed')) + '</select></label>' +
        '<label class="field"><span class="field__label">' + tr('f_current') + '</span>' +
          '<input class="field__input" name="current" type="number" step="0.01" min="0" placeholder="0,00" value="' + (editing ? inv.current : '') + '"></label>' +
      '</div>' +
      '<div class="field"><div class="field__label rowhead"><span>' + tr('f_movements') + '</span>' +
        '<button type="button" class="link" id="mov-add">' + tr('add_more') + '</button></div>' +
        collapsibleRows('mov-list', rowsArr) + '</div>' +
      '<div class="field"><span class="field__label">' + tr('f_color') + '</span>' + swatchesHtml(editing ? inv.color : SWATCHES[4]) + '</div>',
      function (form) {
        var movements = readMovs(form);
        if (!movements.length) { alert(tr('need_deposit')); return false; }
        var name = form.elements.name.value.trim() || tr('def_investment');
        var type = form.elements.type.value;
        var color = form.dataset.color || (editing ? inv.color : SWATCHES[4]);
        var net = movements.reduce(function (s, m) { return s + (m.kind === 'saque' ? -m.amount : m.amount); }, 0);
        var current = form.elements.current.value ? Math.abs(parseFloat(form.elements.current.value)) : net;
        if (editing) { inv.name = name; inv.type = type; inv.color = color; inv.movements = movements; inv.current = current; }
        else { data.investments.push({ id: Store.uid(), name: name, type: type, color: color, current: current, movements: movements }); }
        save(); renderInvestments();
      });
    if (!editing) $('modal-form').dataset.color = SWATCHES[4];
  }

  async function deleteInvestment(id) {
    var inv = data.investments.find(function (x) { return x.id === id; });
    if (!inv) return;
    if (!(await confirmDialog(tr('del_investment', { x: inv.name })))) return;
    data.investments = data.investments.filter(function (x) { return x.id !== id; });
    save(); renderInvestments();
  }

  /* ---- Categoria (criar/editar/remover) ---- */
  function openCategory(cat) {
    var editing = !!cat;
    openModal(editing ? tr('edit_category') : tr('new_category'),
      '<label class="field"><span class="field__label">' + tr('f_name') + '</span>' +
        '<input class="field__input" name="name" required placeholder="' + tr('ph_category') + '" value="' + (editing ? escapeHtml(cat.name) : '') + '"></label>' +
      '<div class="field"><span class="field__label">' + tr('f_color') + '</span>' + swatchesHtml(editing ? cat.color : SWATCHES[0]) + '</div>',
      function (form) {
        var color = form.dataset.color || (editing ? cat.color : SWATCHES[0]);
        var name = form.elements.name.value.trim() || tr('def_category');
        if (editing) { cat.name = name; cat.color = color; }
        else { data.categories.push({ id: 'cat-' + Store.uid(), name: name, color: color }); }
        save(); renderAll();
      });
    if (!editing) $('modal-form').dataset.color = SWATCHES[0];
  }

  async function deleteCategory(id) {
    if (data.categories.length <= 1) { await confirmDialog(tr('keep_one_cat'), true); return; }
    var cat = catById(id);
    if (!(await confirmDialog(tr('del_category', { x: cat.name })))) return;
    var fallback = data.categories.find(function (c) { return c.id !== id && /outros|other|otros/i.test(c.name); })
                || data.categories.find(function (c) { return c.id !== id; });
    data.expenses.forEach(function (exp) { if (exp.categoryId === id) exp.categoryId = fallback.id; });
    data.categories = data.categories.filter(function (c) { return c.id !== id; });
    save(); renderAll();
  }

  /* ---- Orçamento (por mês ou padrão) ---- */
  function openBudget() {
    var k = monthKey(view);
    var isDefault = data.monthBudgets[k] == null;
    openModal(tr('budget_prefix') + monthLabel(view),
      '<label class="field"><span class="field__label">' + tr('f_budget') + '</span>' +
        '<input class="field__input" name="budget" type="number" step="0.01" min="0" required value="' + budgetFor(view) + '"></label>' +
      '<label class="check"><input type="checkbox" name="allmonths"' + (isDefault ? ' checked' : '') + '>' +
        '<span>' + tr('budget_all') + '</span></label>' +
      '<p class="field__hint">' + tr('budget_hint') + '</p>',
      function (form) {
        var val = Math.abs(parseFloat(form.elements.budget.value) || 0);
        if (form.elements.allmonths.checked) { data.budget = val; delete data.monthBudgets[k]; }
        else { data.monthBudgets[k] = val; }
        save(); renderOverview();
      });
  }

  /* ---- Moeda ---- */
  function openCurrency() {
    var opts = CURRENCIES.map(function (c) {
      var label = c + ' — ' + currencyName(c) + ' (' + currencySymbol(c) + ')';
      return '<option value="' + c + '"' + (c === data.currency ? ' selected' : '') + '>' + escapeHtml(label) + '</option>';
    }).join('');
    openModal(tr('currency_title'),
      '<label class="field"><span class="field__label">' + tr('menu_currency') + '</span><select name="currency">' + opts + '</select></label>',
      function (form) { data.currency = form.elements.currency.value; save(); updateMenuLabels(); renderAll(); });
  }

  /* ---- Idioma ---- */
  function openLanguage() {
    var opts = LANGS.map(function (l) {
      return '<option value="' + l + '"' + (l === lang ? ' selected' : '') + '>' + LANG_NAMES[l] + '</option>';
    }).join('');
    openModal(tr('language_title'),
      '<label class="field"><span class="field__label">' + tr('menu_language') + '</span><select name="lang">' + opts + '</select></label>',
      function (form) {
        lang = form.elements.lang.value; data.lang = lang;
        save(); applyStaticI18n(); updateMenuLabels(); renderAll();
      });
  }

  /* ---- Exportar dados (JSON backup + CSV legível) ---- */
  function downloadFile(filename, content, mime) {
    var blob = new Blob([content], { type: mime + ';charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function csvDelim() { return lang === 'en' ? ',' : ';'; }       // pt/es usam ; (decimal é vírgula)
  function csvNum(n) {
    var s = (Number(n) || 0).toFixed(2);
    return lang === 'en' ? s : s.replace('.', ',');
  }
  function csvFrac(n) {                                  // fração p/ formatar como % na planilha (0,07 -> 7%)
    var s = (Number(n) || 0).toFixed(4);
    return lang === 'en' ? s : s.replace('.', ',');
  }
  function csvCell(v, delim) {
    v = String(v == null ? '' : v);
    if (v.indexOf('"') >= 0 || v.indexOf(delim) >= 0 || v.indexOf('\n') >= 0 || v.indexOf('\r') >= 0)
      v = '"' + v.replace(/"/g, '""') + '"';
    return v;
  }
  function toCsv(rows, delim) {
    return '\uFEFF' + rows.map(function (r) {           // BOM p/ acentos no Excel
      return r.map(function (c) { return csvCell(c, delim); }).join(delim);
    }).join('\r\n');
  }
  function buildExpensesCsv() {
    var delim = csvDelim(), cur = data.currency;
    var rows = [[tr('col_date'), tr('f_description'), tr('f_category'), tr('col_amount') + ' (' + cur + ')', tr('col_month')]];
    var flat = [];
    data.expenses.forEach(function (exp) {
      var cat = catById(exp.categoryId);
      exp.entries.forEach(function (e) { flat.push({ date: e.date, merchant: exp.merchant, cat: cat.name, amount: e.amount }); });
    });
    flat.sort(function (a, b) { return a.date.localeCompare(b.date); });
    flat.forEach(function (r) { rows.push([r.date, r.merchant, r.cat, csvNum(r.amount), r.date.slice(0, 7)]); });
    return toCsv(rows, delim);
  }
  function buildInvestmentsCsv() {
    var delim = csvDelim(), cur = data.currency;
    var rows = [[tr('f_name'), tr('f_type'), tr('col_invested') + ' (' + cur + ')',
      tr('current_value') + ' (' + cur + ')', tr('return_label') + ' (' + cur + ')', tr('return_label') + ' %']];
    data.investments.forEach(function (inv) {
      var ap = investedOf(inv), ret = inv.current - ap, frac = ap > 0 ? (ret / ap) : 0;
      rows.push([inv.name, inv.type, csvNum(ap), csvNum(inv.current), csvNum(ret), csvFrac(frac)]);
    });
    return toCsv(rows, delim);
  }
  function exportName(kind, ext) { return 'aurora-' + kind + '-' + todayStr() + '.' + ext; }
  function doExport(kind) {
    if (kind === 'json') downloadFile(exportName('backup', 'json'), JSON.stringify(data, null, 2), 'application/json');
    else if (kind === 'expenses') downloadFile(exportName('despesas', 'csv'), buildExpensesCsv(), 'text/csv');
    else if (kind === 'investments') downloadFile(exportName('investimentos', 'csv'), buildInvestmentsCsv(), 'text/csv');
  }
  function openExport() {
    $('modal-title').textContent = tr('export_title');
    $('modal-form').innerHTML =
      '<p class="field__hint" style="margin-top:0">' + tr('export_desc') + '</p>' +
      '<div class="exportlist">' +
        '<button type="button" class="btn btn--block" data-export="json">' + tr('export_backup') + '</button>' +
        '<button type="button" class="btn btn--block" data-export="expenses">' + tr('export_expenses') + '</button>' +
        '<button type="button" class="btn btn--block" data-export="investments">' + tr('export_investments') + '</button>' +
      '</div>' +
      '<div class="modal__actions"><button type="button" class="btn" data-close>' + tr('cancel') + '</button></div>';
    modalSubmit = null;
    if ($('modal').hidden) lastFocus = document.activeElement;
    $('modal').hidden = false;
    var f1 = $('modal-form').querySelector('a[href], button, input, select');
    if (f1) f1.focus();
  }

  /* ---- Despesas fixas (recorrências) ---- */
  function applyRecurrenceOccurrence(rec) {
    var entry = { id: Store.uid(), date: rec.nextDue, amount: rec.amount };
    var exp = data.expenses.find(function (x) { return x.merchant === rec.merchant && x.categoryId === rec.categoryId; });
    if (exp) exp.entries.push(entry);
    else data.expenses.push({ id: Store.uid(), merchant: rec.merchant, categoryId: rec.categoryId, entries: [entry] });
    rec.nextDue = advanceDue(rec);
  }
  function launchRecurrence(id) {
    var rec = (data.recurrences || []).find(function (r) { return r.id === id; });
    if (!rec) return;
    applyRecurrenceOccurrence(rec);              // lança 1 ocorrência e avança
    save(); renderAll();
  }
  function launchAllRecurrences() {
    var today = todayStr();
    (data.recurrences || []).forEach(function (rec) {
      if (rec.active === false) return;
      var guard = 0;
      while (rec.nextDue <= today && guard < 120) { applyRecurrenceOccurrence(rec); guard++; }
    });
    save(); renderAll();
  }

  function renderPendingFixas() {
    var el = $('pending-fixas'); if (!el) return;
    var today = new Date();
    var sameMonth = view.getMonth() === today.getMonth() && view.getFullYear() === today.getFullYear();
    var todayIso = todayStr();
    var pending = sameMonth
      ? (data.recurrences || []).filter(function (r) { return r.active !== false && r.nextDue <= todayIso; })
      : [];
    if (!pending.length) { el.innerHTML = ''; return; }
    el.innerHTML = '<article class="card card--fixas"><div class="card__head">' +
      '<span class="card__label">' + tr('fixas_pending') + '</span>' +
      '<button class="btn btn--small" data-launch-all>' + tr('launch_all') + '</button></div>' +
      '<ul class="activity">' + pending.map(function (r) {
        var c = catById(r.categoryId);
        return '<li class="activity__item">' +
          '<span class="activity__dot" style="background:' + c.color + '"></span>' +
          '<div class="activity__info"><span class="activity__title">' + escapeHtml(r.merchant) + '</span>' +
            '<span class="activity__meta">' + escapeHtml(c.name) + ' · ' + tr('freq_' + r.freq) + '</span>' +
            '<span class="activity__date">' + shortDate(r.nextDue) + '</span></div>' +
          '<span class="activity__amount">' + money(r.amount, { cents: true }) + '</span>' +
          '<button class="btn btn--small" data-launch="' + r.id + '">' + tr('launch_one') + '</button>' +
        '</li>';
      }).join('') + '</ul></article>';
  }

  function openRecurrences() {
    var list = data.recurrences || [];
    var body = '<p class="field__hint" style="margin-top:0">' + tr('fixas_desc') + '</p>';
    if (list.length) {
      body += '<ul class="catlist">' + list.map(function (r) {
        var c = catById(r.categoryId);
        return '<li class="catlist__item">' +
          '<span class="catlist__dot" style="background:' + c.color + '"></span>' +
          '<span class="catlist__name">' + escapeHtml(r.merchant) + '</span>' +
          '<span class="catlist__total">' + money(r.amount) + ' · ' + tr('freq_' + r.freq) + '</span>' +
          '<button class="rowbtn rowbtn--edit" data-edit-rec="' + r.id + '" aria-label="' + tr('edit_label') + '">' + ICON_EDIT + '</button>' +
          '<button class="rowbtn rowbtn--del" data-del-rec="' + r.id + '" aria-label="' + tr('remove_label') + '">' + ICON_DEL + '</button>' +
        '</li>';
      }).join('') + '</ul>';
    } else {
      body += '<p class="empty">' + tr('fixas_empty') + '</p>';
    }
    body += '<div class="exportlist"><button type="button" class="btn btn--block btn--primary" data-new-rec>' + tr('fixas_new') + '</button></div>' +
      '<div class="modal__actions"><button type="button" class="btn" data-close>' + tr('cancel') + '</button></div>';
    $('modal-title').textContent = tr('menu_fixas');
    $('modal-form').innerHTML = body;
    modalSubmit = null;
    if ($('modal').hidden) lastFocus = document.activeElement;
    $('modal').hidden = false;
    var f2 = $('modal-form').querySelector('a[href], button, input, select');
    if (f2) f2.focus();
  }

  function openRecurrence(rec) {
    var editing = !!rec;
    var sel = editing ? rec.categoryId : data.categories[0].id;
    var freq = editing ? rec.freq : 'monthly';
    var due = editing ? rec.nextDue : todayStr();
    function freqOpt(v) { return '<option value="' + v + '"' + (freq === v ? ' selected' : '') + '>' + tr('freq_' + v) + '</option>'; }
    openModal(editing ? tr('fixas_edit') : tr('fixas_new'),
      '<label class="field"><span class="field__label">' + tr('f_description') + '</span>' +
        '<input class="field__input" name="merchant" required placeholder="' + tr('ph_expense') + '" value="' + (editing ? escapeHtml(rec.merchant) : '') + '"></label>' +
      '<label class="field"><span class="field__label">' + tr('f_category') + '</span><select name="categoryId">' + categoryOptions(sel) + '</select></label>' +
      '<div class="field__row">' +
        '<label class="field"><span class="field__label">' + tr('col_amount') + '</span>' +
          '<input class="field__input" name="amount" type="number" step="0.01" min="0" placeholder="0,00" value="' + (editing ? rec.amount : '') + '"></label>' +
        '<label class="field"><span class="field__label">' + tr('f_frequency') + '</span>' +
          '<select name="freq">' + freqOpt('monthly') + freqOpt('weekly') + freqOpt('yearly') + '</select></label>' +
      '</div>' +
      '<label class="field"><span class="field__label">' + tr('f_next_due') + '</span>' +
        '<input type="date" class="row-date" name="nextDue" value="' + due + '"></label>',
      function (form) {
        var merchant = form.elements.merchant.value.trim() || tr('def_expense');
        var amount = Math.abs(parseFloat(form.elements.amount.value) || 0);
        var nextDue = form.elements.nextDue.value || todayStr();
        var f = form.elements.freq.value;
        var day = Number(nextDue.slice(8, 10));
        if (editing) {
          rec.merchant = merchant; rec.categoryId = form.elements.categoryId.value;
          rec.amount = amount; rec.freq = f; rec.nextDue = nextDue; rec.day = day;
        } else {
          data.recurrences.push({ id: Store.uid(), merchant: merchant, categoryId: form.elements.categoryId.value,
            amount: amount, freq: f, nextDue: nextDue, day: day, active: true });
        }
        save(); renderAll();
        openRecurrences();      // volta pro gerenciador atualizado
        return false;
      });
  }

  async function deleteRecurrence(id) {
    var rec = (data.recurrences || []).find(function (r) { return r.id === id; });
    if (!rec) return;
    if (!(await confirmDialog(tr('del_fixa', { x: rec.merchant })))) return;
    data.recurrences = data.recurrences.filter(function (r) { return r.id !== id; });
    save(); renderAll(); openRecurrences();
  }

  /* ---- Confirmação estilizada (substitui o confirm() do navegador) ---- */
  function confirmDialog(message, alertOnly) {
    return new Promise(function (resolve) {
      var prevFocus = document.activeElement;
      var el = document.createElement('div');
      el.className = 'confirm';
      el.innerHTML =
        '<div class="confirm__backdrop"></div>' +
        '<div class="confirm__box" role="alertdialog" aria-modal="true">' +
          '<p class="confirm__msg">' + escapeHtml(message) + '</p>' +
          '<div class="confirm__actions">' +
            (alertOnly ? '' : '<button class="btn" data-no>' + tr('cancel') + '</button>') +
            '<button class="btn ' + (alertOnly ? 'btn--primary' : 'btn--danger') + '" data-yes>' + (alertOnly ? tr('ok') : tr('remove')) + '</button>' +
          '</div></div>';
      document.body.appendChild(el);
      function onKey(ev) {
        if (ev.key === 'Escape') { ev.preventDefault(); done(false); }
        else if (ev.key === 'Tab') { trapFocus(el, ev); }
      }
      document.addEventListener('keydown', onKey);
      function done(v) {
        document.removeEventListener('keydown', onKey);
        el.remove();
        if (prevFocus && prevFocus.focus) { try { prevFocus.focus(); } catch (e) {} }
        resolve(v);
      }
      el.querySelector('[data-yes]').onclick = function () { done(true); };
      var no = el.querySelector('[data-no]'); if (no) no.onclick = function () { done(false); };
      el.querySelector('.confirm__backdrop').onclick = function () { done(false); };
      el.querySelector('[data-yes]').focus();      // foco inicial no botão principal
    });
  }

  /* ===================== EVENTOS / WIRING =================== */
  function setupEvents() {
    $('add-expense').addEventListener('click', function () { openExpense(null); });
    $('add-investment').addEventListener('click', function () { openInvestment(null); });
    $('add-category').addEventListener('click', function () { openCategory(null); });
    $('edit-categories').addEventListener('click', function () { switchView('categories'); });

    $('modal-form').addEventListener('submit', function (e) {
      e.preventDefault();
      if (!modalSubmit) return;
      var keepOpen = modalSubmit($('modal-form'));
      if (keepOpen !== false) closeModal();
    });
    $('modal-form').addEventListener('click', function (e) {
      var del = e.target.closest('.row-del');
      if (del) { e.preventDefault(); del.closest('.modal-row').remove(); return; }
      var more = e.target.closest('[data-more]');
      if (more) {
        e.preventDefault();
        var wrap = more.parentNode.querySelector('.morewrap');
        if (wrap) {
          wrap.hidden = !wrap.hidden;
          var count = wrap.querySelectorAll('.modal-row').length;
          more.textContent = wrap.hidden ? tr('show_more', { n: count }) : tr('show_less');
        }
        return;
      }
      var ex = e.target.closest('[data-export]');
      if (ex) { e.preventDefault(); doExport(ex.dataset.export); }
    });
    $('modal').addEventListener('click', function (e) { if (e.target.closest('[data-close]')) closeModal(); });
    document.addEventListener('keydown', function (e) {
      if (document.querySelector('.confirm')) return;     // confirm cuida do próprio teclado
      if ($('modal').hidden) return;
      if (e.key === 'Tab') trapFocus($('modal'), e);
      else if (e.key === 'Escape') closeModal();
    });

    document.addEventListener('click', function (e) {
      var t;
      if ((t = e.target.closest('[data-edit-exp]'))) { var ex = data.expenses.find(function (x) { return x.id === t.dataset.editExp; }); if (ex) openExpense(ex); return; }
      if ((t = e.target.closest('[data-del-exp]')))  { deleteExpense(t.dataset.delExp); return; }
      if ((t = e.target.closest('[data-edit-inv]'))) { var iv = data.investments.find(function (x) { return x.id === t.dataset.editInv; }); if (iv) openInvestment(iv); return; }
      if ((t = e.target.closest('[data-del-inv]')))  { deleteInvestment(t.dataset.delInv); return; }
      if ((t = e.target.closest('[data-edit-cat]'))) { var ct = catById(t.dataset.editCat); openCategory(ct); return; }
      if ((t = e.target.closest('[data-del-cat]')))  { deleteCategory(t.dataset.delCat); return; }
      if ((t = e.target.closest('[data-launch]')))   { launchRecurrence(t.dataset.launch); return; }
      if (e.target.closest('[data-launch-all]'))     { launchAllRecurrences(); return; }
      if ((t = e.target.closest('[data-edit-rec]'))) { var rc = (data.recurrences || []).find(function (x) { return x.id === t.dataset.editRec; }); if (rc) openRecurrence(rc); return; }
      if ((t = e.target.closest('[data-del-rec]')))  { deleteRecurrence(t.dataset.delRec); return; }
      if (e.target.closest('[data-new-rec]'))        { openRecurrence(null); return; }
    });

    $('save-status-retry').addEventListener('click', flushSave);

    var avatar = $('avatar-btn'), menu = $('account-menu');
    avatar.addEventListener('click', function (e) { if (e.target.closest('.menu')) return; menu.hidden = !menu.hidden; });
    avatar.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); menu.hidden = !menu.hidden; } });
    document.addEventListener('click', function (e) { if (!e.target.closest('.avatar')) menu.hidden = true; });

    $('menu-budget').addEventListener('click', function () { menu.hidden = true; openBudget(); });
    $('menu-export').addEventListener('click', function () { menu.hidden = true; openExport(); });
    $('menu-fixas').addEventListener('click', function () { menu.hidden = true; openRecurrences(); });
    $('menu-currency').addEventListener('click', function () { menu.hidden = true; openCurrency(); });
    $('menu-language').addEventListener('click', function () { menu.hidden = true; openLanguage(); });
    $('menu-logout').addEventListener('click', function () {
      Store.logout(); data = null;
      $('app').hidden = true; $('auth-screen').hidden = false;
      $('auth-user').value = ''; $('auth-pass').value = ''; $('auth-error').textContent = '';
    });
  }

  function updateMenuLabels() {
    $('menu-currency').textContent = tr('menu_currency') + ' · ' + data.currency;
    $('menu-language').textContent = tr('menu_language') + ' · ' + LANG_NAMES[lang];
  }

  /* ============================ BOOT ============================ */
  function boot() {
    setupAuth();
    setupNav();
    setupEvents();
    if (Store.currentUser()) startApp();
    else { lang = detectLang(); applyStaticI18n(); setupGoogle(); $('auth-screen').hidden = false; }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
