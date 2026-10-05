import { useEffect, useState } from "react";
import Modal from "../shared/Modal";
import ImagenFlor from "./ImagenFlor";
import { api } from "../../services/apiService";
import { dinero, fechaTexto, mensajeError } from "../../services/gestionService";
import type { Modulo, Registro } from "../../services/gestionService";
import { configuracion } from "./configuracion";

interface Linea { idFlor: number; nombreFlor: string; cantidad: number; precio?: number; precioCompra?: number; subtotal: number }
export default function Detalle({ modulo, registro, cerrar }: { modulo: Modulo; registro: Registro; cerrar: () => void }) {
  const config = configuracion[modulo];
  const [data, setData] = useState<{ detalles?: Linea[]; total?: number } | null>(null);
  const [error, setError] = useState("");
  const necesitaDetalle = modulo === "pedidos" || modulo === "inventario";
  useEffect(() => {
    if (!necesitaDetalle) return;
    const controller = new AbortController();
    api.get(`/${config.api}/${config.detalle}${registro.id}`, { signal: controller.signal })
      .then(res => { if (!controller.signal.aborted) setData(res.data); })
      .catch(err => { if (!controller.signal.aborted) setError(mensajeError(err)); });
    return () => controller.abort();
  }, [config.api, config.detalle, registro.id, necesitaDetalle]);
  const campos: [string, string | number | null | undefined][] = [
    [modulo === "pedidos" ? "Cliente" : modulo === "inventario" ? "Proveedor" : "Nombre", registro.nombre],
    [modulo === "pedidos" ? "Atendido por" : modulo === "flores" ? "Color" : "Usuario", registro.secundario],
    ["Fecha", registro.fecha ? fechaTexto(registro.fecha) : null],
    ["Estado", registro.estado == null ? null : typeof registro.estado === "boolean" ? modulo === "flores" ? registro.estado ? "Disponible" : "No disponible" : registro.estado ? "Activo" : "Inactivo" : registro.estado],
    ["Rol", registro.rol], ["Correo", registro.correo], ["Teléfono", registro.telefono], ["DPI", registro.dpi],
    ["Stock", registro.stock], ["Cantidad", registro.cantidad], ["Precio unitario", registro.precio != null ? dinero(registro.precio) : null],
  ];
  return <Modal titulo={`${config.singular} #${registro.id}`} cerrar={cerrar}>
    {modulo === "flores" && registro.imagen && <ImagenFlor key={registro.imagen} src={registro.imagen} nombre={registro.nombre} detalle />}
    <dl className="fa-detail-grid">{campos.filter(([, value]) => value !== undefined && value !== null).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value === "" ? "No registrado" : value}</dd></div>)}</dl>
    {necesitaDetalle && <>
      <div className="fa-section-label"><h3>Flores del registro</h3><span>{data?.detalles?.length ?? "…"} líneas</span></div>
      {error ? <p className="fa-alert" role="alert">{error}</p> : !data ? <p role="status">Cargando detalle…</p> :
        <div className="fa-table-scroll"><table className="fa-table fa-detail-table"><thead><tr><th>Flor</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th></tr></thead>
          <tbody>{data.detalles?.map((linea, index) => <tr key={index}><td>{linea.nombreFlor}</td><td>{linea.cantidad}</td><td>{dinero(linea.precio ?? linea.precioCompra)}</td><td>{dinero(linea.subtotal)}</td></tr>)}
          {!data.detalles?.length && <tr><td colSpan={4}>Sin detalles registrados.</td></tr>}</tbody></table></div>}
      <div className="fa-detail-total"><span>Total del registro</span><strong>{dinero(data?.total ?? registro.total)}</strong></div>
    </>}
  </Modal>;
}
