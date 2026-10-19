import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../../components/login/AuthLayout";
import { restablecerContrasena } from "../../services/authService";
import { mensajeError } from "../../services/gestionService";
declare global { interface Window { __florArteResetToken?: string } }
export default function RestablecerContrasena() {
  // index.html retira el fragmento antes de cargar cualquier recurso. Solo permanece en memoria.
  const [token, setToken] = useState(() => window.__florArteResetToken ?? "");
  useEffect(() => { delete window.__florArteResetToken; }, []);
  const [contrasena, setContrasena] = useState(""); const [confirmacion, setConfirmacion] = useState("");
  const [ocupado, setOcupado] = useState(false); const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  async function enviar(e: React.FormEvent) {
    e.preventDefault(); if (ocupado) return; setError("");
    if (contrasena !== confirmacion) { setError("Las contraseñas no coinciden."); return; }
    if (new TextEncoder().encode(contrasena).length > 72) { setError("La contraseña no puede superar 72 bytes."); return; }
    setOcupado(true);
    try {
      setMensaje((await restablecerContrasena(token, contrasena, confirmacion)).message);
      setToken(""); setContrasena(""); setConfirmacion("");
      ["token", "user", "role"].forEach(key => localStorage.removeItem(key));
    } catch (err) { setError(mensajeError(err)); }
    finally { setOcupado(false); }
  }
  return <AuthLayout titulo="Establece tu contraseña">
    {error && <div className="fa-auth-notice danger" role="alert">{error}</div>}
    {mensaje ? <div className="fa-auth-notice success" role="status">{mensaje}</div> : !token ?
      <div className="fa-auth-notice" role="alert">El enlace no es válido. Solicita uno nuevo.</div> :
      <form onSubmit={enviar} className="fa-security-form">
        <p>Usa al menos ocho caracteres. El enlace solo puede utilizarse una vez.</p>
        <label htmlFor="nueva-contrasena" className="form-label">Nueva contraseña</label>
        <input id="nueva-contrasena" type="password" className="form-control mb-3" minLength={8} maxLength={72}
          autoComplete="new-password" required disabled={ocupado} value={contrasena} onChange={e => setContrasena(e.target.value)} />
        <label htmlFor="confirmar-contrasena" className="form-label">Confirmar contraseña</label>
        <input id="confirmar-contrasena" type="password" className="form-control mb-3" minLength={8} maxLength={72}
          autoComplete="new-password" required disabled={ocupado} value={confirmacion} onChange={e => setConfirmacion(e.target.value)} />
        <button className="fa-button fa-auth-submit" disabled={ocupado}>{ocupado ? "Guardando…" : "Guardar contraseña"}</button>
      </form>}
    {!mensaje && <Link to="/recuperar-contrasena" className="fa-auth-link">Solicitar otro enlace</Link>}
    <Link to="/login" className="fa-auth-link">Iniciar sesión</Link>
  </AuthLayout>;
}
