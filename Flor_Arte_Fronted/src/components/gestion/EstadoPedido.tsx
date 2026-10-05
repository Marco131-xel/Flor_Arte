import {useEffect,useState} from "react";
import {api} from "../../services/apiService";
import {mensajeError} from "../../services/gestionService";
import type {Pedido} from "../../types/pedido";
import Modal from "../shared/Modal";
import {estadosPedido} from "./configuracion";

export default function EstadoPedido({id,cerrar,guardado}:{id:number;cerrar:()=>void;guardado:()=>void}) {
  const [pedido,setPedido]=useState<Pedido|null>(null);const [estado,setEstado]=useState("");
  const [error,setError]=useState("");const [ocupado,setOcupado]=useState(false);
  useEffect(()=>{const controller=new AbortController();api.get<Pedido>(`/pedido/show/${id}`,{signal:controller.signal}).then(({data})=>{if(!controller.signal.aborted){setPedido(data);setEstado(data.estado);}}).catch(err=>{if(!controller.signal.aborted)setError(mensajeError(err));});return()=>controller.abort();},[id]);
  return <Modal titulo={`Cambiar estado del pedido #${id}`} cerrar={cerrar} ocupado={ocupado}>
    {error&&<p className="fa-alert" role="alert">{error}</p>}
    {!pedido ? !error&&<p role="status">Cargando pedido…</p> : <form onSubmit={async e=>{e.preventDefault();if(ocupado||estado===pedido.estado)return;setOcupado(true);setError("");try{await api.put(`/pedido/${id}/estado`,{estado});guardado();cerrar();}catch(err){setError(mensajeError(err));}finally{setOcupado(false);}}}>
      <p>Estado actual: <strong>{pedido.estado.toLowerCase()}</strong></p>
      <label className="fa-field" htmlFor="pedido-nuevo-estado">Nuevo estado<select id="pedido-nuevo-estado" className="cp-select" required value={estado} disabled={ocupado} onChange={e=>setEstado(e.target.value)}>{estadosPedido.map(opcion=><option key={opcion} value={opcion}>{opcion.toLowerCase()}</option>)}</select></label>
      {estado==='CANCELADO'&&pedido.estado!=='CANCELADO'&&<p className="fa-alert">Al cancelar se devolverán las flores al inventario.</p>}
      <div className="fa-form-actions"><button className="fa-button" disabled={ocupado||estado===pedido.estado}>{ocupado?'Guardando…':'Guardar estado'}</button></div>
    </form>}
  </Modal>;
}
