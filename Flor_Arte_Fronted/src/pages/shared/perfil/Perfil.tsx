import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMyData } from "../../../services/userService";
import type { UserFull } from "../../../types/user";
import { mensajeError } from "../../../services/gestionService";
export default function Perfil() {
  const navigate=useNavigate();
  const [sesion]=useState(()=>{try{return JSON.parse(localStorage.getItem("user")||"{}");}catch{return {};}});
  const admin=localStorage.getItem("role")==="ADMINISTRADOR";
  const [perfil,setPerfil]=useState<UserFull|null>(null);const [error,setError]=useState("");
  useEffect(()=>{let vigente=true;getMyData(Number(sesion.id)).then(data=>{if(vigente)setPerfil(data);}).catch(err=>{if(vigente)setError(mensajeError(err));});return()=>{vigente=false;};},[sesion.id]);
  if(error)return <p className="fa-alert" role="alert">{error}</p>;
  if(!perfil)return <p className="fa-empty" role="status">Cargando tu perfil…</p>;
  const nombre=perfil.persona?.nombre||perfil.name;
  const iniciales=nombre.split(/\s+/).filter(Boolean).slice(0,2).map(n=>n[0]).join("").toUpperCase();
  return <section className="fa-profile"><header className="fa-page-heading"><div><p className="fa-eyebrow">Tu espacio personal</p><h1>Mi perfil</h1><p>Tu información y acceso a FlorArte.</p></div>{admin&&<Link className="fa-button" to="editar"><i aria-hidden="true" className="bi bi-pencil-square"/>Editar perfil</Link>}</header>
    <div className="fa-profile-grid"><aside className="fa-profile-identity"><div className="fa-profile-cover"/><div className="fa-monogram" aria-hidden="true">{iniciales}</div><h2>{nombre}</h2><p>@{perfil.name}</p><span className="fa-badge success">{admin?"Administrador":"Empleado"}</span><div className="fa-profile-status"><span className={`fa-status-dot ${perfil.estado?"":"inactive"}`}/>{perfil.estado?"Cuenta activa":"Cuenta inactiva"}</div><small>Equipo FlorArte</small></aside>
      <div className="fa-profile-details"><section><div className="fa-section-label"><h2>Información personal</h2><i aria-hidden="true" className="bi bi-person-vcard"/></div><dl className="fa-detail-grid"><div><dt>Nombre completo</dt><dd>{nombre}</dd></div><div><dt>Correo de acceso</dt><dd>{perfil.email}</dd></div><div><dt>Teléfono</dt><dd>{perfil.persona?.telefono||"No registrado"}</dd></div><div><dt>DPI</dt><dd>{perfil.persona?.dpi||"No registrado"}</dd></div><div><dt>Correo de contacto</dt><dd>{perfil.persona?.correo||"No registrado"}</dd></div><div><dt>Nombre de usuario</dt><dd>{perfil.name}</dd></div></dl></section>
      <section><div className="fa-section-label"><h2>Acceso a tu cuenta</h2><i aria-hidden="true" className="bi bi-shield-check"/></div><div className="fa-account-row"><div><strong>Contraseña</strong><p>El cambio de contraseña aún no está disponible.</p></div><button className="fa-button secondary" disabled>Cambiar contraseña</button></div><div className="fa-account-row"><div><strong>Cerrar sesión</strong><p>Finaliza tu sesión en este dispositivo.</p></div><button className="fa-button secondary" onClick={()=>{localStorage.removeItem("token");localStorage.removeItem("role");localStorage.removeItem("user");navigate("/login",{replace:true});}}><i aria-hidden="true" className="bi bi-box-arrow-right"/>Salir</button></div></section></div>
    </div>
  </section>;
}
