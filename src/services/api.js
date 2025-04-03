import axios from "axios";

const API_BASE_URL = "http://168.90.147.242:5001";


const api = axios.create({
  baseURL: API_BASE_URL,
});


export { API_BASE_URL };
export default api;
 