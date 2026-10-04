import { apiPublica } from "./apiService";

export const loginRequest = async (correo: string, contrasena: string) => {
  const response = await apiPublica.post("/auth/login", {
    correo,
    contrasena,
  });

  return response.data;
};
