const url = import.meta.env.VITE_API_URL?.trim();

if (!url) {
  throw new Error("Falta VITE_API_URL. Configura la dirección del backend en el archivo .env.");
}

export const API_URL = url.replace(/\/+$/, "");
