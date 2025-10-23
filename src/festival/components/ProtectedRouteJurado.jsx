import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRouteJurado = ({ children }) => {
  const isJuradoLogado = localStorage.getItem("juradoLogado") === "true";
  const tipo = localStorage.getItem("tipoUsuario");

  if (!isJuradoLogado || tipo !== "jurado") {
    return <Navigate to="/loginjurados" replace />;
  }

  return children;
};

export default ProtectedRouteJurado;
