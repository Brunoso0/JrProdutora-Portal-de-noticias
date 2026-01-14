import axios from "axios";

const API_BASE_URL = "https://api.jrprodutora.com.br";
// const API_BASE_URL = "http://localhost:5000";
const API_FESTIVAL = "https://festival.jrprodutora.com.br"
const API_VAGAS = "https://api.jrcoffee.com.br:5002/api";
// const API_FESTIVAL = "http://168.90.147.242:5000"
// const API_FESTIVAL = "http://localhost:3001"

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

export { API_BASE_URL, API_FESTIVAL, API_VAGAS, apiFestival };
export default api;
 
