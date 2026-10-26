export const estadosEvento = ["PENDIENTE", "CONFIRMADO", "TRABAJANDO", "REALIZADO", "PAGADO", "CANCELADO"] as const;
export type EstadoEvento = typeof estadosEvento[number];
export interface FlorEvento { idFlor: number; nombreFlor: string; cantidad: number; stockDisponible: number; disponible: boolean; imagenUrl?: string|null }
export interface Evento {
  idEvento: number; nombre: string; idCliente: number; nombreCliente: string;
  idEmpleado: number|null; nombreEmpleado: string|null; fecha: string; diasPreparacion: number;
  inicioPreparacion: string; descripcion: string|null; ubicacion: string|null; estado: EstadoEvento;
  reservaAplicada: boolean; creadoEn: string; editableHasta: string; puedeEditar: boolean;
  importe?: number|null; fechaPago?: string|null;
  totalFlores: number; estadosPermitidos: EstadoEvento[]; detalles?: FlorEvento[];
}
export interface PaginaEventos {
  contenido: Evento[]; pagina: number; tamano: number; totalElementos: number; totalPaginas: number;
  resumen: { eventos: number; pendientes: number; reservados: number; floresReservadas: number }; horaServidor: string;
}
export interface CalendarioEventos {
  anio: number; mes: number;
  dias: {dia:string; eventos:number; pendientes:number; reservados:number; cancelados:number; floresReservadas:number}[];
  preparacion: {dia:string; eventos:number}[];
}
export const fechaLocal = (fecha: Date) => `${fecha.getFullYear()}-${String(fecha.getMonth()+1).padStart(2,"0")}-${String(fecha.getDate()).padStart(2,"0")}`;
export const reservaTexto = (evento: Evento) => ["REALIZADO","PAGADO"].includes(evento.estado) ? "Flores utilizadas" : evento.reservaAplicada ? "Flores reservadas" : "Necesidad registrada, sin reserva";
