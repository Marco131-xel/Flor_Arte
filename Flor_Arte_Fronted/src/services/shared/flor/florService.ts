import type { Color, NewColor, TipoFlor, NewTipoFlor, Flor, NewFlor } from "../../../types/flor";
import { api } from "../../apiService";

        /* SERVICIOS PARA COLOR */

// listar colores
export const getColores = async (): Promise<Color[]> => {
  const response = await api.get<Color[]>("/color/all");
  return response.data;
};

// crear color
export const createColor = async (colorData: NewColor): Promise<Color> => {
  const response = await api.post<Color>("/color/create", colorData);
  return response.data;
};

// ver color
export const getColorById = async (id: number): Promise<Color> => {
  const response = await api.get<Color>(`/color/${id}`);
  return response.data;
};

// actualizar color
export const updateColor = async (id: number, colorData: NewColor): Promise<Color> => {
  const response = await api.put<Color>(`/color/update/${id}`, colorData);
  return response.data;
};

// eliminar color
export const deleteColor = async (id: number) => {
  const response = await api.delete(`/color/delete/${id}`);
  return response.data;
};

        /* SERVICIOS PARA TIPO FLOR */

// listar tipos de flor
export const getTiposFlor = async (): Promise<TipoFlor[]> => {
  const response = await api.get<TipoFlor[]>("/tipoflor/all");
  return response.data;
};

// crear tipo de flor
export const createTipoFlor = async (tipoFlorData: NewTipoFlor): Promise<TipoFlor> => {
  const response = await api.post<TipoFlor>("/tipoflor/create", tipoFlorData);
  return response.data;
};

// ver tipo de flor
export const getTipoFlorById = async (id: number): Promise<TipoFlor> => {
  const response = await api.get<TipoFlor>(`/tipoflor/${id}`);
  return response.data;
};

// actualizar tipo de flor
export const updateTipoFlor = async (id: number, tipoFlorData: NewTipoFlor): Promise<TipoFlor> => {
  const response = await api.put<TipoFlor>(`/tipoflor/update/${id}`, tipoFlorData);
  return response.data;
};

// eliminar tipo de flor
export const deleteTipoFlor = async (id: number) => {
  const response = await api.delete(`/tipoflor/delete/${id}`);
  return response.data;
};

        /* SERVICIOS PARA FLOR */

// listar flores
export const getFlores = async (): Promise<Flor[]> => {
  const response = await api.get<Flor[]>("/flor/all");
  return response.data;
};

// crear flor
export const createFlor = async (florData: NewFlor): Promise<Flor> => {
  const response = await api.post<Flor>("/flor/create", florData);
  return response.data;
};

// ver flor
export const getFlorById = async (id: number): Promise<Flor> => {
  const response = await api.get<Flor>(`/flor/${id}`);
  return response.data;
};

// actualizar flor
export const updateFlor = async (id: number, florData: NewFlor): Promise<Flor> => {
  const response = await api.put<Flor>(`/flor/update/${id}`, florData);
  return response.data;
};

// eliminar flor
export const deleteFlor = async (id: number) => {
  const response = await api.delete(`/flor/delete/${id}`);
  return response.data;
};