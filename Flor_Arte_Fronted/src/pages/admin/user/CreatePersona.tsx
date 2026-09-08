import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPersona } from "../../../services/admin/usuarioService";

function CreatePersona() {
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [dpi, setDpi] = useState("");
  const [correo, setCorreo] = useState("");
  const [idRol, setIdRol] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

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

      await createPersona({
        nombre,
        telefono,
        dpi,
        correo,
        idRol,
      });

      setSuccess("Persona registrada exitosamente");

      setNombre("");
      setTelefono("");
      setDpi("");
      setCorreo("");
      setIdRol("");
    } catch (error: any) {
      console.error("Error al crear usuario: ", error);

      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError("Ocurrió un error al registrar la persona");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="persona-dark-container">
      <div className="persona-dark-card">
        <div className="persona-dark-header">
          <h1>Crear Persona</h1>
          <p>Registra los datos personales en el sistema</p>
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
              {loading ? "Registrando..." : "Crear persona"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreatePersona;