import type { Modulo } from "../../services/gestionService";
export interface Configuracion { titulo: string; singular: string; descripcion: string; icono: string; nuevo: string; crear: string; editar: string; api: string; detalle: string; fecha?: boolean }
export const configuracion: Record<Modulo, Configuracion> = {
  arreglos: { titulo: "Arreglos", singular: "Arreglo", descripcion: "Define la composición y el precio de cada arreglo floral.", icono: "basket2", nuevo: "Nuevo arreglo", crear: "create", editar: "update", api: "arreglo", detalle: "" },
  pedidosArreglos: { titulo: "Pedidos de arreglos", singular: "Pedido de arreglo", descripcion: "Ventas de arreglos, seguimiento y control de las flores utilizadas.", icono: "bag-heart", nuevo: "Nuevo pedido de arreglo", crear: "create", editar: "update", api: "pedido_arreglo", detalle: "", fecha: true },
  tipoflor: { titulo: "Tipos de flor", singular: "Tipo de flor", descripcion: "Catálogo de especies y variedades.", icono: "flower3", nuevo: "Nuevo tipo", crear: "", editar: "", api: "tipoflor", detalle: "" },
  flores: { titulo: "Flores", singular: "Flor", descripcion: "Tu catálogo, sus existencias y precios en un solo lugar.", icono: "flower3", nuevo: "Nueva flor", crear: "create", editar: "update", api: "flor", detalle: "", },
  pedidos: { titulo: "Pedidos", singular: "Pedido", descripcion: "Consulta el historial y da seguimiento a cada pedido.", icono: "bag-heart", nuevo: "Nuevo pedido", crear: "create", editar: "update", api: "pedido", detalle: "show/", fecha: true },
  inventario: { titulo: "Inventario", singular: "Entrada", descripcion: "Controla las entradas de flores y revisa tus compras por período.", icono: "box-seam", nuevo: "Nueva entrada", crear: "create", editar: "update", api: "entrada_inventario", detalle: "show/", fecha: true },
  mermas: { titulo: "Mermas", singular: "Merma", descripcion: "Un historial claro de flores dañadas, vencidas o perdidas.", icono: "clipboard2-pulse", nuevo: "Registrar merma", crear: "merma", editar: "merma/editar", api: "movimiento_inventario", detalle: "show/", fecha: true },
  personas: { titulo: "Personas", singular: "Persona", descripcion: "Encuentra y administra la información de tus contactos.", icono: "people", nuevo: "Nueva persona", crear: "create", editar: "update", api: "persona", detalle: "" },
  usuarios: { titulo: "Usuarios", singular: "Usuario", descripcion: "Administra las cuentas y el acceso al sistema.", icono: "person-badge", nuevo: "Nuevo usuario", crear: "crear", editar: "editar", api: "user", detalle: "" },
};
export const estadosPedido = ["PENDIENTE", "CONFIRMADO", "PREPARANDO", "LISTO", "ENTREGADO", "CANCELADO"];
