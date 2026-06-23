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

  /* ----------------- dados iniciais (seed) -------------------------- */
  function seedExpenses() {
    var now = new Date();
    function iso(m, day) { return new Date(now.getFullYear(), now.getMonth() - m, day).toISOString().slice(0, 10); }
    function exp(merchant, catId, entries) {
      return { id: uid(), merchant: merchant, categoryId: catId,
        entries: entries.map(function (e) { return { id: uid(), date: iso(e[0], e[1]), amount: e[2] }; }) };
    }
    return [
      exp('Aluguel', 'cat-moradia', [[0,5,1650],[1,5,1650],[2,5,1650]]),
      exp('Supermercado', 'cat-alimento', [[0,8,320],[1,8,300],[2,8,330]]),
      exp('Padaria', 'cat-alimento', [[0,20,25],[0,21,20]]),
      exp('iFood', 'cat-alimento', [[0,14,95]]),
      exp('Restaurante', 'cat-alimento', [[0,18,130]]),
      exp('Combustível', 'cat-transp', [[0,6,220],[1,6,200],[2,6,200]]),
      exp('Uber', 'cat-transp', [[0,12,70]]),
      exp('Transporte público', 'cat-transp', [[0,2,50]]),
      exp('Amazon', 'cat-compras', [[0,9,210]]),
      exp('Roupas', 'cat-compras', [[0,16,200]]),
      exp('Farmácia', 'cat-saude', [[0,7,80],[1,7,90],[2,7,90]]),
      exp('Academia', 'cat-saude', [[0,1,120]]),
      exp('Consulta', 'cat-saude', [[0,15,50]]),
      exp('Energia', 'cat-contas', [[0,10,130],[1,10,140],[2,10,150]]),
      exp('Internet', 'cat-contas', [[0,10,100],[1,10,100],[2,10,100]]),
      exp('Celular', 'cat-contas', [[0,10,50],[1,10,50],[2,10,50]]),
      exp('Netflix', 'cat-lazer', [[0,3,55],[1,3,55],[2,3,55]]),
      exp('Spotify', 'cat-lazer', [[0,3,35],[1,3,35],[2,3,35]]),
      exp('Cinema', 'cat-lazer', [[0,17,60]]),
      exp('Steam', 'cat-lazer', [[0,19,40]]),
      exp('Presente', 'cat-outros', [[0,11,240]]),
      exp('Pet shop', 'cat-outros', [[0,13,200]])
    ];
  }

  function seedInvestments() {
    function d(m) { var x = new Date(); return new Date(x.getFullYear(), x.getMonth() - m, 10).toISOString().slice(0, 10); }
    return [
      { id: uid(), name: 'Tesouro Selic 2029', type: 'Renda Fixa', color: '#00d6b4', current: 5350, movements: [{ id: uid(), kind: 'aporte', date: d(6), amount: 5000 }] },
      { id: uid(), name: 'PETR4',  type: 'Ações',  color: '#3366ff', current: 3280, movements: [{ id: uid(), kind: 'aporte', date: d(4), amount: 3000 }] },
      { id: uid(), name: 'MXRF11', type: 'FII',    color: '#b94dff', current: 2090, movements: [{ id: uid(), kind: 'aporte', date: d(3), amount: 2000 }] },
      { id: uid(), name: 'Bitcoin',type: 'Cripto', color: '#ff2d78', current: 1820, movements: [{ id: uid(), kind: 'aporte', date: d(5), amount: 1500 }] }
    ];
  }

  function freshUserData() {
    return {
      budget: 5000, currency: 'BRL', monthBudgets: {},
      categories: defaultCategories(),
      expenses: seedExpenses(),
      investments: seedInvestments()
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
