import { api } from "./apiService";
import type { NewPersona } from "../types/user";


export const getMyData = async (id: number) => {
  const response = await api.get(`/user/${id}`);
  return response.data;
}

export const updatePersona = async (id: number, personaData: NewPersona) => {
  const response = await api.put(`/persona/update/${id}`, personaData);
  return response.data;
};