import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPersonaById, updatePersona } from "../../../services/admin/usuarioService";

function UpdatePersona() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [dpi, setDpi] = useState("");
  const [correo, setCorreo] = useState("");
  const [idRol, setIdRol] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarPersona();
  }, [id]);

  const cargarPersona = async () => {
    try {
      setCargando(true);
      setError("");
      const data = await getPersonaById(Number(id));
      setNombre(data.nombre);
      setTelefono(data.telefono);
      setDpi(data.dpi);
      setCorreo(data.correo);
      setIdRol(String(data.rol.idRol));
    } catch (error) {
      console.error("Error al cargar la persona:", error);
      setError("No se pudo cargar la persona");
    } finally {
      setCargando(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!nombre) {
      setError("Se necesita el nombre al menos");
      return;
    }

    try {
      setLoading(true);

      await updatePersona(Number(id), {
        nombre,
        telefono,
        dpi,
        correo,
        idRol,
      });

      setSuccess("Persona actualizada exitosamente");
    } catch (error: any) {
      console.error("Error al actualizar persona:", error);

      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError("Ocurrió un error al actualizar la persona");
      }
    } finally {
      setLoading(false);
    }
  };

  if (cargando) {
    return (
      <div className="persona-dark-container">
        <div className="persona-dark-card">
          <p className="persona-dark-cargando">Cargando datos de la persona...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="persona-dark-container">
      <div className="persona-dark-card">
        <div className="persona-dark-header">
          <h1>Editar Persona</h1>
          <p>Actualiza los datos personales registrados</p>
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
            <label htmlFor="correo">Correo</label>
            <input
              id="correo"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="Ingrese su correo"
            />
          </div>

          <div className="persona-dark-group">
            <label htmlFor="idRol">Rol</label>
            <select
              id="idRol"
              value={idRol}
              onChange={(e) => setIdRol(e.target.value)}
            >
              <option value="">Seleccione un rol</option>
              <option value="1">Administrador</option>
              <option value="2">Empleado</option>
              <option value="3">Cliente</option>
              <option value="4">Proveedor</option>
            </select>
          </div>

          <div className="persona-dark-acciones">
            <button
              type="button"
              className="persona-dark-btn-cancelar"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancelar
            </button>

            <button type="submit" className="persona-dark-btn" disabled={loading}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UpdatePersona;