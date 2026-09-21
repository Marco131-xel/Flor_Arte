import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import type { Usuario, Persona } from "../../../types/user";
import {
  getPersonas,
  getUsuarios,
  deletePersona,
  deleteUsuario,
} from "../../../services/admin/usuarioService";

const ROLES_PERSONAS = ["ADMINISTRADOR", "EMPLEADO", "CLIENTE", "PROVEEDOR"];
const ROLES_USUARIOS = ["ADMINISTRADOR", "EMPLEADO"];

function badgeClaseRol(rol: string) {
  const r = rol?.toUpperCase();
  if (r?.startsWith("ADMIN")) return "personas-badge-admin";

  switch (r) {
    case "CLIENTE":
      return "personas-badge-cliente";
    case "PROVEEDOR":
      return "personas-badge-proveedor";
    case "EMPLEADO":
      return "personas-badge-empleado";
    default:
      return "personas-badge-default";
  }
}

// minúsculas y sin tildes, para que "jose" encuentre "José"
const normalizar = (texto?: string | null) =>
  (texto ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const coincideRol = (rolReal: string | undefined, filtro: string) => {
  if (filtro === "TODOS") return true;
  const r = rolReal?.toUpperCase() ?? "";
  return filtro === "ADMINISTRADOR" ? r.startsWith("ADMIN") : r === filtro;
};

const etiquetaRol = (rol: string) =>
  rol === "TODOS"
    ? "Todos los roles"
    : rol.charAt(0) + rol.slice(1).toLowerCase();

/* ---------- Combobox de roles ---------- */
function FiltroRol({
  valor,
  roles,
  onChange,
}: {
  valor: string;
  roles: string[];
  onChange: (rol: string) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;

    const clickFuera = (e: MouseEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false);
    };
    const escape = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };

    document.addEventListener("mousedown", clickFuera);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", clickFuera);
      document.removeEventListener("keydown", escape);
    };
  }, [abierto]);

  const opciones = ["TODOS", ...roles];

  return (
    <div className="personas-select" ref={contenedor}>
      <button
        type="button"
        className={
          valor !== "TODOS"
            ? "personas-select-trigger personas-select-trigger-on"
            : "personas-select-trigger"
        }
        aria-haspopup="listbox"
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
      >
        <i className="bi bi-funnel" aria-hidden="true"></i>
        <span className="personas-select-text">{etiquetaRol(valor)}</span>
        <i
          className={
            abierto
              ? "bi bi-chevron-up personas-select-chevron"
              : "bi bi-chevron-down personas-select-chevron"
          }
          aria-hidden="true"
        ></i>
      </button>

      {abierto && (
        <div className="personas-select-panel" role="listbox">
          {opciones.map((rol) => (
            <button
              key={rol}
              type="button"
              role="option"
              aria-selected={rol === valor}
              className={
                rol === valor
                  ? "personas-select-item personas-select-item-on"
                  : "personas-select-item"
              }
              onClick={() => {
                onChange(rol);
                setAbierto(false);
              }}
            >
              <span>{etiquetaRol(rol)}</span>
              {rol === valor && <i className="bi bi-check-lg"></i>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Buscador ---------- */
function Buscador({
  valor,
  onChange,
  placeholder,
}: {
  valor: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="personas-search-box">
      <i className="bi bi-search"></i>
      <input
        type="text"
        className="personas-search-input"
        placeholder={placeholder}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
      />
      {valor && (
        <button
          type="button"
          className="personas-search-clear"
          onClick={() => onChange("")}
          title="Limpiar búsqueda"
        >
          <i className="bi bi-x-lg"></i>
        </button>
      )}
    </div>
  );
}

function IndexUser() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const usuarioActual = JSON.parse(localStorage.getItem("user") || "{}");

  // filtros
  const [busquedaPersonas, setBusquedaPersonas] = useState("");
  const [rolPersonas, setRolPersonas] = useState("TODOS");
  const [busquedaUsuarios, setBusquedaUsuarios] = useState("");
  const [rolUsuarios, setRolUsuarios] = useState("TODOS");

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

  /* ---------- Listas filtradas ---------- */
  const personasFiltradas = useMemo(() => {
    const termino = normalizar(busquedaPersonas.trim());
    return personas.filter((p) => {
      const coincideTexto =
        !termino ||
        normalizar(p.nombre).includes(termino) ||
        normalizar(p.correo).includes(termino);
      return coincideTexto && coincideRol(p.tipoRol, rolPersonas);
    });
  }, [personas, busquedaPersonas, rolPersonas]);

  const usuariosFiltrados = useMemo(() => {
    const termino = normalizar(busquedaUsuarios.trim());
    return usuarios.filter((u) => {
      const coincideTexto =
        !termino ||
        normalizar(u.nombre).includes(termino) ||
        normalizar(u.email).includes(termino) ||
        normalizar(u.name).includes(termino);
      return coincideTexto && coincideRol(u.rol, rolUsuarios);
    });
  }, [usuarios, busquedaUsuarios, rolUsuarios]);

  const personasConFiltro =
    busquedaPersonas.trim() !== "" || rolPersonas !== "TODOS";
  const usuariosConFiltro =
    busquedaUsuarios.trim() !== "" || rolUsuarios !== "TODOS";

  const limpiarFiltrosPersonas = () => {
    setBusquedaPersonas("");
    setRolPersonas("TODOS");
  };

  const limpiarFiltrosUsuarios = () => {
    setBusquedaUsuarios("");
    setRolUsuarios("TODOS");
  };

  /* ---------- Eliminar ---------- */
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

      <div className="personas-toolbar">
        <Buscador
          valor={busquedaPersonas}
          onChange={setBusquedaPersonas}
          placeholder="Buscar por nombre o correo..."
        />
        <div className="personas-toolbar-right">
          <FiltroRol
            valor={rolPersonas}
            roles={ROLES_PERSONAS}
            onChange={setRolPersonas}
          />
          {personasConFiltro && (
            <button
              type="button"
              className="personas-btn-link"
              onClick={limpiarFiltrosPersonas}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {loading && <div className="personas-state-box">Cargando personas...</div>}
      {error && <div className="personas-error-box">{error}</div>}

      {!loading && !error && (
        <>
          <p className="personas-result-count">
            Mostrando {personasFiltradas.length} de {personas.length}{" "}
            {personas.length === 1 ? "persona" : "personas"}
          </p>

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
                ) : personasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="personas-empty-row">
                      No se encontraron personas con esos filtros
                    </td>
                  </tr>
                ) : (
                  personasFiltradas.map((persona) => {
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
        </>
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

      <div className="personas-toolbar">
        <Buscador
          valor={busquedaUsuarios}
          onChange={setBusquedaUsuarios}
          placeholder="Buscar por nombre, usuario o correo..."
        />
        <div className="personas-toolbar-right">
          <FiltroRol
            valor={rolUsuarios}
            roles={ROLES_USUARIOS}
            onChange={setRolUsuarios}
          />
          {usuariosConFiltro && (
            <button
              type="button"
              className="personas-btn-link"
              onClick={limpiarFiltrosUsuarios}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {loading && <div className="personas-state-box">Cargando usuarios...</div>}
      {error && <div className="personas-error-box">{error}</div>}

      {!loading && !error && (
        <>
          <p className="personas-result-count">
            Mostrando {usuariosFiltrados.length} de {usuarios.length}{" "}
            {usuarios.length === 1 ? "usuario" : "usuarios"}
          </p>

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
                ) : usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="personas-empty-row">
                      No se encontraron usuarios con esos filtros
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map((usuario) => {
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
        </>
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