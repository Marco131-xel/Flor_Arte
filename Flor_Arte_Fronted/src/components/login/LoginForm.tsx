import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../styles/login.module.css";
import { loginRequest } from "../../services/authService";

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      //const data = await loginRequest(email, password);
      localStorage.setItem("token", "fake-token");
      localStorage.setItem("role", "administrador");
      localStorage.setItem("user", JSON.stringify({ nombre: "Prueba" }));

      navigate("/admin");
    } catch {
      setError("Credenciales incorrectas");
    }
  };

  return (
    <div className={styles.loginWrapper}>
      <div className={`card ${styles.loginCard}`}>
        <div className="row g-0">

          {/* Panel izquierdo */}
          <div className={`col-md-6 ${styles.leftSide} d-flex flex-column justify-content-center align-items-center p-5`}>
            <h4 className="mb-3 d-flex align-items-center justify-content-center gap-2">
            Sistema FlorArte
            </h4>

            <p className="small mb-4 text-center">
              La plataforma que hace florecer la gestión de tu negocio
            </p>

            <img
              src="/images/florarte.png"
              alt="Sistema 3R"
              className="img-fluid"
              style={{ maxWidth: "200px" }}
            />
          </div>

          {/* Panel derecho */}
          <div className="col-md-6 p-5 bg-white">
            <div className="text-center mb-4">
              <h3 className="fw-bold">Inicia Sesión</h3>
              <p className="text-muted">
                Inicia sesión para gestionar tu tienda, productos y pedidos.
              </p>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleLogin}>
              <div className="mb-3">
                <label className="form-label">
                  <i className="bi bi-envelope"></i> Correo
                </label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label">
                  <i className="bi bi-lock"></i> Contraseña
                </label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className={`btn w-100 text-white py-2 ${styles.btnLogin}`}
              >
                <i className="bi bi-box-arrow-in-right"></i> Entrar
              </button>

              <div className="text-center mt-3">
                <a href="/recuperar" className={`${styles.customLink} fw-bold`}>
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginForm;