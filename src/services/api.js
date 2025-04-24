import axios from "axios";

const API_BASE_URL = "https://api.jrprodutora.com.br";
const API_FESTIVAL = "https://festival.jrprodutora.com.br"


const api = axios.create({
  baseURL: API_BASE_URL,
});


const apiFestival = axios.create({
  baseURL: API_FESTIVAL,
});


export { API_BASE_URL, API_FESTIVAL, apiFestival  };
export default api;
 