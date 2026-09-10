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
    } catch (error: any) {
      console.error("Error al actualizar perfil:", error);
      setError(error.response?.data?.error || "Ocurrió un error al actualizar tu perfil");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="persona-dark-container">
        <div className="persona-dark-card">
          <p className="persona-dark-cargando">Cargando tu información...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="persona-dark-container">
      <div className="persona-dark-card">
        <div className="persona-dark-header">
          <h1>Editar mi perfil</h1>
          <p>Actualiza tus datos personales</p>
        </div>

        {error && <div className="persona-dark-mensaje error">{error}</div>}
        {success && <div className="persona-dark-mensaje exito">{success}</div>}

        <form className="persona-dark-form" onSubmit={handleSubmit}>
          <div className="persona-dark-group">
            <label htmlFor="nombre">Nombre</label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ingrese el nombre"
            />
          </div>

          <div className="persona-dark-group">
            <label htmlFor="telefono">Teléfono</label>
            <input
              id="telefono"
              type="text"
              inputMode="numeric"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ""))}
              placeholder="Ingrese el número de teléfono"
              maxLength={8}
            />
          </div>

          <div className="persona-dark-group">
            <label htmlFor="dpi">DPI</label>
            <input
              id="dpi"
              type="text"
              inputMode="numeric"
              value={dpi}
              onChange={(e) => setDpi(e.target.value.replace(/\D/g, ""))}
              placeholder="Ingrese el DPI"
              maxLength={13}
            />
          </div>

          <div className="persona-dark-group">
            <label htmlFor="correo">Correo de contacto</label>
            <input
              id="correo"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="Ingrese su correo"
            />
          </div>

          <div className="persona-dark-acciones">
            <button
              type="button"
              className="persona-dark-btn-cancelar"
              onClick={() => navigate("/admin/perfil")}
              disabled={guardando}
            >
              Cancelar
            </button>

            <button type="submit" className="persona-dark-btn" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditPerfil;