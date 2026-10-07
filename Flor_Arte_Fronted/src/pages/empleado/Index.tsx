import ActividadInicio from "../../components/shared/ActividadInicio";
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
  const { resumen, valor, errores, cargando, reintentar } = useResumenInicio(false);
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
    { label: "Arreglos en proceso", value: valor("arreglosProceso"), icon: "bi-gift", link: "/empleado/arreglos/pedidos", accent: "gold" },
    { label: "Eventos próximos", value: valor("eventos"), icon: "bi-calendar-event", link: "/empleado/eventos", accent: "teal" },
    { label: "Flores con stock bajo", value: valor("stockBajo"), icon: "bi-exclamation-triangle", link: "/empleado/flores", accent: "primary" },
    { label: "Arreglos pendientes", value: valor("arreglosPendientes"), icon: "bi-gift", link: "/empleado/arreglos/pedidos", accent: "gold" },
    { label: "Pedidos en proceso", value: valor("pedidosProceso"), icon: "bi-bag", link: "/empleado/pedidos", accent: "teal" },
    { label: "Pedidos listos", value: valor("pedidosListos"), icon: "bi-bag-check", link: "/empleado/pedidos", accent: "primary" },
    { label: "Arreglos listos", value: valor("arreglosListos"), icon: "bi-gift", link: "/empleado/arreglos/pedidos", accent: "gold" },
    { label: "Eventos de hoy", value: valor("eventosHoy"), icon: "bi-calendar-check", link: "/empleado/eventos", accent: "teal" },
    { label: "Flores agotadas", value: valor("agotadas"), icon: "bi-flower3", link: "/empleado/flores", accent: "primary" },
    { label: "Flores en inventario", value: valor("unidadesStock"), icon: "bi-boxes", link: "/empleado/inventario", accent: "teal" },
    { label: "Compras del mes", value: valor("comprasMes"), icon: "bi-truck", link: "/empleado/inventario", accent: "gold" },
    { label: "Flores desechadas este mes", value: valor("mermasMes"), icon: "bi-clipboard2-pulse", link: "/empleado/inventario", accent: "primary" },
  ];

  const accesos = [
    { label: "Gestionar Personas", icon: "bi bi-people", link: "/empleado/personas" },
    { label: "Gestionar Flores", icon: "bi-flower1", link: "/empleado/flores" },
    { label: "Gestionar Inventario", icon: "bi-journal", link: "/empleado/inventario" },
    { label: "Gestionar Pedidos", icon: "bi-bag-plus", link: "/empleado/pedidos" },
    { label: "Gestionar Arreglos", icon: "bi-gift", link: "/empleado/arreglos" },
    { label: "Gestionar Eventos", icon: "bi-calendar-event", link: "/empleado/eventos" },
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
      <div className="inicio-refresh"><p>Datos actuales · Eventos de los próximos 7 días · Compras y merma del mes actual</p><button type="button" className="fa-button secondary" onClick={reintentar} disabled={cargando}>Actualizar resumen</button></div>

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

      <ActividadInicio resumen={resumen} cargando={cargando} error={errores.length>0} administrador={false} />

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