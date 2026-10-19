/** Ruta explícita: no depende de cómo React Router agrupe las rutas. */
export function rutaRegresoFormulario(pathname: string): string {
  const ruta = pathname.replace(/\/+$/, '');
  if (/\/usuarios\/(crear|editar\/[^/]+)$/.test(ruta)) return '/admin/usuarios?seccion=usuarios';
  if (/\/usuarios\/(crear-Persona|editar-Persona\/[^/]+)$/.test(ruta)) return '/admin/usuarios?seccion=personas';
  if (/\/inventario\/merma(?:\/editar\/[^/]+)?$/.test(ruta)) return ruta.replace(/\/merma(?:\/editar\/[^/]+)?$/, '') + '?seccion=mermas';
  return ruta.replace(/\/(?:create|crear|update\/[^/]+|editar\/[^/]+|editar|color|tipoflor)$/, '');
}
