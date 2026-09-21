export interface Entrada_Inventario {
    idEntrada: number;
    idPersona: number;
    nombrePersona: string;
    fecha: string;
    total: number;
    detalles: Detalle_Entrada[];   
}

export interface New_Entra_Inv {
    idPersona: number;
    fecha: string;
    total: number;   
}

export interface Detalle_Entrada {
    idDetalleEntrada: number;
    idEntrada: number;
    idFlor: number;
    nombreFlor: string;
    cantidad: number;
    precioCompra: number;
    subtotal: number;
}

export interface New_Deta_Entra {
    idEntrada: number;
    idFlor: number;
    cantidad: number;
    precioCompra: number;
    subtotal: number;
}

export interface Movimiento_Inventario {
  idMovimientoInventario: number;
  idFlor: number;
  nombreFlor: string;
  tipoMovimiento: string;
  cantidad: number;
  motivo: string;
  fecha: string;
}

export interface New_Mov_Inv {
    idFlor: number;
    tipoMovimiento: string;
    cantidad: number;
    motivo: string;
    fecha?: string;
}


export interface New_Deta_Entra_Item {
  idFlor: number;
  cantidad: number;
  precioCompra: number;
}

export interface New_Entra_Inv_Completa {
  idPersona: number;
  detalles: New_Deta_Entra_Item[];
}