# Plano de Testes — Sistema do Festival de Forró

Este documento lista funcionalidades do sistema do festival e casos de teste manuais e verificações práticas para serem executadas passo a passo. Use como checklist: marque cada item quando verificado.

Índice

- Visão Geral
- Preparação do ambiente
- Autenticação e Sessões de Usuário
- Painel de Administração
- Gestão de Sessões (Sessions)
- Gestão de Jurados
- Gestão de Candidatos
- Fluxo de Votação do Jurado
- Envio e Verificação de Votos (API)
- Resultados e Vencedores
- Alertas e Comunicação (Socket/Alerts)
- Uploads e Recursos (imagens, áudio)
- UI/UX e Comportamentos no Frontend
- Edge cases e Consistência de Dados
- Segurança e Permissões
- Checklist de regressão final
- Observações e logs úteis

---

## Visão Geral

Objetivo: verificar, de ponta a ponta, que cada funcionalidade do sistema do festival funciona conforme o esperado — tanto em interfaces (admin, jurado, público) quanto na API/backend e no comportamento em tempo real via sockets.

Para cada item abaixo, descrevo:
- Passo a passo de teste
- Resultado esperado
- Onde verificar (UI, API, DB, logs)
- Severidade (Bloqueante / Alta / Média / Baixa)

---

## Preparação do ambiente

- [ ] 1) Variáveis de ambiente configuradas (API_FESTIVAL apontando para backend de teste)
  - Verificar `process.env.API_FESTIVAL` no frontend/build.
  - Severidade: Bloqueante

- [ ] 2) Usuários de teste criados:
  - Admin (com credenciais), Jurado(s), Candidato(s).
  - Armazenar tokens no `localStorage` para testes manuais.
  - Severidade: Alta

- [ ] 3) Banco de dados de teste com dados previsíveis ou ambiente local com dump de teste.
  - Severidade: Alta

- [ ] 4) Ferramentas para inspeção: console do navegador, network tab, Postman/Insomnia, acesso aos logs do backend.
  - Severidade: Baixa

---

## Autenticação e Sessões de Usuário

- [ ] Login Admin
  - Passos:
    1. Acessar a tela de login do admin.
    2. Inserir usuário/senha de admin.
  - Esperado: sucesso e redirecionamento para painel administrativo; token salvo em `localStorage` sob `token` ou `festivalAdminToken`.
  - Verificar: network (status 200), `localStorage` value. Severidade: Bloqueante

- [ ] Login Jurado
  - Passos: login com usuário jurado.
  - Esperado: acesso à área do jurado; token e user salvos em `localStorage`.
  - Verificar: `localStorage` chaves `user` / `token`.

- [ ] Logout
  - Passos: clicar em sair nas interfaces.
  - Esperado: `localStorage` limpo das chaves relacionadas e redirecionamento à tela de login.

---

## Painel de Administração

- [ ] Criar/Editar Sessão
  - Passos:
    1. No admin, criar nova sessão com campos: título, status (ex: `judge_voting`), número de vencedores, duração, escalação de jurados, candidatos ligados.
    2. Salvar.
  - Esperado: sessão aparece na lista; dados preservados.
  - Verificar: API `/api/sessions` e GET da sessão.

- [ ] Escalar Jurados para Sessão
  - Passos: adicionar jurados à sessão.
  - Esperado: jurados aparecem na lista de jurados da sessão; API `/api/sessions/:id/judges` retorna array com ids.
  - Verificar: resposta da API e UI.

- [ ] Definir número de vencedores
  - Passos: editar sessão e definir `winners_count` (ou campo análogo) para 1, 2, 3 etc.
  - Teste específico: após encerrar sessão e gerar resultados, conferir se a tela de resultados mostra exatamente a quantidade definida.
  - Verificar: UI de resultados pública e admin; endpoint de resultados (ex: `/api/sessions/:id/results`).
  - Severidade: Alta

---

## Gestão de Sessões (Sessions)

- [ ] Iniciar sessão (status)
  - Passos: mudar status da sessão para `judge_voting`.
  - Esperado: jurados conectados recebem evento via socket `session:updated` e UI atualiza para tela de votação.
  - Verificar: socket events, logs do frontend (console), UI do jurado.

