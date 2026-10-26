import { useEffect, useState } from "react";
import type { DesafioAuth, SesionAuth } from "../../types/auth";
import { mensajeError } from "../../services/gestionService";
import { reenviarCodigo, verificarCodigo } from "../../services/authService";

interface Props { desafio: DesafioAuth; configuracion?: boolean;
  onComplete: (sesion: SesionAuth) => void; onCancel: () => void }
export default function CodigoCorreo({ desafio, configuracion = false, onComplete, onCancel }: Props) {
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState(desafio.message);
  const [ocupado, setOcupado] = useState(false);
  const [plazos, setPlazos] = useState(() => ({
    vence: Date.now() + desafio.expiresInSeconds * 1000,
    reenvio: Date.now() + desafio.resendAfterSeconds * 1000,
  }));
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => { const timer = window.setInterval(() => setAhora(Date.now()), 1000);
    return () => window.clearInterval(timer); }, []);
  const espera = Math.max(0, Math.ceil((plazos.reenvio - ahora) / 1000));
  const restante = Math.max(0, Math.ceil((plazos.vence - ahora) / 1000));
  async function verificar(e: React.FormEvent) {
    e.preventDefault(); if (ocupado) return;
    setOcupado(true); setError("");
    try { const sesion = await verificarCodigo(desafio.challengeId, codigo, configuracion);
      setCodigo(""); onComplete(sesion);
    } catch (err) { setCodigo(""); setError(mensajeError(err)); }
    finally { setOcupado(false); }
  }
  async function reenviar() {
    if (ocupado || espera > 0) return;
    setOcupado(true); setError(""); setCodigo("");
    try { const nuevo = await reenviarCodigo(desafio.challengeId, configuracion);
      const instante = Date.now(); setAhora(instante);
      setPlazos({ vence: instante + nuevo.expiresInSeconds * 1000,
        reenvio: instante + nuevo.resendAfterSeconds * 1000 });
      setMensaje("Enviamos un nuevo código. El anterior ya no es válido.");
    } catch (err) { setError(mensajeError(err)); }
    finally { setOcupado(false); }
  }
  return <div className="fa-email-challenge fa-security-form">
    <p className="fa-auth-notice success" role="status">{mensaje}</p>
    {error && <div className="fa-auth-notice danger" role="alert">{error}</div>}
    <form onSubmit={verificar}>
      <label className="form-label" htmlFor="codigo-correo">Código de seis dígitos</label>
      <input id="codigo-correo" className="fa-code-input" type="text"
        inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6}
        value={codigo} onChange={e => setCodigo(e.target.value.replace(/[^0-9]/g, ""))}
        required disabled={ocupado} autoFocus aria-describedby="vigencia-codigo" />
      <p id="vigencia-codigo" className="fa-code-timer">{restante > 0
        ? `Vence en ${Math.floor(restante / 60)}:${String(restante % 60).padStart(2, "0")}`
        : "El código ha vencido. Solicita uno nuevo para continuar."}</p>
      <button className="fa-button fa-auth-submit" disabled={ocupado || restante === 0}>
        {ocupado ? "Procesando…" : "Verificar código"}</button>
    </form>
    <div className="fa-auth-actions"><button type="button" className="fa-button secondary" onClick={reenviar} disabled={ocupado || espera > 0}>
      {espera > 0 ? `Reenviar en ${espera} s` : "Reenviar código"}</button>
    <button type="button" className="fa-button tertiary" onClick={onCancel} disabled={ocupado}>
      {configuracion ? "Cancelar" : "Volver al inicio de sesión"}</button>
  </div></div>;
}
