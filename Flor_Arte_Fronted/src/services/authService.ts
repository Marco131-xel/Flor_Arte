import { api, apiPublica } from "./apiService";
import type { DesafioAuth, RespuestaLogin, SesionAuth } from "../types/auth";

export const loginRequest = async (correo: string, contrasena: string) =>
  (await apiPublica.post<RespuestaLogin>("/auth/login", { correo, contrasena })).data;
export const verificarCodigo = async (challengeId: string, codigo: string, configuracion = false) =>
  (await (configuracion ? api : apiPublica).post<SesionAuth>(
    `/auth/2fa/${configuracion ? "configuracion/" : ""}verificar`, { challengeId, codigo })).data;
export const reenviarCodigo = async (challengeId: string, configuracion = false) =>
  (await (configuracion ? api : apiPublica).post<DesafioAuth>(
    `/auth/2fa/${configuracion ? "configuracion/" : ""}reenviar`, { challengeId })).data;
export const solicitarRecuperacion = async (correo: string) =>
  (await apiPublica.post<{ message: string }>("/auth/recuperacion/solicitar", { correo })).data;
export const restablecerContrasena = async (token: string, contrasena: string, confirmacion: string) =>
  (await apiPublica.post<{ message: string }>("/auth/recuperacion/restablecer", { token, contrasena, confirmacion })).data;
export const obtenerConfiguracion2fa = async () =>
  (await api.get<{ habilitado: boolean }>("/auth/2fa/configuracion")).data;
export const configurar2fa = async (habilitado: boolean, contrasena: string) =>
  (await api.post<DesafioAuth>("/auth/2fa/configuracion/iniciar", { habilitado, contrasena })).data;

// Solo se persiste la sesión definitiva; nunca los desafíos ni sus secretos.
export function guardarSesion(data: SesionAuth, email?: string) {
  let anterior: Record<string, unknown> = {};
  try { anterior = JSON.parse(localStorage.getItem("user") || "{}"); } catch { /* sesión nueva */ }
  localStorage.setItem("token", data.token);
  localStorage.setItem("role", data.tipoUsuario);
  localStorage.setItem("user", JSON.stringify({ id: data.id_usuario, nombre: data.nombre,
    estado: data.estado, email: email ?? anterior.email }));
}
