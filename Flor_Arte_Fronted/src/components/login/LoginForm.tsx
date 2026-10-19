import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "../../styles/login.module.css";
import { guardarSesion, loginRequest } from "../../services/authService";
import CodigoCorreo from "./CodigoCorreo";
import type { DesafioAuth, SesionAuth } from "../../types/auth";
import { mensajeLogin } from "../../services/mensajesLogin";

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [desafio, setDesafio] = useState<DesafioAuth | null>(null);
  const completar = (data: SesionAuth) => {
    guardarSesion(data, email);
    navigate(data.tipoUsuario === "ADMINISTRADOR" ? "/admin" : data.tipoUsuario === "EMPLEADO" ? "/empleado" : "/", { replace: true });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    ["token", "role", "user"].forEach(key => localStorage.removeItem(key));

    try {
      const data = await loginRequest(email, password);
      setPassword("");
      if (data.requires2fa) setDesafio(data);
      else completar(data);
    } catch (err: unknown) {
      setPassword("");
      setError(mensajeLogin(err));
    } finally {
      setLoading(false);
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
              alt="Logo Sistema FlorArte"
              className="img-fluid"
              style={{ maxWidth: "200px" }}
            />
          </div>

          {/* Panel derecho */}
          <div className="col-md-6 p-5 bg-white">
            <div className="text-center mb-4">
              <h3 className="fw-bold">{desafio ? "Verifica tu identidad" : "Inicia Sesión"}</h3>
              <p className="text-muted">
                {desafio ? "Confirma el código enviado a tu correo para continuar." : "Inicia sesión para gestionar tu tienda, productos y pedidos."}
              </p>
            </div>

            {error && (
              <div className="fa-auth-notice danger" role="alert" aria-live="assertive">
                {error}
              </div>
            )}

            {desafio ? <CodigoCorreo desafio={desafio} onComplete={completar}
              onCancel={() => { setDesafio(null); setError(""); }} /> : <form onSubmit={handleLogin}>
              <div className="mb-3">
                <label htmlFor="email" className="form-label">
                  <i className="bi bi-envelope"></i> Correo
                </label>
                <input
                  id="email"
                  type="email"
                  className={`form-control ${styles.formControl}`}
                  placeholder="ejemplo@correo.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="mb-2">
                <label htmlFor="password" className="form-label">
                  <i className="bi bi-lock"></i> Contraseña
                </label>
                <div className="input-group">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className={`form-control ${styles.formControl}`}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className={`btn w-100 text-white py-2 mt-3 ${styles.btnLogin}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Ingresando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right"></i> Entrar
                  </>
                )}
              </button>

              <div className="text-center mt-3">
                <Link className={`${styles.customLink} fw-bold`} to="/recuperar-contrasena">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </form>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
