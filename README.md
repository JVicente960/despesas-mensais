# Aurora · Controle de despesas

App de despesas mensais com **contas reais sincronizadas entre dispositivos**,
login por senha ou Google, interface em 3 idiomas e 13 moedas.
Frontend em HTML/CSS/JS puro (sem framework); backend em Cloudflare Pages
Functions + D1 (roda no mesmo deploy, sem servidor à parte).

**No ar:** https://despesas-mensais.pages.dev

## Estrutura

```
aurora/
├── index.html                  ← estrutura (login + app), sem CSS/JS embutido
├── style.css                   ← visual (glow controlado por --glow-opacity)
├── privacy.html                ← política de privacidade (LGPD), tema do app
├── _headers                    ← cabeçalhos de segurança do Pages (CSP etc.)
├── js/
│   ├── storage.js               ← fala com a API (/api/*), guarda o token, migra dados
│   ├── charts.js                ← gráficos em SVG puro (donut e barras)
│   └── app.js                   ← interface, i18n, navegação e modais
│
├── functions/api/[[route]].js   ← backend (register / login / logout / auth/google / data / account)
├── schema.sql                   ← tabelas do banco D1
└── wrangler.toml                ← config do Cloudflare (Pages + D1)
```

## O que o app faz

- **Despesas** agrupadas por estabelecimento, com vários lançamentos (datas/valores)
  por item; adicionar, editar e remover. Listas longas colapsam (mostra os 3 mais
  recentes + "Mostrar mais").
- **Categorias** com cor. As 8 padrão (Moradia, Alimentação, Transporte, Compras,
  Saúde, Contas, Lazer, Outros) são **traduzidas conforme o idioma**; categorias
  criadas por você mantêm o nome. Renomear uma padrão a transforma em personalizada.
- **Despesas fixas (recorrentes):** cadastre uma vez (mensal/semanal/anual). Quando
  vencem, aparecem na Visão geral pra você lançar com um toque ("Lançar" ou
  "Lançar todas", com catch-up de atrasadas).
- **Orçamento** por mês; navegação entre meses (setas no topo) recalcula tudo.
- **Investimentos:** aportado, valor atual, rendimento %, gráfico.
- **Histórico:** barras dos últimos 6 meses; clique numa barra pra abrir o mês.
- **Exportar dados:** backup completo em JSON e planilhas CSV (despesas e
  investimentos), com formato adaptado ao idioma.
- **Começar limpo:** zera os dados mantendo a conta (diferente de excluir a conta).
- Feedback de salvamento ("Salvando… / Salvo ✓ / Falha ao salvar" com repetir).

## Segurança e privacidade

- **Login por senha ou Google.** Google usa fluxo de ID token (RS256/JWKS), com
  validação de emissor, audiência, expiração e e-mail verificado.
- **Senhas:** hash **PBKDF2** no servidor; nunca guardadas no navegador. No
  cadastro exige mínimo de 8 caracteres e barra senhas óbvias (o login não impõe
  isso, pra não travar contas antigas).
- **Rate-limit de login:** tentativas falhas por IP no D1; após o limite, bloqueia
  temporariamente (429) — trava ataques de força bruta.
- **CSP e cabeçalhos de segurança** (`_headers`): script-src restrito (sem inline),
  liberando só o necessário (Google + Fonts); mais nosniff, referrer-policy,
  permissions-policy e anti-clickjacking.
- **Foco preso nos modais** (acessibilidade): Tab/Shift+Tab circulam dentro do
  modal, Esc fecha e devolve o foco.
- **LGPD:** política de privacidade publicada (`privacy.html`), **portabilidade**
  (exportar dados) e **direito de exclusão** ("Excluir conta" apaga conta, dados e
  sessões de forma irreversível, com confirmação digitada).
- A sessão expira em 60 dias.

## Como a sincronização funciona

O navegador guarda apenas um **token de sessão** e o nome do usuário. Os dados
ficam no banco D1, no Cloudflare. A cada alteração o app salva em segundo plano
(`PUT /api/data`); ao entrar, carrega tudo (`GET /api/data`).

> Por usar backend, **o app não funciona abrindo o `index.html` direto (file://)**
> — ele precisa da API. Use `wrangler pages dev .` para testar localmente, ou o
> site publicado.

## Internacionalização e moedas

- **Idiomas:** Português, Inglês e Espanhol. Detecta o idioma do navegador e
  permite trocar manualmente (menu do avatar → Idioma).
- **Moedas:** 13 opções (BRL, USD, EUR, etc.), menu do avatar → Moeda. Formatação
  de números e datas segue o idioma.

## Passo a passo (uma vez só)

```bash
npm i -g wrangler
wrangler login

# 1. cria o banco e copia o "database_id" que aparece
wrangler d1 create aurora-db

# 2. cole esse id em wrangler.toml (campo database_id)

# 3. cria as tabelas (users, sessions, user_data, login_attempts)
wrangler d1 execute aurora-db --file=./schema.sql            # local
wrangler d1 execute aurora-db --remote --file=./schema.sql   # produção
```

### Login com Google (opcional)

1. Google Cloud Console → crie um **OAuth Client ID** (tipo "Web application").
2. Em *Authorized JavaScript origins*, adicione a URL do site (e
   `http://localhost:8788` para testes).
3. Cole o Client ID nos dois lugares que o usam: a constante `GOOGLE_CLIENT_ID`
   no backend (`functions/api/[[route]].js`) e a constante correspondente em
   `js/app.js` (também refletida no CSP do `_headers`).
4. Para abrir a qualquer pessoa (fora do modo de teste), **publique a tela de
   consentimento** informando a URL da política de privacidade
   (`/privacy.html`). Escopos básicos de identidade não exigem revisão do Google.

### Testar localmente

```bash
wrangler pages dev .
```
Abra o endereço que aparecer (ex.: http://localhost:8788), crie uma conta e use.

### Publicar (via GitHub + Pages — recomendado)

1. Suba o conteúdo da pasta `aurora/` para um repositório no GitHub
   (o `index.html`, o `_headers` e a pasta `functions/` na **raiz** do projeto).
2. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
3. Build command: *(vazio)*. Output directory: `/`.
4. Em **Settings → Functions → D1 database bindings**: adicione
   `Variable name = DB` ligado ao banco `aurora-db`.
5. Deploy. As rotas ficam em `/api/...` no mesmo domínio do site.

> Alternativa por linha de comando: `wrangler pages deploy .`
> Ao mudar `schema.sql` (tabela nova), rode a migração no D1 **antes** do deploy.

## Ajustes rápidos

- **Brilho do fundo:** variável `--glow-opacity` no topo do `style.css`.
- **Moeda / Idioma / Orçamento:** menu do avatar (canto superior direito).
- **Limite do rate-limit:** constantes `RL_MAX` e `RL_WINDOW` no backend.
- **API em outro domínio:** mude `API_BASE` no topo de `js/storage.js`.
