import CampoNumero from "../../../components/shared/CampoNumero";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../../services/apiService";
import { mensajeError, fechaTexto, dinero } from "../../../services/gestionService";
import type { Movimiento_Inventario } from "../../../types/inventario";
export default function EditarMerma() {
  const {id} = useParams(); const navigate=useNavigate();
  const [merma,setMerma]=useState<Movimiento_Inventario|null>(null);
  const [costo,setCosto]=useState("");
  const [cantidad,setCantidad]=useState(""); const [error,setError]=useState(""); const [guardando,setGuardando]=useState(false);
  useEffect(() => {
    const controller=new AbortController();
    api.get<Movimiento_Inventario>(`/movimiento_inventario/show/${id}`,{signal:controller.signal}).then(({data})=>{
      if (!controller.signal.aborted) { if (data.motivo!=="MERMA" || data.tipoMovimiento!=="SALIDA") {setError("Este movimiento no es una merma.");return;} setMerma(data);setCantidad(String(data.cantidad));setCosto(data.costoUnitario==null?"":String(data.costoUnitario)); }
    }).catch(err=>{if(!controller.signal.aborted)setError(mensajeError(err));});
    return ()=>controller.abort();
  },[id]);
  return <section className="fa-editor"><button className="fa-button tertiary" onClick={()=>navigate("..")}>← Inventario</button><p className="fa-eyebrow">Control de pérdidas</p><h1>Editar merma #{id}</h1><p>Ajusta la cantidad registrada. El inventario se actualizará con la diferencia.</p>
    {error && <p role="alert" className="fa-alert">{error}</p>}
    {!merma ? !error && <p role="status">Cargando merma…</p> : <form onSubmit={async e=>{e.preventDefault();if(guardando)return;const valor=Number(cantidad);if(!Number.isInteger(valor)||valor<=0){setError("Ingresa una cantidad entera mayor que cero.");return;}if(costo.trim()===""||!Number.isFinite(Number(costo))||Number(costo)<0){setError("Ingresa un costo unitario válido.");return;}setGuardando(true);setError("");try {await api.put(`/movimiento_inventario/update/${id}`,{idFlor:merma.idFlor,tipoMovimiento:"SALIDA",motivo:"MERMA",cantidad:valor,costoUnitario:Number(costo)});navigate("..");}catch(err){setError(mensajeError(err));}finally{setGuardando(false);}}}>
      <dl className="fa-detail-grid"><div><dt>Flor</dt><dd>{merma.nombreFlor}</dd></div><div><dt>Fecha original</dt><dd>{fechaTexto(merma.fecha)}</dd></div></dl>
      <label className="fa-field" htmlFor="merma-cantidad">Unidades dadas de baja<CampoNumero id="merma-cantidad"  min="1" step="1" required value={cantidad} disabled={guardando} onChange={e=>setCantidad(e.target.value)} /></label>
      <label className="fa-field" htmlFor="merma-costo">Costo unitario de compra (Q) *<CampoNumero id="merma-costo" required min="0" max="9999999999.999999" step="0.000001" value={costo} disabled={guardando} onChange={e=>setCosto(e.target.value)} /></label>
      {merma.costoUnitario==null&&<p className="fa-edit-notice">Este registro antiguo no guarda un costo. Ingresa el costo de compra correspondiente a la merma.</p>}
      {costo!==""&&<p>Pérdida: <strong>{dinero(Number(cantidad)*Number(costo))}</strong></p>}
      <div className="fa-form-actions"><button type="button" className="fa-button secondary" disabled={guardando} onClick={()=>navigate("..")}>Cancelar</button><button className="fa-button" disabled={guardando}>{guardando?"Guardando…":"Guardar cambios"}</button></div>
    </form>}
  </section>;
}
