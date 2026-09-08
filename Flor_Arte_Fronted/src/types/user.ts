export interface Profile {
  nombre: string;
  telefono: string | null;
  dpi: string | null;
  email: string;
  estado: boolean;
  idPersona: number;
  rol: string;
  user: string;
}

export interface Usuario {
  idUsuario: number;
  name: string;
  email: string;
  estado: boolean;

  idPersona: number;
  nombre: string;
  telefono: string;
  dpi: string;

  rol: string;
}

export interface NewUsuario {
  nombre: string;
  email: string;
  password: string;
  rolPersona: string;
}

export interface Rol {
  idRol: number;
  tipo: string;
}

export interface Persona {
  idPersona: number;
  nombre: string;
  telefono: string;
  dpi: string;
  correo:string;
  rol: Rol
}

export interface NewPersona {
  nombre: string;
  telefono: string;
  dpi: string;
  correo: string;
  idRol: string;
}