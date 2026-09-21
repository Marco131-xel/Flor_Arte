export interface Detalle_Pedido {
  idDetallePedido: number;
  idPedido: number;
  idFlor: number;
  nombreFlor: string;
  cantidad: number;
  precio: number;
  subtotal: number;
}

// para agregar/editar un renglon suelto via /detalle_pedido
export interface New_Deta_Pedido {
  idPedido: number;
  idFlor: number;
  cantidad: number;
  precio: number;
}

export interface Pedido {
  idPedido: number;
  idCliente: number;
  nombreCliente: string;
  idEmpleado: number | null;
  nombreEmpleado: string | null;
  estado: string;
  total: number;
  detalles: Detalle_Pedido[];
}

// item de detalle dentro de la creacion/edicion del pedido completo
export interface New_Deta_Pedido_Item {
  idFlor: number;
  cantidad: number;
  precio: number;
}

// para /pedido/create — el backend acepta el pedido con o sin detalles
export interface New_Pedido {
  idCliente: number;
  idEmpleado?: number;
  detalles?: New_Deta_Pedido_Item[];
}

// para /pedido/update/{id} — tipicamente para cambiar estado
export interface Update_Pedido {
  idCliente: number;
  idEmpleado?: number;
  estado: string;
}