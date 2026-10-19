import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../../components/login/AuthLayout";
import { solicitarRecuperacion } from "../../services/authService";
import { mensajeError } from "../../services/gestionService";
export default function RecuperarContrasena() {
  const [correo, setCorreo] = useState(""); const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState(""); const [mensaje, setMensaje] = useState("");
  async function enviar(e: React.FormEvent) {
    e.preventDefault(); if (ocupado) return; setOcupado(true); setError("");
    try { setMensaje((await solicitarRecuperacion(correo)).message); setCorreo(""); }
    catch (err) { setError(mensajeError(err)); } finally { setOcupado(false); }
  }
  return <AuthLayout titulo="Recupera tu contraseña">
    <p>Solicita un enlace seguro. Tendrá una vigencia de 15 minutos.</p>
    {error && <div className="fa-auth-notice danger" role="alert">{error}</div>}
    {mensaje ? <div className="fa-auth-notice success" role="status">{mensaje}</div> :
      <form onSubmit={enviar} className="fa-security-form"><label htmlFor="correo-recuperacion" className="form-label">Correo electrónico</label>
        <input id="correo-recuperacion" type="email" className="form-control mb-3" maxLength={150}
          autoComplete="email" required value={correo} disabled={ocupado} onChange={e => setCorreo(e.target.value)} />
        <button className="fa-button fa-auth-submit" disabled={ocupado}>{ocupado ? "Enviando…" : "Enviar enlace"}</button>
      </form>}
    <Link to="/login" className="fa-auth-link">Volver al inicio de sesión</Link>
  </AuthLayout>;
}
