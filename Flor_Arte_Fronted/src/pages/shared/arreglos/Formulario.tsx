import {useEffect,useState} from "react";
import {useNavigate,useParams} from "react-router-dom";
import {api} from "../../../services/apiService";
import {dinero,mensajeError} from "../../../services/gestionService";
import type {Registro} from "../../../services/gestionService";
import type {Arreglo} from "../../../types/arreglo";
import CampoNumero from "../../../components/shared/CampoNumero";
import SelectorRegistro from "../../../components/shared/SelectorRegistro";

import ImagenFlor from "../../../components/gestion/ImagenFlor";

interface Linea {idFlor:number;nombreFlor:string;cantidad:string}
export default function FormularioArreglo({editar=false}:{editar?:boolean}) {
  const {id}=useParams(),navigate=useNavigate();
  const [nombre,setNombre]=useState(""),[descripcion,setDescripcion]=useState(""),[precio,setPrecio]=useState("");
  const [imagenUrl,setImagenUrl]=useState("");
  const [detalles,setDetalles]=useState<Linea[]>([]),[flor,setFlor]=useState<Registro|null>(null),[cantidad,setCantidad]=useState("");
  const [cargando,setCargando]=useState(editar),[guardando,setGuardando]=useState(false),[error,setError]=useState("");
  useEffect(()=>{
    if(!editar)return;const controller=new AbortController();
    api.get<Arreglo>(`/arreglo/${id}`,{signal:controller.signal}).then(({data})=>{if(controller.signal.aborted)return;setNombre(data.nombre);setImagenUrl(data.imagenUrl||"");setDescripcion(data.descripcion||"");setPrecio(String(data.precio));setDetalles(data.detalles.map(d=>({...d,cantidad:String(d.cantidad)})));}).catch(err=>{if(!controller.signal.aborted)setError(mensajeError(err));}).finally(()=>{if(!controller.signal.aborted)setCargando(false);});
    return()=>controller.abort();
  },[editar,id]);
  const agregar=()=>{
    if(!flor||!Number.isInteger(Number(cantidad))||Number(cantidad)<=0){setError("Selecciona una flor y una cantidad entera mayor que cero.");return;}
    if(detalles.some(d=>d.idFlor===flor.id)){setError("Esta flor ya está en la composición. Ajusta su cantidad en la tabla.");return;}
    if(detalles.length>=200){setError("La composición permite hasta 200 flores diferentes.");return;}
    setDetalles(prev=>[...prev,{idFlor:flor.id,nombreFlor:`${flor.nombre}${flor.secundario?` · ${flor.secundario}`:""}`,cantidad}]);setFlor(null);setCantidad("");setError("");
  };
  return <section className="fa-editor fa-arr-editor"><button className="fa-button tertiary" onClick={()=>navigate("..")}>← Catálogo de arreglos</button><p className="fa-eyebrow">Productos FlorArte</p><h1>{editar?"Editar arreglo":"Crear arreglo"}</h1><p>Define las flores por unidad y su precio de venta. El inventario se descuenta al registrar un pedido.</p>
    {error&&<p className="fa-alert" role="alert">{error}</p>}
    {cargando?<p role="status">Cargando arreglo…</p>:<form onSubmit={async e=>{e.preventDefault();if(guardando)return;setError("");if(!nombre.trim()||!precio.trim()||!detalles.length){setError("Completa nombre, precio y al menos una flor de la composición.");return;}if(detalles.some(d=>!d.cantidad.trim()||!Number.isInteger(Number(d.cantidad))||Number(d.cantidad)<=0)){setError("Todas las cantidades deben ser enteros mayores que cero.");return;}setGuardando(true);try{const datos={nombre:nombre.trim(),descripcion:descripcion.trim()||null,imagenUrl:imagenUrl.trim()||null,precio:Number(precio),detalles:detalles.map(d=>({idFlor:d.idFlor,cantidad:Number(d.cantidad)}))};if(editar)await api.put(`/arreglo/update/${id}`,datos);else await api.post('/arreglo/create',datos);navigate("..");}catch(err){setError(mensajeError(err));}finally{setGuardando(false);}}}>
      <fieldset disabled={guardando} className="fa-fieldset"><div className="fa-arr-fields"><label className="fa-field" htmlFor="arreglo-nombre">Nombre *<input id="arreglo-nombre" required maxLength={100} value={nombre} onChange={e=>setNombre(e.target.value)}/></label><label className="fa-field" htmlFor="arreglo-precio">Precio de venta (Q) *<CampoNumero id="arreglo-precio" required min="0" max="99999999.99" step="0.01" value={precio} onChange={e=>setPrecio(e.target.value)}/></label><label className="fa-field fa-full" htmlFor="arreglo-descripcion">Descripción (opcional)<textarea id="arreglo-descripcion" className="cp-input" maxLength={5000} rows={3} value={descripcion} onChange={e=>setDescripcion(e.target.value)}/></label><label className="fa-field fa-full" htmlFor="arreglo-imagen">URL de imagen (opcional)<input id="arreglo-imagen" type="url" pattern="https?://.+" maxLength={2048} placeholder="https://ejemplo.com/arreglo.jpg" value={imagenUrl} onChange={e=>setImagenUrl(e.target.value)}/><small>Enlace HTTP o HTTPS a la imagen del arreglo.</small></label></div>{imagenUrl.trim()&&<ImagenFlor key={imagenUrl.trim()} src={imagenUrl.trim()} nombre={nombre||"Arreglo"} detalle/>}
      <div className="fa-section-label"><h2>Composición por arreglo</h2><span>{detalles.length} flores diferentes</span></div><div className="fa-arr-add"><SelectorRegistro modulo="flores" estado="activa" label="Flor" nombre={flor?`${flor.nombre} · ${flor.secundario||""}`:""} onSelect={setFlor}/><label className="fa-field" htmlFor="arreglo-cantidad">Cantidad por arreglo<CampoNumero id="arreglo-cantidad" min="1" max="2147483647" step="1" value={cantidad} onChange={e=>setCantidad(e.target.value)}/></label><button type="button" className="fa-button secondary" onClick={agregar}>Agregar flor</button></div>
      <div className="ci-table-wrap"><table className="fa-table"><thead><tr><th>Flor</th><th>Cantidad por arreglo</th><th>Acciones</th></tr></thead><tbody>{detalles.map(d=><tr key={d.idFlor}><td>{d.nombreFlor}</td><td><CampoNumero className="cp-input fa-quantity" required aria-label={`Cantidad de ${d.nombreFlor}`} min="1" max="2147483647" step="1" value={d.cantidad} onChange={e=>setDetalles(prev=>prev.map(linea=>linea.idFlor===d.idFlor?{...linea,cantidad:e.target.value}:linea))}/></td><td><button type="button" className="fa-icon-button danger" aria-label={`Quitar ${d.nombreFlor}`} onClick={()=>setDetalles(prev=>prev.filter(linea=>linea.idFlor!==d.idFlor))}><i className="bi bi-trash3" aria-hidden="true"/></button></td></tr>)}{!detalles.length&&<tr><td colSpan={3}>Agrega las flores que forman este arreglo.</td></tr>}</tbody></table></div>
      <div className="fa-detail-total"><span>Precio por arreglo</span><strong>{dinero(Number(precio)||0)}</strong></div><div className="fa-form-actions"><button type="button" className="fa-button secondary" onClick={()=>navigate("..")}>Cancelar</button><button className="fa-button">{guardando?'Guardando…':'Guardar arreglo'}</button></div></fieldset>
    </form>}
  </section>;
}
