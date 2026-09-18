import { Link } from "react-router-dom";

interface Props {
  toggleSidebar: () => void;
}

function Header({ toggleSidebar }: Props) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const displayName = user?.nombre || user?.email || "Usuario";

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
          to="/admin"
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

          <span style={{ marginLeft: "10px" }}>
            Sistema FlorArte
          </span>
        </Link>
      </div>

      <div className="d-flex align-items-center gap-3">
        <Link to="/admin/perfil" className="empleado-user text-decoration-none">
          {displayName} <i className="bi bi-person-circle"></i>
        </Link>
      </div>
    </header>
  );
}

export default Header;