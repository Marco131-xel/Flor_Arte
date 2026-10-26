import { useState } from "react";
import type { Comprobante } from "../../../types/comprobante";
import { numeroComprobante } from "../../../types/comprobante";
import { enviarComprobanteCorreo } from "../../../services/documentosService";
import { mensajeError } from "../../../services/gestionService";
export default function CorreoRecibo({ comprobante, ocupado, cambiarOcupado }: {
  comprobante: Comprobante; ocupado: boolean; cambiarOcupado: (valor: boolean) => void;
}) {
  const [enviando, setEnviando] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [correo, setCorreo] = useState(comprobante.documento.correo ?? "");
  const [error, setError] = useState(""); const [mensaje, setMensaje] = useState("");
  async function enviar(e: React.FormEvent) {
    e.preventDefault(); if (ocupado) return;
    setEnviando(true); cambiarOcupado(true); setError(""); setMensaje("");
    try { setMensaje((await enviarComprobanteCorreo(comprobante.id, correo.trim())).message); }
    catch (err) { setError(mensajeError(err)); } finally { setEnviando(false); cambiarOcupado(false); }
  }
  return <section className="rc-email-panel">
    <h3><i className="bi bi-envelope-paper me-2" aria-hidden="true"/>Envía el PDF por correo</h3>
    <p>Comparte {numeroComprobante(comprobante)} con {comprobante.tipo === "INVENTARIO" ? "el proveedor" : "tu cliente"}. Incluye el logo y el detalle de la operación.</p>
    {!abierto ? <button className="fa-button secondary" disabled={ocupado} onClick={() => setAbierto(true)}>
      <i className="bi bi-send" aria-hidden="true"/>Enviar por correo</button> :
      <form className="rc-email-form fa-security-form" onSubmit={enviar}>
        <label htmlFor="correo-recibo">Correo del {comprobante.tipo === "INVENTARIO" ? "proveedor" : "cliente"}
          <input id="correo-recibo" type="email" required maxLength={150} autoComplete="email"
            placeholder="cliente@correo.com" value={correo} onChange={e => { setCorreo(e.target.value); setMensaje(""); }} disabled={ocupado}/>
        </label>
        <button className="fa-button" disabled={ocupado}><i className="bi bi-send" aria-hidden="true"/>{enviando ? "Enviando…" : "Enviar PDF"}</button>
      </form>}
    {abierto && <p className="mt-2 mb-0">Se usará este correo solo para el envío; el comprobante original conserva sus datos.</p>}
    {error && <div className="fa-auth-notice danger mt-3 mb-0" role="alert">{error}</div>}
    {mensaje && <div className="fa-auth-notice success mt-3 mb-0" role="status">{mensaje}</div>}
  </section>;
}
