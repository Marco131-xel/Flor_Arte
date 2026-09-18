import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import type { Usuario, Persona } from "../../../types/user";
import {
  getPersonas,
  getUsuarios,
  deletePersona,
  deleteUsuario,
} from "../../../services/admin/usuarioService";

function badgeClaseRol(rol: string) {
  switch (rol?.toUpperCase()) {
    case "CLIENTE":
      return "personas-badge-cliente";
    case "PROVEEDOR":
      return "personas-badge-proveedor";
    case "ADMIN":
      return "personas-badge-admin";
    case "EMPLEADO":
      return "personas-badge-empleado";
    default:
      return "personas-badge-default";
  }
}

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

  const [usuarioAVer, setUsuarioAVer] = useState<Usuario | null>(null);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<Usuario | null>(null);
  const [eliminandoUsuario, setEliminandoUsuario] = useState(false);

  useEffect(() => {
    cargarUsuarios();
    cargarPersonas();
  }, []);

  useEffect(() => {
    const hayModalAbierto =
      personaAVer !== null ||
      personaAEliminar !== null ||
      usuarioAVer !== null ||
      usuarioAEliminar !== null;
    document.body.style.overflow = hayModalAbierto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [personaAVer, personaAEliminar, usuarioAVer, usuarioAEliminar]);

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
      setError("No se pudieron cargar las personas");
    } finally {
      setLoading(false);
    }
  };

  const confirmarEliminar = async () => {
    if (!personaAEliminar) return;
    try {
      setEliminando(true);
      await deletePersona(personaAEliminar.idPersona);
      setPersonas((prev) => prev.filter((p) => p.idPersona !== personaAEliminar.idPersona));
      setPersonaAEliminar(null);
    } catch (error) {
      console.error("Error al eliminar persona:", error);
      setError("No se pudo eliminar la persona");
    } finally {
      setEliminando(false);
    }
  };

  const confirmarEliminarUsuario = async () => {
    if (!usuarioAEliminar) return;
    try {
      setEliminandoUsuario(true);
      await deleteUsuario(usuarioAEliminar.idUsuario);
      setUsuarios((prev) => prev.filter((u) => u.idUsuario !== usuarioAEliminar.idUsuario));
      setUsuarioAEliminar(null);
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      setError("No se pudo eliminar el usuario");
    } finally {
      setEliminandoUsuario(false);
    }
  };

  return (
    <div className="personas-page">
      {/* SECCIÓN PERSONAS */}
      <div className="personas-header">
        <div>
          <h1 className="personas-title">Personas</h1>
          <p className="personas-subtitle">Gestiona las personas registradas</p>
        </div>
        <button
          className="personas-btn-primary"
          onClick={() => navigate("/admin/usuarios/crear-Persona")}
        >
          <i className="bi bi-person-plus"></i>
          <span>Nueva persona</span>
        </button>
      </div>

      {loading && <div className="personas-state-box">Cargando personas...</div>}
      {error && <div className="personas-error-box">{error}</div>}

      {!loading && !error && (
        <div className="personas-table-card">
          <table className="personas-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th className="personas-th-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {personas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="personas-empty-row">
                    No hay personas registradas
                  </td>
                </tr>
              ) : (
                personas.map((persona) => {
                  const esPersonaActual = persona.idPersona === usuarioActual.id;
                  return (
                    <tr key={persona.idPersona} className="personas-tr">
                      <td className="personas-td-muted">{persona.idPersona}</td>
                      <td className="personas-td-nombre">{persona.nombre}</td>
                      <td className="personas-td-muted">{persona.correo}</td>
                      <td>
                        <span className={`personas-badge ${badgeClaseRol(persona.tipoRol)}`}>
                          {persona.tipoRol}
                        </span>
                      </td>
                      <td>
                        {esPersonaActual ? (
                          <span className="personas-badge personas-badge-tu">Tu registro</span>
                        ) : (
                          <div className="personas-acciones">
                            <button
                              className="personas-icon-btn personas-icon-btn-view"
                              title="Ver"
                              onClick={() => setPersonaAVer(persona)}
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            <button
                              className="personas-icon-btn personas-icon-btn-edit"
                              title="Editar"
                              onClick={() =>
                                navigate(`/admin/usuarios/editar-persona/${persona.idPersona}`)
                              }
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>
                            <button
                              className="personas-icon-btn personas-icon-btn-delete"
                              title="Eliminar"
                              onClick={() => setPersonaAEliminar(persona)}
                            >
                              <i className="bi bi-trash3"></i>
                            </button>
                          </div>
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

      {/* SECCIÓN USUARIOS */}
      <div className="personas-header personas-header-usuarios">
        <div>
          <h1 className="personas-title">Usuarios</h1>
          <p className="personas-subtitle">Gestiona los usuarios del sistema</p>
        </div>
        <button className="personas-btn-primary" onClick={() => navigate("/admin/usuarios/crear")}>
          <i className="bi bi-person-plus"></i>
          <span>Nuevo usuario</span>
        </button>
      </div>

      {loading && <div className="personas-state-box">Cargando usuarios...</div>}
      {error && <div className="personas-error-box">{error}</div>}

      {!loading && !error && (
        <div className="personas-table-card">
          <table className="personas-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th className="personas-th-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan={6} className="personas-empty-row">
                    No hay usuarios registrados
                  </td>
                </tr>
              ) : (
                usuarios.map((usuario) => {
                  const esUsuarioActual = usuario.idUsuario === usuarioActual.id;
                  return (
                    <tr key={usuario.idUsuario} className="personas-tr">
                      <td className="personas-td-muted">{usuario.idUsuario}</td>
                      <td className="personas-td-nombre">{usuario.nombre}</td>
                      <td className="personas-td-muted">{usuario.email}</td>
                      <td>
                        <span className={`personas-badge ${badgeClaseRol(usuario.rol)}`}>
                          {usuario.rol}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`personas-badge ${
                            usuario.estado ? "personas-badge-activo" : "personas-badge-inactivo"
                          }`}
                        >
                          {usuario.estado ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td>
                        {esUsuarioActual ? (
                          <span className="personas-badge personas-badge-tu">Tu usuario</span>
                        ) : (
                          <div className="personas-acciones">
                            <button
                              className="personas-icon-btn personas-icon-btn-view"
                              title="Ver"
                              onClick={() => setUsuarioAVer(usuario)}
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            <button
                              className="personas-icon-btn personas-icon-btn-edit"
                              title="Editar"
                              onClick={() => navigate(`/admin/usuarios/editar/${usuario.idUsuario}`)}
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>
                            <button
                              className="personas-icon-btn personas-icon-btn-delete"
                              title="Eliminar"
                              onClick={() => setUsuarioAEliminar(usuario)}
                            >
                              <i className="bi bi-trash3"></i>
                            </button>
                          </div>
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

      {/* MODAL "VER PERSONA" */}
      {personaAVer &&
        createPortal(
          <div className="personas-overlay" onClick={() => setPersonaAVer(null)}>
            <div className="personas-modal" onClick={(e) => e.stopPropagation()}>
              <div className="personas-modal-header">
                <div>
                  <h2 className="personas-modal-title">{personaAVer.nombre}</h2>
                  <span className={`personas-badge ${badgeClaseRol(personaAVer.tipoRol)}`}>
                    {personaAVer.tipoRol}
                  </span>
                </div>
                <button className="personas-close-x" onClick={() => setPersonaAVer(null)}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <div className="personas-modal-body">
                <div className="personas-info-row">
                  <span className="personas-info-label">ID</span>
                  <span className="personas-info-value">{personaAVer.idPersona}</span>
                </div>
                <div className="personas-info-row">
                  <span className="personas-info-label">Correo</span>
                  <span className="personas-info-value">{personaAVer.correo}</span>
                </div>
                <div className="personas-info-row">
                  <span className="personas-info-label">Teléfono</span>
                  <span className="personas-info-value">{personaAVer.telefono}</span>
                </div>
                <div className="personas-info-row">
                  <span className="personas-info-label">DPI</span>
                  <span className="personas-info-value">{personaAVer.dpi}</span>
                </div>
              </div>

              <div className="personas-modal-footer">
                <button className="personas-btn-secondary" onClick={() => setPersonaAVer(null)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL "ELIMINAR PERSONA" */}
      {personaAEliminar &&
        createPortal(
          <div
            className="personas-overlay"
            onClick={() => !eliminando && setPersonaAEliminar(null)}
          >
            <div className="personas-modal personas-modal-danger" onClick={(e) => e.stopPropagation()}>
              <div className="personas-danger-icon">
                <i className="bi bi-exclamation-triangle"></i>
              </div>
              <h2 className="personas-modal-title-centered">¿Eliminar persona?</h2>
              <p className="personas-modal-text">
                Esta acción eliminará permanentemente a <strong>{personaAEliminar.nombre}</strong>.
                No se puede deshacer.
              </p>
              <div className="personas-modal-footer-centered">
                <button
                  className="personas-btn-secondary"
                  onClick={() => setPersonaAEliminar(null)}
                  disabled={eliminando}
                >
                  Cancelar
                </button>
                <button
                  className="personas-btn-danger"
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

      {/* MODAL "VER USUARIO" */}
      {usuarioAVer &&
        createPortal(
          <div className="personas-overlay" onClick={() => setUsuarioAVer(null)}>
            <div className="personas-modal" onClick={(e) => e.stopPropagation()}>
              <div className="personas-modal-header">
                <div>
                  <h2 className="personas-modal-title">{usuarioAVer.nombre}</h2>
                  <span className={`personas-badge ${badgeClaseRol(usuarioAVer.rol)}`}>
                    {usuarioAVer.rol}
                  </span>
                </div>
                <button className="personas-close-x" onClick={() => setUsuarioAVer(null)}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <div className="personas-modal-body">
                <div className="personas-info-row">
                  <span className="personas-info-label">Usuario</span>
                  <span className="personas-info-value">{usuarioAVer.name}</span>
                </div>
                <div className="personas-info-row">
                  <span className="personas-info-label">Correo</span>
                  <span className="personas-info-value">{usuarioAVer.email}</span>
                </div>
                <div className="personas-info-row">
                  <span className="personas-info-label">Teléfono</span>
                  <span className="personas-info-value">{usuarioAVer.telefono || "No registrado"}</span>
                </div>
                <div className="personas-info-row">
                  <span className="personas-info-label">DPI</span>
                  <span className="personas-info-value">{usuarioAVer.dpi}</span>
                </div>
                <div className="personas-info-row">
                  <span className="personas-info-label">Estado</span>
                  <span
                    className={`personas-badge ${
                      usuarioAVer.estado ? "personas-badge-activo" : "personas-badge-inactivo"
                    }`}
                  >
                    {usuarioAVer.estado ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>

              <div className="personas-modal-footer">
                <button className="personas-btn-secondary" onClick={() => setUsuarioAVer(null)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL "ELIMINAR USUARIO" */}
      {usuarioAEliminar &&
        createPortal(
          <div
            className="personas-overlay"
            onClick={() => !eliminandoUsuario && setUsuarioAEliminar(null)}
          >
            <div className="personas-modal personas-modal-danger" onClick={(e) => e.stopPropagation()}>
              <div className="personas-danger-icon">
                <i className="bi bi-exclamation-triangle"></i>
              </div>
              <h2 className="personas-modal-title-centered">¿Eliminar usuario?</h2>
              <p className="personas-modal-text">
                Esta acción eliminará permanentemente el acceso de{" "}
                <strong>{usuarioAEliminar.nombre}</strong>. No se puede deshacer.
              </p>
              <div className="personas-modal-footer-centered">
                <button
                  className="personas-btn-secondary"
                  onClick={() => setUsuarioAEliminar(null)}
                  disabled={eliminandoUsuario}
                >
                  Cancelar
                </button>
                <button
                  className="personas-btn-danger"
                  onClick={confirmarEliminarUsuario}
                  disabled={eliminandoUsuario}
                >
                  {eliminandoUsuario ? "Eliminando..." : "Sí, eliminar"}
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