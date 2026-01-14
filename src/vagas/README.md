# Módulo de Captação de Vagas

Este módulo gerencia a captação de currículos e candidaturas para vagas de emprego.

## 📁 Estrutura de Arquivos

```
vagas/
├── pages/
│   └── CandidaturaVagas.jsx        # Página principal do formulário
├── components/
│   ├── UploadField.jsx             # Componente de upload (currículo e foto)
│   ├── VagasSelect.jsx             # Componente de seleção de vagas
│   └── PrivacidadeModal.jsx        # Modal da política de privacidade
└── styles/
    └── CandidaturaVagas.css        # Estilos da página
```

## 🚀 Como Usar

### 1. Importar a Página

No seu arquivo de roteamento (ex: `App.js`), adicione:

```jsx
import CandidaturaVagas from './vagas/pages/CandidaturaVagas';

// Dentro de suas rotas:
<Route path="/vagas" element={<CandidaturaVagas />} />
```

### 2. Dependências Necessárias

Certifique-se de que as seguintes dependências estão instaladas:

```bash
npm install axios react-toastify react-text-mask
```

### 3. Configuração da API

A `API_VAGAS` já está configurada em `src/services/api.js`:

```javascript
const API_VAGAS = "https://api.jrcoffee.com.br:5002/api";
```

Se precisar alterar o URL, edite este valor em `api.js`.

## 📋 Funcionalidades

### Campos do Formulário

1. **Nome** - Campo obrigatório de texto
2. **E-Mail** - Campo obrigatório com validação de email
   - Verifica se o email já foi cadastrado
   - Exibe aviso de email único
3. **Telefone** - Campo obrigatório com máscara (11 dígitos)
   - Formato: (XX) 9 XXXX-XXXX
4. **Vaga Desejada** - Seleção via radio button
   - Carregado dinamicamente da API
5. **Currículo** - Upload de PDF (máximo 20MB)
   - Aceita drag and drop
6. **Foto** - Upload de imagem (JPG, PNG, WebP - máximo 20MB)
   - Aceita drag and drop
7. **Termos de Privacidade** - Checkbox obrigatório
   - Modal com política de privacidade completa

### Validações

- ✅ Campos obrigatórios
- ✅ Formato de email válido
- ✅ Telefone com 11 dígitos
- ✅ Tamanho máximo de arquivo (20MB)
- ✅ Aceitação da política de privacidade
- ✅ Email duplicado (verificação no backend)

### Tratamento de Erros

- Toast notifications para feedback do usuário
- Estados de erro no formulário
- Mensagens personalizadas por tipo de erro
- Loading state durante o envio

## 🔌 Endpoints da API

### Buscar Vagas
```
GET /api/vagas
Response: Array de vagas
```

### Enviar Candidatura
```
POST /api/candidatos/cadastro
Content-Type: multipart/form-data

Campos:
- nome (string)
- email (string)
- telefone (string)
- vaga_id (number)
- curriculo_pdf (file)
- foto (file)
```

## 🎨 Customização

### Cores Principais

- Cor primária: `#d68910` (laranja)
- Cor secundária: `#f5a623` (laranja claro)
- Cor de erro: `#dc3545` (vermelho)
- Cor de sucesso: `#28a745` (verde)

### Modificar Imagem Lateral

Edite o caminho da imagem em `CandidaturaVagas.jsx`:
```jsx
<img src="/img/xicara.png" alt="Xícara de café" />
```

### Modificar Data Limite

No rodapé de `CandidaturaVagas.jsx`:
```jsx
<p>Estaremos aceitando currículos até o dia <b>31 de dezembro de 2024</b></p>
```

### Modificar Email de Contato

Na política de privacidade em `PrivacidadeModal.jsx`:
```jsx
<b>contatojrcoffee@provedorjrnet.com.br</b>
```

## 📱 Responsividade

O módulo é totalmente responsivo com breakpoints em:
- Desktop: 1000px+
- Tablet: até 768px
- Mobile: até 480px

## ⚡ Performance

- Lazy loading de vagas ao montar o componente
- Retry automático em falhas de rede (máx 3 tentativas)
- Validação de arquivo antes do upload
- Indicador de loading durante envio

## 🔒 Segurança

- HTTPS obrigatório
- Validação de MIME type de arquivo
- Limite de tamanho de arquivo
- Dados armazenados apenas para processo seletivo
- Exclusão automática em 30 dias

## 🐛 Troubleshooting

### Email duplicado
Mensagem: "Este e-mail já foi utilizado em outra candidatura!"
- Solução: Usar um email diferente

### Arquivo muito grande
Mensagem: "O arquivo deve ter no máximo 20MB!"
- Solução: Comprimir arquivo ou usar versão menor

### Vagas não carregam
Solução: Verificar URL da `API_VAGAS` em `api.js`

### Erro de CORS
Solução: Verificar configuração CORS no backend

## 📝 Notas Importantes

1. A API retorna as vagas em array com estrutura: `{ id, titulo }`
2. O backend deve retornar `error 409` para emails duplicados
3. Máximo de 20MB por arquivo é fixo
4. Telefone deve ter exatamente 11 dígitos
5. Email é validado por regex e verificação de duplicata

---

Para mais informações, consulte a documentação da API em `https://api.jrcoffee.com.br:5002/api/docs`
