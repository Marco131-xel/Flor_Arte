export interface SesionAuth {
  requires2fa?: false; token: string; nombre: string; tipoUsuario: string;
  id_usuario: number; estado: boolean; message: string;
}
export interface DesafioAuth {
  requires2fa: true; challengeId: string; expiresInSeconds: number;
  resendAfterSeconds: number; message: string;
}
export type RespuestaLogin = SesionAuth | DesafioAuth;
