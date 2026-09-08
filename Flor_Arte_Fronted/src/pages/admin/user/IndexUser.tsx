import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import type { Usuario, Persona } from "../../../types/user";
import { getPersonas, getUsuarios, deletePersona } from "../../../services/admin/usuarioService";

function IndexUser() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const usuarioActual = JSON.parse(localStorage.getItem("user") || "{}");

  const [personaAVer, setPersonaAVer] = useState<Persona | null>(null);
  const [personaAEliminar, setPersonaAEliminar] = useState<Persona | null>(null);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    cargarUsuarios();
    cargarPersonas();
  }, []);

  // bloquea el scroll 
  useEffect(() => {
    const hayModalAbierto = personaAVer !== null || personaAEliminar !== null;
    document.body.style.overflow = hayModalAbierto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [personaAVer, personaAEliminar]);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getUsuarios();
      setUsuarios(data);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      setError("No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  const cargarPersonas = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getPersonas();
      setPersonas(data);
    } catch (error) {
      console.error("Error al cargar a personas: ", error);
      setError("No se puedieron cargar las personas");
    } finally {
      setLoading(false);
    }
  };

  const confirmarEliminar = async () => {
    if (!personaAEliminar) return;

    try {
      setEliminando(true);
      await deletePersona(personaAEliminar.idPersona);
      setPersonas((prev) =>
        prev.filter((p) => p.idPersona !== personaAEliminar.idPersona)
      );
      setPersonaAEliminar(null);
    } catch (error) {
      console.error("Error al eliminar persona:", error);
      setError("No se pudo eliminar la persona");
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="usuarios-container">

      {/* SECCIÓN PERSONAS */}
      <div className="usuarios-header">
        <div>
          <h1>Personas</h1>
          <p>Gestiona las personas registradas</p>
        </div>
        <button className="btn-nuevo" onClick={() => navigate("/admin/usuarios/crear-Persona")}>Nueva Persona</button>
      </div>

      {loading && <div className="mensaje">Cargando personas...</div>}
      {error && <div className="mensaje error">{error}</div>}

      {!loading && !error && (
        <div className="tabla-container">
          <table className="usuarios-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {personas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="sin-usuarios">
                    No hay personas registradas
                  </td>
                </tr>
              ) : (
                personas.map((persona) => {
                  const esPersonaActual = persona.idPersona === usuarioActual.id;

                  return (
                    <tr key={persona.idPersona}>
                      <td>{persona.idPersona}</td>
                      <td>{persona.nombre}</td>
                      <td>{persona.correo}</td>
                      <td><span className="rol">{persona.rol.tipo}</span></td>
                      <td className="acciones">
                        {esPersonaActual ? (
                          <>
                            <span className="tu-usuario">Tu registro</span>
                          </>
                        ):(
                          <>
                            <button className="btn-ver" onClick={() => setPersonaAVer(persona)}>
                              Ver
                            </button>
                            <button
                              className="btn-editar"
                              onClick={() => navigate(`/admin/usuarios/editar-persona/${persona.idPersona}`)}
                            >
                              Editar
                            </button>
                            <button
                              className="btn-eliminar"
                              onClick={() => setPersonaAEliminar(persona)}
                            >
                              Eliminar
                            </button>
                          </>
                        )}    
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* SECCIÓN USUARIOS */}
      <div className="usuarios-header">
        <div>
          <h1>Usuarios</h1>
          <p>Gestiona los usuarios del sistema</p>
        </div>
        <button className="btn-nuevo" onClick={() => navigate("/admin/usuarios/crear")}>Nuevo Usuario</button>
      </div>

      {loading && <div className="mensaje">Cargando usuarios...</div>}
      {error && <div className="mensaje error">{error}</div>}

      {!loading && !error && (
        <div className="tabla-container">
          <table className="usuarios-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan={7} className="sin-usuarios">
                    No hay usuarios registrados
                  </td>
                </tr>
              ) : (
                usuarios.map((usuario) => {
                  const esUsuarioActual = usuario.idUsuario === usuarioActual.id;

                  return (
                    <tr key={usuario.idUsuario}>
                      <td>{usuario.idUsuario}</td>
                      <td>{usuario.nombre}</td>
                      <td>{usuario.email}</td>
                      <td>{usuario.telefono || "No registrado"}</td>
                      <td><span className="rol">{usuario.rol}</span></td>
                      <td>
                        <span className={usuario.estado ? "estado activo" : "estado inactivo"}>
                          {usuario.estado ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="acciones">
                        {esUsuarioActual ? (
                          <span className="tu-usuario">Tu usuario</span>
                        ) : (
                          <>
                            <button className="btn-editar">Editar</button>
                            <button className="btn-eliminar">Eliminar</button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL "VER PERSONA" — montado con Portal directo en document.body */}
      {personaAVer && createPortal(
        <div className="modal-overlay" onClick={() => setPersonaAVer(null)}>
          <div className="ver-persona-caja" onClick={(e) => e.stopPropagation()}>
            <div className="ver-persona-header">
              <h2>{personaAVer.nombre}</h2>
              <span className="rol">{personaAVer.rol.tipo}</span>
            </div>

            <div className="ver-persona-campo">
              <span className="ver-persona-label">ID</span>
              <span className="ver-persona-valor">{personaAVer.idPersona}</span>
            </div>

            <div className="ver-persona-campo">
              <span className="ver-persona-label">Correo</span>
              <span className="ver-persona-valor">{personaAVer.correo}</span>
            </div>

            <div className="ver-persona-campo">
              <span className="ver-persona-label">Teléfono</span>
              <span className="ver-persona-valor">{personaAVer.telefono}</span>
            </div>

            <div className="ver-persona-campo">
              <span className="ver-persona-label">DPI</span>
              <span className="ver-persona-valor">{personaAVer.dpi}</span>
            </div>

            <button className="persona-dark-btn-cancelar" onClick={() => setPersonaAVer(null)}>
              Cerrar
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL "ELIMINAR PERSONA" — montado con Portal directo en document.body */}
      {personaAEliminar && createPortal(
        <div className="modal-overlay" onClick={() => !eliminando && setPersonaAEliminar(null)}>
          <div className="modal-caja" onClick={(e) => e.stopPropagation()}>
            <h2>¿Eliminar persona?</h2>
            <p>
              Esta acción eliminará permanentemente a{" "}
              <strong>{personaAEliminar.nombre}</strong>. No se puede deshacer.
            </p>
            <div className="modal-acciones">
              <button
                className="persona-dark-btn-cancelar"
                onClick={() => setPersonaAEliminar(null)}
                disabled={eliminando}
              >
                Cancelar
              </button>
              <button
                className="modal-btn-confirmar"
                onClick={confirmarEliminar}
                disabled={eliminando}
              >
                {eliminando ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default IndexUser;