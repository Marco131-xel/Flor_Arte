import { api } from "../../services/apiService";
import Brand from "../shared/Brand";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

interface Props {
  toggleSidebar: () => void;
  sidebarOpen?: boolean;
}

interface Notificacion {
  id: string;
  tipo: "pedido" | "stock" | "usuario" | "empleado" | "evento";
  titulo: string;
  detalle: string;
  ruta: string;
}

const INTERVALO_MS = 60_000;
// clave propia del admin: ve más tipos de avisos que el empleado
const CLAVE_LEIDAS = "fa_notif_leidas_admin";

// Rutas de admin a las que lleva cada aviso (ajústalas a tu router)

// pedidos que ya están en marcha y deberían tener un empleado a cargo

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

const iconoDe = (tipo: Notificacion["tipo"]) => {
  switch (tipo) {
    case "evento":
      return "bi bi-calendar-event";
    case "pedido":
      return "bi bi-bag-plus";
    case "stock":
      return "bi bi-exclamation-triangle";
    case "usuario":
      return "bi bi-person-x";
    case "empleado":
      return "bi bi-person-dash";
  }
};

function Header({ toggleSidebar, sidebarOpen }: Props) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const displayName = user?.nombre || user?.email || "Usuario";

  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [leidas, setLeidas] = useState<string[]>(leerLeidas);
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);

  /* ---------- Armar notificaciones ---------- */
  useEffect(() => {
    const controller = new AbortController();
    let pendiente = false;
    const cargar = async () => {
      if (pendiente || document.hidden) return;
      pendiente = true;
      try {
        const { data } = await api.get<Notificacion[]>("/gestion/avisos", { signal: controller.signal });
        if (!controller.signal.aborted) setNotificaciones(data);
      } catch (err) { if (!controller.signal.aborted) console.error("No se pudieron cargar los avisos", err); }
      finally { pendiente = false; }
    };
    void cargar();
    const timer = setInterval(cargar, INTERVALO_MS);
    return () => { controller.abort(); clearInterval(timer); };
  }, []);

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
  const cantidad = notificaciones.filter((n) => !leidas.includes(n.id)).length;

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
          aria-expanded={sidebarOpen}
          aria-controls="panel-menu"
        >
          <i className="bi bi-list"></i>
        </button>

        <Brand inicio="/admin" />
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
                <h2 className="notif-panel-title">Avisos recientes</h2>
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
                  <p>No hay avisos recientes</p>
                  <span>
                    Aquí aparecerán los pedidos pendientes, el stock bajo y los
                    usuarios inactivos.
                  </span>
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
                            <i className={iconoDe(n.tipo)}></i>
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

        <Link to="/admin/perfil" className="empleado-user text-decoration-none">
          {displayName} <i className="bi bi-person-circle"></i>
        </Link>
      </div>
    </header>
  );
}

export default Header;