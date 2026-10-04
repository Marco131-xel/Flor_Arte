import { Link } from "react-router-dom";

interface Props {
  nombre: string;
  inicio: "/admin" | "/empleado";
}

export default function ModuloPendiente({ nombre, inicio }: Props) {
  return (
    <section className="container py-4" aria-labelledby="modulo-titulo">
      <div className="card border-0 shadow-sm mx-auto" style={{ maxWidth: 640 }}>
        <div className="card-body p-4 p-md-5 text-center">
          <i className="bi bi-tools fs-1 text-secondary" aria-hidden="true"></i>
          <p className="text-secondary mt-3 mb-2">Módulo pendiente</p>
          <h1 id="modulo-titulo" className="h3">{nombre}</h1>
          <p className="text-secondary my-3">
            Este módulo todavía no está disponible en tu panel. Puedes seguir
            utilizando las demás secciones del sistema.
          </p>
          <Link className="btn btn-outline-secondary" to={inicio}>
            <i className="bi bi-arrow-left me-2" aria-hidden="true"></i>
            Volver al inicio
          </Link>
        </div>
      </div>
    </section>
  );
}
