import { Link } from "react-router-dom";
import { useResumenInicio } from "../../hooks/useResumenInicio";

interface StatCard {
  label: string;
  value: string | number;
  icon: string;
  link: string;
  accent: "primary" | "gold" | "teal";
}

function Index() {
  const { valor, errores, cargando, reintentar } = useResumenInicio(false);
  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const nombre = user?.nombre || user?.email?.split("@")[0] || "de nuevo";

  const fechaHoy = new Date().toLocaleDateString("es-GT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const stats: StatCard[] = [
    { label: "Pedidos pendientes", value: valor("pedidos"), icon: "bi-bag-plus", link: "/empleado/pedidos", accent: "primary" },
    { label: "Arreglos en proceso", value: "Pendiente", icon: "bi-gift", link: "/empleado/arreglos", accent: "gold" },
    { label: "Eventos próximos", value: "Pendiente", icon: "bi-calendar-event", link: "/empleado/eventos", accent: "teal" },
    { label: "Reportes del mes", value: "Pendiente", icon: "bi-bar-chart-line", link: "/empleado/reportes", accent: "primary" },
  ];

  const accesos = [
    { label: "Gestionar Personas", icon: "bi bi-people", link: "/empleado/personas" },
    { label: "Gestionar Flores", icon: "bi-flower1", link: "/empleado/flores" },
    { label: "Gestionar Inventario", icon: "bi-journal", link: "/empleado/inventario" },
    { label: "Gestionar Pedidos", icon: "bi-bag-plus", link: "/empleado/pedidos" },
    { label: "Gestionar Arreglos", icon: "bi-gift", link: "/empleado/arreglos" },
    { label: "Gestionar Eventos", icon: "bi-calendar-event", link: "/empleado/eventos" },
    { label: "Consultar Reportes", icon: "bi-bar-chart-line", link: "/empleado/reportes" },
    { label: "Generar Recibos", icon: "bi-receipt", link: "/empleado/recibos" },
  ];

  return (
    <div className="inicio-wrapper">
<div className="inicio-hero">
  <div className="inicio-hero-content">

    <div className="inicio-logo-container">
      <img
        src="/images/florarte.png"
        alt="Flor Arte"
        className="inicio-logo"
      />
    </div>

    <div className="inicio-hero-text">
      <p className="inicio-fecha">
        {fechaHoy}
      </p>

      <h1 className="inicio-saludo">
        {saludo}, <span>{nombre}</span>
      </h1>

      <p className="inicio-sub">
        Este es el resumen de actividad de Flor Arte.
      </p>
    </div>

  </div>
</div>

      {errores.length > 0 && (
        <div className="alert alert-warning d-flex flex-wrap align-items-center gap-2" role="alert">
          <span>No se pudieron cargar los datos de {errores.join(", ")}. Intenta de nuevo.</span>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={reintentar} disabled={cargando}>
            Reintentar
          </button>
        </div>
      )}
      <p className="text-secondary small">
        Los módulos marcados como «Pendiente» todavía no tienen indicadores disponibles.
      </p>

      <div className="stat-grid" aria-busy={cargando}>
        {stats.map((s) => (
          <Link to={s.link} key={s.label} className={`stat-card stat-card--${s.accent}`}>
            <div className="stat-icon">
              <i className={`bi ${s.icon}`}></i>
            </div>
            <div>
              <p className={`stat-value${typeof s.value === "string" ? " fs-6" : ""}`}>{s.value}</p>
              <p className="stat-label">{s.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="inicio-section">
        <h2 className="inicio-section-title">Accesos rápidos</h2>
        <div className="acceso-grid">
          {accesos.map((a) => (
            <Link to={a.link} key={a.label} className="acceso-card">
              <i className={`bi ${a.icon}`}></i>
              <span>{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Index;