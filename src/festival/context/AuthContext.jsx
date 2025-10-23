import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_FESTIVAL } from '../../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null); // 'admin', 'moderador', 'publico'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar token salvo no localStorage
    const savedToken = localStorage.getItem('festivalAuthToken');
    const savedRole = localStorage.getItem('festivalUserRole');
    
    if (savedToken && savedRole) {
      setToken(savedToken);
      setRole(savedRole);
      setIsAuthenticated(true);
      
      // Configurar axios com o token
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
    }
    
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await axios.post(`${API_FESTIVAL}/api/auth/login`, credentials);
      const { token: newToken, role: userRole } = response.data;
      
      setToken(newToken);
      setRole(userRole);
      setIsAuthenticated(true);
      
      // Salvar no localStorage
      localStorage.setItem('festivalAuthToken', newToken);
      localStorage.setItem('festivalUserRole', userRole);
      
      // Configurar axios
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Erro ao fazer login' 
      };
    }
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    setIsAuthenticated(false);
    
    localStorage.removeItem('festivalAuthToken');
    localStorage.removeItem('festivalUserRole');
    
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    isAuthenticated,
    token,
    role,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook customizado
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};