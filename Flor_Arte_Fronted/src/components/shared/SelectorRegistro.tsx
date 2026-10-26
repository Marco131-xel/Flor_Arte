import {useEffect,useId,useRef,useState} from "react";
import {cargarPagina,mensajeError} from "../../services/gestionService";
import type {Modulo,Pagina,Registro} from "../../services/gestionService";

export default function SelectorRegistro({modulo,label,nombre,onSelect,rol="",estado="",disabled=false}:{modulo:Modulo;label:string;nombre:string;onSelect:(registro:Registro)=>void;rol?:string;estado?:string;disabled?:boolean}) {
  const id=useId(),contenedor=useRef<HTMLDivElement>(null);
  const [abierto,setAbierto]=useState(false),[q,setQ]=useState(""),[pagina,setPagina]=useState(0);
  const [resultado,setResultado]=useState<{clave:string;data?:Pagina;error?:string}>({clave:""});
  const clave=JSON.stringify([modulo,q,pagina,rol,estado]);
  useEffect(()=>{
    if(!abierto)return;const controller=new AbortController();
    const timer=setTimeout(()=>cargarPagina(modulo,{pagina,tamano:20,q,mes:"",estado,rol,orden:"nombre"},controller.signal).then(data=>{if(!controller.signal.aborted)setResultado({clave,data});}).catch(err=>{if(!controller.signal.aborted)setResultado({clave,error:mensajeError(err)});}),q?250:0);
    return()=>{clearTimeout(timer);controller.abort();};
  },[abierto,modulo,q,pagina,rol,estado,clave]);
  useEffect(()=>{if(!abierto)return;const fuera=(e:MouseEvent)=>{if(!contenedor.current?.contains(e.target as Node))setAbierto(false);};document.addEventListener("mousedown",fuera);return()=>document.removeEventListener("mousedown",fuera);},[abierto]);
  const data=resultado.clave===clave?resultado.data:undefined;
  return <div className="fa-field fa-record-select" ref={contenedor} onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();setAbierto(false);}}}><label htmlFor={id}>{label} <span className="cp-required">*</span></label><button id={id} type="button" className="fa-select-trigger" aria-haspopup="dialog" aria-expanded={abierto} disabled={disabled} onClick={()=>setAbierto(v=>!v)}>{nombre||`Selecciona ${label.toLowerCase()}`}<i className="bi bi-chevron-down" aria-hidden="true"/></button>
    {abierto&&<div className="fa-select-panel" role="dialog" aria-label={`Seleccionar ${label.toLowerCase()}`}><input autoFocus aria-label={`Buscar ${label.toLowerCase()}`} placeholder="Buscar por nombre…" maxLength={100} value={q} onChange={e=>{setQ(e.target.value);setPagina(0);}}/>
      <div className="fa-select-results">{resultado.clave!==clave?<p role="status">Cargando…</p>:resultado.error?<p role="alert">{resultado.error}</p>:!data?.contenido.length?<p>Sin coincidencias.</p>:data.contenido.map(item=><button key={item.id} type="button" onClick={()=>{onSelect(item);setAbierto(false);}}><strong>{item.nombre}{item.secundario?` · ${item.secundario}`:""}</strong>{item.stock!=null&&<small>{item.stock} {modulo==='arreglos'?'arreglos posibles':'unidades en stock'}</small>}</button>)}</div>
      <nav aria-label={`Páginas de ${label.toLowerCase()}`}><button type="button" aria-label={`Anterior ${label.toLowerCase()}`} disabled={!data||data.pagina===0} onClick={()=>setPagina((data?.pagina||0)-1)}>←</button><span>{data?`${data.pagina+1} / ${Math.max(1,data.totalPaginas)}`:"…"}</span><button type="button" aria-label={`Siguiente ${label.toLowerCase()}`} disabled={!data||data.pagina+1>=data.totalPaginas} onClick={()=>setPagina((data?.pagina||0)+1)}>→</button></nav>
    </div>}
  </div>;
}
