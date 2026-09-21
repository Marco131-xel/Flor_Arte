import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";

import { createMovimientoInventario } from "../../../services/shared/inventario/inventarioService";
import { getFlores } from "../../../services/shared/flor/florService";

import type { Flor } from "../../../types/flor";

interface Opcion {
  id: number;
  etiqueta: string;
  stock: number;
}

const mensajeDeError = (err: unknown, respaldo: string) => {
  const detalle = (err as { response?: { data?: { message?: string } } })
    ?.response?.data?.message;

  return detalle || respaldo;
};

function Merma() {
  const navigate = useNavigate();

  const [flores, setFlores] = useState<Flor[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [idFlor, setIdFlor] = useState<number | null>(null);
  const [cantidad, setCantidad] = useState("");

  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const contenedor = useRef<HTMLDivElement>(null);

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  useEffect(() => {
    const cargarFlores = async () => {
      try {
        setCargando(true);
        setErrorCarga(null);
        const data = await getFlores();
        setFlores(data);
      } catch (err) {
        console.error(err);
        setErrorCarga(mensajeDeError(err, "No se pudieron cargar las flores."));
      } finally {
        setCargando(false);
      }
    };

    cargarFlores();
  }, []);

  useEffect(() => {
    if (!abierto) return;

    const clickFuera = (e: MouseEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) {
        setAbierto(false);
        setBusqueda("");
      }
    };

    document.addEventListener("mousedown", clickFuera);
    return () => document.removeEventListener("mousedown", clickFuera);
  }, [abierto]);

  const opciones: Opcion[] = useMemo(
    () =>
      flores.map((f) => ({
        id: f.idFlor,
        etiqueta: `${f.nombreTipoFlor} ${f.nombreColor}`.trim(),
        stock: f.stock,
      })),
    [flores]
  );

  const seleccionada = opciones.find((o) => o.id === idFlor);

  const filtradas = opciones.filter((o) =>
    o.etiqueta.toLowerCase().includes(busqueda.trim().toLowerCase())
  );

  const cant = Number(cantidad);
  const cantidadValida = Number.isInteger(cant) && cant > 0;
  const excedeStock = seleccionada != null && cantidadValida && cant > seleccionada.stock;
  const stockResultante = seleccionada ? seleccionada.stock - (cantidadValida ? cant : 0) : null;

  const soloPositivo = (valor: string) => valor.replace(/-/g, "");

  const bloquearNegativo = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "-" || e.key === "e") e.preventDefault();
  };

  const elegirFlor = (id: number) => {
    setIdFlor(id);
    setAbierto(false);
    setBusqueda("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setExito(null);

    if (!seleccionada) return setError("Selecciona una flor.");
    if (!cantidadValida)
      return setError("Ingresa una cantidad entera mayor que 0.");
    if (excedeStock)
      return setError(
        `No puedes dar de baja ${cant} unidades: solo hay ${seleccionada.stock} en stock.`
      );

    try {
      setGuardando(true);

      await createMovimientoInventario({
        idFlor: seleccionada.id,
        tipoMovimiento: "SALIDA",
        cantidad: cant,
        motivo: "MERMA",
      });

      setExito(`Se registró la merma de ${cant} unidad(es) de ${seleccionada.etiqueta}.`);
      setFlores((prev) =>
        prev.map((f) =>
          f.idFlor === seleccionada.id ? { ...f, stock: f.stock - cant } : f
        )
      );
      setIdFlor(null);
      setCantidad("");
    } catch (err) {
      console.error(err);
      setError(
        mensajeDeError(
          err,
          "No se pudo registrar la merma. Revisa los datos e inténtalo otra vez."
        )
      );
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="ci-page">
        <div className="ci-state">Cargando flores…</div>
      </div>
    );
  }

  if (errorCarga) {
    return (
      <div className="ci-page">
        <div className="ci-error" role="alert">
          <i className="bi bi-exclamation-circle" aria-hidden="true"></i>
          <span>{errorCarga}</span>
        </div>
        <button type="button" className="ci-btn-secondary" onClick={() => navigate(-1)}>
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="ci-page">
      <header className="ci-header">
        <button type="button" className="ci-back" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left" aria-hidden="true"></i> Inventario
        </button>

        <h1 className="ci-title">Registrar merma</h1>
        <p className="ci-subtitle">
          Da de baja flores dañadas, vencidas o perdidas del inventario.
        </p>
      </header>

      {error && (
        <div className="ci-error" role="alert">
          <i className="bi bi-exclamation-circle" aria-hidden="true"></i>
          <span>{error}</span>
        </div>
      )}

      {exito && (
        <div className="ci-success" role="status">
          <i className="bi bi-check-circle" aria-hidden="true"></i>
          <span>{exito}</span>
        </div>
      )}

      <form className="ci-layout" onSubmit={handleSubmit}>
        <section className="ci-card">
          <div className="ci-grid">
            <div className="ci-field" ref={contenedor}>
              <label className="ci-label" htmlFor="flor">
                <i className="bi bi-flower3" aria-hidden="true"></i> Flor
              </label>

              <div className="ci-combo">
                <button
                  id="flor"
                  type="button"
                  className="ci-combo-trigger"
                  aria-haspopup="listbox"
                  aria-expanded={abierto}
                  onClick={() => setAbierto((v) => !v)}
                  onKeyDown={(e) => e.key === "Escape" && setAbierto(false)}
                >
                  <span
                    className={
                      seleccionada ? "ci-combo-text" : "ci-combo-text ci-combo-empty-text"
                    }
                  >
                    {seleccionada?.etiqueta || "Selecciona una flor"}
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
                        placeholder="Buscar flor…"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") setAbierto(false);
                          if (e.key === "Enter" && filtradas.length === 1) {
                            e.preventDefault();
                            elegirFlor(filtradas[0].id);
                          }
                        }}
                      />
                    </div>

                    <div className="ci-combo-list" role="listbox">
                      {filtradas.length === 0 ? (
                        <p className="ci-combo-none">Ninguna flor coincide</p>
                      ) : (
                        filtradas.map((opcion) => (
                          <button
                            key={opcion.id}
                            type="button"
                            role="option"
                            aria-selected={opcion.id === idFlor}
                            className={
                              opcion.id === idFlor
                                ? "ci-combo-item ci-combo-item-on"
                                : "ci-combo-item"
                            }
                            onClick={() => elegirFlor(opcion.id)}
                          >
                            <span className="ci-combo-icon">
                              <i className="bi bi-flower3" aria-hidden="true"></i>
                            </span>
                            {opcion.etiqueta}
                            <span className="ci-combo-stock">{opcion.stock} u.</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="ci-field">
              <label className="ci-label" htmlFor="cantidad">
                <i className="bi bi-boxes" aria-hidden="true"></i> Cantidad a
                dar de baja
              </label>
              <input
                id="cantidad"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                placeholder="0"
                className={excedeStock ? "ci-input ci-input-invalid" : "ci-input"}
                value={cantidad}
                onKeyDown={bloquearNegativo}
                onChange={(e) => setCantidad(soloPositivo(e.target.value))}
              />
              {excedeStock && (
                <span className="ci-field-error">
                  Supera el stock disponible ({seleccionada?.stock} u.)
                </span>
              )}
            </div>
          </div>

          {seleccionada && (
            <div className="ci-warn">
              <i className="bi bi-exclamation-triangle" aria-hidden="true"></i>
              <span>
                Stock actual de <strong>{seleccionada.etiqueta}</strong>:{" "}
                {seleccionada.stock} u.
                {cantidadValida &&
                  !excedeStock &&
                  ` Quedará en ${stockResultante} u. después de esta merma.`}
              </span>
            </div>
          )}
        </section>

        <aside className="ci-summary">
          <h2 className="ci-summary-title">Resumen</h2>

          <dl className="ci-summary-body">
            <div className="ci-summary-row">
              <dt>Flor</dt>
              <dd>{seleccionada?.etiqueta || "Sin elegir"}</dd>
            </div>

            <div className="ci-summary-row">
              <dt>Tipo de movimiento</dt>
              <dd>Salida</dd>
            </div>

            <div className="ci-summary-row">
              <dt>Motivo</dt>
              <dd>Merma</dd>
            </div>

            <div className="ci-summary-row">
              <dt>Cantidad</dt>
              <dd>{cantidadValida ? cant : "—"}</dd>
            </div>
          </dl>

          <div className="ci-actions">
            <button
              type="submit"
              className="ci-btn-primary"
              disabled={guardando || !seleccionada || !cantidadValida || excedeStock}
            >
              {guardando ? "Registrando…" : "Registrar merma"}
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

export default Merma;