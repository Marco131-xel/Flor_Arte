import { Link } from "react-router-dom";

interface Props {
  toggleSidebar: () => void;
}

function Header({ toggleSidebar }: Props) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const displayName = user?.nombre || user?.email || "Usuario";

  return (
    <header className="admin-header d-flex align-items-center justify-content-between px-3">
      <div className="d-flex align-items-center gap-3">
        <button
          className="btn-menu"
          onClick={toggleSidebar}
          aria-label="Mostrar/ocultar menú"
        >
          <i className="bi bi-list"></i>
        </button>

        <Link to="/admin" className="navbar-brand text-white fw-bold">
          Sistema FlorArte
        </Link>
      </div>

      <div className="d-flex align-items-center gap-3">
        <span className="admin-user">
          {displayName} <i className="bi bi-person-circle"></i>
        </span>
      </div>
    </header>
  );
}

export default Header;