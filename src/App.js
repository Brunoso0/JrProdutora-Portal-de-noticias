import { useEffect } from "react";
import axios from "axios";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import { API_BASE_URL } from './services/api'; // Configuração do Axios

import { UserProvider } from "./context/UserContext";

import LoginPage from "./portal/pages/LoginPage";
import AdminPage from "./portal/pages/AdminPage";
import NoticiaPage from "./portal/pages/NoticiaPage";
import VerTodos from "./portal/pages/VerTudoPage";

import ProtectedRoute from "./shared/components/ProtectedRoute";
import ProtectedRouteCandidato from "./shared/components/ProtectedRouteCandidato";

import CandidaturaVagas from './vagas/pages/CandidaturaVagas';
import LoginVagas from "./vagas/pages/LoginVagas";
import ListaCandidatosVagas from "./vagas/pages/ListaCandidatosVagas";

import PublicLayout from "./layouts/PublicLayout";
import FestivalHome from "./festival/pages/FestivalHome";
import FestivalInscricao from "./festival/pages/FestivalInscricao";
import LoginCandidato from "./festival/pages/LoginCandidato";
import CandidateArea from "./festival/pages/CandidateArea";

import "./index.css";

const App = () => {
  useEffect(() => {
    console.log("📌 [DEBUG] useEffect chamado!");

    const trackVisit = async () => {
      if (sessionStorage.getItem("visitTracked")) {
        console.log("⚠ [AVISO] Visita já registrada nesta sessão. Bloqueando requisição duplicada.");
        return;
      }

      try {
        const fp = await FingerprintJS.load();
        const visitorId = (await fp.get()).visitorId;

        // Captura os dados do navegador
        const userAgent = navigator.userAgent;
        const isMobile = /Mobi|Android/i.test(userAgent);
        const isTablet = /Tablet|iPad/i.test(userAgent);
        const dispositivo = isMobile ? "Mobile" : isTablet ? "Tablet" : "Desktop";
        const navegador = navigator.userAgentData?.brands?.[0]?.brand || navigator.userAgent;
        const sistemaOperacional = navigator.userAgentData?.platform || navigator.platform;

        console.log("📌 [DEBUG] Captura inicial:", { visitorId, dispositivo, navegador, sistemaOperacional });

        // Obtém a localização pelo IP
        const { data: ipData } = await axios.get("https://ipinfo.io/json?token=13fc3b1a73900b");

        console.log("📌 [DEBUG] Dados da API IPInfo:", ipData);

        // **Antes de enviar, verifique se a requisição já foi disparada**
        if (sessionStorage.getItem("visitTracked")) {
          console.log("⚠ [AVISO] A requisição já foi enviada, abortando para evitar duplicação.");
          return;
        }

        // Marca a visita como registrada antes de enviar a requisição
        sessionStorage.setItem("visitTracked", "true");

        // Enviar os dados para o servidor
        await axios.post(`${API_BASE_URL}/visits/track-visit`, {
          visitorId,
          ip: ipData.ip,
          cidade: ipData.city || "Desconhecido",
          estado: ipData.region || "Desconhecido",
          pais: ipData.country || "Desconhecido",
          dispositivo,
          navegador,
          sistemaOperacional,
        });

        console.log("✅ [SUCESSO] Visita registrada com sucesso!");

      } catch (error) {
        console.error("❌ [ERRO] Erro ao registrar visita:", error);
      }
    };

    trackVisit();
  }, []);
  
  
// forçando o carregamento do app no build

  return (
    <UserProvider>
      <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        <Route path="/noticia/:slug" element={<NoticiaPage />} />
        <Route path="/ver-todos/:tipo" element={<VerTodos />} />
        <Route path="/" element={<PublicLayout />} />
        <Route path="/vagas" element={<CandidaturaVagas />} />
        <Route path="/vagas/login" element={<LoginVagas />} />
        <Route path="/vagas/candidatos" element={<ListaCandidatosVagas />} />
        <Route path="/festival-forro" element={<FestivalHome />} />
        <Route path="/festival-forro/inscricao" element={<FestivalInscricao />} />
        <Route path="/login-candidato" element={<LoginCandidato />} />
        <Route path="/area-candidato" element={<ProtectedRouteCandidato><CandidateArea /></ProtectedRouteCandidato>} />
      </Routes>
      </Router>
    </UserProvider>
  );
};

export default App;
