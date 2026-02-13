import axios from "axios";

const API_BASE_URL = process.env.API_BASE_URL || "";
const API_FESTIVAL = process.env.API_FESTIVAL || "";
const API_VAGAS = process.env.REACT_APP_API_VAGAS || "";

// Configuração para retry automático
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 segundo

// Função para delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Função para verificar se deve fazer retry
const shouldRetry = (error) => {
  return error.response?.status >= 500 || 
         error.code === 'NETWORK_ERROR' || 
         error.code === 'ECONNABORTED' ||
         !error.response;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 segundos
});

const apiFestival = axios.create({
  baseURL: API_FESTIVAL,
  timeout: 10000, // 10 segundos
});



// Interceptor para retry automático no apiFestival
apiFestival.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config } = error;
    
    // Se não tem config ou já excedeu tentativas
    if (!config || config.__retryCount >= MAX_RETRIES) {
      console.error('🚨 API Festival definitivamente indisponível:', error.message);
      return Promise.reject(error);
    }

    // Incrementa contador de tentativas
    config.__retryCount = config.__retryCount || 0;
    config.__retryCount += 1;

    // Se deve tentar novamente
    if (shouldRetry(error)) {
      console.warn(`⚠️ Tentativa ${config.__retryCount}/${MAX_RETRIES} para ${config.url}`);
      await delay(RETRY_DELAY * config.__retryCount);
      return apiFestival(config);
    }

    return Promise.reject(error);
  }
);

export { API_BASE_URL, API_FESTIVAL, API_VAGAS, apiFestival};
export default api;
 