- [ ] Ativar candidato
  - Passos: no admin, definir `active_candidate_id` para um candidato.
  - Esperado: jurados veem o candidato imediatamente; campo `active_candidate_id` aparece em `/api/sessions`.

- [ ] Liberar/Encerrar votação
  - Passos: admin libera e encerra; quando encerrada, jurados não conseguem votar.
  - Verificar: botões de voto desabilitados, status da sessão.

---

## Gestão de Jurados

- [ ] Verificar escalação
  - Passos: com o admin, verifique o array de jurados da sessão.
  - Esperado: o jurado logado cujo `id` está no array pode votar; caso contrário, ver tela "ACESSO NÃO AUTORIZADO".
  - Teste: login como jurado A (escalado) e jurado B (não escalado) e confirmar diferenças.

- [ ] Validação localStorage/state
  - Passos: confirmar que a área do jurado usa `localStorage.user` quando `user` state não está pronto.
  - Esperado: não deve mostrar "SISTEMA EM ESPERA" indevidamente (corrigido no frontend).

---

## Gestão de Candidatos

- [ ] Criar/Editar Candidato
  - Passos: no admin, criar candidato com `artistic_name`, `song_title`, `photo`, `city`, `state`.
  - Verificar: `/api/admin/candidates/:id` e UI do jurado exibindo dados.

- [ ] Foto e áudio
  - Passos: subir imagem e áudio para um candidato.
  - Verificar URL de assets (relativa/absoluta) e se `resolvePhotoUrl()` constrói o caminho correto.

---

## Fluxo de Votação do Jurado

Para cada jurado escalado:

- [ ] Entrar na sala e ver candidato ativo
  - Passos: login jurado -> acessar area do jurado.
  - Esperado: ao existir sessão `judge_voting` com `active_candidate_id`, o jurado vê o candidato e sliders para notas.

- [ ] Testar sliders de notas
  - Passos:
    1. Mover cada slider para valores distintos (0.0 a 10.0, step 0.1).
    2. Verificar valor exibido ao lado do critério (`scores[criterion].toFixed(1)`).
  - Esperado: valor refletido e média parcial calculada corretamente.
  - Verificar: cálculo do `partialAverage` é (soma / n) com 2 casas.

- [ ] Confirmar voto
  - Passos: preencher notas, observações (opcional), clicar em "Confirmar Voto".
  - Esperado: POST em `/api/votes/judge` com payload contendo `session_id`, `candidate_id`, notas, `observations`.
  - Após sucesso: botão desabilitado / mensagem de confirmação / `hasVoted = true`.

- [ ] Voto já registrado
  - Passos: tentar votar novamente (recarregar).
  - Esperado: sistema detecta voto existente via `/api/votes/judge/check` e mostra estado "Voto Já Registrado" com notas carregadas.

- [ ] Testar concorrência e race conditions
  - Passos: abrir dois navegadores como mesmo jurado (sessões duplicadas) e submeter voto ao mesmo tempo.
  - Esperado: backend lida com duplicados, apenas 1 voto por jurado por candidato é salvo (checagem idempotente).

---

## Envio e Verificação de Votos (API)

- [ ] Verificar payload do POST `/api/votes/judge`
  - Campos obrigatórios: `session_id`, `candidate_id`, `tuning`, `stage_presence`, ... `observations`.
  - Verificar códigos HTTP (200/201 OK) e respostas de erro (400/401/403).

- [ ] Check endpoint `/api/votes/judge/check`
  - Teste: consultar se jurado votou para `session_id`+`candidate_id` retorna `{ hasVoted: true/false, vote: {...} }`.

- [ ] Deleção/atualização de voto
  - Se houver endpoints para atualizar/excluir voto, testar comportamentos e refletir no frontend (eventos socket `vote:judge:updated`/`deleted`).

---

## Resultados e Vencedores

- [ ] Gerar resultados após término da sessão
  - Passos: admin encerra sessão e solicita geração de resultados.
  - Esperado: API retorna lista ordenada por média de notas; número de vencedores condiz com configuração da sessão.
  - Teste detalhado: definir `winners_count = 2`, criar candidatos com notas conhecidas (simular votos via API), gerar resultados e verificar UI mostra exatamente 2 vencedores.

