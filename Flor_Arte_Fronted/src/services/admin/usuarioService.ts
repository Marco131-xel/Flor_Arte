import axios from "axios";
import type { Usuario } from "../../types/user";
import type { Persona, NewPersona } from "../../types/user";

const API_URL = "http://localhost:8080";

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

// funcion para personas
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

/* SERVICIOS PARA PERSONAS */

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