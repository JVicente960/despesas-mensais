/* =====================================================================
   storage.js · Camada de dados e autenticação (ONLINE)
   ---------------------------------------------------------------------
   Conversa com o backend em Cloudflare Pages Functions + D1.
   Contas e dados ficam no servidor, sincronizados entre dispositivos.

   Modelo de dados (v2):
     budget         -> orçamento padrão (fixo)
     monthBudgets   -> { 'YYYY-MM': valor } overrides por mês
     currency       -> 'BRL' | 'USD'
     categories     -> [{ id, name, color }]
     expenses       -> [{ id, merchant, categoryId, entries:[{id,date,amount}] }]
     investments    -> [{ id, name, type, color, current,
                          movements:[{id, kind:'aporte'|'saque', date, amount}] }]

   Expõe: window.Store
   ===================================================================== */
(function () {
  'use strict';

  var API_BASE = '';
  var KEYS = { token: 'aurora.token', user: 'aurora.user' };

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  async function api(method, path, body) {
    var headers = { 'Content-Type': 'application/json' };
    var token = localStorage.getItem(KEYS.token);
    if (token) headers['Authorization'] = 'Bearer ' + token;

    var res;
    try {
      res = await fetch(API_BASE + path, {
        method: method, headers: headers,
        body: body !== undefined ? JSON.stringify(body) : undefined
      });
    } catch (e) { throw new Error('Não foi possível conectar ao servidor.'); }

    var data = null;
    try { data = await res.json(); } catch (e) { data = {}; }
    if (!res.ok) throw new Error((data && data.error) || 'Erro na requisição.');
    return data;
  }

  /* --------------------- categorias padrão -------------------------- */
  function defaultCategories() {
    return [
      { id: 'cat-moradia',  name: 'Moradia',     color: '#ff2d78' },
      { id: 'cat-alimento', name: 'Alimentação', color: '#b94dff' },
      { id: 'cat-outros',   name: 'Outros',      color: '#8257ff' },
      { id: 'cat-compras',  name: 'Compras',     color: '#3366ff' },
      { id: 'cat-transp',   name: 'Transporte',  color: '#19b9ff' },
      { id: 'cat-contas',   name: 'Contas',      color: '#00d6b4' },
      { id: 'cat-saude',    name: 'Saúde',       color: '#2fdd76' },
      { id: 'cat-lazer',    name: 'Lazer',       color: '#c2ee2e' }
    ];
  }

  /* ----------------- dados iniciais (usuário novo começa limpo) ----- */
  function freshUserData() {
    return {
      budget: 5000, currency: 'BRL', lang: null, monthBudgets: {},
      categories: defaultCategories(),
      expenses: [],
      investments: []
    };
  }

  /* -------- migração: converte dados antigos (v1) para v2 ----------- */
  function migrate(data) {
    if (!data) return data;

    // transações planas -> despesas agrupadas por (descrição + categoria)
    if (data.transactions && !data.expenses) {
      var map = {};
      data.expenses = [];
      data.transactions.forEach(function (t) {
        var key = (t.merchant || 'Despesa') + '|' + t.categoryId;
        if (!map[key]) {
          map[key] = { id: uid(), merchant: t.merchant || 'Despesa', categoryId: t.categoryId, entries: [] };
          data.expenses.push(map[key]);
        }
        map[key].entries.push({ id: t.id || uid(), date: t.date, amount: t.amount });
      });
      delete data.transactions;
    }
    if (!data.expenses) data.expenses = [];

    // investimentos antigos (invested/current) -> movements
    (data.investments || []).forEach(function (inv) {
      if (!inv.movements) {
        inv.movements = [{ id: uid(), kind: 'aporte',
          date: inv.date || new Date().toISOString().slice(0, 10),
          amount: inv.invested || 0 }];
      }
      if (inv.current == null) inv.current = inv.invested || 0;
      if (!inv.color) inv.color = '#3366ff';
      if (!inv.type) inv.type = 'Outros';
    });
    if (!data.investments) data.investments = [];

    if (!data.monthBudgets) data.monthBudgets = {};
    if (data.budget == null) data.budget = 5000;
    if (!data.currency) data.currency = 'BRL';
    if (!data.categories) data.categories = defaultCategories();
    return data;
  }

  /* --------------------------- API pública -------------------------- */
  var Store = {
    uid: uid,

    async register(username, password) {
      try { await api('POST', '/api/register', { username: username, password: password }); return { ok: true }; }
      catch (e) { return { ok: false, error: e.message }; }
    },

    async login(username, password) {
      try {
        var res = await api('POST', '/api/login', { username: username, password: password });
        localStorage.setItem(KEYS.token, res.token);
        localStorage.setItem(KEYS.user, res.username);
        return { ok: true };
      } catch (e) { return { ok: false, error: e.message }; }
    },

    async logout() {
      try { await api('POST', '/api/logout'); } catch (e) {}
      localStorage.removeItem(KEYS.token);
      localStorage.removeItem(KEYS.user);
    },

    currentUser() {
      return localStorage.getItem(KEYS.token) ? localStorage.getItem(KEYS.user) : null;
    },

    async fetchData() {
      var res = await api('GET', '/api/data');
      if (res.data) return migrate(res.data);
      var seeded = freshUserData();
      await this.saveData(seeded);
      return seeded;
    },

    async saveData(data) { return api('PUT', '/api/data', data); }
  };

  window.Store = Store;
})();
