import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRouteCandidato = ({ children }) => {
  const isCandidatoLogado = localStorage.getItem("candidatoLogado") === "true";
  return isCandidatoLogado ? children : <Navigate to="/loginfestival" />;
};

export default ProtectedRouteCandidato;
