import {useEffect,useState} from "react";
import {api} from "../../../services/apiService";
import {fechaTexto,mensajeError,dinero} from "../../../services/gestionService";
import CampoNumero from "../../../components/shared/CampoNumero";
import Modal from "../../../components/shared/Modal";
import type {Evento,EstadoEvento} from "../../../types/evento";
import {reservaTexto} from "../../../types/evento";

export default function DetalleEvento({id,cerrar,guardado}:{id:number;cerrar:()=>void;guardado:()=>void}) {
  const [importe,setImporte]=useState("");
  const [evento,setEvento]=useState<Evento|null>(null),[error,setError]=useState(""),[estado,setEstado]=useState<EstadoEvento|"">(""),[ocupado,setOcupado]=useState(false);
  useEffect(()=>{const controller=new AbortController();api.get<Evento>(`/evento/${id}`,{signal:controller.signal}).then(({data})=>{if(!controller.signal.aborted)setEvento(data);}).catch(err=>{if(!controller.signal.aborted)setError(mensajeError(err));});return()=>controller.abort();},[id]);
  return <Modal titulo={evento?.nombre||`Evento #${id}`} cerrar={cerrar} ocupado={ocupado}>
    {error&&<p className="fa-alert" role="alert">{error}</p>}
    {!evento?<p role="status">Cargando evento…</p>:<>
      <p><span className={`fa-badge ev-status-${evento.estado.toLowerCase()}`}>{evento.estado.toLowerCase()}</span></p>
      <dl className="fa-detail-grid"><div><dt>Cliente</dt><dd>{evento.nombreCliente}</dd></div><div><dt>Responsable</dt><dd>{evento.nombreEmpleado||"Sin asignar"}</dd></div><div><dt>Día del evento</dt><dd>{fechaTexto(evento.fecha)}</dd></div><div><dt>Inicio de preparación</dt><dd>{fechaTexto(`${evento.inicioPreparacion}T00:00:00`)} · {evento.diasPreparacion} días antes</dd></div><div><dt>Importe acordado</dt><dd>{evento.importe==null?"Sin registrar":dinero(evento.importe)}</dd></div>{evento.fechaPago&&<div><dt>Fecha de pago</dt><dd>{fechaTexto(evento.fechaPago)}</dd></div>}<div><dt>Ubicación</dt><dd>{evento.ubicacion||"No registrada"}</dd></div><div><dt>Descripción</dt><dd>{evento.descripcion||"No registrada"}</dd></div></dl>
      <div className="fa-section-label"><h3>{reservaTexto(evento)}</h3><span>{evento.totalFlores} flores</span></div>
      {!evento.reservaAplicada&&evento.estado!=="CANCELADO"&&evento.detalles?.some(d=>!d.disponible||d.cantidad>d.stockDisponible)&&<p className="fa-alert">Actualmente faltan flores para confirmar. La solicitud queda registrada; repón el inventario antes de reservar.</p>}
      <div className="fa-table-scroll"><table className="fa-table"><thead><tr><th>Flor</th><th>Necesarias</th><th>Stock disponible ahora</th></tr></thead><tbody>{evento.detalles?.map(d=><tr key={d.idFlor}><td>{d.nombreFlor}{!d.disponible&&<small> · No disponible</small>}</td><td>{d.cantidad}</td><td>{d.stockDisponible}</td></tr>)}</tbody></table></div>
      {!!evento.estadosPermitidos.length&&<form className="ev-state-form" onSubmit={async e=>{e.preventDefault();if(!estado||ocupado)return;setOcupado(true);setError("");try{const {data}=await api.put<Evento>(`/evento/${id}/estado`,{estado,...(estado==="PAGADO"&&evento.importe==null?{importe:Number(importe)}:{})});setEvento(data);setEstado("");guardado();}catch(err){setError(mensajeError(err));}finally{setOcupado(false);}}}>
        <label className="fa-field" htmlFor="evento-estado">Nuevo estado<select id="evento-estado" className="cp-select" required value={estado} disabled={ocupado} onChange={e=>setEstado(e.target.value as EstadoEvento)}><option value="">Selecciona un estado</option>{evento.estadosPermitidos.map(opcion=><option key={opcion} value={opcion}>{opcion.toLowerCase()}</option>)}</select></label>
        {estado==="PAGADO"&&evento.importe==null&&<label className="fa-field" htmlFor="evento-pago-importe">Importe del evento (Q) *<CampoNumero id="evento-pago-importe" required min="0" max="99999999.99" step="0.01" value={importe} onChange={e=>setImporte(e.target.value)}/></label>}
        {estado==="CONFIRMADO"&&<p className="fa-edit-notice">Al confirmar se apartarán y descontarán las flores del inventario.</p>}
        {estado==="CANCELADO"&&evento.reservaAplicada&&<p className="fa-edit-notice">Al cancelar se devolverán las flores reservadas al inventario.</p>}
        <button className="fa-button" disabled={ocupado||!estado}>{ocupado?"Guardando…":"Guardar estado"}</button>
      </form>}
      {["REALIZADO","PAGADO"].includes(evento.estado)&&<p className="fa-edit-notice">Las flores ya fueron utilizadas. Este evento permanece en el historial.</p>}
    </>}
  </Modal>;
}
