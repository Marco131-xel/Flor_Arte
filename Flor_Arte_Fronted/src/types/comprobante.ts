export type TipoComprobante="PEDIDO"|"ARREGLO"|"EVENTO"|"INVENTARIO";
export const nombresComprobante:Record<TipoComprobante,string>={PEDIDO:"Recibo de pedido",ARREGLO:"Recibo de arreglo",EVENTO:"Recibo de evento",INVENTARIO:"Comprobante de compra"};
export interface Empresa {nombre:string;direccion:string;correo:string;telefono:string}
export interface DocumentoComprobante {empresa:Empresa;persona:string;direccion:string|null;telefono:string|null;correo:string|null;responsable:string|null;fecha:string;estado:string;total:number;lineas:{descripcion:string;cantidad:number;precio:number;subtotal:number}[]}
export interface Comprobante {id:number;tipo:TipoComprobante;idOrigen:number;emitidoEn:string;emitidoPor:string;documento:DocumentoComprobante}
export interface FilaComprobante {id:number;tipo:TipoComprobante;idOrigen:number;persona:string;total:number;emitidoEn:string}
export interface PaginaComprobantes {contenido:FilaComprobante[];pagina:number;tamano:number;totalElementos:number;totalPaginas:number}
export const numeroComprobante=(c:{id:number;tipo:TipoComprobante})=>`${c.tipo==="INVENTARIO"?"COMP":"REC"}-${String(c.id).padStart(6,"0")}`;
