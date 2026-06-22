# Aurora · Controle de despesas

App de despesas mensais com **contas reais sincronizadas entre dispositivos**.
Frontend em HTML/CSS/JS separados; backend em Cloudflare Pages Functions + D1
(roda no mesmo deploy, sem servidor à parte).

## Estrutura

```
aurora/
├── index.html                  ← estrutura (sem CSS/JS embutido)
├── style.css                   ← visual (glow controlado por --glow-opacity)
├── js/
│   ├── storage.js               ← fala com a API (/api/*) e guarda o token
│   ├── charts.js                ← gráficos em SVG puro (donut e barras)
│   └── app.js                   ← interface, navegação e modais
│
├── functions/api/[[route]].js   ← backend (register / login / logout / data)
├── schema.sql                   ← tabelas do banco D1
└── wrangler.toml                ← config do Cloudflare (Pages + D1)
```

## O que o app faz

- Categorias comuns já cadastradas (Moradia, Alimentação, Transporte, Compras,
  Saúde, Contas, Lazer, Outros) com despesas de exemplo no mês atual e nos 2
  anteriores — só na primeira vez que cada conta entra.
- Adicionar/remover despesas e categorias (com cor).
- Navegar entre meses (setas no topo); tudo recalcula sozinho.
- Aba de Investimentos (aportado, valor atual, rendimento %, gráfico).
- Aba de Histórico (barras dos últimos 6 meses; clique numa barra pra abrir o mês).
- Login com usuário e senha. Cada conta tem seus próprios dados, guardados no
  servidor e sincronizados em qualquer dispositivo.

## Como a sincronização funciona

O navegador guarda apenas um **token de sessão** e o nome do usuário. Os dados
ficam no banco D1, no Cloudflare. A cada alteração o app salva em segundo plano
(`PUT /api/data`); ao entrar, carrega tudo (`GET /api/data`). A senha nunca é
guardada no navegador — vai por HTTPS pro servidor, que faz o hash com **PBKDF2**.
A sessão expira em 60 dias.

> Observação: por usar backend, **o app não funciona abrindo o `index.html`
> direto (file://)** — ele precisa da API. Use `wrangler pages dev` para testar
> localmente, ou o site já publicado.

## Passo a passo (uma vez só)

```bash
npm i -g wrangler
wrangler login

# 1. cria o banco e copia o "database_id" que aparece
wrangler d1 create aurora-db

# 2. cole esse id em wrangler.toml (campo database_id)

# 3. cria as tabelas
wrangler d1 execute aurora-db --file=./schema.sql            # local
wrangler d1 execute aurora-db --remote --file=./schema.sql   # produção
```

### Testar localmente

```bash
wrangler pages dev .
```
Abra o endereço que aparecer (ex.: http://localhost:8788), crie uma conta e use.

### Publicar (via GitHub + Pages — recomendado)

1. Suba o conteúdo da pasta `aurora/` para um repositório no GitHub
   (o `index.html` e a pasta `functions/` precisam ficar na **raiz** do projeto).
2. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
3. Build command: *(vazio)*. Output directory: `/`.
4. Em **Settings → Functions → D1 database bindings**: adicione
   `Variable name = DB` ligado ao banco `aurora-db`.
5. Deploy. As rotas ficam em `/api/...` no mesmo domínio do site.

> Alternativa por linha de comando: `wrangler pages deploy .`

## Ajustes rápidos

- **Brilho do fundo:** variável `--glow-opacity` no topo do `style.css`
  (já reduzida). Aumente pra brilhar mais, diminua pra apagar.
- **Moeda:** menu do avatar (canto superior direito) alterna R$ / US$.
- **Orçamento:** menu do avatar → "Definir orçamento".
- **API em outro domínio:** mude `API_BASE` no topo de `js/storage.js`.
