import axios from "axios";
import { api } from "./apiService";
import type { NewPersona, NewUser } from "../types/user";

const API_URL = "http://localhost:8080";

export const getMyProfile = async () => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${API_URL}/user/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const createUser = async (userData: NewUser) => { 
  const response = await api.post('user/create', userData);
  return response.data; 
};

export const getMyData = async (id: number) => {
  const response = await api.get(`/user/${id}`);
  return response.data;
}

export const updatePersona = async (id: number, personaData: NewPersona) => {
  const response = await api.put(`/persona/update/${id}`, personaData);
  return response.data;
};