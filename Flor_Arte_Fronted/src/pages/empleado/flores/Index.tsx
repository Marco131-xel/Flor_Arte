import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFlores, getTiposFlor, deleteFlor } from "../../../services/shared/flor/florService";
import type { Flor, TipoFlor } from "../../../types/flor";

type FiltroEstado = "todas" | "disponible" | "no-disponible";

// Colores aproximados para nombres comunes en español. Flor/TipoFlor no
// guardan un código hex, así que el swatch se pinta adivinando el color
// a partir de "nombreColor"; si el nombre no está en el mapa, cae a gris.
const COLORES_APROX: Record<string, string> = {
  // Rojos y rosas
  rojo: "#c0392b",
  rosado: "#e0699a",
  rosa: "#e0699a",
  "rosa claro": "#f3c6d9",
  "rosa fucsia": "#d6336c",
  fucsia: "#d6336c",

  // Blancos y neutros claros
  blanco: "#ffffff",
  crema: "#f5e6c8",
  marfil: "#f5f0dc",

  // Amarillos y dorados
  amarillo: "#e8c220",
  "amarillo limón": "#d4de23",
  dorado: "#c9a227",

  // Naranjas
  naranja: "#e67e22",
  durazno: "#f2b280",
  melocotón: "#f4a988",
  coral: "#ff6f61",
  salmón: "#fa8072",

  // Morados y violetas
  lila: "#b399d4",
  lavanda: "#c3b1e1",
  morado: "#7e57a3",
  violeta: "#8e44ad",
  purpura: "#6c3483",
  púrpura: "#6c3483",

  // Azules
  azul: "#2f6fa8",
  "azul cielo": "#7fb8e0",
  celeste: "#7fb8e0",
  "azul marino": "#1b3a5c",
  turquesa: "#2fa8a0",

  // Verdes
  verde: "#3f8f5f",
  "verde menta": "#8fc9a6",
  "verde oliva": "#6b6e2c",
  "verde esmeralda": "#2f9e6b",

  // Cafés y tonos oscuros
  marrón: "#7a5230",
  chocolate: "#5a3a22",
  bronce: "#8c6239",
  negro: "#111827",

  // Rojos oscuros
  bordeaux: "#6e1423",
  granate: "#7a1f2b",
};

function colorAproximado(nombre: string): string {
  const clave = nombre?.trim().toLowerCase();
  return COLORES_APROX[clave] ?? "#c9c9c9";
}

function IndexFlores() {
  const navigate = useNavigate();

  const [flores, setFlores] = useState<Flor[]>([]);
  const [tiposFlor, setTiposFlor] = useState<TipoFlor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // buscador y filtro de estado
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todas");

  // modal ver
  const [florVer, setFlorVer] = useState<Flor | null>(null);

  // modal eliminar
  const [florEliminar, setFlorEliminar] = useState<Flor | null>(null);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    cargarFlores();
    cargarTiposFlor();
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

  const cargarTiposFlor = async () => {
    try {
      const data = await getTiposFlor();
      setTiposFlor(data);
    } catch (err) {
      console.error("Error al cargar tipos de flor:", err);
    }
  };

  // idTipoFlor -> imagenUrl, para mostrar la imagen del tipo de flor
  // asociado (Flor no tiene su propia imagen, la hereda de TipoFlor)
  const imagenesPorTipoFlor = useMemo(() => {
    const mapa = new Map<number, string>();
    tiposFlor.forEach((t) => {
      if (t.imagenUrl) mapa.set(t.idTipoFlor, t.imagenUrl);
    });
    return mapa;
  }, [tiposFlor]);

  const floresFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return flores.filter((flor) => {
      const coincideBusqueda =
        !termino ||
        flor.nombreTipoFlor?.toLowerCase().includes(termino) ||
        flor.nombreColor?.toLowerCase().includes(termino);

      const coincideEstado =
        filtroEstado === "todas" ||
        (filtroEstado === "disponible" && flor.estado) ||
        (filtroEstado === "no-disponible" && !flor.estado);

      return coincideBusqueda && coincideEstado;
    });
  }, [flores, busqueda, filtroEstado]);

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

      {/* BUSCADOR + FILTRO DE ESTADO */}
      <div className="flor-filtros">
        <div className="flor-search-box">
          <i className="bi bi-search"></i>
          <input
            type="text"
            className="flor-search-input"
            placeholder="Buscar por tipo de flor o color..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {busqueda && (
            <button
              type="button"
              className="flor-search-clear"
              onClick={() => setBusqueda("")}
              title="Limpiar búsqueda"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          )}
        </div>

        <div className="flor-filter-estado">
          <button
            type="button"
            className={`flor-filter-btn ${filtroEstado === "todas" ? "flor-filter-btn-activo" : ""}`}
            onClick={() => setFiltroEstado("todas")}
          >
            Todas
          </button>
          <button
            type="button"
            className={`flor-filter-btn ${filtroEstado === "disponible" ? "flor-filter-btn-activo" : ""}`}
            onClick={() => setFiltroEstado("disponible")}
          >
            Disponibles
          </button>
          <button
            type="button"
            className={`flor-filter-btn ${filtroEstado === "no-disponible" ? "flor-filter-btn-activo" : ""}`}
            onClick={() => setFiltroEstado("no-disponible")}
          >
            No disponibles
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
              ) : floresFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="flor-empty-row">
                    No se encontraron flores con esos filtros.
                  </td>
                </tr>
              ) : (
                floresFiltradas.map((flor) => (
                  <tr key={flor.idFlor} className="flor-tr">
                    <td className="flor-td-nombre">{flor.nombreTipoFlor}</td>
                    <td>
                      <div className="flor-color-cell">
                        <span
                          className="flor-color-swatch"
                          style={{ backgroundColor: colorAproximado(flor.nombreColor) }}
                        />
                        {flor.nombreColor}
                      </div>
                    </td>
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
              <div className="flor-modal-img-box">
                {imagenesPorTipoFlor.get(florVer.idTipoFlor) ? (
                  <img
                    src={imagenesPorTipoFlor.get(florVer.idTipoFlor)}
                    alt={florVer.nombreTipoFlor}
                    className="flor-modal-img"
                  />
                ) : (
                  <span className="flor-modal-img-fallback">🌸</span>
                )}
              </div>

              <div className="flor-info-row">
                <span className="flor-info-label">Tipo de flor</span>
                <span className="flor-info-value">{florVer.nombreTipoFlor}</span>
              </div>
              <div className="flor-info-row">
                <span className="flor-info-label">Color</span>
                <span className="flor-info-value flor-info-value-color">
                  <span
                    className="flor-color-swatch"
                    style={{ backgroundColor: colorAproximado(florVer.nombreColor) }}
                  />
                  {florVer.nombreColor}
                </span>
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
                <span
                  className={
                    florVer.estado
                      ? "flor-badge flor-badge-activo"
                      : "flor-badge flor-badge-inactivo"
                  }
                >
                  {florVer.estado ? "Disponible" : "No Disponible"}
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