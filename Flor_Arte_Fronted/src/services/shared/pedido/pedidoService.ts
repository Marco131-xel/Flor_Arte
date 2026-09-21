import type {
  Pedido,
  New_Pedido,
  Update_Pedido,
  Detalle_Pedido,
  New_Deta_Pedido,
} from "../../../types/pedido";

import { api } from "../../apiService";

        /* SERVICIOS PARA PEDIDO */

// listar todos los pedidos
export const getPedidos = async (): Promise<Pedido[]> => {
  const response = await api.get<Pedido[]>("/pedido/all");

  return response.data;
};

// crear pedido (con o sin detalles)
export const createPedido = async (pedidoData: New_Pedido): Promise<Pedido> => {
  const response = await api.post<Pedido>("/pedido/create", pedidoData);

  return response.data;
};

// ver pedido por ID (con sus detalles)
export const getPedidoById = async (id: number): Promise<Pedido> => {
  const response = await api.get<Pedido>(`/pedido/show/${id}`);

  return response.data;
};

// actualizar pedido
export const updatePedido = async (id: number, pedidoData: Update_Pedido): Promise<Pedido> => {
  const response = await api.put<Pedido>(`/pedido/update/${id}`, pedidoData);

  return response.data;
};

// eliminar pedido
export const deletePedido = async (id: number) => {
  const response = await api.delete(`/pedido/delete/${id}`);

  return response.data;
};


        /* SERVICIOS PARA DETALLE DE PEDIDO */

// listar todos los detalles
export const getDetallesPedido = async (): Promise<Detalle_Pedido[]> => {
  const response = await api.get<Detalle_Pedido[]>("/detalle_pedido/all");

  return response.data;
};

// ver detalle por ID
export const getDetallePedidoById = async (id: number): Promise<Detalle_Pedido> => {
  const response = await api.get<Detalle_Pedido>(`/detalle_pedido/show/${id}`);

  return response.data;
};

// obtener los detalles de un pedido específico
export const getDetallesByPedido = async (idPedido: number): Promise<Detalle_Pedido[]> => {
  const response = await api.get<Detalle_Pedido[]>(`/detalle_pedido/pedido/${idPedido}`);

  return response.data;
};

// agregar un renglón (descuenta stock, crea salida VENTA y suma el total)
export const createDetallePedido = async (detalleData: New_Deta_Pedido): Promise<Detalle_Pedido> => {
  const response = await api.post<Detalle_Pedido>("/detalle_pedido/create", detalleData);

  return response.data;
};

// actualizar un renglón (reajusta stock y total)
export const updateDetallePedido = async (id: number, detalleData: New_Deta_Pedido): Promise<Detalle_Pedido> => {
  const response = await api.put<Detalle_Pedido>(`/detalle_pedido/update/${id}`, detalleData);

  return response.data;
};

// eliminar un renglón (devuelve el stock al inventario)
export const deleteDetallePedido = async (id: number) => {
  const response = await api.delete(`/detalle_pedido/delete/${id}`);

  return response.data;
};