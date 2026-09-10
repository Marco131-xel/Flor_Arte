import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getUsuarioById,
  updateUsuario,
  getPersonas,
} from "../../../services/admin/usuarioService";
import type { Persona } from "../../../types/user";

function UpdateUser() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // vacío = no cambiar
  const [estado, setEstado] = useState(true);
  const [idPersona, setIdPersona] = useState("");

  const [personas, setPersonas] = useState<Persona[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError("");

      const [usuario, personasData] = await Promise.all([
        getUsuarioById(Number(id)),
        getPersonas(),
      ]);

      setEmail(usuario.email);
      setEstado(usuario.estado);
      setIdPersona(String(usuario.idPersona));
      setPersonas(personasData);
    } catch (error) {
      console.error("Error al cargar el usuario:", error);
      setError("No se pudo cargar la información del usuario");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!email || !idPersona) {
      setError("El correo y la persona asociada son obligatorios");
      return;
    }

    try {
      setGuardando(true);

      await updateUsuario(Number(id), {
        email,
        password: password || undefined, // solo se manda si el admin escribió una nueva
        estado,
        idPersona,
      });

      setSuccess("Usuario actualizado exitosamente");
      setPassword("");
    } catch (error: any) {
      console.error("Error al actualizar usuario:", error);

      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError("Ocurrió un error al actualizar el usuario");
      }
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <div className="persona-dark-container">
        <div className="persona-dark-card">
          <p>Cargando usuario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="persona-dark-container">
      <div className="persona-dark-card">
        <div className="persona-dark-header">
          <h1>Editar usuario</h1>
          <p>Actualiza el acceso al sistema</p>
        </div>

        {error && <div className="persona-dark-mensaje error">{error}</div>}
        {success && <div className="persona-dark-mensaje exito">{success}</div>}

        <form className="persona-dark-form" onSubmit={handleSubmit}>
          {/* Persona asociada */}
          <div className="persona-dark-group">
            <label htmlFor="idPersona">Persona asociada</label>
            <select
              id="idPersona"
              value={idPersona}
              onChange={(e) => setIdPersona(e.target.value)}
            >
              <option value="">Seleccione una persona</option>
              {personas.map((persona) => (
                <option key={persona.idPersona} value={persona.idPersona}>
                  {persona.nombre} — {persona.dpi}
                </option>
              ))}
            </select>
          </div>

          {/* Correo */}
          <div className="persona-dark-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ingrese el correo"
            />
          </div>

          {/* Contraseña */}
          <div className="persona-dark-group">
            <label htmlFor="password">Nueva contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Dejar en blanco para no cambiarla"
            />
            <small>Solo se actualiza si escribes una contraseña nueva</small>
          </div>

          {/* Estado */}
          <div className="persona-dark-group">
            <label htmlFor="estado">Estado</label>
            <select
              id="estado"
              value={estado ? "activo" : "inactivo"}
              onChange={(e) => setEstado(e.target.value === "activo")}
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>

          <div className="persona-dark-acciones">
            <button
              type="button"
              className="persona-dark-btn-cancelar"
              onClick={() => navigate(-1)}
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

export default UpdateUser;