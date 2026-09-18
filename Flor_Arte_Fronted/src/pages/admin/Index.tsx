import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

interface StatCard {
  label: string;
  value: string | number;
  icon: string;
  link: string;
  accent: "primary" | "gold" | "teal";
}

interface StatGroup {
  title: string;
  items: StatCard[];
}

function IndexAdmin() {
  const [saludo, setSaludo] = useState("Hola");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const nombre = user?.nombre || user?.email?.split("@")[0] || "de nuevo";

  useEffect(() => {
    const hora = new Date().getHours();
    if (hora < 12) setSaludo("Buenos días");
    else if (hora < 19) setSaludo("Buenas tardes");
    else setSaludo("Buenas noches");
  }, []);

  const fechaHoy = new Date().toLocaleDateString("es-GT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // TODO: reemplazar estos valores con los datos reales que devuelva cada servicio
  // (getUsuarios/getPersonas para el primer grupo; pedidos/arreglos/eventos/reportes
  // para el segundo, cuando el admin también tenga esos módulos). Por ahora quedan
  // como placeholder.
  const statGroups: StatGroup[] = [
    {
      title: "Usuarios",
      items: [
        { label: "Personas registradas", value: 24, icon: "bi-people", link: "/admin/usuarios", accent: "primary" },
        { label: "Usuarios del sistema", value: 12, icon: "bi-person-badge", link: "/admin/usuarios", accent: "teal" },
        { label: "Usuarios activos", value: 10, icon: "bi-person-check", link: "/admin/usuarios", accent: "gold" },
        { label: "Cuentas inactivas", value: 2, icon: "bi-person-x", link: "/admin/usuarios", accent: "primary" },
      ],
    },
    {
      title: "Operaciones",
      items: [
        { label: "Pedidos pendientes", value: 8, icon: "bi-bag-plus", link: "/admin/pedidos", accent: "primary" },
        { label: "Arreglos en proceso", value: 3, icon: "bi-gift", link: "/admin/arreglos", accent: "gold" },
        { label: "Eventos próximos", value: 2, icon: "bi-calendar-event", link: "/admin/eventos", accent: "teal" },
        { label: "Reportes del mes", value: 5, icon: "bi-bar-chart-line", link: "/admin/reportes", accent: "primary" },
      ],
    },
  ];

  const accesos = [
    { label: "Gestionar Personas y Usuarios", icon: "bi-people", link: "/admin/usuarios" },
    { label: "Nueva Persona", icon: "bi-person-plus", link: "/admin/usuarios/crear-Persona" },
    { label: "Nuevo Usuario", icon: "bi-person-fill-add", link: "/admin/usuarios/crear" },
    { label: "Mi Perfil", icon: "bi-person-circle", link: "/admin/perfil" },
  ];

  return (
    <div className="inicio-wrapper">
      <div className="inicio-hero">
        <div className="inicio-hero-content">
          <div className="inicio-logo-container">
            <img src="/images/florarte.png" alt="Flor Arte" className="inicio-logo" />
          </div>

          <div className="inicio-hero-text">
            <p className="inicio-fecha">{fechaHoy}</p>

            <h1 className="inicio-saludo">
              {saludo}, <span>{nombre}</span>
            </h1>

            <p className="inicio-sub">Este es el resumen de administración de Flor Arte.</p>
          </div>
        </div>
      </div>

      {statGroups.map((grupo) => (
        <div className="inicio-section" key={grupo.title}>
          <h2 className="inicio-section-title">{grupo.title}</h2>
          <div className="stat-grid">
            {grupo.items.map((s) => (
              <Link to={s.link} key={s.label} className={`stat-card stat-card--${s.accent}`}>
                <div className="stat-icon">
                  <i className={`bi ${s.icon}`}></i>
                </div>
                <div>
                  <p className="stat-value">{s.value}</p>
                  <p className="stat-label">{s.label}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}

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

export default IndexAdmin;