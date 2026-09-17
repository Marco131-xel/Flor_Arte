import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getColores, deleteColor } from "../../../services/shared/flor/florService";
import type { Color as ColorType } from "../../../types/flor";

function Color() {
  const navigate = useNavigate();

  const [colores, setColores] = useState<ColorType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // modal ver
  const [colorVer, setColorVer] = useState<ColorType | null>(null);

  // modal eliminar
  const [colorEliminar, setColorEliminar] = useState<ColorType | null>(null);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    cargarColores();
  }, []);

  const cargarColores = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getColores();
      setColores(data);
    } catch (err) {
      setError("No se pudieron cargar los colores.");
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async () => {
    if (!colorEliminar) return;
    try {
      setEliminando(true);
      await deleteColor(colorEliminar.idColor);
      setColores((prev) => prev.filter((c) => c.idColor !== colorEliminar.idColor));
      setColorEliminar(null);
    } catch (err) {
      setError("No se pudo eliminar el color.");
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="color-page">
      {/* HEADER */}
      <div className="color-header">
        <div>
          <button className="color-btn-back" onClick={() => navigate(-1)}>
            ← Volver a Flores
          </button>
          <h1 className="color-title">Colores</h1>
          <p className="color-subtitle">Catálogo de colores disponibles para las flores</p>
        </div>

        <div className="color-header-actions">
          <button className="color-btn-primary" onClick={() => navigate("/colores/crear")}>
            + Crear Color
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && <div className="color-error-box">{error}</div>}

      {/* CONTENIDO */}
      {loading ? (
        <div className="color-state-box">Cargando colores...</div>
      ) : colores.length === 0 ? (
        <div className="color-state-box">No hay colores registrados.</div>
      ) : (
        <div className="color-grid">
          {colores.map((color) => (
            <div key={color.idColor} className="color-card">
              <div className="color-card-top">
                <span className="color-swatch" data-nombre={color.nombre.toLowerCase()} />
                <span className="color-card-nombre">{color.nombre}</span>
              </div>
              <div className="color-card-acciones">
                <button
                  className="color-icon-btn color-icon-btn-view"
                  title="Ver"
                  onClick={() => setColorVer(color)}
                >
                  <i className="bi bi-eye"></i>
                </button>
                <button
                  className="color-icon-btn color-icon-btn-edit"
                  title="Editar"
                  onClick={() => navigate(`/colores/editar/${color.idColor}`)}
                >
                  <i className="bi bi-pencil-square"></i>
                </button>
                <button
                  className="color-icon-btn color-icon-btn-delete"
                  title="Eliminar"
                  onClick={() => setColorEliminar(color)}
                >
                  <i className="bi bi-trash3"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL VER */}
      {colorVer && (
        <div className="color-overlay" onClick={() => setColorVer(null)}>
          <div className="color-modal" onClick={(e) => e.stopPropagation()}>
            <div className="color-modal-header">
              <h2 className="color-modal-title">Detalle del color</h2>
              <button className="color-close-x" onClick={() => setColorVer(null)}>
                ✕
              </button>
            </div>
            <div className="color-modal-body">
              <div className="color-info-row">
                <span className="color-info-label">ID</span>
                <span className="color-info-value">{colorVer.idColor}</span>
              </div>
              <div className="color-info-row">
                <span className="color-info-label">Nombre</span>
                <span className="color-info-value">{colorVer.nombre}</span>
              </div>
            </div>
            <div className="color-modal-footer">
              <button className="color-btn-secondary" onClick={() => setColorVer(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {colorEliminar && (
        <div className="color-overlay" onClick={() => !eliminando && setColorEliminar(null)}>
          <div className="color-modal" onClick={(e) => e.stopPropagation()}>
            <div className="color-modal-danger">
              <div className="color-danger-icon">⚠</div>
              <h2 className="color-modal-title-centered">¿Eliminar color?</h2>
              <p className="color-modal-text">
                Esta acción eliminará el color <strong>{colorEliminar.nombre}</strong> del
                catálogo. Si hay flores que lo usan, podría afectarlas.
              </p>
              <div className="color-modal-footer-centered">
                <button
                  className="color-btn-secondary"
                  disabled={eliminando}
                  onClick={() => setColorEliminar(null)}
                >
                  Cancelar
                </button>
                <button
                  className="color-btn-danger"
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

export default Color;