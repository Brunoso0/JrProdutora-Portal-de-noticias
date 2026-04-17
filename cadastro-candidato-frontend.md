# Cadastro de Candidato no Frontend

Este guia mostra como consumir a rota de cadastro de candidato da API Festival Forro a partir do frontend.

## Endpoint

- `POST /api/auth/register`
- `POST /api/uploads/pdfs`

Baseado na montagem da API, a URL final fica assim:

```txt
{API_URL}/api/auth/register
```

```txt
{API_URL}/api/uploads/pdfs
```

## Fluxo recomendado com upload

1. Enviar PDF em `POST /api/uploads/pdfs` no campo `file` (multipart/form-data).
2. Opcionalmente, enviar `public_link` na mesma rota para link de verificacao do portfolio.
3. No cadastro, enviar a referencia retornada em `portfolio_pdf_ref`.

Observacao: a imagem do candidato nao entra neste formulario de cadastro. O upload de imagem deve acontecer no fluxo de perfil do candidato (separado do registro inicial).

As rotas de upload salvam os arquivos nestas pastas:

- `uploads/pdfs`

## O que o backend espera

Para um candidato, o backend valida e salva dois conjuntos de dados:

1. `users`
2. `candidate_profiles`

Campos mais importantes para o cadastro de candidato:

- `name`
- `email`
- `cpf`
- `artistic_name`
- `experience_years` com mínimo de 2
- `password` opcional, mas recomendado

Campos opcionais:

- `address`
- `rg`
- `phone`
- `song_name`
- `is_group`
- `bio`
- `portfolio_url`
- `portfolio_pdf_ref`

Se `role` não for enviado, o backend assume `candidate`.

Se `password` não for enviado, o backend usa o CPF como senha do candidato. No frontend, o ideal é exibir essa regra com clareza para evitar confusão no login.

`portfolio_url` e `portfolio_pdf_ref` aceitam:

- link publico (`https://...`), que sera salvo como `link:...`
- caminho de arquivo enviado pelas rotas de upload, salvo como `arquivo:uploads/...`

## Regras de validação

O frontend deve impedir ou tratar os seguintes casos:

- `name` vazio
- `email` inválido
- `cpf` vazio
- `artistic_name` vazio
- `experience_years < 2`
- `password` com menos de 4 caracteres, se for enviada

Erros comuns retornados pela API:

- `400` quando faltam `cpf` ou `artistic_name`
- `400` quando `experience_years` é menor que 2
- `409` quando `email` ou `cpf` já existem
- `500` para falha inesperada no servidor

## Exemplo de payload

```json
{
  "name": "Maria Silva",
  "email": "maria@email.com",
  "password": "123456",
  "role": "candidate",
  "artistic_name": "Maria do Forro",
  "address": "Rua das Flores, 123",
  "rg": "1234567",
  "cpf": "123.456.789-00",
  "phone": "(11) 99999-9999",
  "song_name": "Forro da Noite",
  "experience_years": 3,
  "is_group": false,
  "bio": "Cantora de forró pé de serra.",
  "portfolio_url": "https://exemplo.com/portfolio",
  "portfolio_pdf_ref": "arquivo:uploads/pdfs/1713000000000-portfolio.pdf"
}
```

## Exemplo de upload PDF com link publico

```js
async function uploadPortfolioPdf(file, publicLink) {
  const formData = new FormData();
  if (file) formData.append('file', file);
  if (publicLink) formData.append('public_link', publicLink);

  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/uploads/pdfs`, {
    method: 'POST',
    body: formData
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Falha no upload de PDF.');
  return data;
}
```

## Exemplo com `fetch`

```js
async function registerCandidate(formData) {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...formData,
      role: 'candidate'
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Falha ao cadastrar candidato.');
  }

  return data;
}
```

## Exemplo em um formulário React

```jsx
import { useState } from 'react';

const initialState = {
  name: '',
  email: '',
  password: '',
  cpf: '',
  artistic_name: '',
  experience_years: 2,
  phone: '',
  song_name: '',
  bio: ''
};

export default function CandidateRegisterForm() {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...form,
          role: 'candidate',
          experience_years: Number(form.experience_years)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Não foi possível cadastrar o candidato.');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setSuccess('Candidato cadastrado com sucesso.');
      setForm(initialState);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" value={form.name} onChange={handleChange} placeholder="Nome" />
      <input name="email" value={form.email} onChange={handleChange} placeholder="E-mail" />
      <input name="password" value={form.password} onChange={handleChange} placeholder="Senha" type="password" />
      <input name="cpf" value={form.cpf} onChange={handleChange} placeholder="CPF" />
      <input name="artistic_name" value={form.artistic_name} onChange={handleChange} placeholder="Nome artístico" />
      <input name="experience_years" value={form.experience_years} onChange={handleChange} type="number" min="2" />
      <button type="submit" disabled={loading}>
        {loading ? 'Enviando...' : 'Cadastrar candidato'}
      </button>

      {error ? <p>{error}</p> : null}
      {success ? <p>{success}</p> : null}
    </form>
  );
}
```

## Resposta de sucesso

Quando o cadastro funciona, a API responde com `201` e este formato:

```json
{
  "message": "Usuario criado com sucesso.",
  "user": {
    "id": 1,
    "name": "Maria Silva",
    "email": "maria@email.com",
    "role": "candidate"
  },
  "token": "jwt-gerado-pela-api"
}
```

O frontend pode usar esse `token` imediatamente para autenticação nas próximas rotas protegidas.

## Boas práticas no frontend

- Valide `experience_years` antes de enviar, porque o backend exige no mínimo 2.
- Mostre uma mensagem clara quando `email` ou `cpf` já existirem.
- Se o fluxo usar senha, não dependa do fallback do CPF sem avisar o usuário.
- Guarde o `token` e os dados do usuário em um local consistente, como `localStorage` ou estado global.
- Centralize a URL base da API em uma variável de ambiente.

## Exemplo de erro tratado

```json
{
  "message": "CPF e nome artistico sao obrigatorios para candidato."
}
```

Nesse caso, o frontend deve destacar os campos obrigatórios e evitar novo envio até a correção.
