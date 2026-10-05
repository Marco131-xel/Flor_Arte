export interface FlorArreglo {idFlor:number;nombreFlor:string;cantidad:number;cantidadPorArreglo?:number}
export interface Arreglo {idArreglo:number;nombre:string;imagenUrl:string|null;descripcion:string|null;precio:number;disponibles:number;detalles:FlorArreglo[]}
export interface PedidoArreglo {idPedidoArreglo:number;idCliente:number;nombreCliente:string;idEmpleado:number|null;nombreEmpleado:string|null;idArreglo:number;nombreArreglo:string;imagenUrl:string|null;cantidad:number;precioUnitario:number;total:number;estado:string;fecha:string;detalles:FlorArreglo[]}
