import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRouteCandidato = ({ children }) => {
  const isCandidatoLogado = localStorage.getItem("candidatoLogado") === "true";

  if (!isCandidatoLogado) {
    console.warn("🛑 Usuário não autenticado. Redirecionando para loginfestival.");
    return <Navigate to="/loginfestival" replace />;
  }

  return children;
};

export default ProtectedRouteCandidato;
