import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFlores, deleteFlor } from "../../../services/shared/flor/florService";
import type { Flor } from "../../../types/flor";

function IndexFlores() {
  const navigate = useNavigate();

  const [flores, setFlores] = useState<Flor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // modal ver
  const [florVer, setFlorVer] = useState<Flor | null>(null);

  // modal eliminar
  const [florEliminar, setFlorEliminar] = useState<Flor | null>(null);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    cargarFlores();
  }, []);

  const cargarFlores = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getFlores();
      setFlores(data);
    } catch (err) {
      setError("No se pudieron cargar las flores.");
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async () => {
    if (!florEliminar) return;
    try {
      setEliminando(true);
      await deleteFlor(florEliminar.idFlor);
      setFlores((prev) => prev.filter((f) => f.idFlor !== florEliminar.idFlor));
      setFlorEliminar(null);
    } catch (err) {
      setError("No se pudo eliminar la flor.");
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="flor-page">
      {/* HEADER */}
      <div className="flor-header">
        <div>
          <h1 className="flor-title"><i className="bi bi-flower3"></i> Flores</h1>
          <p className="flor-subtitle">Gestión del catálogo de flores</p>
        </div>

        <div className="flor-header-actions">
          <button
            className="flor-btn-secondary"
            onClick={() => navigate("/empleado/flores/color")}
          >
            Ver Colores
          </button>
          <button
            className="flor-btn-secondary"
            onClick={() => navigate("/empleado/flores/tipoflor")}
          >
            Ver Tipos de Flor
          </button>
          <button
            className="flor-btn-primary"
            onClick={() => navigate("/empleado/flores/create")}
          >
            <i className="bi bi-patch-plus"></i>Crear
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && <div className="flor-error-box">{error}</div>}

      {/* CONTENIDO */}
      {loading ? (
        <div className="flor-state-box">Cargando flores...</div>
      ) : (
        <div className="flor-table-card">
          <table className="flor-table">
            <thead>
              <tr>
                <th>Tipo de Flor</th>
                <th>Color</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th className="flor-th-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {flores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="flor-empty-row">
                    No hay flores registradas.
                  </td>
                </tr>
              ) : (
                flores.map((flor) => (
                  <tr key={flor.idFlor} className="flor-tr">
                    <td className="flor-td-nombre">{flor.nombreTipoFlor}</td>
                    <td>{flor.nombreColor}</td>
                    <td>Q{flor.precio.toFixed(2)}</td>
                    <td className="flor-td-muted">{flor.stock}</td>
                    <td>
                      <span
                        className={
                          flor.estado
                            ? "flor-badge flor-badge-activo"
                            : "flor-badge flor-badge-inactivo"
                        }
                      >
                        {flor.estado ? "Disponible" : "No Disponible"}
                      </span>
                    </td>
                    <td>
                      <div className="flor-acciones">
                        <button
                          className="flor-icon-btn flor-icon-btn-view"
                          title="Ver"
                          onClick={() => setFlorVer(flor)}
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button
                          className="flor-icon-btn flor-icon-btn-edit"
                          title="Editar"
                          onClick={() => navigate(`/empleado/flores/update/${flor.idFlor}`)}
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>
                        <button
                          className="flor-icon-btn flor-icon-btn-delete"
                          title="Eliminar"
                          onClick={() => setFlorEliminar(flor)}
                        >
                          <i className="bi bi-trash3"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL VER */}
      {florVer && (
        <div className="flor-overlay" onClick={() => setFlorVer(null)}>
          <div className="flor-modal" onClick={(e) => e.stopPropagation()}>
            <div className="flor-modal-header">
              <div>
                <h2 className="flor-modal-title">Detalle de la flor</h2>
              </div>
              <button className="flor-close-x" onClick={() => setFlorVer(null)}>
                ✕
              </button>
            </div>
            <div className="flor-modal-body">
              <div className="flor-info-row">
                <span className="flor-info-label">Tipo de flor</span>
                <span className="flor-info-value">{florVer.nombreTipoFlor}</span>
              </div>
              <div className="flor-info-row">
                <span className="flor-info-label">Color</span>
                <span className="flor-info-value">{florVer.nombreColor}</span>
              </div>
              <div className="flor-info-row">
                <span className="flor-info-label">Precio</span>
                <span className="flor-info-value">Q{florVer.precio.toFixed(2)}</span>
              </div>
              <div className="flor-info-row">
                <span className="flor-info-label">Stock</span>
                <span className="flor-info-value">{florVer.stock}</span>
              </div>
              <div className="flor-info-row">
                <span className="flor-info-label">Estado</span>
                <span className="flor-info-value">
                  {florVer.estado ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
            <div className="flor-modal-footer">
              <button className="flor-btn-secondary" onClick={() => setFlorVer(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {florEliminar && (
        <div className="flor-overlay" onClick={() => !eliminando && setFlorEliminar(null)}>
          <div className="flor-modal" onClick={(e) => e.stopPropagation()}>
            <div className="flor-modal-danger">
              <div className="flor-danger-icon">⚠</div>
              <h2 className="flor-modal-title-centered">¿Eliminar flor?</h2>
              <p className="flor-modal-text">
                Esta acción eliminará <strong>{florEliminar.nombreTipoFlor}</strong>{" "}
                color <strong>{florEliminar.nombreColor}</strong> del catálogo. No se
                puede deshacer.
              </p>
              <div className="flor-modal-footer-centered">
                <button
                  className="flor-btn-secondary"
                  disabled={eliminando}
                  onClick={() => setFlorEliminar(null)}
                >
                  Cancelar
                </button>
                <button
                  className="flor-btn-danger"
                  disabled={eliminando}
                  onClick={handleEliminar}
                >
                  {eliminando ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IndexFlores;