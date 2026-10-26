import { useEffect, useState } from "react";
import CodigoCorreo from "./CodigoCorreo";
import { configurar2fa, guardarSesion, obtenerConfiguracion2fa } from "../../services/authService";
import { mensajeError } from "../../services/gestionService";
import type { DesafioAuth } from "../../types/auth";
export default function SeguridadCorreo() {
  const [habilitado, setHabilitado] = useState<boolean | null>(null);
  const [contrasena, setContrasena] = useState(""); const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState(""); const [ocupado, setOcupado] = useState(false);
  const [desafio, setDesafio] = useState<DesafioAuth | null>(null);
  useEffect(() => { let activo = true; obtenerConfiguracion2fa().then(d => { if (activo) setHabilitado(d.habilitado); })
    .catch(err => { if (activo) setError(mensajeError(err)); }); return () => { activo = false; }; }, []);
  async function iniciar(e: React.FormEvent) {
    e.preventDefault(); if (ocupado || habilitado === null) return;
    setOcupado(true); setError(""); setMensaje("");
    try { setDesafio(await configurar2fa(!habilitado, contrasena)); }
    catch (err) { setError(mensajeError(err)); } finally { setContrasena(""); setOcupado(false); }
  }
  return <div className="fa-security-settings"><div className="fa-security-heading"><span className="fa-security-icon" aria-hidden="true"><i className="bi bi-shield-check"/></span><h3>Verificación en dos pasos</h3></div>
    <p>Recibe un código por correo después de verificar tu contraseña.
      {habilitado !== null && <strong className={`fa-badge ${habilitado ? "success" : "neutral"}`}> {habilitado ? "Activada." : "Desactivada."}</strong>}</p>
    {error && <div className="fa-auth-notice danger" role="alert">{error}</div>}
    {mensaje && <div className="fa-auth-notice success" role="status">{mensaje}</div>}
    {desafio ? <CodigoCorreo desafio={desafio} configuracion onCancel={() => setDesafio(null)}
      onComplete={sesion => { guardarSesion(sesion); setHabilitado(!habilitado); setDesafio(null);
        setMensaje("Configuración actualizada. Las sesiones anteriores fueron invalidadas."); }} /> :
      habilitado === null ? <p role="status">{error ? "No se pudo consultar la configuración." : "Cargando configuración…"}</p> :
      <form onSubmit={iniciar} className="fa-security-form fa-security-config">
        <div className="fa-security-password"><label htmlFor="contrasena-2fa" className="form-label">Confirma tu contraseña actual</label>
          <input id="contrasena-2fa" className="form-control" type="password" autoComplete="current-password"
            required value={contrasena} disabled={ocupado} onChange={e => setContrasena(e.target.value)} /></div>
        <button className="fa-button" disabled={ocupado}>{ocupado ? "Enviando…" : habilitado ? "Desactivar 2FA" : "Activar 2FA"}</button>
      </form>}
  </div>;
}
