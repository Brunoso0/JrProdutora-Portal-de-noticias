import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRouteCandidato = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login-candidato" />;
};

export default ProtectedRouteCandidato;
