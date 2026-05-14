# Plano de Testes Expandido — Festival de Forró

Este documento é uma versão exaustiva, cobrindo todas as funcionalidades do módulo Festival encontradas no frontend, com casos de teste manuais e comandos `curl`/payloads sugeridos para verificação. Marque cada teste ao executá-lo.

Formato de cada caso de teste:
- Objetivo: o que validar
- Precondições: estado necessário (usuário, sessão, tokens)
- Passos: passos detalhados
- Payload/API: quando aplicável, exemplo `curl`/JSON
- Resultado esperado: critérios de sucesso
- Severidade

---

SUMÁRIO (seções principais)
- Autenticação
- Sessões (CRUD + gerenciamento)
- Gestão de candidatos
- Gestão de jurados
- Fluxo de votação (jurados)
- Votação pública
- Auditoria e edição de votos
- Alertas e notificações
- Transmissão / broadcast
- Uploads e mídia
- Candidate Area
- Inscrição (registro)
- UI e estados (espera, não autorizado, etc.)
- Testes de segurança e edge cases

---

## AUTENTICAÇÃO

1) Login Admin / Festival Admin
- Objetivo: validar login do admin/festival
- Precondições: conta admin criada
- Passos:
  1. POST para `/api/auth/login` com payload:

```bash
curl -X POST "$API_FESTIVAL/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"secret"}'
```

- Resultado esperado: HTTP 200; resposta contém token JWT e user object; token salvo em `localStorage` (frontend). Severidade: Bloqueante

2) Login Jurado
- Mesmo procedimento com credenciais de jurado.

3) Login Candidato
- Mesma verificação usando tela `LoginCandidato`.

4) Logout
- Verificar que `localStorage` remove token e user e redireciona.

---

## SESSÕES (CRUD + gerenciamento)

1) Criar Sessão
- Objetivo: criar sessão via UI admin / API
- Precondições: admin autenticado
- Passos (UI): Painel -> Módulo Sessões -> Criar nova (preencher título, qtd candidatos)
- Passos (API):

```bash
curl -X POST "$API_FESTIVAL/api/sessions" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Sessao Teste","status":"waiting","winners_count_judges":2,"candidates_limit":5}'
```

- Esperado: HTTP 201/200; novo objeto de sessão retornado com `id`. Severidade: Alta

2) Editar Sessão (Dados Gerais)
- PATCH `/api/sessions/:id` com payload de campos e verificar retorno e UI.

3) Alterar Status
- `PATCH /api/sessions/:id/status` — testar transições: `waiting` -> `judge_voting` -> `finished`.
- Verificar: jurados recebem socket `session:updated` e UI `JudgeArea` atualiza.

4) Ativar/Definir Candidato Ativo
- `PATCH /api/sessions/:id/active-candidate` com `{ active_candidate_id: <id> }`.
- Verificar: `JudgeArea` mostra candidato; `FestivalTransmission` atualiza (socket/storage).

5) Vincular / Remover Candidatos
- POST `/api/sessions/:id/candidates` com `{ candidate_ids: [id] }`; DELETE `/api/sessions/:id/candidates/:candidateId`.
- Verificar limite de candidatos respeitado (`candidates_limit`).

6) Salvar Ordem e Horários
- PATCH `/api/sessions/:id/candidates/:candidateId/details` (após reorder). Verificar persistência e exibição.

7) Definir winners_count_judges / winners_count_public
- Validar que, ao finalizar e gerar resultados, a UI de resultados (admin/public) mostra exatamente os vencedores configurados (ex. quando 2, mostrar top-2).
- Processo para validar: simular votos via API com médias controladas, chamar endpoint de resultados `/api/sessions/:id/results` e verificar tamanho do array de `winners` ou filtrar top N.

Exemplo (simulado) — gerar 3 candidatos com médias conhecidas (pseudocódigo):
- POST votos via `/api/sessions/:id/votes` (ou `/api/votes/judge`) para cada candidato/jurado
- GET `/api/sessions/:id/results` → verificar ordem e winners_count

Severidade: Alta

---

## GESTÃO DE CANDIDATOS (Admin)

1) Listar candidatos
- GET `/api/admin/candidates?page=1&limit=100` — verificar paginação e campos essenciais (`id`, `artistic_name`, `profile_photo_url`).

