# Mapeamento de Funcionalidades — Festival de Forró

Este arquivo contém um inventário detalhado das rotas, páginas, componentes, endpoints API e eventos em tempo real usados pelo módulo "Festival" no repositório. Use como base para criar casos de teste exaustivos.

---

## 1) Rotas públicas / páginas (baseadas em `src/App.js`)

- `/festival-forro` → `src/festival/pages/FestivalHome.jsx`  (home público do festival)
- `/festival-forro/inscricao` → `src/festival/pages/FestivalInscricao.jsx` (inscrições de candidatos)
- `/festival-forro/votar` → `src/festival/pages/FestivalVotar.jsx` (votação pública)
- `/festival-forro/login` → `src/festival/pages/LoginJuradoAdmin.jsx` (login jurados/admin festival)
- `/festival-forro/admin/login` → `src/festival/pages/LoginJuradoAdmin.jsx` (login admin festival)
- `/festival-forro/admin` → `src/festival/pages/FestivalAdmin.jsx` (painel administrativo festival)
- `/festival-forro/admin/transmissao/:sessionId` → `src/festival/pages/FestivalTransmission.jsx` (painel de transmissão)
- `/festival-forro/jurado` → `src/festival/pages/JudgeArea.jsx` (área do jurado)
- `/login-candidato` → `src/festival/pages/LoginCandidato.jsx` (login candidatos)
- `/area-candidato` → `src/festival/pages/CandidateArea.jsx` (área do candidato)

(Além das rotas gerais da aplicação listadas em `src/App.js` relacionadas a portal e vagas.)

---

## 2) Páginas / Subcomponentes Relevantes (festival)

Páginas:
- `src/festival/pages/FestivalHome.jsx`
- `src/festival/pages/FestivalInscricao.jsx`
- `src/festival/pages/FestivalVotar.jsx`
- `src/festival/pages/FestivalAdmin.jsx`
- `src/festival/pages/FestivalTransmission.jsx`
- `src/festival/pages/JudgeArea.jsx`
- `src/festival/pages/CandidateArea.jsx`
- `src/festival/pages/LoginCandidato.jsx`
- `src/festival/pages/LoginJuradoAdmin.jsx`

SubPages / Admin modules:
- `src/festival/subPages/SessoesAdmin.jsx` (gestão completa de sessões — endpoints variados)
- `src/festival/subPages/JuradosAdmin.jsx` (CRUD de jurados)
- `src/festival/subPages/ArtistasAdmin.jsx` (CRUD de candidatos/artistas)
- `src/festival/subPages/DashboardAdmin.jsx` (visão geral)
- `src/festival/subPages/ConfiguracoesAdmin.jsx` (configurações, uploads de imagens)

---

## 3) Endpoints API usados pelo frontend (inventário)

Nota: `${API_FESTIVAL}` ou `apiBase`/`API_FESTIVAL_BASE_URL` são usados como base. Seguem os caminhos relativos usados:

- Sessões e gerenciamento:
  - `GET /api/sessions` — listar sessões
  - `GET /api/sessions/:id/results` — obter resultados da sessão
  - `GET /api/sessions/:id/judges` — jurados da sessão
  - `GET /api/sessions/:id/broadcast` — dados de transmissão
  - `GET /api/sessions/:id/audit` — dados de auditoria (votos/alerts)
  - `POST /api/sessions` — criar sessão
  - `PATCH /api/sessions/:id` — atualizar sessão (dados gerais)
  - `PATCH /api/sessions/:id/status` — alterar status (waiting, judge_voting, public_voting, finished)
  - `PATCH /api/sessions/:id/active-candidate` — definir/desativar candidato ativo
  - `POST /api/sessions/:id/candidates` — vincular candidatos à sessão
  - `DELETE /api/sessions/:id/candidates/:candidateId` — remover candidato
  - `PATCH /api/sessions/:id/candidates/:candidateId/details` — atualizar ordem/horário
  - `PATCH /api/sessions/:id/candidates/:candidateId/score-correction` — correção manual de nota
  - `POST /api/sessions/:id/judges` — vincular juiz
  - `DELETE /api/sessions/:id/judges/:judgeId` — remover juiz
  - `PUT /api/sessions/:id/votes/:judgeId/:candidateId` — editar voto manualmente (admin)
  - `DELETE /api/sessions/:id/votes/:judgeId/:candidateId` — excluir voto (admin)
  - `DELETE /api/sessions/:id` — excluir sessão
  - `PATCH /api/sessions/:id/broadcast` — atualiza modo de transmissão

