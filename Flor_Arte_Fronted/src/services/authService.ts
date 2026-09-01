import axios from "axios";

const API_URL = "http://localhost:8080/auth";

export const loginRequest = async (correo: string, contrasena: string) => {
  const response = await axios.post(`${API_URL}/login`, {
    correo,
    contrasena,
  });

  return response.data;
};