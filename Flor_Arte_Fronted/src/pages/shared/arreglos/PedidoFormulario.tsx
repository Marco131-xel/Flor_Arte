import {useEffect,useState} from "react";
import {useNavigate,useParams} from "react-router-dom";
import {api} from "../../../services/apiService";
import {dinero,mensajeError} from "../../../services/gestionService";
import type {Registro} from "../../../services/gestionService";
import type {Arreglo,PedidoArreglo,FlorArreglo} from "../../../types/arreglo";
import type {UserFull} from "../../../types/user";
import CampoNumero from "../../../components/shared/CampoNumero";
import SelectorRegistro from "../../../components/shared/SelectorRegistro";

import ImagenFlor from "../../../components/gestion/ImagenFlor";

export default function FormularioPedidoArreglo({editar=false}:{editar?:boolean}) {
  const {id}=useParams(),navigate=useNavigate();
  const [cliente,setCliente]=useState<Registro|null>(null),[arreglo,setArreglo]=useState<Registro|null>(null);
  const [cantidad,setCantidad]=useState("1"),[responsable,setResponsable]=useState<number|null>(null),[nombreResponsable,setNombreResponsable]=useState("");
  const [imagenUrl,setImagenUrl]=useState("");
  const [detalles,setDetalles]=useState<FlorArreglo[]>([]),[precio,setPrecio]=useState(0),[snapshot,setSnapshot]=useState<PedidoArreglo|null>(null);
  const [cargando,setCargando]=useState(true),[cargandoReceta,setCargandoReceta]=useState(false),[guardando,setGuardando]=useState(false),[error,setError]=useState("");
  useEffect(()=>{
    const controller=new AbortController();
    const cargar=async()=>{
      try {
        if(editar){const {data}=await api.get<PedidoArreglo>(`/pedido_arreglo/${id}`,{signal:controller.signal});if(controller.signal.aborted)return;setSnapshot(data);setImagenUrl(data.imagenUrl||"");setCliente({id:data.idCliente,nombre:data.nombreCliente});setArreglo({id:data.idArreglo,nombre:data.nombreArreglo});setCantidad(String(data.cantidad));setResponsable(data.idEmpleado);setNombreResponsable(data.nombreEmpleado||"Sin asignar");setPrecio(data.precioUnitario);setDetalles(data.detalles.map(d=>({...d,cantidad:d.cantidadPorArreglo??d.cantidad/data.cantidad})));}
        else {let sesion:{id?:number};try{sesion=JSON.parse(localStorage.getItem('user')||'{}');}catch{throw new Error('Sesión inválida');}const {data}=await api.get<UserFull>(`/user/${sesion.id}`,{signal:controller.signal});if(controller.signal.aborted)return;setResponsable(data.idPersona);setNombreResponsable(data.persona.nombre);}
      }catch(err){if(!controller.signal.aborted)setError(mensajeError(err));}finally{if(!controller.signal.aborted)setCargando(false);}
    };void cargar();return()=>controller.abort();
  },[editar,id]);
  useEffect(()=>{
    if(!arreglo)return;
    if(snapshot&&snapshot.idArreglo===arreglo.id)return;
    const controller=new AbortController();
    api.get<Arreglo>(`/arreglo/${arreglo.id}`,{signal:controller.signal}).then(({data})=>{if(!controller.signal.aborted){setDetalles(data.detalles);setPrecio(data.precio);setImagenUrl(data.imagenUrl||"");setCargandoReceta(false);}}).catch(err=>{if(!controller.signal.aborted){setError(mensajeError(err));setCargandoReceta(false);}});
    return()=>controller.abort();
  },[arreglo,snapshot]);
  const seleccionar=(registro:Registro)=>{setArreglo(registro);setError("");if(snapshot&&snapshot.idArreglo===registro.id){setPrecio(snapshot.precioUnitario);setImagenUrl(snapshot.imagenUrl||"");setDetalles(snapshot.detalles.map(d=>({...d,cantidad:d.cantidadPorArreglo??d.cantidad/snapshot.cantidad})));setCargandoReceta(false);}else{setImagenUrl("");setDetalles([]);setCargandoReceta(true);}};
  return <section className="fa-editor fa-arr-editor"><button className="fa-button tertiary" onClick={()=>navigate("..")}>← Pedidos de arreglos</button><p className="fa-eyebrow">Venta y seguimiento</p><h1>{editar?`Editar pedido de arreglo #${id}`:'Nuevo pedido de arreglo'}</h1><p>El precio y la composición quedan guardados con el pedido. El stock se ajusta según la cantidad solicitada.</p>
    {error&&<p className="fa-alert" role="alert">{error}</p>}
    {cargando?<p role="status">Cargando datos…</p>:<form onSubmit={async e=>{e.preventDefault();if(guardando||cargandoReceta)return;setError("");if(!cliente||!arreglo||!cantidad.trim()||!Number.isInteger(Number(cantidad))||Number(cantidad)<=0||!detalles.length){setError('Selecciona cliente, arreglo y una cantidad entera positiva.');return;}if(!editar&&!responsable){setError('No se pudo identificar al responsable. Revisa tu sesión.');return;}setGuardando(true);try{const datos={idCliente:cliente.id,idEmpleado:responsable,idArreglo:arreglo.id,cantidad:Number(cantidad)};if(editar)await api.put(`/pedido_arreglo/update/${id}`,datos);else await api.post('/pedido_arreglo/create',datos);navigate("..");}catch(err){setError(mensajeError(err));}finally{setGuardando(false);}}}>
      <fieldset className="fa-fieldset" disabled={guardando}><div className="fa-arr-fields"><SelectorRegistro modulo="personas" rol="CLIENTE" label="Cliente" nombre={cliente?.nombre||""} onSelect={setCliente}/><SelectorRegistro modulo="arreglos" label="Arreglo" nombre={arreglo?.nombre||""} onSelect={seleccionar}/><label className="fa-field" htmlFor="pedido-arreglo-cantidad">Cantidad de arreglos *<CampoNumero id="pedido-arreglo-cantidad" required min="1" max="2147483647" step="1" value={cantidad} onChange={e=>setCantidad(e.target.value)}/></label><div className="fa-field"><span>Responsable</span><strong>{nombreResponsable||'Sin asignar'}</strong></div></div>
      {snapshot&&<p className="fa-edit-notice">Estado actual: {snapshot.estado.toLowerCase()}. Puedes cambiarlo desde el botón Estado del listado.</p>}
      {imagenUrl&&<ImagenFlor key={imagenUrl} src={imagenUrl} nombre={arreglo?.nombre||"Arreglo"} detalle/>}<div className="fa-section-label"><h2>Flores del pedido</h2><span>{detalles.length} flores diferentes</span></div>{cargandoReceta?<p role="status">Cargando composición…</p>:<div className="ci-table-wrap"><table className="fa-table"><thead><tr><th>Flor</th><th>Por arreglo</th><th>Total de flores</th></tr></thead><tbody>{detalles.map(d=><tr key={d.idFlor}><td>{d.nombreFlor}</td><td>{d.cantidad}</td><td>{d.cantidad*(Number(cantidad)||0)}</td></tr>)}{!detalles.length&&<tr><td colSpan={3}>Selecciona un arreglo para ver su composición.</td></tr>}</tbody></table></div>}
      <dl className="fa-detail-grid"><div><dt>Precio por arreglo</dt><dd>{dinero(precio)}</dd></div><div><dt>Cantidad de arreglos</dt><dd>{cantidad||'—'}</dd></div></dl><div className="fa-detail-total"><span>Total del pedido</span><strong>{dinero(precio*(Number(cantidad)||0))}</strong></div><div className="fa-form-actions"><button type="button" className="fa-button secondary" onClick={()=>navigate("..")}>Cancelar</button><button className="fa-button" disabled={cargandoReceta}>{guardando?'Guardando…':'Guardar pedido'}</button></div></fieldset>
    </form>}
  </section>;
}
