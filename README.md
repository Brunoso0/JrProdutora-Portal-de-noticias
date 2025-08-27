# 📰 Portal de Notícias — JR Produtora

Frontend em **React** para o portal de notícias da **JR Produtora**.  
Focado em performance, SEO básico e integração com backend Node.js (API própria), o sistema permite gerenciar notícias, categorias, programas, anúncios e métricas.

---

## ✨ Funcionalidades

- 📰 **Notícias** com destaques, listagem e ordenação por recentes  
- 📂 **Categorias** e **Programas** (ex.: Café com Resenha, JR Esportes)  
- 🔎 **Busca** e filtros básicos  
- 📑 **Páginas de detalhe** via slug  
- 📊 **Área administrativa (dashboard)** para gerenciar:
  - Notícias (criação/edição, imagens, status)  
  - Categorias e Programas  
  - Anúncios (posições fixas, horizontais/verticais/Google Ads)  
  - Relatórios e métricas (gráficos planejados)  
- 🎨 **Estilos** com Tailwind CSS + ajustes próprios  
- 🌐 **Build** pronto para deploy em Nginx ou Apache (exemplo de `.htaccess` incluso)  

---

## 🧱 Stack

- ⚛️ **React (CRA)**  
- 🎨 **Tailwind CSS** (via CRACO)  
- 🌐 **Axios** para requisições  
- 🟢 **Node.js + Express** (backend separado)  
- 🔒 **Nginx / Apache** + **Certbot** para produção HTTPS  

---

## 📂 Estrutura do projeto

```
.
├─ public/                 # index.html, ícones e assets públicos
├─ src/
│  ├─ assets/              # imagens, logos, ícones
│  ├─ components/          # componentes reutilizáveis
│  ├─ pages/               # páginas (Home, VerTodos, Detalhe, etc.)
│  ├─ services/            # configuração do Axios
│  ├─ styles/              # CSS adicionais
│  ├─ App.jsx
│  └─ index.jsx
├─ scripts/                # utilitários de build/deploy
├─ craco.config.js
├─ tailwind.config.js
├─ package.json
└─ README.md
```

---

## ⚙️ Requisitos

- **Node.js** 18+  
- **npm** ou **yarn**

---

## 🚀 Rodando localmente

```bash
# Instalar dependências
npm install
# ou
yarn

# Criar o arquivo .env (veja abaixo)

# Rodar em desenvolvimento
npm start
# ou
yarn start
```

Aplicação disponível em: **http://localhost:3000**

---

## 🔐 Variáveis de ambiente

Crie um arquivo `.env` na raiz:

```bash
# URL da API (produção ou dev)
REACT_APP_API_URL=https://api.seudominio.com.br

# (opcional)
REACT_APP_GOOGLE_TAG=G-XXXXXXX
REACT_APP_ENABLE_MOCKS=false
```

Exemplo (`services/api.js`):

```js
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});
```

---

## 🧩 Scripts disponíveis

- `npm start` — desenvolvimento (hot reload)  
- `npm run build` — build otimizado para produção  
- `npm test` — testes (quando configurados)  

---

## 🧭 Rotas principais

- `/` — Home (destaques + últimas notícias)  
- `/ver-todos` — Listagem com filtros  
- `/noticia/:slug` — Página de detalhe  
- `/categoria/:slug` — Notícias por categoria  
- `/programa/:slug` — Notícias por programa  
- `/admin` — Dashboard administrativo  

---

## 🗃️ Modelo de dados esperado (frontend)

- **Notícias** → título, subtítulo, imagem, slug, conteúdo, autor, programa, categoria, destaque, datas  
- **Categorias / Programas** → nome, slug  
- **Anúncios** → posição, tipo (horizontal/vertical/google), prioridade, imagem/HTML, link  
- **Relatórios** → métricas (visitas únicas, votos/engajamento, etc.)  

---

## 📐 Convenções de código

- Componentes em **JSX**  
- Estilização com **Tailwind CSS** (preferência)  
- Pastas organizadas por responsabilidade  
- Componentes → **PascalCase**, arquivos → **kebab-case**  

---

## 🗺️ Roadmap

- [ ] Notícias da semana e da região  
- [ ] Melhorias de SEO (sitemap.xml, robots.txt)  
- [ ] Página de anunciantes (venda de espaços)  
- [ ] Relatórios reais via API (gráficos)  
- [ ] Testes automatizados  
- [ ] Suporte a i18n (pt-BR default)  

---

## 🤝 Como contribuir

1. Faça um **fork**  
2. Crie sua branch: `git checkout -b feature/minha-feature`  
3. Commit: `git commit -m "feat: minha feature"`  
4. Push: `git push origin feature/minha-feature`  
5. Abra um Pull Request 🎉  

---

## 📄 Licença

Defina a licença aqui (ex.: MIT).  
Se nada for definido, o projeto será considerado **sem licença explícita**.

---
