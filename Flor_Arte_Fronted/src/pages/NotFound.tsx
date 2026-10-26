import { Link } from "react-router-dom";

interface Props {
  inicio?: "/admin" | "/empleado";
}

export default function NotFound({ inicio }: Props) {
  const token = localStorage.getItem("token");
  const rol = localStorage.getItem("role");
  const destino = inicio ?? (
    token && rol === "ADMINISTRADOR" ? "/admin" :
    token && rol === "EMPLEADO" ? "/empleado" : "/login"
  );

  return (
    <section className="container py-5" aria-labelledby="pagina-no-encontrada">
      <div className="card border-0 shadow-sm mx-auto" style={{ maxWidth: 640 }}>
        <div className="card-body p-4 p-md-5 text-center">
          <p className="display-3 fw-bold text-secondary mb-2">404</p>
          <h1 id="pagina-no-encontrada" className="h3">Página no encontrada</h1>
          <p className="text-secondary my-3">
            La dirección que intentaste abrir no existe. Revisa que esté bien
            escrita o utiliza el botón para continuar.
          </p>
          <Link className="btn btn-outline-secondary" to={destino}>
            <i className="bi bi-arrow-left me-2" aria-hidden="true"></i>
            {destino === "/login" ? "Ir a iniciar sesión" : "Volver al inicio"}
          </Link>
        </div>
      </div>
    </section>
  );
}
