# Fluxo teórico das sessões

Este arquivo descreve como as sessões devem funcionar em teoria, com base no contrato que o frontend já espera. O repositório atual não contém o backend dessas rotas; ele apenas consome as APIs e organiza a interface administrativa e a área do candidato.

## 1. Visão geral

A sessão representa um ciclo de avaliação do Festival de Forró. Em teoria, o backend controla o ciclo de vida da sessão, e o frontend apenas consulta e altera o estado por meio de requisições autenticadas.

O fluxo geral é:

1. O administrador cria uma sessão.
2. A sessão recebe participantes/candidatos vinculados.
3. A sessão é colocada em um status operacional, como votação popular ou votação dos jurados.
4. Os resultados são consolidados.
5. A sessão é encerrada.
6. A área do candidato passa a consultar os resultados daquela sessão encerrada.

## 2. Onde isso aparece no frontend

Os principais pontos do código que mostram esse contrato são:

- `src/festival/subPages/SessoesAdmin.jsx`
- `src/festival/pages/CandidateArea.jsx`
- `src/festival/subPages/DashboardAdmin.jsx`
- `src/services/api.js`
- `SISTEMA_VOTACAO_SESSOES.md`

Esses arquivos mostram que o sistema foi desenhado para conversar com uma API remota configurada por variável de ambiente, principalmente `API_FESTIVAL`.

## 3. Ciclo de vida esperado da sessão

### 3.1 Criação

Na área administrativa, o backend deve aceitar a criação de uma sessão com dados como:

- título
- data
- horário
- local
- status inicial
- quantidade de vencedores

Na prática, o frontend envia algo no estilo:

- `POST /api/sessions`

O backend deve devolver a sessão criada com seu `id` e seus campos normalizados.

### 3.2 Seleção e edição

Depois de criada, a sessão pode ser selecionada para ajustes. O frontend indica que o backend precisa permitir:

- atualizar metadados da sessão
- alterar status da sessão
- alterar o candidato ativo da sessão
- incluir ou remover candidatos da sessão
- aplicar correção manual de pontuação

Os endpoints esperados pelo frontend são do tipo:

- `PATCH /api/sessions/{id}`
- `PATCH /api/sessions/{id}/status`
- `PATCH /api/sessions/{id}/active-candidate`
- `POST /api/sessions/{id}/candidates`
- `DELETE /api/sessions/{id}/candidates/{candidateId}`
- `PATCH /api/sessions/{id}/candidates/{candidateId}/score-correction`

### 3.3 Estados de sessão

O fluxo teórico mais consistente para o backend é trabalhar com estes estados:

- `waiting`: sessão criada, mas ainda não iniciada
- `public_voting`: votação popular liberada
- `judge_voting`: votação dos jurados liberada
- `finished`: sessão encerrada

Isso aparece diretamente na UI administrativa e também na leitura dos dados da área do candidato.

### 3.4 Encerramento

Quando a sessão termina, o backend precisa marcar a sessão como finalizada. A partir daí, ela deixa de ser tratada como ativa e passa a ser usada como base histórica para resultados.

O frontend espera conseguir consultar sessões encerradas e seus resultados consolidados.

## 4. Fluxo administrativo esperado

Na tela administrativa, o backend precisa permitir que o operador:

- veja a lista completa de sessões
- selecione uma sessão específica
- carregue os resultados daquela sessão
- altere o status da sessão
- ajuste candidatos vinculados
- corrija pontuações manualmente quando necessário

Os dados são carregados com autenticação via token salvo em `localStorage`, então o backend deve exigir e validar esse token.

Em teoria, a sequência administrativa é:

1. Carregar sessões com `GET /api/sessions`.
2. Selecionar uma sessão específica.
3. Carregar o resultado dela com `GET /api/sessions/{id}/results`.
4. Aplicar alterações estruturais ou de status.
5. Recarregar os dados para refletir o novo estado.

## 5. Fluxo da área do candidato

Na área do candidato, o backend funciona de forma mais passiva: ele entrega as sessões já associadas ao candidato e os resultados das sessões finalizadas.

O frontend faz duas consultas principais:

- `GET /api/candidate/me`
- `GET /api/candidate/sessions`

Depois disso, para cada sessão finalizada, consulta os resultados individuais com:

- `GET /api/candidate/results/{sessionId}`

### 5.1 O que o candidato enxerga

O backend deve fornecer dados para que o frontend mostre:

- qual é a próxima sessão relevante
- quais sessões já foram finalizadas
- qual foi a nota técnica
- qual foi o ajuste manual
- qual foi a pontuação efetiva
- se o candidato venceu ou não
- histórico de evolução por sessão

### 5.2 Quando os resultados aparecem

Em teoria, os resultados só devem aparecer para o candidato depois que a sessão estiver em estado `finished` e o backend tiver liberado os dados consolidados.

Isso evita exibir resultado parcial antes do encerramento oficial.

## 6. Estrutura mínima que o backend deveria manter

Para esse fluxo funcionar sem ambiguidade, o backend provavelmente precisa persistir algo assim:

- identificação da sessão
- título e descrição
- data e horário
- local
- status atual
- candidatos vinculados à sessão
- candidato ativo, se houver
- pontuação técnica
- ajuste manual
- pontuação efetiva
- posição final
- quantidade total de candidatos
- mensagem de vencedor, quando aplicável

## 7. Regras teóricas importantes

Algumas regras implícitas pelo frontend são:

- uma sessão ativa deve ser única por vez, ou ao menos o backend deve controlar conflitos
- sessões finalizadas não devem continuar recebendo alterações operacionais normais
- resultados de sessão precisam ser determinísticos para consulta posterior
- a área do candidato deve poder consultar apenas o que lhe pertence ou o que já foi publicado
- toda alteração administrativa deve exigir autenticação

## 8. Resumo do fluxo

Em teoria, o backend funciona assim:

1. O admin cria uma sessão.
2. O admin organiza os candidatos ligados a ela.
3. A sessão entra em votação popular ou votação dos jurados.
4. As notas são calculadas e corrigidas.
5. O backend consolida o resultado final.
6. A sessão é encerrada.
7. O candidato consulta o histórico e vê os resultados liberados.

## 9. Observação final

Se a intenção for implementar o backend de verdade, este documento serve como mapa do contrato esperado pela interface atual. O próximo passo seria transformar esse fluxo em rotas reais, com banco de dados e regras de transição de status.