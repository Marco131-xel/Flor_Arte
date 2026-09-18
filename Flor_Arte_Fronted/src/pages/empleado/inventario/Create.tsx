import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { createEntradaCompleta } from "../../../services/shared/inventario/inventarioService";
import { getPersonas } from "../../../services/admin/usuarioService";
import { getFlores } from "../../../services/shared/flor/florService";

import type { Persona } from "../../../types/user";
import type { Flor } from "../../../types/flor";

interface DetalleFormulario {
  idFlor: number;
  nombreFlor: string;
  cantidad: number;
  precioCompra: number;
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

function CreateInventario() {
  const navigate = useNavigate();

  const [personas, setPersonas] = useState<Persona[]>([]);
  const [flores, setFlores] = useState<Flor[]>([]);
  const [cargando, setCargando] = useState(true);

  const [idPersona, setIdPersona] = useState<number | null>(null);
  const [idFlor, setIdFlor] = useState<number | null>(null);
  const [cantidad, setCantidad] = useState("");
  const [precioCompra, setPrecioCompra] = useState("");

  const [detalles, setDetalles] = useState<DetalleFormulario[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        setCargando(true);
        setError(null);

        const [personasData, floresData] = await Promise.all([
          getPersonas(),
          getFlores(),
        ]);

        setPersonas(personasData);
        setFlores(floresData);
      } catch (err) {
        console.error(err);
        setError(
          mensajeDeError(
            err,
            "No se pudieron cargar los proveedores y las flores. Recarga la página."
          )
        );
      } finally {
        setCargando(false);
      }
    };

