# 📰 Portal de Notícias — JR Produtora

Frontend em **React** desenvolvido para o portal de notícias da **JR Produtora**.  
O objetivo deste repositório é **demonstrar a estrutura e o funcionamento** do projeto, servindo como vitrine de organização e boas práticas.

---

## ✨ Visão Geral

- 📰 **Notícias** com destaques e ordenação por recentes  
- 📂 **Categorias** e **Programas** (ex.: Café com Resenha, JR Esportes)  
- 🔎 **Busca** e filtros básicos  
- 📑 **Páginas de detalhe** via slug  
- 📊 **Área administrativa (dashboard)** para gerenciar:
  - Notícias  
  - Categorias e Programas  
  - Anúncios em diferentes posições (horizontal, vertical, Google Ads)  
  - Relatórios e métricas  

O sistema utiliza **React com Tailwind CSS**, integrando-se a um **backend Node.js** que gerencia as informações.

---

## 🧱 Tecnologias utilizadas

- ⚛️ **React (Create React App)**  
- 🎨 **Tailwind CSS** (via CRACO)  
- 🌐 **Axios** para consumo de API  
- 🟢 **Node.js + Express** (backend do projeto — não incluído aqui)  

---

## 📂 Estrutura do Projeto

```
.
├─ public/                 # index.html, ícones e assets públicos
├─ src/
│  ├─ assets/              # imagens, logos, ícones
│  ├─ components/          # componentes reutilizáveis
│  ├─ pages/               # páginas principais
│  ├─ services/            # integração com API
│  ├─ styles/              # CSS adicionais
│  ├─ App.jsx
│  └─ index.jsx
├─ craco.config.js
├─ tailwind.config.js
└─ package.json
```

---

## 🎯 Objetivo

Este projeto **não é distribuído para uso externo**.  
O repositório existe apenas como **referência técnica e portfólio**, para que interessados possam visualizar:

- Estrutura de pastas  
- Organização de componentes  
- Integração com Tailwind  
- Conceito de SPA (Single Page Application)  
- Implementação de rotas dinâmicas com React Router  

---

## 📄 Licença

Este projeto é **proprietário** da **JR Produtora**.  
Não é permitido clonar, redistribuir ou utilizar para fins comerciais sem autorização.  

---
