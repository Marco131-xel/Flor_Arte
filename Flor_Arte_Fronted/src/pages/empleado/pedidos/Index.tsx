import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getPedidos,
  updatePedido,
  deletePedido,
} from "../../../services/shared/pedido/pedidoService";
import type { Pedido } from "../../../types/pedido";

const ESTADOS = [
  "PENDIENTE",
  "CONFIRMADO",
  "PREPARANDO",
  "LISTO",
  "ENTREGADO",
  "CANCELADO",
];

function quetzales(valor: number) {
  return `Q${valor.toLocaleString("es-GT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function claseEstado(estado: string) {
  return `personas-badge-estado-${estado
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")}`;
}

/* ---------- Combobox de estados ---------- */
function FiltroEstado({
  valor,
  estados,
  onChange,
}: {
  valor: string;
  estados: string[];
  onChange: (estado: string) => void;
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

  const etiqueta = (estado: string) =>
    estado === "TODOS"
      ? "Todos los estados"
      : estado.charAt(0) + estado.slice(1).toLowerCase();

  const opciones = ["TODOS", ...estados];

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
        <span className="personas-select-text">{etiqueta(valor)}</span>
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
          {opciones.map((estado) => (
            <button
              key={estado}
              type="button"
              role="option"
              aria-selected={estado === valor}
              className={
                estado === valor
                  ? "personas-select-item personas-select-item-on"
                  : "personas-select-item"
              }
              onClick={() => {
                onChange(estado);
                setAbierto(false);
              }}
            >
              <span className="personas-select-item-label">
                {estado !== "TODOS" && (
                  <span
                    className={`personas-estado-dot ${claseEstado(estado)}`}
                  ></span>
                )}
                {etiqueta(estado)}
              </span>
              {estado === valor && <i className="bi bi-check-lg"></i>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function IndexPedidos() {
  const navigate = useNavigate();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("TODOS");

  const [pedidoVer, setPedidoVer] = useState<Pedido | null>(null);

  const [pedidoEstado, setPedidoEstado] = useState<Pedido | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [cambiando, setCambiando] = useState(false);
  const [errorEstado, setErrorEstado] = useState<string | null>(null);

  const [pedidoEliminar, setPedidoEliminar] = useState<Pedido | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  useEffect(() => {
    cargarPedidos();
  }, []);

  const cargarPedidos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPedidos();
      setPedidos(data);
    } catch (err) {
      console.error("Error al cargar pedidos:", err);
      setError("No se pudieron cargar los pedidos.");
    } finally {
      setLoading(false);
    }
  };

  const pedidosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return pedidos.filter((p) => {
      const coincideEstado =
        filtroEstado === "TODOS" || p.estado === filtroEstado;
      const coincideBusqueda =
        !termino || p.nombreCliente?.toLowerCase().includes(termino);
      return coincideEstado && coincideBusqueda;
    });
  }, [pedidos, busqueda, filtroEstado]);

  const totalGeneral = useMemo(
    () => pedidosFiltrados.reduce((acc, p) => acc + (p.total || 0), 0),
    [pedidosFiltrados]
  );

  const hayFiltros = busqueda.trim() !== "" || filtroEstado !== "TODOS";

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroEstado("TODOS");
  };

  /* ---------- Cambiar estado ---------- */
  const abrirEstado = (pedido: Pedido) => {
    setErrorEstado(null);
    setNuevoEstado(pedido.estado);
    setPedidoEstado(pedido);
  };

  const cerrarEstado = () => {
    if (cambiando) return;
    setPedidoEstado(null);
    setErrorEstado(null);
  };

  const confirmarEstado = async () => {
    if (!pedidoEstado) return;
    if (nuevoEstado === pedidoEstado.estado) {
      cerrarEstado();
      return;
    }

    try {
      setCambiando(true);
      setErrorEstado(null);

      await updatePedido(pedidoEstado.idPedido, {
        idCliente: pedidoEstado.idCliente,
        idEmpleado: pedidoEstado.idEmpleado ?? undefined,
        estado: nuevoEstado,
      });

      setPedidos((prev) =>
        prev.map((p) =>
          p.idPedido === pedidoEstado.idPedido
            ? { ...p, estado: nuevoEstado }
            : p
        )
      );
      setPedidoEstado(null);
    } catch (err) {
      console.error("Error al cambiar el estado:", err);
      const data = (
        err as { response?: { data?: { message?: string; error?: string } } }
      )?.response?.data;
      setErrorEstado(
        data?.message ??
          data?.error ??
          "No se pudo cambiar el estado. Inténtalo de nuevo."
      );
    } finally {
      setCambiando(false);
    }
  };

  /* ---------- Eliminar ---------- */
  const abrirEliminar = (pedido: Pedido) => {
    setErrorEliminar(null);
    setPedidoEliminar(pedido);
  };

  const cerrarEliminar = () => {
    if (eliminando) return;
    setPedidoEliminar(null);
    setErrorEliminar(null);
  };

  const confirmarEliminar = async () => {
    if (!pedidoEliminar) return;

    try {
      setEliminando(true);
      setErrorEliminar(null);

      await deletePedido(pedidoEliminar.idPedido);

      setPedidos((prev) =>
        prev.filter((p) => p.idPedido !== pedidoEliminar.idPedido)
      );
      setPedidoEliminar(null);
    } catch (err) {
      console.error("Error al eliminar el pedido:", err);
      const data = (
        err as { response?: { data?: { message?: string; error?: string } } }
      )?.response?.data;
      setErrorEliminar(
        data?.message ??
          data?.error ??
          "No se pudo eliminar el pedido. Inténtalo de nuevo."
      );
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="personas-page">
      <div className="personas-header">
        <div>
          <h1 className="personas-title">
            <i className="bi bi-bag-plus"></i> Gestión de Pedidos
          </h1>
          <p className="personas-subtitle">
            Pedidos de clientes y su estado de atención
          </p>
        </div>
        <div className="personas-header-actions">
          <button
            className="personas-btn-primary"
            onClick={() => navigate("/empleado/pedidos/create")}
          >
            <i className="bi bi-plus-lg"></i>
            <span>Nuevo Pedido</span>
          </button>
        </div>
      </div>

      <div className="personas-toolbar">
        <div className="personas-search-box">
          <i className="bi bi-search"></i>
          <input
            type="text"
            className="personas-search-input"
            placeholder="Buscar por cliente..."
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

        <div className="personas-toolbar-right">
          <FiltroEstado
            valor={filtroEstado}
            estados={ESTADOS}
            onChange={setFiltroEstado}
          />
          {hayFiltros && (
            <button
              type="button"
              className="personas-btn-link"
              onClick={limpiarFiltros}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {error && <div className="personas-error-box">{error}</div>}

      {loading ? (
        <div className="personas-state-box">Cargando pedidos...</div>
      ) : (
        <>
          <p className="personas-result-count">
            Mostrando {pedidosFiltrados.length} de {pedidos.length}{" "}
            {pedidos.length === 1 ? "pedido" : "pedidos"}
          </p>

          <div className="personas-table-card">
            <table className="personas-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Atendido por</th>
                  <th>Estado</th>
                  <th className="personas-th-total">Total</th>
                  <th className="personas-th-acciones">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="personas-empty-row">
                      No hay pedidos registrados.
                    </td>
                  </tr>
                ) : pedidosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="personas-empty-row">
                      No se encontraron pedidos con esos filtros.
                    </td>
                  </tr>
                ) : (
                  pedidosFiltrados.map((pedido) => (
                    <tr key={pedido.idPedido} className="personas-tr">
                      <td className="personas-td-muted">#{pedido.idPedido}</td>
                      <td className="personas-td-nombre">
                        {pedido.nombreCliente}
                      </td>
                      <td className="personas-td-muted">
                        {pedido.nombreEmpleado ?? "Sin asignar"}
                      </td>
                      <td>
                        <span
                          className={`personas-badge ${claseEstado(
                            pedido.estado
                          )}`}
                        >
                          {pedido.estado}
                        </span>
                      </td>
                      <td className="personas-td-total">
                        {quetzales(pedido.total)}
                      </td>
                      <td>
                        <div className="personas-acciones">
                          <button
                            className="personas-icon-btn personas-icon-btn-view"
                            title="Ver detalle"
                            onClick={() => setPedidoVer(pedido)}
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          <button
                            className="personas-icon-btn personas-icon-btn-edit"
                            title="Editar"
                            onClick={() =>
                              navigate(
                                `/empleado/pedidos/update/${pedido.idPedido}`
                              )
                            }
                          >
                            <i className="bi bi-pencil-square"></i>
                          </button>
                          <button
                            className="personas-icon-btn personas-icon-btn-estado"
                            title="Cambiar estado"
                            onClick={() => abrirEstado(pedido)}
                          >
                            <i className="bi bi-arrow-repeat"></i>
                          </button>
                          <button
                            className="personas-icon-btn personas-icon-btn-delete"
                            title="Eliminar"
                            onClick={() => abrirEliminar(pedido)}
                          >
                            <i className="bi bi-trash3"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {pedidosFiltrados.length > 0 && (
                <tfoot>
                  <tr className="personas-tr-total">
                    <td colSpan={4} className="personas-td-total-label">
                      Total {hayFiltros ? "(filtrado)" : "general"}
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
        </>
      )}

      {/* Ver detalle */}
      {pedidoVer && (
        <div className="personas-overlay" onClick={() => setPedidoVer(null)}>
          <div className="personas-modal" onClick={(e) => e.stopPropagation()}>
            <div className="personas-modal-header">
              <h2 className="personas-modal-title">
                Pedido #{pedidoVer.idPedido}
              </h2>
              <button
                className="personas-close-x"
                onClick={() => setPedidoVer(null)}
              >
                ✕
              </button>
            </div>

            <div className="personas-modal-body">
              <div className="personas-info-row">
                <span className="personas-info-label">Cliente</span>
                <span className="personas-info-value">
                  {pedidoVer.nombreCliente}
                </span>
              </div>
              <div className="personas-info-row">
                <span className="personas-info-label">Atendido por</span>
                <span className="personas-info-value">
                  {pedidoVer.nombreEmpleado ?? "Sin asignar"}
                </span>
              </div>
              <div className="personas-info-row">
                <span className="personas-info-label">Estado</span>
                <span
                  className={`personas-badge ${claseEstado(pedidoVer.estado)}`}
                >
                  {pedidoVer.estado}
                </span>
              </div>
              <div className="personas-info-row">
                <span className="personas-info-label">Total</span>
                <span className="personas-info-value entrada-info-value-total">
                  {quetzales(pedidoVer.total)}
                </span>
              </div>

              <div className="personas-detalle-section">
                <span className="personas-info-label">Flores del pedido</span>

                {!pedidoVer.detalles || pedidoVer.detalles.length === 0 ? (
                  <p className="personas-detalle-vacio">
                    Este pedido todavía no tiene flores registradas.
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
                      {pedidoVer.detalles.map((d) => (
                        <tr key={d.idDetallePedido}>
                          <td>{d.nombreFlor}</td>
                          <td>{d.cantidad}</td>
                          <td>{quetzales(d.precio)}</td>
                          <td>{quetzales(d.subtotal)}</td>
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
                onClick={() => setPedidoVer(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cambiar estado */}
      {pedidoEstado && (
        <div className="personas-overlay" onClick={cerrarEstado}>
          <div
            className="personas-modal personas-modal-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="personas-modal-header">
              <h2 className="personas-modal-title">
                Estado del pedido #{pedidoEstado.idPedido}
              </h2>
              <button
                className="personas-close-x"
                onClick={cerrarEstado}
                disabled={cambiando}
              >
                ✕
              </button>
            </div>

            <div className="personas-modal-body">
              <p className="personas-confirm-note">
                Pedido de <strong>{pedidoEstado.nombreCliente}</strong>. Elige
                el nuevo estado:
              </p>

              <div className="personas-estado-list">
                {ESTADOS.map((estado) => (
                  <button
                    key={estado}
                    type="button"
                    className={`personas-estado-option ${
                      nuevoEstado === estado
                        ? "personas-estado-option-active"
                        : ""
                    }`}
                    onClick={() => setNuevoEstado(estado)}
                    disabled={cambiando}
                  >
                    <span
                      className={`personas-badge ${claseEstado(estado)}`}
                    >
                      {estado}
                    </span>
                    {nuevoEstado === estado && (
                      <i className="bi bi-check-lg"></i>
                    )}
                  </button>
                ))}
              </div>

              {errorEstado && (
                <div className="personas-error-box">{errorEstado}</div>
              )}
            </div>

            <div className="personas-modal-footer">
              <button
                className="personas-btn-secondary"
                onClick={cerrarEstado}
                disabled={cambiando}
              >
                Cancelar
              </button>
              <button
                className="personas-btn-primary"
                onClick={confirmarEstado}
                disabled={cambiando}
              >
                {cambiando ? "Guardando..." : "Guardar estado"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Eliminar */}
      {pedidoEliminar && (
        <div className="personas-overlay" onClick={cerrarEliminar}>
          <div
            className="personas-modal personas-modal-sm"
            role="alertdialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="personas-modal-header">
              <h2 className="personas-modal-title">Eliminar pedido</h2>
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
                Se eliminará el pedido #{pedidoEliminar.idPedido} de{" "}
                <strong>{pedidoEliminar.nombreCliente}</strong> por{" "}
                <strong>{quetzales(pedidoEliminar.total)}</strong>, junto con
                sus líneas de detalle.
              </p>
              <p className="personas-confirm-note">
                Esta acción no se puede deshacer.
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

export default IndexPedidos;