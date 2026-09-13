import { useEffect, useMemo, useState } from "react";
import { createUser, getPersonas, getUsuarios } from "../../../services/admin/usuarioService";
import type { Persona } from "../../../types/user";
import { useNavigate } from "react-router-dom";

function CreateUser() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [idPersona, setIdPersona] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);

  const [personas, setPersonas] = useState<Persona[]>([]);
  const [idsConUsuario, setIdsConUsuario] = useState<Set<number>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargandoDatos(true);
      setError("");

      const [personasData, usuariosData] = await Promise.all([
        getPersonas(),
        getUsuarios(),
      ]);

      setPersonas(personasData);
      setIdsConUsuario(new Set(usuariosData.map((u) => u.idPersona)));
    } catch (error) {
      console.error("Error al cargar datos: ", error);
      setError("No se pudieron cargar las personas");
    } finally {
      setCargandoDatos(false);
    }
  };

  // Empleados que AÚN NO tienen un usuario en el sistema
  const empleadosDisponibles = useMemo(
    () =>
      personas.filter(
        (p) => p.tipoRol === "EMPLEADO" && !idsConUsuario.has(p.idPersona)
      ),
    [personas, idsConUsuario]
  );

  const handlePersonaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoIdPersona = e.target.value;
    setIdPersona(nuevoIdPersona);

    const personaSeleccionada = empleadosDisponibles.find(
      (p) => String(p.idPersona) === nuevoIdPersona
    );

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

      // la persona recién usada ya no debe volver a aparecer en el combo
      setIdsConUsuario((prev) => new Set(prev).add(Number(idPersona)));
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
          {/* Persona (rol EMPLEADO, sin usuario todavía) */}
          <div className="persona-dark-group">
            <label htmlFor="idPersona">Empleado</label>

            <select
              id="idPersona"
              value={idPersona}
              onChange={handlePersonaChange}
              disabled={loading || cargandoDatos || empleadosDisponibles.length === 0}
            >
              <option value="">
                {cargandoDatos ? "Cargando empleados..." : "Seleccione un empleado"}
              </option>

              {empleadosDisponibles.map((persona) => (
                <option key={persona.idPersona} value={persona.idPersona}>
                  {persona.nombre} — {persona.dpi}
                </option>
              ))}
            </select>

            {!cargandoDatos && empleadosDisponibles.length === 0 && (
              <p className="zero-empleados">
                No hay empleados disponibles
              </p>
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

            <button type="submit" className="persona-dark-btn" disabled={loading || cargandoDatos}>
              {loading ? "Registrando..." : "Crear usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateUser;