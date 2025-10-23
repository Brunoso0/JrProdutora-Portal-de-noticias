import { Navigate } from "react-router-dom";

const ProtectedRouteAdminFestival = ({ children }) => {
  const isAdminFestival = localStorage.getItem("juradoLogado") === "true" && localStorage.getItem("tipoUsuario") === "admin";

  if (!isAdminFestival) {
    return <Navigate to="/loginjurados" />;
  }

  return children;
};

export default ProtectedRouteAdminFestival;
