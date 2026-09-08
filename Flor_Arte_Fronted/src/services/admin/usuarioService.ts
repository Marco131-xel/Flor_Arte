import axios from "axios";
import type { Usuario } from "../../types/user";
import type { Persona } from "../../types/user";

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
