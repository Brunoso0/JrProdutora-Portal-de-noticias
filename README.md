Portal de Notícias — JR Produtora

Frontend em React para o portal de notícias da JR Produtora.
Projeto focado em performance, SEO básico, organização de componentes e integração com um backend Node.js (API própria) para gerenciamento de notícias, categorias, programas, anúncios e métricas.

✨ Principais recursos

Listagem de notícias com destaque e ordenação por recentes

Categorias e Programas (ex.: Café com Resenha, JR Esportes)

Busca e filtros básicos

Páginas de detalhe (slug)

Área administrativa (dashboard) para gerenciar:

Notícias (criação/edição, imagens, status)

Categorias e Programas

Anúncios (posições fixas, horizontais/verticais, Google Ads, prioridade/loop)

Relatórios e métricas (base para gráficos)

Estilos com Tailwind CSS + ajustes próprios

Build pronto para servir via Nginx ou Apache (arquivo .htaccess de exemplo incluído)

🧱 Stack

React (Create React App)

CRACO para personalizações de build

Tailwind CSS

Axios (ou fetch) para chamadas à API

Node.js/Express no backend (projeto separado)

Integração com Nginx/Apache para produção e Certbot (SSL)

O repositório contém craco.config.js, tailwind.config.js e um htaccess-template.txt para apoio ao deploy em Apache. 
GitHub

📁 Estrutura (resumo)
.
├─ public/                 # index.html, ícones, imagens públicas
├─ src/
│  ├─ assets/              # imagens, logos, ícones do app
│  ├─ components/          # componentes reutilizáveis (Cards, Header, Footer etc.)
│  ├─ pages/               # páginas (Home, VerTodos, Detalhe, Programas ...)
│  ├─ services/
│  │  └─ api.js            # configuração do Axios (baseURL, interceptors)
│  ├─ styles/              # CSS complementares quando necessário
│  ├─ App.jsx
│  └─ index.jsx
├─ scripts/                # utilitários de build/deploy (se aplicável)
├─ craco.config.js
├─ tailwind.config.js
├─ package.json
└─ README.md


A navegação de arquivos do GitHub mostra essas entradas no repositório. 
GitHub

⚙️ Requisitos

Node.js LTS (18+ recomendado)

npm ou yarn

🚀 Rodando localmente
# 1) Instalar dependências
npm install
# ou
yarn

# 2) Criar o .env (veja abaixo) com a URL da API

# 3) Subir em desenvolvimento
npm start
# ou
yarn start

# App em http://localhost:3000

🔐 Variáveis de ambiente

Crie um arquivo .env na raiz:

# URL base do backend (produção/desenvolvimento)
REACT_APP_API_URL=https://api.seudominio.com.br

# (Opcional) chaves/flags para integrações
REACT_APP_GOOGLE_TAG=G-XXXXXXX
REACT_APP_ENABLE_MOCKS=false


No código (ex.: services/api.js):

import axios from "axios";

export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

🧩 Scripts úteis

Os scripts padrão do CRA estão disponíveis:

npm start — modo desenvolvimento (hot reload)

npm run build — build otimizado para produção

npm test — testes (quando configurados)

O README atual do repo mostra exatamente os scripts padrão do CRA. 
GitHub

🧭 Rotas esperadas (frontend)

/ — Home com destaques, últimas notícias e blocos de anúncios

/ver-todos — Listagem com filtros (categoria, programa, período)

/noticia/:slug — Página de detalhe

/categoria/:slug — Notícias por categoria

/programa/:slug — Notícias por programa

/admin — Dashboard administrativo (controle de notícias, anúncios, relatórios)

Os slugs são preferidos em vez de IDs para URLs legíveis.

🗃️ Modelo de dados (visão de frontend)

O frontend consome endpoints do backend para:

Notícias: título, subtítulo, imagem, slug, conteúdo, autor, programa, categoria, destaque, datas

Categorias/Programas: nome, slug

Anúncios: posição, tipo (horizontal/vertical/google), prioridade/ordem, imagem/HTML, link/UTM

Relatórios: métricas (ex.: visitas únicas vs. retornantes, votos/engajamento quando aplicável)

O backend é externo a este repo, mas o portal já foi planejado para essas entidades.

📦 Build e Deploy
Nginx (recomendado)

Rodar npm run build

Servir build/ via Nginx (exemplo de server block):

server {
  server_name www.seudominio.com.br seudominio.com.br;

  root /var/www/portal-noticias/build;
  index index.html;

  location / {
    try_files $uri /index.html;
  }

  location /uploads/ {
    alias /var/www/api/uploads/;
  }

  # Proxy para API (se necessário)
  location /api/ {
    proxy_pass https://api.seudominio.com.br/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}


Certificado TLS com Certbot (Let’s Encrypt).

Apache

Habilite AllowOverride All no virtual host e renomeie o htaccess-template.txt para .htaccess dentro de build/ (ou na raiz servida).

O template já provê Fallback para SPA (React Router) e cache básico.

O arquivo htaccess-template.txt está no repo. 
GitHub

📐 Convenções de código

Componentes em JSX com CSS/Tailwind (preferência por utilitários do Tailwind + classes próprias quando necessário).

Pastas por responsabilidade (components/pages/services).

Nomes de arquivos e slugs kebab-case; componentes PascalCase.

ESLint/Prettier (se configurados no seu setup local/IDE).

🔎 Acessibilidade & SEO básico

title, meta description e og: tags por página (quando possível)

alt em imagens

Headings em ordem semântica

Links descritivos

Foco visível e contraste adequados

🗺️ Roadmap (sugestão)

 Página “Notícias da semana” e “da região” (menus rápidos)

 Melhorias de SEO (sitemap.xml, robots.txt, metatags por rota)

 Página de anunciantes (venda de espaços)

 Relatórios com gráficos via API real (substituir mocks)

 Testes de integração (React Testing Library + Jest)

 i18n (pt-BR por padrão)

🤝 Como contribuir

Faça um fork do projeto

Crie uma branch: git checkout -b feature/minha-feature

Commit: git commit -m "feat: minha feature"

Push: git push origin feature/minha-feature

Abra um Pull Request

📄 Licença

Defina a licença aqui (MIT, ISC etc.). Se nada for declarado, o repositório será considerado sem licença pública explícita.