2) Criar/Editar/Excluir candidato (Admin)
- POST `/api/admin/candidates` com payload completo
- PATCH `/api/admin/candidates/:id`
- DELETE `/api/admin/candidates/:id`
- Verificar cascata: remover candidato de sessões quando excluído (se aplicável).

3) Upload de imagem
- POST `/api/uploads/imagens` com multipart/form-data; verificar retorno `url`.
- Testar `resolvePhotoUrl()` no frontend para caminhos relativos e absolutos.

Severidade: Alta

---

## GESTÃO DE JURADOS (Admin)

1) CRUD Jurados
- GET `/api/admin/judges`
- GET `/api/admin/judges/:id`
- POST `/api/admin/judges`
- PATCH `/api/admin/judges/:id`
- DELETE `/api/admin/judges/:id`
- Testar upload de foto de jurado (`/api/uploads/imagens`).

2) Vincular/Remover jurado a sessão
- POST `/api/sessions/:id/judges` com `{ judge_id }`
- DELETE `/api/sessions/:id/judges/:judgeId`
- Verificar `JudgeArea` mostra acesso autorizado apenas quando jurado estiver vinculado.

Severidade: Alta

---

## FLUXO DE VOTAÇÃO (JURADOS)

1) Pré-requisitos
- Sessão com `status: judge_voting`
- Jurado A autenticado e escalado para a sessão
- `active_candidate_id` definido

2) Visualizar candidato e sliders
- Acessar `/festival-forro/jurado` → verificar `candidate-card` com `candidate.name`, `song_title` etc.
- Verificar sliders (`input[type=range]`) para cada critério e que `partialAverage` calcula (soma/n)

3) Confirmar voto — payload esperado
- POST `/api/votes/judge` com body:

```json
{
  "session_id": 123,
  "candidate_id": 456,
  "tuning": 7.5,
  "stage_presence": 8.0,
  "harmony": 6.5,
  "rhythm": 7.0,
  "interpretation": 7.2,
  "authenticity": 6.8,
  "diction": 8.0,
  "observations": "Boa apresentação"
}
```

- Verificar: API 200/201; frontend mostra `hasVoted = true` e desabilita inputs.
- Verificar `/api/votes/judge/check?session_id=123&candidate_id=456` retorna `{ hasVoted:true, vote: {...} }`.

4) Idempotência / concorrência
- Abrir duas sessões do navegador com mesmo jurado e submeter votos em paralelo.
- Esperado: backend rejeita duplicados ou atualiza de forma idempotente; frontend mostra voto confirmado sem duplicatas.

5) Edição/Remoção (Admin)
- Admin edita voto via `PUT /api/sessions/:id/votes/:judgeId/:candidateId` e exclui via `DELETE`.
- Verificar eventos socket `vote:judge:updated`/`vote:judge:deleted` notificam clientes.

Severidade: Bloqueante / Alta

---

## VOTAÇÃO PÚBLICA

1) Listar votação pública ativa
- GET `/api/votes/public/active`
- Verificar retorno com `session_id`, `candidates` e `is_open`.

2) Enviar voto público
- POST `/api/votes/public` com `{ session_id, candidate_id }` e possível `device_id` ou `fingerprint`.
- Verificar limites (ex: 1 voto por dispositivo) — confirmar com backend.

Severidade: Alta

---

## AUDITORIA E EDIÇÃO DE VOTOS

1) Visualizar auditoria
- GET `/api/sessions/:id/audit` → estrutura: lista por candidato com `votes` e `alerts`.
- Verificar que `SessoesAdmin` exibe os dados, e botões de edição/exclusão de voto funcionam.

2) Alterar voto (admin)
- PUT `/api/sessions/:id/votes/:judgeId/:candidateId` com payload de notas (floats).
- Verificar recalculo de médias e atualização via socket para `JudgeArea`/`FestivalTransmission`.

3) Excluir voto (admin)
- DELETE ...
- Verificar remoção e notificações.

Severidade: Alta

---

## ALERTAS E NOTIFICAÇÕES

1) Enviar alerta do jurado
- POST `/api/alerts` com `{ session_id, candidate_id, category, message }`
- Verificar retorno e que admin recebe socket `alert:created` (SessoesAdmin recarrega auditData).

2) Marcar alerta como resolvido
- PATCH `/api/alerts/:id/resolve` — verificar UI admin atualiza e socket `alert:resolved` é emitido.

Severidade: Alta

---

## TRANSMISSÃO / BROADCAST

