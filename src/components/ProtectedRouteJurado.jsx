// src/components/ProtectedRouteJurado.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRouteJurado = ({ children }) => {
  const isJurado = localStorage.getItem("juradoLogado") === "true";
  return isJurado ? children : <Navigate to="/loginfestival" />;
};

export default ProtectedRouteJurado;
