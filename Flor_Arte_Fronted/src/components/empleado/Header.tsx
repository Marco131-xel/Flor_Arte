import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getPedidos } from "../../services/shared/pedido/pedidoService";
import { getFlores } from "../../services/shared/flor/florService";

interface Props {
  toggleSidebar: () => void;
}

interface Notificacion {
  id: string; // estable: sirve para saber si ya se leyó
  tipo: "pedido" | "stock";
  titulo: string;
  detalle: string;
  ruta: string;
}

const UMBRAL_STOCK = 5; // avisa cuando quedan 5 unidades o menos
const INTERVALO_MS = 60_000; // revisa cada minuto
const CLAVE_LEIDAS = "fa_notif_leidas";

const leerLeidas = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_LEIDAS) || "[]");
  } catch {
    return [];
  }
};

const guardarLeidas = (ids: string[]) => {
  try {
    localStorage.setItem(CLAVE_LEIDAS, JSON.stringify(ids));
  } catch {
    /* si el navegador no deja guardar, seguimos sin persistir */
  }
};

function Header({ toggleSidebar }: Props) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const displayName = user?.nombre || user?.email || "Usuario";

  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [leidas, setLeidas] = useState<string[]>(leerLeidas);
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);

  /* ---------- Armar notificaciones ---------- */
  const cargarNotificaciones = useCallback(async () => {
    try {
      const [pedidos, flores] = await Promise.all([getPedidos(), getFlores()]);

      const deInventario: Notificacion[] = flores
        .filter((f) => f.estado && f.stock <= UMBRAL_STOCK)
        .map((f) => {
          const nombre = `${f.nombreTipoFlor} ${f.nombreColor}`.trim();
          return {
            // incluye el stock: si cambia, vuelve a avisar
            id: `stock-${f.idFlor}-${f.stock}`,
            tipo: "stock" as const,
            titulo: f.stock === 0 ? "Flor agotada" : "Stock bajo",
            detalle:
              f.stock === 0
                ? `${nombre} se quedó sin unidades.`
                : `${nombre}: quedan ${f.stock} unidades.`,
            ruta: "/empleado/flores",
          };
        });

      const dePedidos: Notificacion[] = pedidos
        .filter((p) => p.estado === "PENDIENTE")
        .map((p) => ({
          id: `pedido-${p.idPedido}`,
          tipo: "pedido" as const,
          titulo: "Pedido pendiente",
          detalle: `Pedido #${p.idPedido} de ${p.nombreCliente} espera atención.`,
          ruta: "/empleado/pedidos",
        }));

      setNotificaciones([...dePedidos, ...deInventario]);
    } catch (err) {
      // el header no debe romperse si falla la consulta
      console.error("Error al cargar notificaciones:", err);
    }
  }, []);

  useEffect(() => {
    cargarNotificaciones();
    const timer = setInterval(cargarNotificaciones, INTERVALO_MS);
    return () => clearInterval(timer);
  }, [cargarNotificaciones]);

  /* ---------- Cerrar con clic fuera / Escape ---------- */
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

  /* ---------- Leídas / no leídas ---------- */
  const noLeidas = notificaciones.filter((n) => !leidas.includes(n.id));
  const cantidad = noLeidas.length;

  const marcarLeida = (id: string) => {
    if (leidas.includes(id)) return;
    const nuevas = [...leidas, id];
    setLeidas(nuevas);
    guardarLeidas(nuevas);
  };

  const marcarTodasLeidas = () => {
    const nuevas = Array.from(
      new Set([...leidas, ...notificaciones.map((n) => n.id)])
    );
    setLeidas(nuevas);
    guardarLeidas(nuevas);
  };

  const abrirNotificacion = (n: Notificacion) => {
    marcarLeida(n.id);
    setAbierto(false);
    navigate(n.ruta);
  };

  return (
    <header className="empleado-header d-flex align-items-center justify-content-between px-3">
      <div className="d-flex align-items-center gap-3">
        <button
          className="btn-menu"
          onClick={toggleSidebar}
          aria-label="Mostrar/ocultar menú"
        >
          <i className="bi bi-list"></i>
        </button>

        <Link
          to="/empleado"
          className="navbar-brand text-white fw-bold d-flex align-items-center"
          style={{ textDecoration: "none" }}
        >
          <img
            src="/images/florarte.svg"
            alt="FlorArte"
            style={{
              width: "45px",
              height: "45px",
              objectFit: "contain",
              display: "block",
            }}
          />

          <span style={{ marginLeft: "10px" }}>Sistema FlorArte</span>
        </Link>
      </div>

      <div className="d-flex align-items-center gap-3">
        {/* ---------- Notificaciones ---------- */}
        <div className="notif" ref={contenedor}>
          <button
            type="button"
            className="notif-btn"
            aria-label={
              cantidad > 0
                ? `Notificaciones: ${cantidad} sin leer`
                : "Notificaciones"
            }
            aria-haspopup="true"
            aria-expanded={abierto}
            onClick={() => setAbierto((v) => !v)}
          >
            <i
              className={cantidad > 0 ? "bi bi-bell-fill" : "bi bi-bell"}
              aria-hidden="true"
            ></i>
            {cantidad > 0 && (
              <span className="notif-badge">{cantidad > 9 ? "9+" : cantidad}</span>
            )}
          </button>

          {abierto && (
            <div className="notif-panel" role="dialog" aria-label="Notificaciones">
              <div className="notif-panel-head">
                <h2 className="notif-panel-title">Notificaciones</h2>
                {cantidad > 0 && (
                  <button
                    type="button"
                    className="notif-mark-all"
                    onClick={marcarTodasLeidas}
                  >
                    Marcar todo como leído
                  </button>
                )}
              </div>

              {notificaciones.length === 0 ? (
                <div className="notif-empty">
                  <i className="bi bi-bell-slash" aria-hidden="true"></i>
                  <p>No tienes notificaciones</p>
                  <span>Aquí aparecerán los pedidos pendientes y los avisos de stock.</span>
                </div>
              ) : (
                <ul className="notif-list">
                  {notificaciones.map((n) => {
                    const sinLeer = !leidas.includes(n.id);
                    return (
                      <li key={n.id}>
                        <button
                          type="button"
                          className={
                            sinLeer ? "notif-item notif-item-new" : "notif-item"
                          }
                          onClick={() => abrirNotificacion(n)}
                        >
                          <span
                            className={`notif-icon notif-icon-${n.tipo}`}
                            aria-hidden="true"
                          >
                            <i
                              className={
                                n.tipo === "pedido"
                                  ? "bi bi-bag-plus"
                                  : "bi bi-exclamation-triangle"
                              }
                            ></i>
                          </span>

                          <span className="notif-text">
                            <strong>{n.titulo}</strong>
                            <span>{n.detalle}</span>
                          </span>

                          {sinLeer && <span className="notif-dot" aria-hidden="true"></span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        <Link
          to="/empleado/perfil"
          className="empleado-user text-decoration-none"
        >
          {displayName} <i className="bi bi-person-circle"></i>
        </Link>
      </div>
    </header>
  );
}

export default Header;