interface ErrorLogin { response?: { status?: number; data?: { error?: string; message?: string; errors?: Record<string, string> } } }
export function mensajeLogin(error: unknown): string {
  const respuesta = (error as ErrorLogin | null)?.response;
  if (!respuesta) return 'No se pudo conectar con el servidor. Revisa tu conexión e intenta nuevamente.';
  const { status, data } = respuesta;
  if (status === 401) return 'Correo o contraseña incorrectos. Revisa tus datos e intenta de nuevo.';
  if (status === 403) return 'Tu cuenta está inactiva o no tiene acceso. Contacta al administrador.';
  if (status === 429) return 'Has realizado demasiados intentos. Espera unos minutos antes de volver a iniciar sesión.';
  if (status === 400) {
    if (data?.errors?.correo) return 'Ingresa un correo electrónico válido.';
    if (data?.errors?.contrasena) return 'Ingresa tu contraseña.';
    if (/bad credentials|credenciales|contrase[nñ]a.*incorrect/i.test(data?.message ?? '')) return 'Correo o contraseña incorrectos. Revisa tus datos e intenta de nuevo.';
    return 'Revisa el correo y la contraseña ingresados antes de continuar.';
  }
  if (status === 503 && data?.error?.startsWith('CORREO_')) return 'No se pudo enviar el código de verificación. Intenta más tarde o contacta al administrador.';
  return 'El servicio de inicio de sesión no está disponible en este momento. Intenta más tarde.';
}
