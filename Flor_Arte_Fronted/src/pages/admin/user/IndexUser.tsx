import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Usuario, Persona } from "../../../types/user";
import { getPersonas, getUsuarios } from "../../../services/admin/usuarioService";

function IndexUser() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  // usuario logueado actualmente
  const usuarioActual = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    cargarUsuarios();
    cargarPersonas();
  }, []);

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
  }

  return (
    <div className="usuarios-container">

      {/* SECCIÓN PERSONAS */}
      <div className="usuarios-header">
        <div>
          <h1>Personas</h1>
          <p>Gestiona las personas registradas</p>
        </div>
        <button className="btn-nuevo" onClick={() => navigate("/admin/personas/crear")}>Nueva Persona</button>
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
                <th>Teléfono</th>
                <th>DPI</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {personas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="sin-usuarios">
                    No hay personas registradas
                  </td>
                </tr>
              ) : (
                personas.map((persona) => (
                  <tr key={persona.idPersona}>
                    <td>{persona.idPersona}</td>
                    <td>{persona.nombre}</td>
                    <td>{persona.telefono}</td>
                    <td>{persona.dpi}</td>
                    <td>{persona.correo}</td>
                    <td><span className="rol">{persona.rol.tipo}</span></td>
                    <td className="acciones">
                      <button className="btn-editar">Editar</button>
                      <button className="btn-eliminar">Eliminar</button>
                    </td>
                  </tr>
                ))
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
    </div>
  );
}

export default IndexUser;