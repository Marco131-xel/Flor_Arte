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

      const [personasData, usuariosData] = await Promise.all([getPersonas(), getUsuarios()]);

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
    () => personas.filter((p) => p.tipoRol === "EMPLEADO" && !idsConUsuario.has(p.idPersona)),
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
    <div className="cp-page">
      <div className="cp-card">
        <div className="cp-header">
          <h1 className="cp-title">Crear usuario</h1>
          <p className="cp-subtitle">Registra el acceso al sistema para un empleado</p>
        </div>

        {error && <div className="cp-alert cp-alert-error">{error}</div>}
        {success && <div className="cp-alert cp-alert-success">{success}</div>}

        <form className="cp-form" onSubmit={handleSubmit} noValidate>
          {/* Persona (rol EMPLEADO, sin usuario todavía) */}
          <div className="cp-field">
            <label htmlFor="idPersona" className="cp-label">
              <i className="bi bi-person-badge-fill"></i> Empleado
            </label>

            <select
              id="idPersona"
              value={idPersona}
              onChange={handlePersonaChange}
              disabled={loading || cargandoDatos || empleadosDisponibles.length === 0}
              className="cp-select"
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
              <span className="cp-hint cp-hint-warning">
                <i className="bi bi-exclamation-circle-fill"></i> No hay empleados disponibles
              </span>
            )}
          </div>

          {/* Nombre */}
          <div className="cp-field">
            <label htmlFor="name" className="cp-label">
              <i className="bi bi-person-fill"></i> Nombre de usuario
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ingrese el nombre"
              className="cp-input"
            />
          </div>

          {/* Correo */}
          <div className="cp-field">
            <label htmlFor="email" className="cp-label">
              <i className="bi bi-envelope-fill"></i> Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ingrese el correo"
              className="cp-input"
            />
            {email && (
              <span className="cp-hint">
                Puedes usar el correo sugerido de la persona o escribir uno distinto
              </span>
            )}
          </div>

          {/* Contraseña */}
          <div className="cp-field">
            <label htmlFor="password" className="cp-label">
              <i className="bi bi-key-fill"></i> Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingrese la contraseña"
              className="cp-input"
            />
          </div>

          <div className="cp-actions">
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={loading}
              className="cp-btn-secondary"
            >
              Cancelar
            </button>

            <button type="submit" disabled={loading || cargandoDatos} className="cp-btn-primary">
              {loading ? "Registrando..." : "Crear usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateUser;