import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  getTiposFlor,
  createTipoFlor,
  updateTipoFlor,
  deleteTipoFlor,
} from "../../../services/shared/flor/florService";
import type { TipoFlor as TipoFlorType, NewTipoFlor } from "../../../types/flor";

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

  // modal crear / editar (mismo formulario para ambos casos)
  const [formAbierto, setFormAbierto] = useState(false);
  const [tipoEditando, setTipoEditando] = useState<TipoFlorType | null>(null);
  const [nombreForm, setNombreForm] = useState("");
  const [descripcionForm, setDescripcionForm] = useState("");
  const [imagenUrlForm, setImagenUrlForm] = useState("");
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [guardandoForm, setGuardandoForm] = useState(false);

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

  const abrirCrear = () => {
    setTipoEditando(null);
    setNombreForm("");
    setDescripcionForm("");
    setImagenUrlForm("");
    setErrorForm(null);
    setFormAbierto(true);
  };

  const abrirEditar = (tipo: TipoFlorType) => {
    setTipoEditando(tipo);
    setNombreForm(tipo.nombre);
    setDescripcionForm(tipo.descripcion || "");
    setImagenUrlForm(tipo.imagenUrl || "");
    setErrorForm(null);
    setFormAbierto(true);
  };

  const cerrarFormulario = () => {
    if (guardandoForm) return;
    setFormAbierto(false);
  };

  const handleGuardarTipoFlor = async (e: FormEvent) => {
    e.preventDefault();
    setErrorForm(null);

    const nombreLimpio = nombreForm.trim();
    if (!nombreLimpio) {
      setErrorForm("El nombre es obligatorio.");
      return;
    }

    const datos: NewTipoFlor = {
      nombre: nombreLimpio,
      descripcion: descripcionForm.trim(),
      imagenUrl: imagenUrlForm.trim() || undefined,
    };

    try {
      setGuardandoForm(true);
      if (tipoEditando) {
        await updateTipoFlor(tipoEditando.idTipoFlor, datos);
      } else {
        await createTipoFlor(datos);
      }
      // Se vuelve a pedir la lista completa al backend en vez de confiar en
      // la forma del objeto que devuelve el endpoint de guardado, para
      // evitar romper el render si la respuesta viene incompleta.
      await cargarTiposFlor();
      setFormAbierto(false);
    } catch (err) {
      setErrorForm(
        tipoEditando
          ? "No se pudo actualizar el tipo de flor."
          : "No se pudo crear el tipo de flor."
      );
    } finally {
      setGuardandoForm(false);
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
          <button className="tipoflor-btn-primary" onClick={abrirCrear}>
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
              <div className="tipoflor-card-img-box">
                {tipo.imagenUrl ? (
                  <img
                    src={tipo.imagenUrl}
                    alt={tipo.nombre}
                    className="tipoflor-card-img"
                  />
                ) : (
                  <span className="tipoflor-card-icon">🌸</span>
                )}
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
                  onClick={() => abrirEditar(tipo)}
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

      {/* MODAL CREAR / EDITAR */}
      {formAbierto && (
        <div className="tipoflor-overlay" onClick={cerrarFormulario}>
          <div className="tipoflor-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tipoflor-modal-header">
              <h2 className="tipoflor-modal-title">
                {tipoEditando ? "Editar tipo de flor" : "Crear tipo de flor"}
              </h2>
              <button className="tipoflor-close-x" onClick={cerrarFormulario}>
                ✕
              </button>
            </div>
            <form onSubmit={handleGuardarTipoFlor}>
              <div className="tipoflor-modal-body">
                {errorForm && <div className="tipoflor-form-error">{errorForm}</div>}

                <div className="tipoflor-form-field">
                  <label className="tipoflor-form-label" htmlFor="nombreTipoFlor">
                    Nombre
                  </label>
                  <input
                    id="nombreTipoFlor"
                    type="text"
                    className="tipoflor-form-input"
                    placeholder="Ej. Tulipán"
                    value={nombreForm}
                    onChange={(e) => setNombreForm(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="tipoflor-form-field">
                  <label className="tipoflor-form-label" htmlFor="descripcionTipoFlor">
                    Descripción
                  </label>
                  <textarea
                    id="descripcionTipoFlor"
                    className="tipoflor-form-textarea"
                    placeholder="Descripción breve del tipo de flor (opcional)"
                    value={descripcionForm}
                    onChange={(e) => setDescripcionForm(e.target.value)}
                  />
                </div>

                <div className="tipoflor-form-field">
                  <label className="tipoflor-form-label" htmlFor="imagenUrlTipoFlor">
                    URL de imagen
                  </label>
                  <input
                    id="imagenUrlTipoFlor"
                    type="url"
                    className="tipoflor-form-input"
                    placeholder="https://..."
                    value={imagenUrlForm}
                    onChange={(e) => setImagenUrlForm(e.target.value)}
                  />

                  <div className="tipoflor-form-preview">
                    {imagenUrlForm.trim() ? (
                      <img
                        src={imagenUrlForm.trim()}
                        alt="Vista previa"
                        className="tipoflor-form-preview-img"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="tipoflor-card-icon">🌸</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="tipoflor-modal-footer">
                <button
                  type="button"
                  className="tipoflor-btn-secondary"
                  onClick={cerrarFormulario}
                  disabled={guardandoForm}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="tipoflor-btn-primary"
                  disabled={guardandoForm}
                >
                  {guardandoForm
                    ? "Guardando..."
                    : tipoEditando
                    ? "Guardar Cambios"
                    : "Guardar"}
                </button>
              </div>
            </form>
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