- [ ] Verificar critérios de desempate
  - Se existir regra (ex: maior nota em critério X), testar casos de empate e confirmar lógica.

- [ ] Tela pública de resultados
  - Passos: acessar rota pública de resultados.
  - Esperado: ranking correto, imagens e músicas associadas carregam, a quantidade de vencedores mostra destaque.

---

## Alertas e Comunicação (Socket/Alerts)

- [ ] Enviar alerta do jurado
  - Passos: no painel do jurado clicar em ALERTA e enviar descrição.
  - Esperado: POST `/api/alerts` com `session_id`, `candidate_id`, `category`, `message`.
  - Verificar: admin recebe notificação (se feature implementada) ou alert salvo no DB.

- [ ] Eventos em tempo real
  - Teste: alterar sessão/ativo no admin e verificar sockets `session:updated`, `session:active_candidate:updated`, `session:active_candidate:released` chegam ao cliente e UI atualiza automaticamente.

---

## Uploads e Recursos (imagens, áudio)

- [ ] Upload de imagens de candidato
  - Verificar URL retornada; testar `resolvePhotoUrl()` com URLs relativas e absolutas.

- [ ] Sincronização de mídia no frontend (cache)
  - Verificar se imagens estáticas carregam corretamente do servidor `public/` ou `build/`.

---

## UI/UX e Comportamentos no Frontend

- [ ] Mensagens de estado
  - Verificar mensagens: "SISTEMA EM ESPERA", "ACESSO NÃO AUTORIZADO", "Voto Já Registrado" e sua condição de disparo.

- [ ] Timer de votação
  - Se existir temporizador para cada candidato, testar contagem regressiva e comportamento ao expirar (voto impossibilitado ou auto-submissão).

- [ ] Responsividade
  - Verificar telas em mobile/desktop; colapsos e rolamentos.

- [ ] Acessibilidade básica
  - Testar navegação por teclado, labels em inputs e contraste de cores para mensagens de alerta.

---

## Edge cases e Consistência de Dados

- [ ] Usuário sem escalação tenta votar
  - Esperado: mensagem de acesso não autorizado; nada é enviado ao backend.

- [ ] Sessão sem candidato ativo
  - Esperado: tela "SISTEMA EM ESPERA" e `active_candidate_id` nulo.

- [ ] Token expirado
  - Teste: invalidar token e verificar se chamadas retornam 401 e se o frontend pede re-login.

- [ ] Falha de rede durante submissão
  - Simular offline no browser e tentar enviar voto. Esperado: erro amigável e possibilidade de retry.

---

## Segurança e Permissões

- [ ] APIs protegidas (Admin vs Judge)
  - Verificar endpoints que só admin pode chamar retornam 403 para jurados.

- [ ] Não expor endpoints sensíveis em rotas públicas
  - Revisar logs e network para confirmar.

---

## Checklist de regressão final (executar antes de cada release)

- [ ] Login/Logout (admin e jurado)
- [ ] Criar sessão e escalar jurados
- [ ] Ativar candidato e mudar status para `judge_voting`
- [ ] Jurado vê candidato e pode votar
- [ ] Voto gravado e `hasVoted` reflete no frontend
- [ ] Resultados apresentam quantidade correta de vencedores
- [ ] Envio de alertas funciona
- [ ] Eventos socket sincronizam interfaces
- [ ] Uploads (foto/áudio) carregam corretamente
- [ ] Permissões e erros 401/403 tratados

---

## Observações e logs úteis

- Console do frontend: observe mensagens de `fetchActiveData`, `socket` connect logs e erros de request.
- Endpoints úteis:
  - `GET /api/sessions`
  - `GET /api/sessions/:id/judges`
  - `GET /api/admin/candidates/:id`
  - `POST /api/votes/judge`
  - `GET /api/votes/judge/check`
  - `POST /api/alerts`
  - `GET /api/sessions/:id/results`

---

Se quiser, eu adapto este documento para gerar um checklist interativo (JSON ou HTML) ou criar scripts de teste automatizados (Playwright/Puppeteer) que executem os passos repetidamente.
