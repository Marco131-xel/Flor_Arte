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

export interface UserFull {
  idUsuario: number;
  name: string;
  email: string;
  estado: boolean;
  idPersona: number;
  persona: Persona;
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
  persona: Persona
}

export interface NewUser {
  name: string;
  email: string;
  password: string;
  idPersona: string;
  
}

export interface UpdateUsuario {
  email: string;
  password?: string;
  estado: boolean;
  idPersona: string;
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
  correo: string;
  idRol: number;
  tipoRol: string;
  rol: Rol
}

export interface NewPersona {
  nombre: string;
  telefono: string;
  dpi: string;
  correo: string;
  idRol: string;
}