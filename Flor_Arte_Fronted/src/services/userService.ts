import axios from "axios";
import type { NewUsuario } from "../types/user";

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

export const createUser = async (userData: NewUsuario) => { 
  const token = localStorage.getItem("token"); 
  const response = await axios.post( 
    `${API_URL}/auth/admin/usuarios`, 
    userData, 
    { 
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }, 
    }); 
  return response.data; 
};