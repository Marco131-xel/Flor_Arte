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

// Los códigos incorrectos de 2FA se manejan en su formulario. Una sesión
// revocada en los módulos protegidos vuelve al login y elimina su copia local.
api.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401 && !error.config?.url?.startsWith("/auth/")) {
    ["token", "role", "user"].forEach(key => localStorage.removeItem(key));
    if (window.location.pathname !== "/login") window.location.replace("/login");
  }
  return Promise.reject(error);
});
