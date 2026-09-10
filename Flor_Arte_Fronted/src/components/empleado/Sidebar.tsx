import { NavLink } from "react-router-dom";

interface Props {
  open: boolean;
}

function Sidebar({ open }: Props) {
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `sidebar-link ${isActive ? "active" : ""}`;

  return (
    <aside className={`empleado-sidebar ${open ? "open" : ""}`}>
      <ul className="sidebar-menu">
        <li>
          <NavLink to="/empleado" end className={linkClass}>
            <i className="bi bi-house"></i> Inicio
          </NavLink>
        </li>

        <li>
          <NavLink to="/empleado/flores" className={linkClass}>
            <i className="bi bi-people"></i> Gestionar Flores
          </NavLink>
        </li>

        <li>
          <NavLink to="/empleado/inventario" className={linkClass}>
            <i className="bi bi-journal"></i> Gestionar Inventario
          </NavLink>
        </li>

        <li>
          <NavLink to="/empleado/pedidos" className={linkClass}>
            <i className="bi bi-bag-plus"></i> Gestionar Pedidos
          </NavLink>
        </li>

        <li>
          <NavLink to="/empleado/arreglos" className={linkClass}>
            <i className="bi bi-gift"></i> Gestionar Arreglos
          </NavLink>
        </li>

        <li>
          <NavLink to="/empleado/eventos" className={linkClass}>
            <i className="bi bi-calendar-event"></i> Gestionar Eventos
          </NavLink>
        </li>

        <li>
          <NavLink to="/empleado/reportes" className={linkClass}>
            <i className="bi bi-bar-chart-line"></i> Consultar Reportes
          </NavLink>
        </li>

        <li>
          <NavLink to="/empleado/recibos" className={linkClass}>
            <i className="bi bi-receipt"></i> Generar Recibos
          </NavLink>
        </li>

        <li className="sidebar-divider"></li>

        <li>
          <button className="sidebar-logout" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i> Cerrar sesión
          </button>
        </li>
      </ul>
    </aside>
  );
}

export default Sidebar;