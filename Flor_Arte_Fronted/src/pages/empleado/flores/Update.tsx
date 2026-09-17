import { useEffect, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getFlorById,
  updateFlor,
  getColores,
  getTiposFlor,
} from "../../../services/shared/flor/florService";
import type { Color, TipoFlor, NewFlor } from "../../../types/flor";

function UpdateFlores() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [colores, setColores] = useState<Color[]>([]);
  const [tiposFlor, setTiposFlor] = useState<TipoFlor[]>([]);
  const [cargando, setCargando] = useState(true);

  const [form, setForm] = useState({
    idTipoFlor: "",
    idColor: "",
    precio: "",
    stock: "",
  });

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    if (!id) return;
    try {
      setCargando(true);
      setError(null);
      const [flor, coloresData, tiposFlorData] = await Promise.all([
        getFlorById(Number(id)),
        getColores(),
        getTiposFlor(),
      ]);
      setColores(coloresData);
      setTiposFlor(tiposFlorData);
      setForm({
        idTipoFlor: String(flor.idTipoFlor),
        idColor: String(flor.idColor),
        precio: String(flor.precio),
        stock: String(flor.stock),
      });
    } catch (err) {
      setError("No se pudo cargar la información de la flor.");
    } finally {
      setCargando(false);
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!id) return;

    if (!form.idTipoFlor || !form.idColor || !form.precio || !form.stock) {
      setError("Completa todos los campos antes de guardar.");
      return;
    }

    if (Number(form.precio) < 0 || Number(form.stock) < 0) {
      setError("El precio y el stock no pueden ser negativos.");
      return;
    }

    const florActualizada: NewFlor = {
      idTipoFlor: Number(form.idTipoFlor),
      idColor: Number(form.idColor),
      precio: Number(form.precio),
      stock: Number(form.stock),
    };

    try {
      setGuardando(true);
      await updateFlor(Number(id), florActualizada);
      navigate(-1);
    } catch (err) {
      setError("No se pudo actualizar la flor. Intenta de nuevo.");
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
        <h1 className="crear-flor-title">Editar Flor</h1>
        <p className="crear-flor-subtitle">Actualiza los datos de esta flor</p>
      </div>

      {error && <div className="crear-flor-error-box">{error}</div>}

      <div className="crear-flor-card">
        {cargando ? (
          <div className="crear-flor-subtitle">Cargando datos de la flor...</div>
        ) : (
          <form className="crear-flor-form" onSubmit={handleSubmit}>
            <div className="crear-flor-grid">
              {/* TIPO DE FLOR */}
              <div className="crear-flor-field">
                <label className="crear-flor-label" htmlFor="idTipoFlor">
                  Tipo de flor
                </label>
                <div className="crear-flor-select-wrap">
                  <select
                    id="idTipoFlor"
                    className="crear-flor-select"
                    value={form.idTipoFlor}
                    onChange={(e) => handleChange("idTipoFlor", e.target.value)}
                  >
                    <option value="">Selecciona un tipo</option>
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
                  Color
                </label>
                <div className="crear-flor-select-wrap">
                  <select
                    id="idColor"
                    className="crear-flor-select"
                    value={form.idColor}
                    onChange={(e) => handleChange("idColor", e.target.value)}
                  >
                    <option value="">Selecciona un color</option>
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
                  Precio (Q)
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
                disabled={guardando}
              >
                {guardando ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default UpdateFlores;