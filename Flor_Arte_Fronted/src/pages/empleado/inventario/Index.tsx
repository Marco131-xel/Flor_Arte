import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getEntradasInventario,
  deleteEntradaInventario,
} from "../../../services/shared/inventario/inventarioService";
import type { Entrada_Inventario } from "../../../types/inventario";

function formatFecha(fechaIso: string) {
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) return fechaIso;

  return fecha.toLocaleString("es-GT", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function quetzales(valor: number) {
  return `Q${valor.toLocaleString("es-GT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function IndexEntradaInventario() {
  const [entradas, setEntradas] = useState<Entrada_Inventario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const [busqueda, setBusqueda] = useState("");

  const [entradaVer, setEntradaVer] = useState<Entrada_Inventario | null>(null);

  const [entradaEliminar, setEntradaEliminar] =
    useState<Entrada_Inventario | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  useEffect(() => {
    cargarEntradas();
  }, []);

  const cargarEntradas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEntradasInventario();
      setEntradas(data);
    } catch (err) {
      console.error("Error al cargar entradas de inventario:", err);
      setError("No se pudieron cargar las entradas de inventario.");
    } finally {
      setLoading(false);
    }
  };

  const entradasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return entradas;
    return entradas.filter((e) =>
      e.nombrePersona?.toLowerCase().includes(termino)
    );
  }, [entradas, busqueda]);

  const totalGeneral = useMemo(
    () => entradasFiltradas.reduce((acc, e) => acc + (e.total || 0), 0),
    [entradasFiltradas]
  );

  const abrirEliminar = (entrada: Entrada_Inventario) => {
    setErrorEliminar(null);
    setEntradaEliminar(entrada);
  };

  const cerrarEliminar = () => {
    if (eliminando) return;
    setEntradaEliminar(null);
    setErrorEliminar(null);
  };

  const confirmarEliminar = async () => {
    if (!entradaEliminar) return;

    try {
      setEliminando(true);
      setErrorEliminar(null);

      await deleteEntradaInventario(entradaEliminar.idEntrada);

      setEntradas((prev) =>
        prev.filter((e) => e.idEntrada !== entradaEliminar.idEntrada)
      );
      setEntradaEliminar(null);
    } catch (err) {
      console.error("Error al eliminar la entrada:", err);

      const mensaje = (
        err as { response?: { data?: { message?: string; error?: string } } }
      )?.response?.data;

      setErrorEliminar(
        mensaje?.message ??
          mensaje?.error ??
          "No se pudo eliminar la entrada. Inténtalo de nuevo."
      );
    } finally {
      setEliminando(false);
    }
  };

  const unidadesEliminar =
    entradaEliminar?.detalles?.reduce((acc, d) => acc + (d.cantidad ?? 0), 0) ??
    0;

  return (
    <div className="personas-page">
      <div className="personas-header">
        <div>
          <h1 className="personas-title">
            <i className="bi bi-journal"></i> Gestión de Inventario
          </h1>
          <p className="personas-subtitle">
            Historial de ingresos de flores al inventario
          </p>
        </div>
        <button
          className="personas-btn-primary"
          onClick={() => navigate("/empleado/inventario/create")}
        >
          <i className="bi bi-plus-lg"></i>
          <span>Nueva Entrada</span>
        </button>
      </div>

      <div className="personas-search-box">
        <i className="bi bi-search"></i>
        <input
          type="text"
          className="personas-search-input"
          placeholder="Buscar por persona..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        {busqueda && (
          <button
            type="button"
            className="personas-search-clear"
            onClick={() => setBusqueda("")}
            title="Limpiar búsqueda"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        )}
      </div>

      {error && <div className="personas-error-box">{error}</div>}

      {loading ? (
        <div className="personas-state-box">
          Cargando entradas de inventario...
        </div>
      ) : (
        <div className="personas-table-card">
          <table className="personas-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Persona</th>
                <th>Fecha</th>
                <th className="personas-th-total">Total</th>
                <th className="personas-th-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {entradas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="personas-empty-row">
                    No hay entradas de inventario registradas.
                  </td>
                </tr>
              ) : entradasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="personas-empty-row">
                    No se encontraron entradas con "{busqueda}".
                  </td>
                </tr>
              ) : (
                entradasFiltradas.map((entrada) => (
                  <tr key={entrada.idEntrada} className="personas-tr">
                    <td className="personas-td-muted">{entrada.idEntrada}</td>
                    <td className="personas-td-nombre">
                      {entrada.nombrePersona}
                    </td>
                    <td className="personas-td-muted">
                      {formatFecha(entrada.fecha)}
                    </td>
                    <td className="personas-td-total">
                      {quetzales(entrada.total)}
                    </td>
                    <td>
                      <div className="personas-acciones">
                        <button
                          className="personas-icon-btn personas-icon-btn-view"
                          title="Ver detalle"
                          onClick={() => setEntradaVer(entrada)}
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button
                          className="personas-icon-btn personas-icon-btn-edit"
                          onClick={() =>
                            navigate(
                              `/empleado/inventario/update/${entrada.idEntrada}`
                            )
                          }
                          title="Editar"
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>
                        <button
                          className="personas-icon-btn personas-icon-btn-delete"
                          onClick={() => abrirEliminar(entrada)}
                          title="Eliminar"
                        >
                          <i className="bi bi-trash3"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {entradasFiltradas.length > 0 && (
              <tfoot>
                <tr className="personas-tr-total">
                  <td colSpan={3} className="personas-td-total-label">
                    Total {busqueda ? "(filtrado)" : "general"}
                  </td>
                  <td className="personas-td-total">
                    {quetzales(totalGeneral)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* Ver detalle */}
      {entradaVer && (
        <div className="personas-overlay" onClick={() => setEntradaVer(null)}>
          <div className="personas-modal" onClick={(e) => e.stopPropagation()}>
            <div className="personas-modal-header">
              <h2 className="personas-modal-title">Detalle de la entrada</h2>
              <button
                className="personas-close-x"
                onClick={() => setEntradaVer(null)}
              >
                ✕
              </button>
            </div>

            <div className="personas-modal-body">
              <div className="personas-info-row">
                <span className="personas-info-label">ID</span>
                <span className="personas-info-value">
                  {entradaVer.idEntrada}
                </span>
              </div>
              <div className="personas-info-row">
                <span className="personas-info-label">Persona</span>
                <span className="personas-info-value">
                  {entradaVer.nombrePersona}
                </span>
              </div>
              <div className="personas-info-row">
                <span className="personas-info-label">Fecha</span>
                <span className="personas-info-value">
                  {formatFecha(entradaVer.fecha)}
                </span>
              </div>
              <div className="personas-info-row">
                <span className="personas-info-label">Total</span>
                <span className="personas-info-value entrada-info-value-total">
                  {quetzales(entradaVer.total)}
                </span>
              </div>

              <div className="personas-detalle-section">
                <span className="personas-info-label">Flores ingresadas</span>

                {!entradaVer.detalles || entradaVer.detalles.length === 0 ? (
                  <p className="personas-detalle-vacio">
                    Esta entrada todavía no tiene el detalle de flores
                    registrado.
                  </p>
                ) : (
                  <table className="personas-detalle-table">
                    <thead>
                      <tr>
                        <th>Flor</th>
                        <th>Cantidad</th>
                        <th>Precio unit.</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entradaVer.detalles.map((d, i) => (
                        <tr key={d.idDetalleEntrada ?? i}>
                          <td>{String(d.nombreFlor ?? "-")}</td>
                          <td>{String(d.cantidad ?? "-")}</td>
                          <td>
                            {typeof d.precioCompra === "number"
                              ? quetzales(d.precioCompra)
                              : "-"}
                          </td>
                          <td>
                            {typeof d.subtotal === "number"
                              ? quetzales(d.subtotal)
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="personas-modal-footer">
              <button
                className="personas-btn-secondary"
                onClick={() => setEntradaVer(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Eliminar */}
      {entradaEliminar && (
        <div className="personas-overlay" onClick={cerrarEliminar}>
          <div
            className="personas-modal personas-modal-sm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="titulo-eliminar-entrada"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="personas-modal-header">
              <h2 className="personas-modal-title" id="titulo-eliminar-entrada">
                Eliminar entrada
              </h2>
              <button
                className="personas-close-x"
                onClick={cerrarEliminar}
                disabled={eliminando}
              >
                ✕
              </button>
            </div>

            <div className="personas-modal-body">
              <div className="personas-confirm-icon">
                <i className="bi bi-exclamation-triangle"></i>
              </div>

              <p className="personas-confirm-text">
                Se eliminará la entrada #{entradaEliminar.idEntrada} de{" "}
                <strong>{entradaEliminar.nombrePersona}</strong> por{" "}
                <strong>{quetzales(entradaEliminar.total)}</strong>, junto con
                todas sus líneas de detalle.
              </p>

              <p className="personas-confirm-note">
                {unidadesEliminar > 0
                  ? `Las ${unidadesEliminar} unidades de esta entrada se descontarán del stock. Esta acción no se puede deshacer.`
                  : "Esta acción no se puede deshacer."}
              </p>

              {errorEliminar && (
                <div className="personas-error-box">{errorEliminar}</div>
              )}
            </div>

            <div className="personas-modal-footer">
              <button
                className="personas-btn-secondary"
                onClick={cerrarEliminar}
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
        </div>
      )}
    </div>
  );
}

export default IndexEntradaInventario;