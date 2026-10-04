import axios from "axios";

import { API_URL } from "../config/api";

const configuracion = {
  baseURL: API_URL,
};

// Ambos clientes comparten la conexión; solo el privado adjunta la sesión.
export const apiPublica = axios.create(configuracion);
export const api = axios.create(configuracion);

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