- Votos / auditoria / alerts:
  - `GET /api/votes/judge/check?session_id=&candidate_id=` — checa se jurado já votou
  - `POST /api/votes/judge` — enviar voto do jurado
  - `POST /api/votes/public` — enviar voto público
  - `GET /api/votes/public/active` — buscar votação pública ativa
  - `POST /api/alerts` — enviar alerta do jurado
  - `PATCH /api/alerts/:id/resolve` — marcar alerta como resolvido

- Admin — candidatos / jurados / profile / uploads:
  - `GET /api/admin/candidates` — lista de candidatos (paginada)
  - `GET /api/admin/candidates/:id` — detalhe candidato
  - `POST /api/admin/candidates` — criar candidato (admin)
  - `PATCH /api/admin/candidates/:id` — atualizar
  - `DELETE /api/admin/candidates/:id` — excluir
  - `GET /api/admin/judges` — listar jurados
  - `GET /api/admin/judges/:id` — detalhe juiz
  - `POST /api/admin/judges` — criar juiz
  - `PATCH /api/admin/judges/:id` — atualizar
  - `DELETE /api/admin/judges/:id` — excluir
  - `GET /api/admin/candidates?limit=1000` — usado em dashboard para catálogo
  - `GET /api/admin/profile` — perfil admin
  - `PUT /api/admin/profile` — atualizar perfil
  - `PUT /api/admin/settings` — salvar configurações
  - `PUT /api/admin/password` — alterar senha
  - `POST /api/uploads/imagens` — upload de imagens
  - `POST /api/uploads/pdfs` — upload de PDFs (inscrição)

- Candidate flows (área do candidato):
  - `GET /api/candidate/me` — dados do candidato logado
  - `GET /api/candidate/sessions` — sessões associadas ao candidato
  - `GET /api/candidate/results/:sessionId` — resultados do candidato por sessão
  - `PATCH /api/candidate/me` — atualizar dados do candidato
  - `POST /api/uploads/imagens` — upload imagem candidato

- Auth:
  - `POST /api/auth/login` — login (jurado/admin/candidato) (usado em `LoginJuradoAdmin.jsx` e `LoginCandidato.jsx`)
  - `POST /api/auth/register` — registro/inscrição (usado em `FestivalInscricao.jsx`)

- Outros endpoints públicos usados por outras partes do app (notícias, vagas, etc.) — referenciados no código:
  - `POST /visits/track-visit` (em `src/App.js` com `API_BASE_URL`)
  - Endpoints de vagas: `${API_VAGAS}/api/...` (variam)


> Observação: alguns módulos usam um helper `apiRequest(method,path,...)` que adiciona o token e a `apiBase` automaticamente (ex: `SessoesAdmin.jsx`). Outros chamam `axios` diretamente com `${API_FESTIVAL}` ou `${API_FESTIVAL_BASE_URL}`.

---

## 4) Eventos WebSocket / Socket.io observados

O app usa `socket.io-client` em vários pontos (ex: `JudgeArea.jsx`, `SessoesAdmin.jsx`): eventos observados no código:

