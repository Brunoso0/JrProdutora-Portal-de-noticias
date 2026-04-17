import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.API_BASE_URL || "";
const API_FESTIVAL = process.env.REACT_APP_API_FESTIVAL || API_BASE_URL;
const API_VAGAS = process.env.REACT_APP_API_VAGAS || "";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 segundos
});

export { API_BASE_URL, API_FESTIVAL, API_VAGAS };
export default api;
 
