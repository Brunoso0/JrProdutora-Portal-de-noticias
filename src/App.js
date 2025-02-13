import { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { UserProvider } from "./context/UserContext";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import NoticiaPage from "./pages/NoticiaPage";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicLayout from "./layouts/PublicLayout";
import axios from "axios";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

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
        await axios.post("http://localhost:5000/admin/track-visit", {
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
  
  

  return (
    <UserProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
            <Route path="/noticia/:slug" element={<NoticiaPage />} />
            <Route path="/" element={<PublicLayout />} />
          </Routes>
        </Router>
      </AuthProvider>
    </UserProvider>
  );
};

export default App;