1) Recuperar broadcast
- GET `/api/sessions/:id/broadcast`
- UI `FestivalTransmission` consome esse endpoint para exibir modo

2) Alterar broadcast (admin)
- PATCH `/api/sessions/:id/broadcast` com `{ display_mode: 'winners'|'ranking_judges'|... }`
- Verificar que a guia de transmissão (nova window) atualiza via `localStorage` event e/ou socket.

Severidade: Média

---

## UPLOADS E MÍDIA

1) Upload imagens e PDFs
- Endpoints: `POST /api/uploads/imagens` e `POST /api/uploads/pdfs`
- Testar arquivos grandes, tipos inválidos e resposta com URL.
- Validar `resolvePhotoUrl()` com diferentes retornos: absolute http(s), relative `/uploads/...`, plain filename.

Severidade: Média

---

## CANDIDATE AREA (candidato autenticado)

1) Visualizar perfil
- GET `/api/candidate/me` — exibir dados (nome artístico, cidade, música)

2) Atualizar perfil e foto
- PATCH `/api/candidate/me` com payload e `POST /api/uploads/imagens` para foto

3) Ver resultados de sessão
- GET `/api/candidate/results/:sessionId` e verificar exibição no frontend.

Severidade: Alta

---

## INSCRIÇÃO (FestivalInscricao)

1) Registrar candidato
- POST `/api/auth/register` com dados do candidato e arquivos (documentos/áudio/imagens)
- Verificar validação de campos obrigatórios, upload e retorno com `user` e token.

Severidade: Alta

---

## UI E ESTADOS (espera, não autorizado, etc.)

1) `SISTEMA EM ESPERA`
- Condição no frontend: `(!session || !candidate)` mostra tela de espera.
- Teste: deixe sessão `judge_voting` sem `active_candidate_id` e verifique mensagem exibida.

2) `ACESSO NÃO AUTORIZADO`
- Condição: `session && !isAssigned` mostra bloqueio.
- Teste: garanta que `sessionJudges` não contém jurado; verifique UI bloqueada; quando admin adiciona jurado via `/api/sessions/:id/judges` e socket emite, a UI do jurado atualiza e passa a permitir voto.

3) `Voto Já Registrado`
- Verificar `GET /api/votes/judge/check` e comportamento do botão.

Severidade: Alta

---

## TESTES DE SEGURANÇA E EDGE CASES

1) Tokens expirados
- Forçar token inválido e verificar 401 em endpoints protegidos; frontend deve redirecionar ao login.

2) Proteção de endpoints admin
- Tentar acessar endpoints `/api/admin/*` com token de jurado ou sem token — esperar 403/401.

3) Limites de participantes
- Testar adicionar candidatos além do `candidates_limit` e verificar rejeição UI/API.

4) Votação concorrente
- Enviar múltiplos votos quase simultâneos e verificar consistência (1 voto por jurado/candidato).

5) Input malformado
- Enviar payloads inválidos (strings em floats, valores fora do range 0-10) e verificar 4xx e mensagens de validação.

Severidade: Alta

---

## CHECKLIST FINAL (resumo executável)

- [ ] Login Admin / Jurado / Candidato
- [ ] Criar sessão (Admin)
- [ ] Adicionar jurados / candidatos
- [ ] Definir candidato ativo
- [ ] Abrir `judge_voting` e validar `JudgeArea` para jurado escalado
- [ ] Enviar voto do jurado e verificar `hasVoted`
- [ ] Gerar resultados e confirmar `winners_count_judges`
- [ ] Testar edição/exclusão de voto (Admin)
- [ ] Enviar e resolver alertas
- [ ] Validar broadcast e transmissão
- [ ] Upload de imagens/pdfs
- [ ] Testes de segurança (401/403, token expirado)

---

## Observações finais

- Para testes automatizados (Playwright), é preferível ter um ambiente de staging com autenticação via tokens fixos ou endpoints de criação rápida (fixtures) para gerar sessões/candidatos/jurados automaticamente. Posso gerar um conjunto de scripts Playwright que executam todo o checklist se desejar.

Próxima ação que executo agora (se confirmar): gerar os casos de teste Playwright completos para o fluxo admin→jurado→resultados, com fixtures (criação via API) e limpeza ao final.

Deseja que eu gere esses scripts Playwright completos agora? (responda `sim` para eu criar os testes automatizados completos)