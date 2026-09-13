import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../styles/login.module.css";
import { loginRequest } from "../../services/authService";

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      const data = await loginRequest(email, password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.tipoUsuario);
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data.id_usuario,
          nombre: data.nombre,
          estado: data.estado,
          email: email,
        })
      );

      if (data.tipoUsuario === "ADMINISTRADOR") {
        navigate("/admin");
      } else if (data.tipoUsuario === "EMPLEADO") {
        navigate("/empleado");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      console.error("Error de login: ", err);
      if (!err.response) {
        setError("No se pudo conectar con el servidor. Verifica tu conexión.");
      } else {
        const status = err.response.status;
        const backendMsg = err.response.data?.error;

        switch (status) {
          case 400:
            setError(backendMsg || "Revisa el correo y la contraseña ingresados");
            break;
          case 401:
            setError(backendMsg || "Correo o contraseña incorrectos");
            break;
          case 403:
            setError(backendMsg || "Tu cuenta está inactiva o bloqueada");
            break;
          case 500:
            setError("Error interno del servidor, intenta más tarde");
            break;
          default:
            setError("Ocurrió un error inesperado, intenta de nuevo");
        }
      }
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
              <h3 className="fw-bold">Inicia Sesión</h3>
              <p className="text-muted">
                Inicia sesión para gestionar tu tienda, productos y pedidos.
              </p>
            </div>

            {error && (
              <div className="alert alert-danger" role="alert" aria-live="assertive">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} noValidate>
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