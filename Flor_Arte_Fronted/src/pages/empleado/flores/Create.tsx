import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createFlor, getColores, getTiposFlor } from "../../../services/shared/flor/florService";
import type { Color, TipoFlor, NewFlor } from "../../../types/flor";

function CreateFlor() {
  const navigate = useNavigate();

  const [colores, setColores] = useState<Color[]>([]);
  const [tiposFlor, setTiposFlor] = useState<TipoFlor[]>([]);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);

  const [form, setForm] = useState({
    idTipoFlor: "",
    idColor: "",
    precio: "",
    stock: "",
  });

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // combobox de tipo de flor
  const [tipoAbierto, setTipoAbierto] = useState(false);
  const [buscarTipo, setBuscarTipo] = useState("");
  const tipoRef = useRef<HTMLDivElement>(null);

  // combobox de color
  const [colorAbierto, setColorAbierto] = useState(false);
  const [buscarColor, setBuscarColor] = useState("");
  const colorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    cargarCatalogos();
  }, []);

  // cierra los combobox al hacer clic fuera de ellos
  useEffect(() => {
    const handleClickFuera = (e: MouseEvent) => {
      if (tipoRef.current && !tipoRef.current.contains(e.target as Node)) {
        setTipoAbierto(false);
      }
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) {
        setColorAbierto(false);
      }
    };
    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, []);

  const cargarCatalogos = async () => {
    try {
      setCargandoCatalogos(true);
      const [coloresData, tiposFlorData] = await Promise.all([
        getColores(),
        getTiposFlor(),
      ]);
      setColores(coloresData);
      setTiposFlor(tiposFlorData);
    } catch (err) {
      setError("No se pudieron cargar los colores y tipos de flor.");
    } finally {
      setCargandoCatalogos(false);
    }
  };

  const handleChange = (campo: keyof typeof form, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  // Evita el signo "-" en precio/stock: bloquea la tecla y limpia cualquier
  // valor negativo que llegue por pegado (Ctrl+V) o autocompletado.
  const bloquearNegativo = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "-" || e.key === "Subtract") {
      e.preventDefault();
    }
  };

  const handleChangeNumeroPositivo = (campo: keyof typeof form, valor: string) => {
    const limpio = valor.replace("-", "");
    setForm((prev) => ({ ...prev, [campo]: limpio }));
  };

  const tipoSeleccionado = tiposFlor.find(
    (t) => t.idTipoFlor === Number(form.idTipoFlor)
  );
  const colorSeleccionado = colores.find(
    (c) => c.idColor === Number(form.idColor)
  );

  const tiposFiltrados = tiposFlor.filter((t) =>
    t.nombre.toLowerCase().includes(buscarTipo.toLowerCase())
  );
  const coloresFiltrados = colores.filter((c) =>
    c.nombre.toLowerCase().includes(buscarColor.toLowerCase())
  );

  const elegirTipo = (tipo: TipoFlor) => {
    handleChange("idTipoFlor", String(tipo.idTipoFlor));
    setTipoAbierto(false);
    setBuscarTipo("");
  };

  const elegirColor = (color: Color) => {
    handleChange("idColor", String(color.idColor));
    setColorAbierto(false);
    setBuscarColor("");
  };

  const hayAlgoParaResumen =
    tipoSeleccionado || colorSeleccionado || form.precio || form.stock;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.idTipoFlor || !form.idColor || !form.precio || !form.stock) {
      setError("Completa todos los campos antes de guardar.");
      return;
    }

    if (Number(form.precio) < 0 || Number(form.stock) < 0) {
      setError("El precio y el stock no pueden ser negativos.");
      return;
    }

    const nuevaFlor: NewFlor = {
      idTipoFlor: Number(form.idTipoFlor),
      idColor: Number(form.idColor),
      precio: Number(form.precio),
      stock: Number(form.stock),
    };

    try {
      setGuardando(true);
      await createFlor(nuevaFlor);
      navigate(-1);
    } catch (err) {
      setError("No se pudo crear la flor. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="crear-flor-page">
      <div className="crear-flor-header">
        <button className="crear-flor-btn-back" onClick={() => navigate(-1)}>
          ← Volver a Flores
        </button>
        <h1 className="crear-flor-title">
          <i className="bi bi-flower3"></i> Crear Flor
        </h1>
        <p className="crear-flor-subtitle">
          Registra una nueva flor en el catálogo del inventario
        </p>
      </div>

      {error && <div className="crear-flor-error-box">{error}</div>}

      <div className="crear-flor-layout">
        {/* FORMULARIO */}
        <div className="crear-flor-card">
          <form className="crear-flor-form" onSubmit={handleSubmit}>
            <div className="crear-flor-grid">
              {/* TIPO DE FLOR - combobox buscable */}
              <div className="crear-flor-field" ref={tipoRef}>
                <label className="crear-flor-label">
                  <i className="bi bi-flower3"></i> Tipo de flor
                </label>
                <div className="crear-flor-combo">
                  <button
                    type="button"
                    className="crear-flor-combo-trigger"
                    onClick={() => !cargandoCatalogos && setTipoAbierto((v) => !v)}
                    disabled={cargandoCatalogos}
                  >
                    <span
                      className={
                        "crear-flor-combo-trigger-text" +
                        (tipoSeleccionado ? "" : " crear-flor-combo-placeholder")
                      }
                    >
                      {cargandoCatalogos
                        ? "Cargando..."
                        : tipoSeleccionado?.nombre || "Selecciona un tipo"}
                    </span>
                    <span className="crear-flor-select-chevron">▾</span>
                  </button>

                  {tipoAbierto && (
                    <div className="crear-flor-combo-panel">
                      <div className="crear-flor-combo-search">
                        <i className="bi bi-search"></i>
                        <input
                          type="text"
                          autoFocus
                          placeholder="Buscar tipo de flor..."
                          value={buscarTipo}
                          onChange={(e) => setBuscarTipo(e.target.value)}
                        />
                      </div>
                      <div className="crear-flor-combo-list">
                        {tiposFiltrados.length === 0 ? (
                          <div className="crear-flor-combo-empty">Sin resultados</div>
                        ) : (
                          tiposFiltrados.map((tipo) => (
                            <button
                              type="button"
                              key={tipo.idTipoFlor}
                              className={
                                "crear-flor-combo-item" +
                                (Number(form.idTipoFlor) === tipo.idTipoFlor
                                  ? " crear-flor-combo-item-activo"
                                  : "")
                              }
                              onClick={() => elegirTipo(tipo)}
                            >
                              <span className="crear-flor-combo-icon">
                                <i className="bi bi-flower3"></i>
                              </span>
                              {tipo.nombre}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* COLOR - combobox buscable */}
              <div className="crear-flor-field" ref={colorRef}>
                <label className="crear-flor-label">
                  <i className="bi bi-palette-fill"></i> Color
                </label>
                <div className="crear-flor-combo">
                  <button
                    type="button"
                    className="crear-flor-combo-trigger"
                    onClick={() => !cargandoCatalogos && setColorAbierto((v) => !v)}
                    disabled={cargandoCatalogos}
                  >
                    {colorSeleccionado && (
                      <span
                        className="color-swatch crear-flor-swatch-sm"
                        data-nombre={colorSeleccionado.nombre.toLowerCase()}
                      />
                    )}
                    <span
                      className={
                        "crear-flor-combo-trigger-text" +
                        (colorSeleccionado ? "" : " crear-flor-combo-placeholder")
                      }
                    >
                      {cargandoCatalogos
                        ? "Cargando..."
                        : colorSeleccionado?.nombre || "Selecciona un color"}
                    </span>
                    <span className="crear-flor-select-chevron">▾</span>
                  </button>

                  {colorAbierto && (
                    <div className="crear-flor-combo-panel">
                      <div className="crear-flor-combo-search">
                        <i className="bi bi-search"></i>
                        <input
                          type="text"
                          autoFocus
                          placeholder="Buscar color..."
                          value={buscarColor}
                          onChange={(e) => setBuscarColor(e.target.value)}
                        />
                      </div>
                      <div className="crear-flor-combo-list">
                        {coloresFiltrados.length === 0 ? (
                          <div className="crear-flor-combo-empty">Sin resultados</div>
                        ) : (
                          coloresFiltrados.map((color) => (
                            <button
                              type="button"
                              key={color.idColor}
                              className={
                                "crear-flor-combo-item" +
                                (Number(form.idColor) === color.idColor
                                  ? " crear-flor-combo-item-activo"
                                  : "")
                              }
                              onClick={() => elegirColor(color)}
                            >
                              <span
                                className="color-swatch crear-flor-swatch-sm"
                                data-nombre={color.nombre.toLowerCase()}
                              />
                              {color.nombre}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* PRECIO */}
              <div className="crear-flor-field">
                <label className="crear-flor-label" htmlFor="precio">
                  <i className="bi bi-coin"></i> Precio (Q)
                </label>
                <input
                  id="precio"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="crear-flor-input"
                  value={form.precio}
                  onKeyDown={bloquearNegativo}
                  onChange={(e) => handleChangeNumeroPositivo("precio", e.target.value)}
                />
              </div>

              {/* STOCK */}
              <div className="crear-flor-field">
                <label className="crear-flor-label" htmlFor="stock">
                  <i className="bi bi-boxes"></i> Stock
                </label>
                <input
                  id="stock"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  className="crear-flor-input"
                  value={form.stock}
                  onKeyDown={bloquearNegativo}
                  onChange={(e) => handleChangeNumeroPositivo("stock", e.target.value)}
                />
              </div>
            </div>

            <div className="crear-flor-footer">
              <button
                type="button"
                className="crear-flor-btn-secondary"
                onClick={() => navigate(-1)}
                disabled={guardando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="crear-flor-btn-primary"
                disabled={guardando || cargandoCatalogos}
              >
                {guardando ? "Guardando..." : "Guardar Flor"}
              </button>
            </div>
          </form>
        </div>

        {/* RESUMEN */}
        <div className="crear-flor-summary">
          <h2 className="crear-flor-summary-title">
            <i className="bi bi-eye"></i> Resumen
          </h2>

          <div className="crear-flor-summary-img-box">
            {tipoSeleccionado?.imagenUrl ? (
              <img
                src={tipoSeleccionado.imagenUrl}
                alt={tipoSeleccionado.nombre}
                className="crear-flor-summary-img"
              />
            ) : (
              <span className="crear-flor-summary-icon">🌸</span>
            )}
          </div>

          {hayAlgoParaResumen ? (
            <div className="crear-flor-summary-body">
              <div className="crear-flor-summary-row">
                <span className="crear-flor-summary-label">Tipo</span>
                <span className="crear-flor-summary-value">
                  {tipoSeleccionado?.nombre || "—"}
                </span>
              </div>
              <div className="crear-flor-summary-row">
                <span className="crear-flor-summary-label">Color</span>
                <span className="crear-flor-summary-value">
                  {colorSeleccionado && (
                    <span
                      className="color-swatch crear-flor-swatch-sm"
                      data-nombre={colorSeleccionado.nombre.toLowerCase()}
                    />
                  )}
                  {colorSeleccionado?.nombre || "—"}
                </span>
              </div>
              <div className="crear-flor-summary-row">
                <span className="crear-flor-summary-label">Precio</span>
                <span className="crear-flor-summary-value">
                  {form.precio ? `Q${Number(form.precio).toFixed(2)}` : "—"}
                </span>
              </div>
              <div className="crear-flor-summary-row">
                <span className="crear-flor-summary-label">Stock</span>
                <span className="crear-flor-summary-value">{form.stock || "—"}</span>
              </div>
            </div>
          ) : (
            <p className="crear-flor-summary-empty">
              Selecciona un tipo de flor y un color para ver el resumen aquí.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreateFlor;