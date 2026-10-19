import { useVolverFormulario } from "../../../hooks/useVolverFormulario";
import { useEffect, useState } from "react";
import {  useParams } from "react-router-dom";
import { getUsuarioById, updateUsuario, solicitarCambioPasswordEmpleado } from "../../../services/admin/usuarioService";
import Modal from "../../../components/shared/Modal";
import {mensajeError} from "../../../services/gestionService";

function UpdateUser() {
  const { id } = useParams();
  const volver = useVolverFormulario();

  const [correoRegistrado,setCorreoRegistrado]=useState("");
  const [esEmpleado,setEsEmpleado]=useState(false);
  const [enviando,setEnviando]=useState(false);
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState(true);
  const [personaNombre, setPersonaNombre] = useState("");
  const [idPersona, setIdPersona] = useState("");

  const [estadoOriginal, setEstadoOriginal] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [idCargado,setIdCargado]=useState<string>();
  const [guardando, setGuardando] = useState(false);
  const [confirmacion,setConfirmacion]=useState(false);

  useEffect(() => {
    let vigente=true;
    getUsuarioById(Number(id)).then(usuario=>{
      if(!vigente)return;
      setError("");
      setEmail(usuario.email);
      setCorreoRegistrado(usuario.email);
      setEsEmpleado((usuario.persona?.rol?.tipo??usuario.persona?.tipoRol??usuario.rol)==="EMPLEADO");
      setEstado(usuario.estado);
      setEstadoOriginal(usuario.estado);
      setIdPersona(String(usuario.idPersona));
      setPersonaNombre(usuario.persona.nombre);
    }).catch(()=>{if(vigente)setError("No se pudo cargar la información del usuario");})
      .finally(()=>{if(vigente){setIdCargado(id);setLoading(false);}});
    return()=>{vigente=false;};
  }, [id]);

  const estadoCambiado = estado !== estadoOriginal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(guardando||enviando)return;

    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("El correo es obligatorio");
      return;
    }

    if (estadoCambiado) { setConfirmacion(true); return; }
    await guardarCambios();
  };

  const guardarCambios=async()=>{
    if(guardando||enviando)return;
    setError("");
    try {
      setGuardando(true);

      await updateUsuario(Number(id), {
        email: email.trim(),
        estado,
        idPersona,
      });

      volver();
    } catch (error: unknown) {
      setError(mensajeError(error));
    } finally {
      setGuardando(false);
    }
  };

  if (loading||idCargado!==id) {
    return (
      <div className="cp-page">
        <div className="cp-card">
          <p className="cp-cargando">Cargando usuario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cp-page">
      {confirmacion&&<Modal titulo={estado?"Activar cuenta":"Desactivar cuenta"} ocupado={guardando} cerrar={()=>setConfirmacion(false)}><section className={`fa-account-confirm ${estado?"activacion":"desactivacion"}`}><div className="fa-account-confirm-icon" aria-hidden="true"><i className={`bi bi-person-${estado?"check":"lock"}`}/></div><span className={`fa-badge ${estado?"success":"warning"}`}>{estado?"Activar acceso":"Suspender acceso"}</span><h3>¿{estado?"Activar":"Desactivar"} la cuenta de {personaNombre}?</h3><p>{estado?"El usuario podrá volver a iniciar sesión con sus credenciales y su verificación en dos pasos, si está activada.":"El usuario no podrá iniciar sesión mientras su cuenta esté inactiva. Sus sesiones anteriores también se invalidarán."}</p>{error&&<p className="fa-auth-notice danger" role="alert">{error}</p>}<div className="fa-form-actions"><button type="button" className="fa-button secondary" disabled={guardando} onClick={()=>setConfirmacion(false)}>Cancelar</button><button type="button" className={`fa-button ${estado?"":"danger"}`} disabled={guardando} onClick={()=>void guardarCambios()}>{guardando?"Guardando…":estado?"Confirmar activación":"Confirmar desactivación"}</button></div></section></Modal>}
      <div className="cp-card">
        <div className="cp-header">
          <h1 className="cp-title">Editar usuario</h1>
          <p className="cp-subtitle">Actualiza el acceso al sistema</p>
        </div>

        {error && !confirmacion && <div role="alert" className="cp-alert cp-alert-error">{error}</div>}
        {success && <div role="status" className="cp-alert cp-alert-success">{success}</div>}

        <form className="cp-form" onSubmit={handleSubmit}>
          {/* Persona asociada: solo lectura */}
          <div className="cp-field cp-field-readonly">
            <label className="cp-label">
              <i className="bi bi-person-badge-fill"></i> Persona asociada
            </label>
            <span className="cp-value-fixed">{personaNombre}</span>
          </div>

          {/* Correo */}
          <div className="cp-field">
            <label htmlFor="email" className="cp-label">
              <i className="bi bi-envelope-fill"></i> Correo electrónico
            </label>
            <input disabled={guardando||enviando}
              id="email" required maxLength={150}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ingrese el correo"
              className="cp-input"
            />
          </div>

          {/* Contraseña: ya no editable directamente */}
          <div className="cp-field cp-field-readonly">
            <label className="cp-label">
              <i className="bi bi-key-fill"></i> Contraseña
            </label>
            <div className="cp-password-row">
              <span className="cp-value-fixed">••••••••</span>
              <button type="button" className="cp-btn-inline" disabled={enviando||guardando||!esEmpleado||!estadoOriginal||estadoCambiado||email.trim()!==correoRegistrado}
                onClick={async()=>{if(enviando||guardando)return;setEnviando(true);setError("");setSuccess("");try{const respuesta=await solicitarCambioPasswordEmpleado(Number(id));setSuccess(respuesta.message);}catch(err){setError(mensajeError(err));}finally{setEnviando(false);}}}>
                <i className="bi bi-envelope" aria-hidden="true"/> {enviando?"Enviando solicitud…":"Enviar cambio de contraseña"}
              </button>
            </div>
            <span className="cp-hint">{!esEmpleado?"Esta opción está disponible para cuentas de empleados.":!estadoOriginal?"Activa y guarda la cuenta antes de solicitar la recuperación.":estadoCambiado||email.trim()!==correoRegistrado?"Guarda los cambios antes de solicitar la recuperación.":`Se enviará un enlace de 15 minutos al correo registrado: ${correoRegistrado}`}</span>
          </div>

          {/* Estado */}
          <div className="cp-field">
            <label htmlFor="estado" className="cp-label">
              <i className="bi bi-toggle2-on"></i> Estado
            </label>
            <select disabled={guardando||enviando}
              id="estado"
              value={estado ? "activo" : "inactivo"}
              onChange={(e) => setEstado(e.target.value === "activo")}
              className="cp-select"
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>

          {estadoCambiado && (
            <div className="cp-mensaje-advertencia">
              <i className="bi bi-exclamation-triangle-fill"></i> Vas a dejar a{" "}
              <strong>{personaNombre}</strong> como <strong>{estado ? "Activo" : "Inactivo"}</strong>.{" "}
              {estado
                ? "Podrá volver a iniciar sesión en el sistema."
                : "No podrá iniciar sesión mientras esté inactivo."}
            </div>
          )}

          <div className="cp-actions">
            <button
              type="button"
              onClick={() => volver()}
              disabled={guardando||enviando}
              className="cp-btn-secondary"
            >
              Cancelar
            </button>

            <button type="submit" disabled={guardando||enviando} className="cp-btn-primary">
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UpdateUser;
