import type {
  Entrada_Inventario,
  New_Entra_Inv,
  Detalle_Entrada,
  New_Deta_Entra,
  Movimiento_Inventario,
  New_Mov_Inv,
  New_Entra_Inv_Completa
} from "../../../types/inventario";

import { api } from "../../apiService";

        /* SERVICIOS PARA ENTRADA DE INVENTARIO */

// listar todas las entradas
export const getEntradasInventario = async (): Promise<Entrada_Inventario[]> => {
  const response = await api.get<Entrada_Inventario[]>("/entrada_inventario/all");

  return response.data;
};

// crear entrada
export const createEntradaInventario = async (entradaData: New_Entra_Inv): Promise<Entrada_Inventario> => {
  const response = await api.post<Entrada_Inventario>("/entrada_inventario/create",entradaData);

  return response.data;
};

export const createEntradaCompleta = async (data: New_Entra_Inv_Completa): Promise<Entrada_Inventario> => {
  const response = await api.post<Entrada_Inventario>("/entrada_inventario/create-completa", data);
  return response.data;
};

// ver entrada por ID
export const getEntradaInventarioById = async (id: number): Promise<Entrada_Inventario> => {
  const response = await api.get<Entrada_Inventario>(`/entrada_inventario/show/${id}`);

  return response.data;
};

// actualizar entrada
export const updateEntradaInventario = async (id: number, entradaData: New_Entra_Inv_Completa): Promise<Entrada_Inventario> => {
  const response = await api.put<Entrada_Inventario>(`/entrada_inventario/update/${id}`,entradaData);

  return response.data;
};

// eliminar entrada
export const deleteEntradaInventario = async (id: number) => {
  const response = await api.delete(`/entrada_inventario/delete/${id}`);

  return response.data;
};


        /* SERVICIOS PARA DETALLE DE ENTRADA */

// listar todos los detalles
export const getDetallesEntrada = async (): Promise<Detalle_Entrada[]> => {
  const response = await api.get<Detalle_Entrada[]>("/detalle_entrada/all");

  return response.data;
};

// crear detalle
export const createDetalleEntrada = async (detalleData: New_Deta_Entra): Promise<Detalle_Entrada> => {
  const response = await api.post<Detalle_Entrada>("/detalle_entrada/create", detalleData);

  return response.data;
};

// ver detalle por ID
export const getDetalleEntradaById = async (id: number): Promise<Detalle_Entrada> => {
  const response = await api.get<Detalle_Entrada>(`/detalle_entrada/show/${id}`);

  return response.data;
};

// obtener detalles de una entrada específica
export const getDetallesByEntrada = async (idEntrada: number): Promise<Detalle_Entrada[]> => {
  const response = await api.get<Detalle_Entrada[]>(`/detalle_entrada/entrada/${idEntrada}`);

  return response.data;
};

// actualizar detalle
export const updateDetalleEntrada = async (id: number, detalleData: New_Deta_Entra): Promise<Detalle_Entrada> => {
  const response = await api.put<Detalle_Entrada>(`/detalle_entrada/update/${id}`, detalleData);

  return response.data;
};

// eliminar detalle
export const deleteDetalleEntrada = async (id: number) => {
  const response = await api.delete(`/detalle_entrada/delete/${id}`);

  return response.data;
};


        /* SERVICIOS PARA MOVIMIENTO DE INVENTARIO */

// listar todos los movimientos
export const getMovimientosInventario = async (): Promise<Movimiento_Inventario[]> => {
  const response = await api.get<Movimiento_Inventario[]>("/movimiento_inventario/all");

  return response.data;
};

// crear movimiento
export const createMovimientoInventario = async (movimientoData: New_Mov_Inv): Promise<Movimiento_Inventario> => {
  const response = await api.post<Movimiento_Inventario>("/movimiento_inventario/create", movimientoData);

  return response.data;
};

// ver movimiento por ID
export const getMovimientoInventarioById = async (id: number): Promise<Movimiento_Inventario> => {
  const response = await api.get<Movimiento_Inventario>(`/movimiento_inventario/show/${id}`);

  return response.data;
};

// obtener movimientos de una flor específica
export const getMovimientosByFlor = async (idFlor: number): Promise<Movimiento_Inventario[]> => {
  const response = await api.get<Movimiento_Inventario[]>(`/movimiento_inventario/flor/${idFlor}`);

  return response.data;
};

// actualizar movimiento
export const updateMovimientoInventario = async (id: number, movimientoData: New_Mov_Inv): Promise<Movimiento_Inventario> => {
  const response = await api.put<Movimiento_Inventario>(`/movimiento_inventario/update/${id}`, movimientoData);

  return response.data;
};

// eliminar movimiento
export const deleteMovimientoInventario = async (id: number) => {
  const response = await api.delete(`/movimiento_inventario/delete/${id}`);

  return response.data;
};
