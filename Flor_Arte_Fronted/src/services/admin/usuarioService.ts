import type { Usuario, Persona, NewPersona, UpdateUsuario, NewUser } from "../../types/user";
import { api } from "../apiService";

    /* SERVICIOS PARA PERSONAS */

// listar personas
export const getPersonas = async (): Promise<Persona[]> => {
  const response = await api.get<Persona[]>("/persona/all");
  return response.data;
};

// crear persona
export const createPersona = async (personaData: NewPersona): Promise<Persona> => {
  const response = await api.post<Persona>("/persona/create", personaData);
  return response.data;
};

// ver persona
export const getPersonaById = async (id: number): Promise<Persona> => {
  const response = await api.get<Persona>(`/persona/${id}`);
  return response.data;
};

// actualizar persona
export const updatePersona = async (id: number, personaData: NewPersona): Promise<Persona> => {
  const response = await api.put<Persona>(`/persona/update/${id}`, personaData);
  return response.data;
};

// eliminar persona
export const deletePersona = async (id: number) => {
  const response = await api.delete(`/persona/delete/${id}`);
  return response.data;
};

    /* SERVICIOS PARA USUARIOS */

// listar usuarios
export const getUsuarios = async (): Promise<Usuario[]> => {
  const response = await api.get<Usuario[]>("/user/all");
  return response.data;
};

// crear usuario
export const createUser = async (userData: NewUser): Promise<Usuario> => {
  const response = await api.post<Usuario>("/user/create", userData);
  return response.data;
};

// obtener usuario por id
export const getUsuarioById = async (id: number): Promise<Usuario> => {
  const response = await api.get<Usuario>(`/user/${id}`);
  return response.data;
};

// editar usuario
export const updateUsuario = async (id: number, userData: UpdateUsuario): Promise<Usuario> => {
  const response = await api.put<Usuario>(`/user/update/${id}`, userData);
  return response.data;
};

// eliminar usuario
export const deleteUsuario = async (id: number) => {
  const response = await api.delete(`/user/delete/${id}`);
  return response.data;
};