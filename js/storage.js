/* =====================================================================
   storage.js · Camada de dados e autenticação (ONLINE)
   ---------------------------------------------------------------------
   Conversa com o backend em Cloudflare Pages Functions + D1.
   As contas e os dados ficam no servidor, sincronizados entre dispositivos.
   No navegador guardamos só o token de sessão e o nome do usuário.

   Expõe um objeto global: window.Store
   ===================================================================== */
(function () {
  'use strict';

  // Mesma origem do site (a API mora em /api/* no mesmo deploy do Pages).
  // Se um dia hospedar a API em outro domínio, troque aqui.
  var API_BASE = '';

  var KEYS = {
    token: 'aurora.token',
    user:  'aurora.user'
  };

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  // Chamada HTTP genérica à API. Lança Error com mensagem amigável em caso de falha.
  async function api(method, path, body) {
    var headers = { 'Content-Type': 'application/json' };
    var token = localStorage.getItem(KEYS.token);
    if (token) headers['Authorization'] = 'Bearer ' + token;

    var res;
    try {
      res = await fetch(API_BASE + path, {
        method: method,
        headers: headers,
        body: body !== undefined ? JSON.stringify(body) : undefined
      });
    } catch (e) {
      throw new Error('Não foi possível conectar ao servidor.');
    }

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

  /* ----------------- despesas iniciais (seed) ----------------------- */
  // Usado só na PRIMEIRA vez que um usuário entra (servidor ainda sem dados),
  // para o painel e o histórico já nascerem preenchidos.
  function seedTransactions() {
    var now = new Date();
    var txns = [];
    function dateInMonth(monthsAgo, day) {
      return new Date(now.getFullYear(), now.getMonth() - monthsAgo, day).toISOString().slice(0, 10);
    }
    function add(monthsAgo, day, merchant, catId, amount) {
      txns.push({ id: uid(), date: dateInMonth(monthsAgo, day), merchant: merchant, categoryId: catId, amount: amount });
    }

    // Mês atual
    add(0, 5,  'Aluguel',            'cat-moradia',  1650);
    add(0, 8,  'Supermercado',       'cat-alimento',  320);
    add(0, 14, 'iFood',              'cat-alimento',   95);
    add(0, 18, 'Restaurante',        'cat-alimento',  130);
    add(0, 20, 'Padaria',            'cat-alimento',   45);
    add(0, 21, 'Mercado',            'cat-alimento',  130);
    add(0, 6,  'Combustível',        'cat-transp',    220);
    add(0, 12, 'Uber',               'cat-transp',     70);
    add(0, 2,  'Transporte público', 'cat-transp',     50);
    add(0, 9,  'Amazon',             'cat-compras',   210);
    add(0, 16, 'Roupas',             'cat-compras',   200);
    add(0, 7,  'Farmácia',           'cat-saude',      80);
    add(0, 1,  'Academia',           'cat-saude',     120);
    add(0, 15, 'Consulta',           'cat-saude',      50);
    add(0, 10, 'Energia',            'cat-contas',    130);
    add(0, 10, 'Internet',           'cat-contas',    100);
    add(0, 10, 'Celular',            'cat-contas',     50);
    add(0, 3,  'Netflix',            'cat-lazer',      55);
    add(0, 3,  'Spotify',            'cat-lazer',      35);
    add(0, 17, 'Cinema',             'cat-lazer',      60);
    add(0, 19, 'Steam',              'cat-lazer',      40);
    add(0, 11, 'Presente',           'cat-outros',    240);
    add(0, 13, 'Pet shop',           'cat-outros',    200);

    // Meses anteriores (recorrentes) para o histórico
    [1, 2].forEach(function (m) {
      add(m, 5,  'Aluguel',      'cat-moradia',  1650);
      add(m, 8,  'Supermercado', 'cat-alimento',  300 + m * 30);
      add(m, 10, 'Energia',      'cat-contas',    120 + m * 10);
      add(m, 10, 'Internet',     'cat-contas',    100);
      add(m, 10, 'Celular',      'cat-contas',     50);
      add(m, 6,  'Combustível',  'cat-transp',    200);
      add(m, 3,  'Netflix',      'cat-lazer',      55);
      add(m, 3,  'Spotify',      'cat-lazer',      35);
      add(m, 9,  'Compras',      'cat-compras',   180 + m * 40);
      add(m, 7,  'Farmácia',     'cat-saude',      90);
    });
    return txns;
  }

  function seedInvestments() {
    var today = new Date().toISOString().slice(0, 10);
    return [
      { id: uid(), name: 'Tesouro Selic 2029', type: 'Renda Fixa', invested: 5000, current: 5350, date: today, color: '#00d6b4' },
      { id: uid(), name: 'PETR4',              type: 'Ações',      invested: 3000, current: 3280, date: today, color: '#3366ff' },
      { id: uid(), name: 'MXRF11',             type: 'FII',        invested: 2000, current: 2090, date: today, color: '#b94dff' },
      { id: uid(), name: 'Bitcoin',            type: 'Cripto',     invested: 1500, current: 1820, date: today, color: '#ff2d78' }
    ];
  }

  function freshUserData() {
    return {
      budget: 5000,
      currency: 'BRL',
      categories: defaultCategories(),
      transactions: seedTransactions(),
      investments: seedInvestments()
    };
  }

  /* --------------------------- API pública -------------------------- */
  var Store = {
    uid: uid,

    // -- autenticação --
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
      try { await api('POST', '/api/logout'); } catch (e) { /* ignora erro de rede no logout */ }
      localStorage.removeItem(KEYS.token);
      localStorage.removeItem(KEYS.user);
    },

    // Retorna o nome do usuário logado (sincrono) ou null.
    currentUser() {
      return localStorage.getItem(KEYS.token) ? localStorage.getItem(KEYS.user) : null;
    },

    // -- dados (assíncrono) --
    // Busca os dados no servidor. Se for um usuário novo (sem dados), semeia e salva.
    async fetchData() {
      var res = await api('GET', '/api/data');
      if (res.data) return res.data;
      var seeded = freshUserData();
      await this.saveData(seeded);
      return seeded;
    },

    async saveData(data) {
      return api('PUT', '/api/data', data);
    }
  };

  window.Store = Store;
})();
