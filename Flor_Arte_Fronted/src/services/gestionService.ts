import { api } from "./apiService";

export type Modulo = "tipoflor" | "flores" | "pedidos" | "inventario" | "mermas" | "personas" | "usuarios";
export interface Registro {
  id: number; nombre: string; descripcion?: string; secundario?: string | null; estado?: string | boolean;
  fecha?: string; total?: number; precio?: number; stock?: number; cantidad?: number;
  correo?: string; telefono?: string; dpi?: string; rol?: string; imagen?: string;
  idPersona?: number; idFlor?: number; creadoEn?: string; editableHasta?: string; puedeEditar?: boolean;
}
export interface Pagina {
  contenido: Registro[]; pagina: number; tamano: number; totalElementos: number; totalPaginas: number;
  resumen: { registros: number; importe: number; unidades: number }; horaServidor: string;
}
export interface Filtros { pagina: number; tamano: number; q: string; mes: string; estado: string; rol: string; orden: string }
export const cargarPagina = async (modulo: Modulo, filtros: Filtros, signal?: AbortSignal) =>
  (await api.get<Pagina>(`/gestion/${modulo}/pagina`, { params: filtros, signal })).data;
export const mensajeError = (error: unknown) => {
  const mensaje = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  return typeof mensaje === "string" ? mensaje : "No se pudo completar la operación. Revisa la conexión e intenta de nuevo.";
};
export const dinero = (valor: number = 0) => new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" }).format(valor);
export const fechaTexto = (valor?: string | null) => {
  if (!valor) return "Sin fecha";
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? "Sin fecha" : fecha.toLocaleString("es-GT", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};