- Emitidos/ouvintes e seus propósitos:
  - `session:updated` — recarregar dados da sessão
  - `session:candidates:updated` — recarregar lista candidatos
  - `session:candidate:removed` — recarregar
  - `session:active_candidate:updated` — recarregar candidato ativo
  - `session:active_candidate:released` — recarregar
  - `vote:judge:deleted` — recarregar dados de auditoria
  - `vote:judge:updated` — recarregar dados de auditoria
  - `vote:judge:created` — (admin) recarrega auditoria
  - `alert:created` — admin recebe novo alerta (SessoesAdmin)
  - `alert:resolved` — atualizar auditoria

- Observações: sockets usam `auth: { token }` quando disponível; origem é `API_FESTIVAL` sem `/api` final.

---

## 5) Comportamentos críticos a testar (extraído do código)

Organize testes de acordo com arquivos e endpoints. Exemplo de verificação extraída do código:

- `SessoesAdmin`:
  - Criar/editar/excluir sessão
  - Alterar `status` para `judge_voting` e confirmar que jurados logados recebem evento e que `JudgeArea` passa a exibir candidato ativo
  - Definir `active_candidate_id` e verificar `JudgeArea` exibe candidato e aceita voto
  - Definir `winners_count_judges` e, ao finalizar sessão, verificar resultados mostram exatamente esse número
  - Testar upload de imagens (`/api/uploads/imagens`)
  - Testar broadcast modes e transmissão (`/api/sessions/:id/broadcast`)
  - Testar auditoria: `GET /api/sessions/:id/audit`, ver edição/deleção de votos via admin

- `JudgeArea`:
  - `fetchActiveData()` deve usar `localStorage.user` quando `user` state não estiver definido (corrigido)
  - Verificar `GET /api/sessions` encontra sessão com status `judge_voting`
  - Verificar `GET /api/sessions/:id/judges` contém jurado logado
  - Verificar `GET /api/admin/candidates/:id` retorna candidato completo
  - Verificar `POST /api/votes/judge` persiste voto; `GET /api/votes/judge/check` indica `hasVoted` e retorna voto salvo
  - Enviar alerta (`POST /api/alerts`) e esperar `alert:created` no admin

- `CandidateArea`:
  - `GET /api/candidate/me` e `GET /api/candidate/sessions`
  - Upload de foto e edição de perfil
  - Visualização de resultados por sessão

- `FestivalInscricao`:
  - `POST /api/auth/register` cria candidato; uploads para `/api/uploads/imagens` ou `/api/uploads/pdfs`

- `FestivalVotar`:
  - `GET /api/votes/public/active` e `POST /api/votes/public` para votação popular

---

## 6) Lacunas que preciso confirmar manualmente / junto ao backend

- Lista completa de parâmetros aceitos em cada endpoint (ex: payload de `/api/votes/judge`) — verificar documentação do backend ou inspecionar código backend.
- Regras de desempate para `winners` — não encontradas no frontend (provavelmente backend).
- Eventos socket exatos e payload shapes (por ex: `vote:judge:created` payload fields) — confirmar com backend ou logs.

---

## 7) Próximos passos sugeridos (para chegarmos a 100%)

1. Gerar uma lista final de **casos de teste** baseada em cada endpoint e cada rota (posso gerar automaticamente).
2. Extrair shapes de payloads (requisito para testes automatizados) consultando backend ou usando `curl`/Postman para endpoints do ambiente de teste.
3. Gerar scripts Playwright adicionais cobrindo:
   - Fluxo admin completo (criar sessão, adicionar jurados, ativar candidato, finalizar sessão e validar resultados)
   - Fluxo jurado (login, votar, alertar)
   - Fluxo público (votar popular)
4. Opcional: criar um job CI (GitHub Actions) para rodar Playwright contra ambiente de staging.

---

Se quiser, eu já gero a lista completa de casos de teste (um `docs/festival-test-plan-expanded.md`) cobrindo cada endpoint e cada comportamento do frontend, com comandos `curl`/exemplos de payload para executar manualmente. Deseja que eu gere esse documento agora? 
