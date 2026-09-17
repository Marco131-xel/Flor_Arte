import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTiposFlor, deleteTipoFlor } from "../../../services/shared/flor/florService";
import type { TipoFlor as TipoFlorType } from "../../../types/flor";

function TipoFlor() {
  const navigate = useNavigate();

  const [tiposFlor, setTiposFlor] = useState<TipoFlorType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // modal ver
  const [tipoFlorVer, setTipoFlorVer] = useState<TipoFlorType | null>(null);

  // modal eliminar
  const [tipoFlorEliminar, setTipoFlorEliminar] = useState<TipoFlorType | null>(null);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    cargarTiposFlor();
  }, []);

  const cargarTiposFlor = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTiposFlor();
      setTiposFlor(data);
    } catch (err) {
      setError("No se pudieron cargar los tipos de flor.");
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async () => {
    if (!tipoFlorEliminar) return;
    try {
      setEliminando(true);
      await deleteTipoFlor(tipoFlorEliminar.idTipoFlor);
      setTiposFlor((prev) =>
        prev.filter((t) => t.idTipoFlor !== tipoFlorEliminar.idTipoFlor)
      );
      setTipoFlorEliminar(null);
    } catch (err) {
      setError("No se pudo eliminar el tipo de flor.");
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="tipoflor-page">
      {/* HEADER */}
      <div className="tipoflor-header">
        <div>
          <button className="tipoflor-btn-back" onClick={() => navigate(-1)}>
            ← Volver a Flores
          </button>
          <h1 className="tipoflor-title">Tipos de Flor</h1>
          <p className="tipoflor-subtitle">Catálogo de especies y variedades</p>
        </div>

        <div className="tipoflor-header-actions">
          <button
            className="tipoflor-btn-primary"
            onClick={() => navigate("/tipoflor/crear")}
          >
            + Crear Tipo de Flor
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && <div className="tipoflor-error-box">{error}</div>}

      {/* CONTENIDO */}
      {loading ? (
        <div className="tipoflor-state-box">Cargando tipos de flor...</div>
      ) : tiposFlor.length === 0 ? (
        <div className="tipoflor-state-box">No hay tipos de flor registrados.</div>
      ) : (
        <div className="tipoflor-grid">
          {tiposFlor.map((tipo) => (
            <div key={tipo.idTipoFlor} className="tipoflor-card">
              {/* Placeholder de imagen: cuando el backend tenga campo de
                  imagen (ej. tipo.imagenUrl), reemplazar el ícono por
                  <img src={tipo.imagenUrl} className="tipoflor-card-img" /> */}
              <div className="tipoflor-card-img-box">
                <span className="tipoflor-card-icon">🌸</span>
              </div>

              <div className="tipoflor-card-body">
                <span className="tipoflor-card-nombre">{tipo.nombre}</span>
                <p className="tipoflor-card-descripcion">
                  {tipo.descripcion || "Sin descripción"}
                </p>
              </div>

              <div className="tipoflor-card-acciones">
                <button
                  className="tipoflor-icon-btn tipoflor-icon-btn-view"
                  title="Ver"
                  onClick={() => setTipoFlorVer(tipo)}
                >
                  <i className="bi bi-eye"></i>
                </button>
                <button
                  className="tipoflor-icon-btn tipoflor-icon-btn-edit"
                  title="Editar"
                  onClick={() => navigate(`/tipoflor/editar/${tipo.idTipoFlor}`)}
                >
                  <i className="bi bi-pencil-square"></i>
                </button>
                <button
                  className="tipoflor-icon-btn tipoflor-icon-btn-delete"
                  title="Eliminar"
                  onClick={() => setTipoFlorEliminar(tipo)}
                >
                  <i className="bi bi-trash3"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL VER */}
      {tipoFlorVer && (
        <div className="tipoflor-overlay" onClick={() => setTipoFlorVer(null)}>
          <div className="tipoflor-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tipoflor-modal-header">
              <h2 className="tipoflor-modal-title">Detalle del tipo de flor</h2>
              <button className="tipoflor-close-x" onClick={() => setTipoFlorVer(null)}>
                ✕
              </button>
            </div>
            <div className="tipoflor-modal-body">
              <div className="tipoflor-info-row">
                <span className="tipoflor-info-label">ID</span>
                <span className="tipoflor-info-value">{tipoFlorVer.idTipoFlor}</span>
              </div>
              <div className="tipoflor-info-row">
                <span className="tipoflor-info-label">Nombre</span>
                <span className="tipoflor-info-value">{tipoFlorVer.nombre}</span>
              </div>
              <div className="tipoflor-info-row tipoflor-info-row-block">
                <span className="tipoflor-info-label">Descripción</span>
                <span className="tipoflor-info-value tipoflor-info-value-block">
                  {tipoFlorVer.descripcion || "Sin descripción"}
                </span>
              </div>
            </div>
            <div className="tipoflor-modal-footer">
              <button className="tipoflor-btn-secondary" onClick={() => setTipoFlorVer(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {tipoFlorEliminar && (
        <div
          className="tipoflor-overlay"
          onClick={() => !eliminando && setTipoFlorEliminar(null)}
        >
          <div className="tipoflor-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tipoflor-modal-danger">
              <div className="tipoflor-danger-icon">⚠</div>
              <h2 className="tipoflor-modal-title-centered">¿Eliminar tipo de flor?</h2>
              <p className="tipoflor-modal-text">
                Esta acción eliminará <strong>{tipoFlorEliminar.nombre}</strong> del
                catálogo. Si hay flores que lo usan, podría afectarlas.
              </p>
              <div className="tipoflor-modal-footer-centered">
                <button
                  className="tipoflor-btn-secondary"
                  disabled={eliminando}
                  onClick={() => setTipoFlorEliminar(null)}
                >
                  Cancelar
                </button>
                <button
                  className="tipoflor-btn-danger"
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

export default TipoFlor;