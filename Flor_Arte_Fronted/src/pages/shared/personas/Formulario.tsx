import {useEffect,useState} from "react";
import {useNavigate,useParams} from "react-router-dom";
import {api} from "../../../services/apiService";
import {mensajeError} from "../../../services/gestionService";
import {datosPersona,validarPersona} from "../../../utils/persona";
import type {DatosPersona} from "../../../utils/persona";

const vacio:DatosPersona={nombre:"",telefono:"",dpi:"",correo:"",idRol:""};
export default function FormularioPersona({editar=false}:{editar?:boolean}) {
  const {id}=useParams();const navigate=useNavigate();
  const admin=localStorage.getItem("role")==="ADMINISTRADOR";
  const [form,setForm]=useState(vacio);const [errores,setErrores]=useState<Record<string,string>>({});
  const [error,setError]=useState("");const [cargando,setCargando]=useState(editar);const [guardando,setGuardando]=useState(false);
  useEffect(()=>{
    if(!editar)return;
    const controller=new AbortController();
    api.get(`/persona/${id}`,{signal:controller.signal}).then(({data})=>{if(!controller.signal.aborted)setForm({nombre:data.nombre||"",telefono:data.telefono||"",dpi:data.dpi||"",correo:data.correo||"",idRol:String(data.idRol)});}).catch(err=>{if(!controller.signal.aborted)setError(mensajeError(err));}).finally(()=>{if(!controller.signal.aborted)setCargando(false);});
    return()=>controller.abort();
  },[editar,id]);
  const cambiar=(campo:keyof DatosPersona,valor:string)=>{setForm(prev=>({...prev,[campo]:valor}));setErrores(prev=>({...prev,[campo]:""}));};
  return <div className="cp-page"><div className="cp-card"><header className="cp-header"><h1 className="cp-title">{editar?"Editar persona":"Crear persona"}</h1><p className="cp-subtitle">Nombre y rol son obligatorios. Los datos de contacto y DPI son opcionales.</p></header>
    {error&&<p className="cp-alert cp-alert-error" role="alert">{error}</p>}
    {cargando?<p role="status">Cargando persona…</p>:<form className="cp-form" noValidate onSubmit={async e=>{
      e.preventDefault();if(guardando)return;const errors=validarPersona(form);setErrores(errors);setError("");if(Object.keys(errors).length){setError("Revisa los campos marcados");return;}
      setGuardando(true);try{const datos=datosPersona(form);if(editar)await api.put(`/persona/update/${id}`,datos);else await api.post("/persona/create",datos);navigate("..");}catch(err){setError(mensajeError(err));const campos=(err as {response?:{data?:{errors?:Record<string,string>}}}).response?.data?.errors;if(campos)setErrores(campos);}finally{setGuardando(false);}
    }}>
      {([['nombre','Nombre',100,'text'],['telefono','Teléfono',20,'tel'],['dpi','DPI',20,'text'],['correo','Correo',150,'email']] as const).map(([campo,label,max,tipo])=><div className="cp-field" key={campo}><label htmlFor={`persona-${campo}`} className="cp-label">{label}{campo==='nombre'&&<span className="cp-required"> *</span>}</label><input id={`persona-${campo}`} type={tipo} required={campo==='nombre'} maxLength={max} value={form[campo]} disabled={guardando} aria-invalid={!!errores[campo]} aria-describedby={errores[campo]?`error-${campo}`:undefined} className={`cp-input ${errores[campo]?'cp-input-error':''}`} onChange={e=>cambiar(campo,e.target.value)}/>{errores[campo]&&<span id={`error-${campo}`} className="cp-field-error">{errores[campo]}</span>}</div>)}
      <div className="cp-field"><label htmlFor="persona-rol" className="cp-label">Rol <span className="cp-required">*</span></label><select id="persona-rol" required value={form.idRol} disabled={guardando} aria-invalid={!!errores.idRol} className="cp-select" onChange={e=>cambiar('idRol',e.target.value)}><option value="">Selecciona un rol</option>{admin&&<><option value="1">Administrador</option><option value="2">Empleado</option></>}<option value="3">Cliente</option><option value="4">Proveedor</option></select>{errores.idRol&&<span className="cp-field-error">{errores.idRol}</span>}</div>
      <div className="fa-form-actions"><button type="button" className="fa-button secondary" disabled={guardando} onClick={()=>navigate("..")}>Cancelar</button><button className="fa-button" disabled={guardando}>{guardando?'Guardando…':'Guardar'}</button></div>
    </form>}
  </div></div>;
}
