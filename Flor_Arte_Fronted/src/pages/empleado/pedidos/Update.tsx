import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent, ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getPedidoById,
  updatePedido,
  createDetallePedido,
  updateDetallePedido,
  deleteDetallePedido,
} from "../../../services/shared/pedido/pedidoService";
import { getPersonas } from "../../../services/admin/usuarioService";
import { getFlores } from "../../../services/shared/flor/florService";

import type { Persona } from "../../../types/user";
import type { Flor } from "../../../types/flor";
import type { Pedido } from "../../../types/pedido";

const ESTADOS = [
  "PENDIENTE",
  "CONFIRMADO",
  "PREPARANDO",
  "LISTO",
  "ENTREGADO",
  "CANCELADO",
];

interface DetalleFormulario {
  idDetallePedido?: number; // si existe, la línea ya está guardada en el backend
  idFlor: number;
  nombreFlor: string;
  cantidad: number;
  precio: number;
  stock: number; // máximo que se puede pedir de esta flor
}

interface Opcion {
  id: number;
  etiqueta: string;
}

const quetzales = (valor: number) =>
  `Q${valor.toLocaleString("es-GT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const mensajeDeError = (err: unknown, respaldo: string) => {
  const detalle = (err as { response?: { data?: { message?: string } } })
    ?.response?.data?.message;

  return detalle || respaldo;
};

function Combo({
  id,
  etiqueta,
  icono,
  opciones,
  valor,
  onSelect,
  placeholder,
  textoBusqueda,
  textoVacio,
  cargando,
}: {
  id: string;
  etiqueta: string;
  icono: ReactNode;
  opciones: Opcion[];
  valor: number | null;
  onSelect: (id: number) => void;
  placeholder: string;
  textoBusqueda: string;
  textoVacio: string;
  cargando: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;

    const clickFuera = (e: MouseEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false);
    };

    document.addEventListener("mousedown", clickFuera);
    return () => document.removeEventListener("mousedown", clickFuera);
  }, [abierto]);

  const seleccionada = opciones.find((o) => o.id === valor);

  const filtradas = opciones.filter((o) =>
    o.etiqueta.toLowerCase().includes(busqueda.trim().toLowerCase())
  );

  const cerrar = () => {
    setAbierto(false);
    setBusqueda("");
  };

  return (
    <div className="ci-field" ref={contenedor}>
      <label className="ci-label" htmlFor={id}>
        {icono} {etiqueta}
      </label>

      <div className="ci-combo">
        <button
          id={id}
          type="button"
          className="ci-combo-trigger"
          aria-haspopup="listbox"
          aria-expanded={abierto}
          disabled={cargando}
          onClick={() => setAbierto((v) => !v)}
          onKeyDown={(e) => e.key === "Escape" && cerrar()}
        >
          <span
            className={
              seleccionada ? "ci-combo-text" : "ci-combo-text ci-combo-empty-text"
            }
          >
            {cargando ? "Cargando…" : seleccionada?.etiqueta || placeholder}
          </span>
          <span className="ci-combo-chevron" aria-hidden="true">
            ▾
          </span>
        </button>

        {abierto && (
          <div className="ci-combo-panel">
            <div className="ci-combo-search">
              <i className="bi bi-search" aria-hidden="true"></i>
              <input
                type="text"
                autoFocus
                placeholder={textoBusqueda}
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") cerrar();
                  if (e.key === "Enter" && filtradas.length === 1) {
                    e.preventDefault();
                    onSelect(filtradas[0].id);
                    cerrar();
                  }
                }}
              />
            </div>

            <div className="ci-combo-list" role="listbox">
              {filtradas.length === 0 ? (
                <p className="ci-combo-none">{textoVacio}</p>
              ) : (
                filtradas.map((opcion) => (
                  <button
                    key={opcion.id}
                    type="button"
                    role="option"
                    aria-selected={opcion.id === valor}
                    className={
                      opcion.id === valor
                        ? "ci-combo-item ci-combo-item-on"
                        : "ci-combo-item"
                    }
                    onClick={() => {
                      onSelect(opcion.id);
                      cerrar();
                    }}
                  >
                    <span className="ci-combo-icon">{icono}</span>
                    {opcion.etiqueta}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function UpdatePedidos() {
  const navigate = useNavigate();
  const { id } = useParams(); // la ruta debe ser .../update/:id
  const idPedido = Number(id);

  const usuarioActual = JSON.parse(localStorage.getItem("user") || "{}");

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [flores, setFlores] = useState<Flor[]>([]);
  const [cargando, setCargando] = useState(true);

  const [idCliente, setIdCliente] = useState<number | null>(null);
  const [estado, setEstado] = useState("");

  const [idFlor, setIdFlor] = useState<number | null>(null);
  const [cantidad, setCantidad] = useState("");
  const [precio, setPrecio] = useState("");

  const [detalles, setDetalles] = useState<DetalleFormulario[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError(null);

      const [pedidoData, personasData, floresData] = await Promise.all([
        getPedidoById(idPedido),
        getPersonas(),
        getFlores(),
      ]);

      setPedido(pedidoData);
      setPersonas(personasData);
      setFlores(floresData);
      setIdCliente(pedidoData.idCliente);
      setEstado(pedidoData.estado);

      // El stock de una línea ya guardada ya fue descontado del inventario,
      // así que lo que se puede pedir es: stock actual + lo que ya tiene el pedido.
      setDetalles(
        (pedidoData.detalles ?? []).map((d) => {
          const flor = floresData.find((f) => f.idFlor === d.idFlor);
          return {
            idDetallePedido: d.idDetallePedido,
            idFlor: d.idFlor,
            nombreFlor: d.nombreFlor,
            cantidad: d.cantidad,
            precio: d.precio,
            stock: (flor?.stock ?? 0) + d.cantidad,
          };
        })
      );
    } catch (err) {
      console.error(err);
      setError(
        mensajeDeError(err, "No se pudo cargar el pedido. Recarga la página.")
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (!idPedido) {
      setError("Pedido no válido.");
      setCargando(false);
      return;
    }
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idPedido]);

  const nombreFlor = (flor: Flor) =>
    `${flor.nombreTipoFlor} ${flor.nombreColor}`.trim();

  const opcionesCliente: Opcion[] = useMemo(
    () =>
      personas
        .filter((p) => p.tipoRol?.toLowerCase() === "cliente")
        .map((p) => ({ id: p.idPersona, etiqueta: p.nombre })),
    [personas]
  );

  const opcionesFlor: Opcion[] = useMemo(
    () =>
      flores
        .filter((f) => f.estado && f.stock > 0)
        .map((f) => ({
          id: f.idFlor,
          etiqueta: `${nombreFlor(f)} — ${f.stock} u.`,
        })),
    [flores]
  );

  const totalPedido = detalles.reduce(
    (suma, d) => suma + d.cantidad * d.precio,
    0
  );
  const unidades = detalles.reduce((suma, d) => suma + d.cantidad, 0);

  const florSeleccionada = flores.find((f) => f.idFlor === idFlor);
  const subtotalPrevio = Number(cantidad || 0) * Number(precio || 0);

  const cantidadNum = Number(cantidad);
  const excedeStockPrevio =
    florSeleccionada != null &&
    Number.isInteger(cantidadNum) &&
    cantidadNum > florSeleccionada.stock;

  const puedeAgregar =
    idFlor !== null &&
    Number.isInteger(cantidadNum) &&
    cantidadNum > 0 &&
    precio !== "" &&
    !excedeStockPrevio;

  const soloPositivo = (valor: string) => valor.replace(/-/g, "");

  const bloquearNegativo = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "-" || e.key === "e") e.preventDefault();
  };

  const elegirFlor = (idSel: number) => {
    setIdFlor(idSel);
    const flor = flores.find((f) => f.idFlor === idSel);
    setPrecio(flor ? String(flor.precio) : "");
  };

  const agregarDetalle = () => {
    setError(null);

    const flor = flores.find((f) => f.idFlor === idFlor);
    if (!flor) return setError("Selecciona una flor.");

    const cant = Number(cantidad);
    const prec = Number(precio);

    if (!Number.isInteger(cant) || cant <= 0)
      return setError("La cantidad debe ser un número entero mayor que 0.");

    if (Number.isNaN(prec) || prec < 0)
      return setError("El precio no puede ser negativo.");

    if (cant > flor.stock)
      return setError(
        `Solo hay ${flor.stock} unidades de ${nombreFlor(flor)} en stock.`
      );

    if (detalles.some((d) => d.idFlor === flor.idFlor))
      return setError(
        `${nombreFlor(flor)} ya está en el pedido. Edita la cantidad en la tabla.`
      );

    setDetalles((prev) => [
      ...prev,
      {
        idFlor: flor.idFlor,
        nombreFlor: nombreFlor(flor),
        cantidad: cant,
        precio: prec,
        stock: flor.stock,
      },
    ]);

    setIdFlor(null);
    setCantidad("");
    setPrecio("");
  };

  const editarDetalle = (
    idFlorEditado: number,
    campo: "cantidad" | "precio",
    valor: string
  ) => {
    setDetalles((prev) =>
      prev.map((d) =>
        d.idFlor === idFlorEditado ? { ...d, [campo]: Number(valor) || 0 } : d
      )
    );
  };

  const eliminarDetalle = (idFlorEliminado: number) => {
    setDetalles((prev) => prev.filter((d) => d.idFlor !== idFlorEliminado));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!pedido) return;
    if (!idCliente) return setError("Selecciona un cliente.");
    if (detalles.length === 0)
      return setError("El pedido debe tener al menos una flor.");
    if (detalles.some((d) => d.cantidad <= 0))
      return setError("Todas las cantidades deben ser mayores que 0.");
    if (detalles.some((d) => d.cantidad > d.stock))
      return setError(
        "Alguna flor supera el stock disponible. Ajusta la cantidad."
      );

    const originales = pedido.detalles ?? [];

    const eliminadas = originales.filter(
      (o) => !detalles.some((d) => d.idDetallePedido === o.idDetallePedido)
    );

    const modificadas = detalles.filter((d) => {
      if (!d.idDetallePedido) return false;
      const original = originales.find(
        (o) => o.idDetallePedido === d.idDetallePedido
      );
      return (
        original &&
        (original.cantidad !== d.cantidad || original.precio !== d.precio)
      );
    });

    const nuevas = detalles.filter((d) => !d.idDetallePedido);

    try {
      setGuardando(true);

      // 1) quitar (devuelve stock) -> 2) modificar (reajusta) -> 3) agregar (descuenta)
      for (const d of eliminadas) {
        await deleteDetallePedido(d.idDetallePedido);
      }

      for (const d of modificadas) {
        await updateDetallePedido(d.idDetallePedido!, {
          idPedido: pedido.idPedido,
          idFlor: d.idFlor,
          cantidad: d.cantidad,
          precio: d.precio,
        });
      }

      for (const d of nuevas) {
        await createDetallePedido({
          idPedido: pedido.idPedido,
          idFlor: d.idFlor,
          cantidad: d.cantidad,
          precio: d.precio,
        });
      }

      // 4) datos generales del pedido (cliente y estado)
      await updatePedido(pedido.idPedido, {
        idCliente,
        idEmpleado: pedido.idEmpleado ?? usuarioActual.id ?? undefined,
        estado,
      });

      navigate("/empleado/pedidos");
    } catch (err) {
      console.error(err);
      setError(
        mensajeDeError(
          err,
          "No se pudo guardar el pedido. Revisa los datos e inténtalo otra vez."
        )
      );
      // si algún paso ya se aplicó, recargamos para que la pantalla refleje lo real
      await cargarDatos();
    } finally {
      setGuardando(false);
    }
  };

  if (cargando && !pedido) {
    return (
      <div className="ci-page">
        <div className="ci-empty">
          <p>Cargando pedido…</p>
        </div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="ci-page">
        <div className="ci-error" role="alert">
          <i className="bi bi-exclamation-circle" aria-hidden="true"></i>
          <span>{error ?? "No se encontró el pedido."}</span>
        </div>
        <button
          type="button"
          className="ci-back"
          onClick={() => navigate("/empleado/pedidos")}
        >
          <i className="bi bi-arrow-left" aria-hidden="true"></i> Pedidos
        </button>
      </div>
    );
  }

  return (
    <div className="ci-page">
      <header className="ci-header">
        <button
          type="button"
          className="ci-back"
          onClick={() => navigate("/empleado/pedidos")}
        >
          <i className="bi bi-arrow-left" aria-hidden="true"></i> Pedidos
        </button>

        <h1 className="ci-title">Editar pedido #{pedido.idPedido}</h1>
        <p className="ci-subtitle">
          Cambia el cliente, el estado o las flores del pedido.
        </p>
      </header>

      {error && (
        <div className="ci-error" role="alert">
          <i className="bi bi-exclamation-circle" aria-hidden="true"></i>
          <span>{error}</span>
        </div>
      )}

      <form className="ci-layout" onSubmit={handleSubmit}>
        <section className="ci-card">
          <div className="ci-grid">
            <Combo
              id="cliente"
              etiqueta="Cliente"
              icono={<i className="bi bi-person-badge" aria-hidden="true"></i>}
              opciones={opcionesCliente}
              valor={idCliente}
              onSelect={setIdCliente}
              placeholder="Selecciona un cliente"
              textoBusqueda="Buscar cliente…"
              textoVacio="Ningún cliente coincide"
              cargando={cargando}
            />

            <div className="ci-field">
              <span className="ci-label">
                <i className="bi bi-arrow-repeat" aria-hidden="true"></i> Estado
              </span>
              <div className="ci-estados" role="radiogroup" aria-label="Estado">
                {ESTADOS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    role="radio"
                    aria-checked={estado === e}
                    className={
                      estado === e
                        ? "ci-estado-chip ci-estado-chip-on"
                        : "ci-estado-chip"
                    }
                    onClick={() => setEstado(e)}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <Combo
              id="flor"
              etiqueta="Agregar flor"
              icono={<i className="bi bi-flower3" aria-hidden="true"></i>}
              opciones={opcionesFlor}
              valor={idFlor}
              onSelect={elegirFlor}
              placeholder="Selecciona una flor"
              textoBusqueda="Buscar flor…"
              textoVacio="Ninguna flor con stock coincide"
              cargando={cargando}
            />

            <div className="ci-field">
              <label className="ci-label" htmlFor="cantidad">
                <i className="bi bi-boxes" aria-hidden="true"></i> Cantidad
              </label>
              <input
                id="cantidad"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                placeholder="0"
                className={
                  excedeStockPrevio ? "ci-input ci-input-invalid" : "ci-input"
                }
                value={cantidad}
                onKeyDown={bloquearNegativo}
                onChange={(e) => setCantidad(soloPositivo(e.target.value))}
              />
              {excedeStockPrevio && florSeleccionada && (
                <span className="ci-field-error">
                  Supera el stock disponible ({florSeleccionada.stock} u.)
                </span>
              )}
            </div>

            <div className="ci-field">
              <label className="ci-label" htmlFor="precio">
                <i className="bi bi-coin" aria-hidden="true"></i> Precio de
                venta
              </label>
              <input
                id="precio"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                className="ci-input"
                value={precio}
                onKeyDown={bloquearNegativo}
                onChange={(e) => setPrecio(soloPositivo(e.target.value))}
              />
            </div>
          </div>

          <div className="ci-add-row">
            <p className="ci-add-preview">
              {subtotalPrevio > 0
                ? `Subtotal de esta línea ${quetzales(subtotalPrevio)}`
                : "Elige la flor, la cantidad y el precio para agregar una línea."}
            </p>

            <button
              type="button"
              className="ci-btn-add"
              onClick={agregarDetalle}
              disabled={!puedeAgregar}
            >
              <i className="bi bi-plus-lg" aria-hidden="true"></i> Agregar flor
            </button>
          </div>

          <div className="ci-detalles">
            <div className="ci-detalles-head">
              <h2 className="ci-detalles-title">Flores del pedido</h2>
              <span className="ci-badge">
                {detalles.length} {detalles.length === 1 ? "flor" : "flores"}
              </span>
            </div>

            {detalles.length === 0 ? (
              <div className="ci-empty">
                <i className="bi bi-flower3" aria-hidden="true"></i>
                <p>El pedido no tiene flores.</p>
                <span>Agrega al menos una para poder guardar los cambios.</span>
              </div>
            ) : (
              <div className="ci-table-wrap">
                <table className="ci-table">
                  <thead>
                    <tr>
                      <th>Flor</th>
                      <th className="ci-col-num">Cantidad</th>
                      <th className="ci-col-num">Precio</th>
                      <th className="ci-col-num">Subtotal</th>
                      <th>
                        <span className="ci-sr">Acciones</span>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {detalles.map((d) => (
                      <tr key={d.idFlor}>
                        <td className="ci-td-flor">{d.nombreFlor}</td>

                        <td className="ci-col-num">
                          <input
                            type="number"
                            min="1"
                            max={d.stock}
                            step="1"
                            className={
                              d.cantidad > d.stock
                                ? "ci-input-mini ci-input-invalid"
                                : "ci-input-mini"
                            }
                            aria-label={`Cantidad de ${d.nombreFlor}`}
                            value={d.cantidad}
                            onKeyDown={bloquearNegativo}
                            onChange={(e) =>
                              editarDetalle(d.idFlor, "cantidad", e.target.value)
                            }
                          />
                        </td>

                        <td className="ci-col-num">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="ci-input-mini"
                            aria-label={`Precio de ${d.nombreFlor}`}
                            value={d.precio}
                            onKeyDown={bloquearNegativo}
                            onChange={(e) =>
                              editarDetalle(d.idFlor, "precio", e.target.value)
                            }
                          />
                        </td>

                        <td className="ci-col-num ci-td-subtotal">
                          {quetzales(d.cantidad * d.precio)}
                        </td>

                        <td className="ci-col-action">
                          <button
                            type="button"
                            className="ci-btn-delete"
                            aria-label={`Quitar ${d.nombreFlor}`}
                            onClick={() => eliminarDetalle(d.idFlor)}
                          >
                            <i className="bi bi-trash3" aria-hidden="true"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  <tfoot>
                    <tr>
                      <td colSpan={3}>Total del pedido</td>
                      <td className="ci-col-num ci-td-total">
                        {quetzales(totalPedido)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </section>

        <aside className="ci-summary">
          <h2 className="ci-summary-title">Resumen</h2>

          <dl className="ci-summary-body">
            <div className="ci-summary-row">
              <dt>Cliente</dt>
              <dd>
                {opcionesCliente.find((c) => c.id === idCliente)?.etiqueta ||
                  "Sin elegir"}
              </dd>
            </div>

            <div className="ci-summary-row">
              <dt>Estado</dt>
              <dd>{estado}</dd>
            </div>

            <div className="ci-summary-row">
              <dt>Flores distintas</dt>
              <dd>{detalles.length}</dd>
            </div>

            <div className="ci-summary-row">
              <dt>Unidades</dt>
              <dd>{unidades}</dd>
            </div>
          </dl>

          <div className="ci-summary-total">
            <span>Total</span>
            <strong>{quetzales(totalPedido)}</strong>
          </div>

          <div className="ci-actions">
            <button
              type="submit"
              className="ci-btn-primary"
              disabled={guardando || cargando || detalles.length === 0}
            >
              {guardando ? "Guardando…" : "Guardar cambios"}
            </button>

            <button
              type="button"
              className="ci-btn-secondary"
              onClick={() => navigate("/empleado/pedidos")}
              disabled={guardando}
            >
              Cancelar
            </button>
          </div>
        </aside>
      </form>
    </div>
  );
}

export default UpdatePedidos;