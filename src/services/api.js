import axios from "axios";

const API_BASE_URL = "https://api.jrprodutora.com.br";


const api = axios.create({
  baseURL: API_BASE_URL,
});


export { API_BASE_URL };
export default api;
 