    cargarCatalogos();
  }, []);

  const nombreFlor = (flor: Flor) =>
    `${flor.nombreTipoFlor} ${flor.nombreColor}`.trim();

  const opcionesProveedor: Opcion[] = useMemo(
    () =>
      personas
        .filter((p) => p.tipoRol?.toLowerCase() === "proveedor")
        .map((p) => ({ id: p.idPersona, etiqueta: p.nombre })),
    [personas]
  );

  const opcionesFlor: Opcion[] = useMemo(
    () => flores.map((f) => ({ id: f.idFlor, etiqueta: nombreFlor(f) })),
    [flores]
  );

  const proveedor = opcionesProveedor.find((p) => p.id === idPersona);

  const totalEntrada = detalles.reduce(
    (suma, d) => suma + d.cantidad * d.precioCompra,
    0
  );

  const unidades = detalles.reduce((suma, d) => suma + d.cantidad, 0);

  const subtotalPrevio = Number(cantidad || 0) * Number(precioCompra || 0);

  const puedeAgregar =
    idFlor !== null && Number(cantidad) > 0 && precioCompra !== "";

  const soloPositivo = (valor: string) => valor.replace(/-/g, "");

  const bloquearNegativo = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "-" || e.key === "e") e.preventDefault();
  };

  const agregarDetalle = () => {
    setError(null);

    const flor = flores.find((f) => f.idFlor === idFlor);
    if (!flor) return setError("Selecciona una flor.");

    const cant = Number(cantidad);
    const precio = Number(precioCompra);

    if (!Number.isInteger(cant) || cant <= 0)
      return setError("La cantidad debe ser un número entero mayor que 0.");

    if (Number.isNaN(precio) || precio < 0)
      return setError("El precio de compra no puede ser negativo.");

    if (detalles.some((d) => d.idFlor === flor.idFlor))
      return setError(
        `${nombreFlor(flor)} ya está en la lista. Edita la cantidad en la tabla.`
      );

    setDetalles((prev) => [
      ...prev,
      {
        idFlor: flor.idFlor,
        nombreFlor: nombreFlor(flor),
        cantidad: cant,
        precioCompra: precio,
      },
    ]);

    setIdFlor(null);
    setCantidad("");
    setPrecioCompra("");
  };

  const editarDetalle = (
    idFlorEditado: number,
    campo: "cantidad" | "precioCompra",
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

    if (!idPersona) return setError("Selecciona un proveedor.");
    if (detalles.length === 0)
      return setError("Agrega al menos una flor a la entrada.");
    if (detalles.some((d) => d.cantidad <= 0))
      return setError("Todas las cantidades deben ser mayores que 0.");

    try {
      setGuardando(true);

      await createEntradaCompleta({
        idPersona,
        detalles: detalles.map((d) => ({
          idFlor: d.idFlor,
          cantidad: d.cantidad,
          precioCompra: d.precioCompra,
        })),
      });

      navigate(-1);
    } catch (err) {
      console.error(err);
      setError(
        mensajeDeError(
          err,
          "No se pudo guardar la entrada. Revisa los datos e inténtalo otra vez."
        )
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="ci-page">
      <header className="ci-header">
        <button
          type="button"
          className="ci-back"
          onClick={() => navigate(-1)}
        >
          <i className="bi bi-arrow-left" aria-hidden="true"></i> Inventario
        </button>

        <h1 className="ci-title">Nueva entrada de inventario</h1>
        <p className="ci-subtitle">
          Registra las flores que ingresan y el precio al que las compraste.
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
              id="proveedor"
              etiqueta="Proveedor"
              icono={<i className="bi bi-person-badge" aria-hidden="true"></i>}
              opciones={opcionesProveedor}
              valor={idPersona}
              onSelect={setIdPersona}
              placeholder="Selecciona un proveedor"
              textoBusqueda="Buscar proveedor…"
              textoVacio="Ningún proveedor coincide"
              cargando={cargando}
            />

            <Combo
              id="flor"
              etiqueta="Flor"
              icono={<i className="bi bi-flower3" aria-hidden="true"></i>}
              opciones={opcionesFlor}
              valor={idFlor}
              onSelect={setIdFlor}
              placeholder="Selecciona una flor"
              textoBusqueda="Buscar flor…"
              textoVacio="Ninguna flor coincide"
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
                className="ci-input"
                value={cantidad}
                onKeyDown={bloquearNegativo}
                onChange={(e) => setCantidad(soloPositivo(e.target.value))}
              />
            </div>

            <div className="ci-field">
              <label className="ci-label" htmlFor="precioCompra">
                <i className="bi bi-coin" aria-hidden="true"></i> Precio de
                compra
              </label>
              <input
                id="precioCompra"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                className="ci-input"
                value={precioCompra}
                onKeyDown={bloquearNegativo}
                onChange={(e) => setPrecioCompra(soloPositivo(e.target.value))}
              />
            </div>
          </div>

          <div className="ci-add-row">
            <p className="ci-add-preview">
              {subtotalPrevio > 0
                ? `Subtotal de esta línea ${quetzales(subtotalPrevio)}`
                : "Elige la flor, la cantidad y el precio."}
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
              <h2 className="ci-detalles-title">Flores de esta entrada</h2>
              <span className="ci-badge">
                {detalles.length} {detalles.length === 1 ? "flor" : "flores"}
              </span>
            </div>

            {detalles.length === 0 ? (
              <div className="ci-empty">
                <i className="bi bi-flower3" aria-hidden="true"></i>
                <p>Aún no hay flores en la entrada.</p>
                <span>
                  Agrega la primera con el formulario de arriba; podrás editar
                  cantidades antes de guardar.
                </span>
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
                            step="1"
                            className="ci-input-mini"
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
                            value={d.precioCompra}
                            onKeyDown={bloquearNegativo}
                            onChange={(e) =>
                              editarDetalle(
                                d.idFlor,
                                "precioCompra",
                                e.target.value
                              )
                            }
                          />
                        </td>

                        <td className="ci-col-num ci-td-subtotal">
                          {quetzales(d.cantidad * d.precioCompra)}
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
                      <td colSpan={3}>Total de la entrada</td>
                      <td className="ci-col-num ci-td-total">
                        {quetzales(totalEntrada)}
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
              <dt>Proveedor</dt>
              <dd>{proveedor?.etiqueta || "Sin elegir"}</dd>
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
            <strong>{quetzales(totalEntrada)}</strong>
          </div>

          <div className="ci-actions">
            <button
              type="submit"
              className="ci-btn-primary"
              disabled={guardando || cargando || detalles.length === 0}
            >
              {guardando ? "Guardando…" : "Guardar entrada"}
            </button>

            <button
              type="button"
              className="ci-btn-secondary"
              onClick={() => navigate(-1)}
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

export default CreateInventario;