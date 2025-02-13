import { createContext, useState, useContext } from "react";
import { useUser } from "./UserContext"; // Importa o UserContext

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("authToken") !== null
  );
  const { updateUser, clearUser } = useUser();

  const login = (token, userData) => {
    localStorage.setItem("authToken", token);
    setIsAuthenticated(true);
    updateUser(userData); // Atualiza o usuário no UserContext
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    setIsAuthenticated(false);
    clearUser(); // Limpa as informações do usuário
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
