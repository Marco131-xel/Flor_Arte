export interface DatosPersona { nombre:string;telefono:string;dpi:string;correo:string;idRol:string }
export function validarPersona(form:DatosPersona) {
  const errores:Record<string,string>={};
  if(!form.nombre.trim())errores.nombre="El nombre es obligatorio";
  else if(form.nombre.trim().length>100)errores.nombre="Máximo 100 caracteres";
  if(!form.idRol)errores.idRol="Selecciona un rol";
  if(form.telefono.trim().length>20)errores.telefono="Máximo 20 caracteres";
  if(form.dpi.trim().length>20)errores.dpi="Máximo 20 caracteres";
  if(form.correo.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo.trim()))errores.correo="Ingresa un correo válido";
  else if(form.correo.trim().length>150)errores.correo="Máximo 150 caracteres";
  return errores;
}
export const datosPersona = (form:DatosPersona) => ({...form,nombre:form.nombre.trim(),telefono:form.telefono.trim()||null,dpi:form.dpi.trim()||null,correo:form.correo.trim()||null});
