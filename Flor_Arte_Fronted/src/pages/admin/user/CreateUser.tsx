import { useEffect, useMemo, useState } from "react";
import { createUser } from "../../../services/userService";
import type { Persona } from "../../../types/user";
import { getPersonas } from "../../../services/admin/usuarioService";
import { useNavigate } from "react-router-dom";

function CreateUser() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [idPersona, setIdPersona] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [personas, setPersonas] = useState<Persona[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    cargarPersonas();
  }, []);

  const cargarPersonas = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getPersonas();
      setPersonas(data);
    } catch (error) {
      console.error("Error al cargar a personas: ", error);
      setError("No se pudieron cargar las personas");
    } finally {
      setLoading(false);
    }
  };

  const empleados = useMemo(
    () => personas.filter((p) => p.rol?.tipo === "EMPLEADO"),
    [personas]
  );

  // cuando cambia la persona seleccionada, precargar su correo (si tiene)
  const handlePersonaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoIdPersona = e.target.value;
    setIdPersona(nuevoIdPersona);

    const personaSeleccionada = empleados.find(
      (p) => String(p.idPersona) === nuevoIdPersona
    );

    // si la persona tiene correo registrado, lo sugerimos en el campo email
    // si no tiene, dejamos el campo vacío para que lo escriban
    setEmail(personaSeleccionada?.correo ?? "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!name || !email || !password || !idPersona) {
      setError("Todos los campos son obligatorios");
      return;
    }

    try {
      setLoading(true);

      await createUser({
        name,
        email,
        password,
        idPersona,
      });

      setSuccess("Usuario registrado exitosamente");

      setName("");
      setEmail("");
      setPassword("");
      setIdPersona("");
    } catch (error: any) {
      console.error("Error al crear usuario:", error);

      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError("Ocurrió un error al registrar el usuario");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="persona-dark-container">
      <div className="persona-dark-card">
        <div className="persona-dark-header">
          <h1>Crear usuario</h1>
          <p>Registra el acceso al sistema para un empleado</p>
        </div>

        {error && <div className="persona-dark-mensaje error">{error}</div>}
        {success && <div className="persona-dark-mensaje exito">{success}</div>}

        <form className="persona-dark-form" onSubmit={handleSubmit}>
          {/* Persona (rol EMPLEADO) */}
          <div className="persona-dark-group">
            <label htmlFor="idPersona">Empleado</label>

            <select
              id="idPersona"
              value={idPersona}
              onChange={handlePersonaChange}
              disabled={loading || empleados.length === 0}
            >
              <option value="">
                {loading ? "Cargando empleados..." : "Seleccione un empleado"}
              </option>

              {empleados.map((persona) => (
                <option key={persona.idPersona} value={persona.idPersona}>
                  {persona.nombre} — {persona.dpi}
                </option>
              ))}
            </select>

            {!loading && empleados.length === 0 && (
              <p>No hay personas con rol EMPLEADO disponibles</p>
            )}
          </div>

          {/* Nombre */}
          <div className="persona-dark-group">
            <label htmlFor="name">Nombre de usuario</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ingrese el nombre"
            />
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
            {email && (
              <small className="consejo">
                Puedes usar el correo sugerido de la persona o escribir uno distinto
              </small>
            )}
          </div>

          {/* Contraseña */}
          <div className="persona-dark-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingrese la contraseña"
            />
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
              {loading ? "Registrando..." : "Crear usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateUser;