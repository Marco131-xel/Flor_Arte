import { useEffect, useState } from "react";
import type { FormEvent } from "react";
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

  useEffect(() => {
    cargarCatalogos();
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
  const bloquearNegativo = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "-" || e.key === "Subtract") {
      e.preventDefault();
    }
  };

  const handleChangeNumeroPositivo = (campo: keyof typeof form, valor: string) => {
    const limpio = valor.replace("-", "");
    setForm((prev) => ({ ...prev, [campo]: limpio }));
  };

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
        <h1 className="crear-flor-title"><i className="bi bi-flower3"></i> Crear Flor</h1>
        <p className="crear-flor-subtitle">
          Registra una nueva flor en el catálogo del inventario
        </p>
      </div>

      {error && <div className="crear-flor-error-box">{error}</div>}

      <div className="crear-flor-card">
        <form className="crear-flor-form" onSubmit={handleSubmit}>
          <div className="crear-flor-grid">
            {/* TIPO DE FLOR */}
            <div className="crear-flor-field">
              <label className="crear-flor-label" htmlFor="idTipoFlor">
                <i className="bi bi-flower3"></i> Tipo de flor
              </label>
              <div className="crear-flor-select-wrap">
                <select
                  id="idTipoFlor"
                  className="crear-flor-select"
                  value={form.idTipoFlor}
                  onChange={(e) => handleChange("idTipoFlor", e.target.value)}
                  disabled={cargandoCatalogos}
                >
                  <option value="">
                    {cargandoCatalogos ? "Cargando..." : "Selecciona un tipo"}
                  </option>
                  {tiposFlor.map((tipo) => (
                    <option key={tipo.idTipoFlor} value={tipo.idTipoFlor}>
                      {tipo.nombre}
                    </option>
                  ))}
                </select>
                <span className="crear-flor-select-chevron">▾</span>
              </div>
            </div>

            {/* COLOR */}
            <div className="crear-flor-field">
              <label className="crear-flor-label" htmlFor="idColor">
                <i className="bi bi-palette-fill"></i> Color
              </label>
              <div className="crear-flor-select-wrap">
                <select
                  id="idColor"
                  className="crear-flor-select"
                  value={form.idColor}
                  onChange={(e) => handleChange("idColor", e.target.value)}
                  disabled={cargandoCatalogos}
                >
                  <option value="">
                    {cargandoCatalogos ? "Cargando..." : "Selecciona un color"}
                  </option>
                  {colores.map((color) => (
                    <option key={color.idColor} value={color.idColor}>
                      {color.nombre}
                    </option>
                  ))}
                </select>
                <span className="crear-flor-select-chevron">▾</span>
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
                Stock
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
    </div>
  );
}

export default CreateFlor;