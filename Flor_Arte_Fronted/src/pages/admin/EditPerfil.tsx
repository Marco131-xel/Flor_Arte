import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyData, updatePersona } from "../../services/userService";
import type { UserFull } from "../../types/user";

function EditPerfil() {
  const navigate = useNavigate();
  const usuarioActual = JSON.parse(localStorage.getItem("user") || "{}");

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [dpi, setDpi] = useState("");
  const [correo, setCorreo] = useState("");
  const [idRol, setIdRol] = useState("");
  const [idPersona, setIdPersona] = useState<number | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!usuarioActual.id) {
      setError("No se pudo identificar al usuario");
      setCargando(false);
      return;
    }

    getMyData(usuarioActual.id)
      .then((data: UserFull) => {
        setNombre(data.persona.nombre);
        setTelefono(data.persona.telefono);
        setDpi(data.persona.dpi);
        setCorreo(data.persona.correo);
        setIdRol(String(data.persona.rol.idRol));
        setIdPersona(data.persona.idPersona);
      })
      .catch(() => setError("No se pudo cargar tu información"))
      .finally(() => setCargando(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!nombre || !idPersona) {
      setError("El nombre es obligatorio");
      return;
    }

    try {
      setGuardando(true);
      await updatePersona(idPersona, { nombre, telefono, dpi, correo, idRol });
      setSuccess("Perfil actualizado exitosamente");
      setFieldErrors({});
    } catch (error: any) {
      console.error("Error al actualizar perfil:", error);

      const mensaje = (error.response?.data?.message ?? error.response?.data?.error) as
        | string
        | undefined;

      if (mensaje?.toLowerCase().includes("dpi")) {
        setFieldErrors((prev) => ({ ...prev, dpi: mensaje }));
        setError("Revisa los campos marcados");
      } else if (mensaje) {
        setError(mensaje);
      } else {
        setError("Ocurrió un error al actualizar tu perfil");
      }
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="cp-page">
        <div className="cp-card">
          <p className="cp-cargando">Cargando tu información...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cp-page">
      <div className="cp-card">
        <div className="cp-header">
          <h1 className="cp-title">Editar mi perfil</h1>
          <p className="cp-subtitle">Actualiza tus datos personales</p>
        </div>

        {error && <div className="cp-alert cp-alert-error">{error}</div>}
        {success && <div className="cp-alert cp-alert-success">{success}</div>}

        <form className="cp-form" onSubmit={handleSubmit} noValidate>
          {/* NOMBRE */}
          <div className="cp-field">
            <label htmlFor="nombre" className="cp-label">
              <i className="bi bi-person-fill"></i> Nombre
            </label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ingrese el nombre"
              className="cp-input"
            />
          </div>

          {/* TELEFONO */}
          <div className="cp-field">
            <label htmlFor="telefono" className="cp-label">
              <i className="bi bi-telephone-fill"></i> Teléfono
            </label>
            <input
              id="telefono"
              type="text"
              inputMode="numeric"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ""))}
              placeholder="Ingrese el número de teléfono"
              maxLength={8}
              className="cp-input"
            />
          </div>

          {/* DPI */}
          <div className="cp-field">
            <label htmlFor="dpi" className="cp-label">
              <i className="bi bi-card-text"></i> DPI
            </label>
            <input
              id="dpi"
              type="text"
              inputMode="numeric"
              value={dpi}
              onChange={(e) => {
                setDpi(e.target.value.replace(/\D/g, ""));
                if (fieldErrors.dpi) {
                  setFieldErrors((prev) => {
                    const { dpi: _dpi, ...rest } = prev;
                    return rest;
                  });
                }
              }}
              placeholder="Ingrese el DPI"
              maxLength={13}
              className={`cp-input ${fieldErrors.dpi ? "cp-input-error" : ""}`}
            />
            {fieldErrors.dpi && <span className="cp-field-error">{fieldErrors.dpi}</span>}
          </div>

          {/* CORREO */}
          <div className="cp-field">
            <label htmlFor="correo" className="cp-label">
              <i className="bi bi-envelope-fill"></i> Correo de contacto
            </label>
            <input
              id="correo"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="Ingrese su correo"
              className="cp-input"
            />
          </div>

          {/* BOTONES DE ACCIONES */}
          <div className="cp-actions">
            <button
              type="button"
              onClick={() => navigate("/admin/perfil")}
              disabled={guardando}
              className="cp-btn-secondary"
            >
              Cancelar
            </button>

            <button type="submit" disabled={guardando} className="cp-btn-primary">
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditPerfil;