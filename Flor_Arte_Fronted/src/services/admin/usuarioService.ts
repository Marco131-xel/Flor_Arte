import axios from "axios";
import type { Usuario } from "../../types/user";
import type { Persona, NewPersona, UpdateUsuario } from "../../types/user";
import { api } from "../apiService";

const API_URL = "http://localhost:8080";

/* SERVICIOS PARA USUARIOS */
// servicio para listar usuarios
export const getUsuarios = async (): Promise<Usuario[]> => {
  const token = localStorage.getItem("token");

  const response = await axios.get<Usuario[]>(
    `${API_URL}/user/all`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

// servicio para obtener el usuario por id
export const getUsuarioById = async (id:number) => {
  const response = await api.get(`/user/${id}`);
  return response.data;
};

// servicio para editar el usuario
export const updateUsuario = async (id: number, userData: UpdateUsuario) => {
  const response = await api.put(`/user/update/${id}`, userData);
  return response.data;
};

// servicio para eliminar usuario
export const deleteUsuario = async (id: number) => {
  const response = await api.delete(`/user/delete/${id}`);
  return response.data;
}

  /* SERVICIOS PARA PERSONAS */
// servicio para listar personas
export const getPersonas = async (): Promise<Persona[]> => {
  const token = localStorage.getItem("token");

  const response = await axios.get<Persona[]>(
    `${API_URL}/persona/all`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

// servicio para crear personas 
export const createPersona = async (personaData: NewPersona) => {
  const token = localStorage.getItem("token"); 
  const response = await axios.post( 
    `${API_URL}/persona/create`, 
    personaData, 
    { 
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }, 
    }); 
  return response.data; 
};

// servicio para ver persona
export const getPersonaById = async (id: number): Promise<Persona> => {
  const token = localStorage.getItem("token");
  const response = await axios.get<Persona>(
    `${API_URL}/persona/${id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

// servicio para actualizar persona
export const updatePersona = async (id: number, personaData: NewPersona) => {
  const token = localStorage.getItem("token");
  const response = await axios.put(
    `${API_URL}/persona/update/${id}`,
    personaData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

// servicio para eliminar persona
export const deletePersona = async (id: number) => {
  const token = localStorage.getItem("token");
  const response = await axios.delete(
    `${API_URL}/persona/delete/${id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};