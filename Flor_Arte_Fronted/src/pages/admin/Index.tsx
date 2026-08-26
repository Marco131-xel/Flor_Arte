import { Link } from "react-router-dom";
import styles from "../../styles/admin/landing.module.css";

const modules = [
  {
    icon: "bi-box-seam",
    title: "Inventario",
    text: "Registra el ingreso de flores por proveedor, con cantidades y precios de compra.",
  },
  {
    icon: "bi-bag-check",
    title: "Pedidos",
    text: "Administra pedidos pequeños y por mayor, cada uno con su propio recibo.",
  },
  {
    icon: "bi-flower2",
    title: "Arreglos",
    text: "Registra los materiales usados en cada arreglo y su ganancia.",
  },
  {
    icon: "bi-calendar-event",
    title: "Eventos",
    text: "Consulta fechas disponibles y la flor comprometida para cada evento.",
  },
  {
    icon: "bi-bar-chart-line",
    title: "Reportes",
    text: "Consulta ventas, pérdidas y ganancias para decidir con datos reales.",
  },
];

function InicioAdmin() {
  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <span className={styles.navBrand}>
          <i className="bi bi-flower2"></i> Flor Arte
        </span>
        <Link to="/login" className={styles.navCta}>
          Iniciar sesión
        </Link>
      </header>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>Sistema de gestión floral</p>
        <h1 className={styles.heroTitle}>
          Todo florece cuando <br className={styles.heroBreak} />
          el negocio está en orden.
        </h1>
        <p className={styles.heroSubtitle}>
          Centraliza el inventario, los pedidos, los arreglos y los eventos de
          tu floristería en un solo lugar, sin cuadernos ni mensajes
          perdidos.
        </p>
        <Link to="/login" className={styles.heroCta}>
          Entrar al sistema <i className="bi bi-arrow-right"></i>
        </Link>
      </section>

      <section className={styles.problem}>
        <div className={styles.problemText}>
          <p className={styles.eyebrow}>El problema</p>
          <p>
            Hoy el ingreso de flores no se registra, los pedidos se manejan
            por cuaderno o WhatsApp, y no hay forma clara de saber qué se
            perdió ni cuánto se ganó. Flor Arte ordena cada una de esas
            operaciones y actualiza el inventario automáticamente cuando se
            vende, se arma un arreglo o se separa flor para un evento.
          </p>
        </div>
      </section>

      <section className={styles.modules}>
        <p className={styles.eyebrow}>Cómo se conecta todo</p>
        <h2 className={styles.sectionTitle}>Un mismo tallo, cinco módulos</h2>

        <div className={styles.vine}>
          <svg
            className={styles.vineLine}
            viewBox="0 0 4 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M2 0 L2 100" stroke="#c9a13e" strokeWidth="2" />
          </svg>

          {modules.map((m) => (
            <div className={styles.vineItem} key={m.title}>
              <span className={styles.vineNode}>
                <i className={`bi ${m.icon}`}></i>
              </span>
              <div>
                <h3 className={styles.vineTitle}>{m.title}</h3>
                <p className={styles.vineText}>{m.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.benefits}>
        <div className={styles.benefitCard}>
          <i className="bi bi-shield-check"></i>
          <h3>Menos pérdidas</h3>
          <p>Sabes qué flor se echa a perder y cuánto representa.</p>
        </div>
        <div className={styles.benefitCard}>
          <i className="bi bi-calendar-check"></i>
          <h3>Cero conflictos de reserva</h3>
          <p>El calendario de eventos evita comprometer la misma fecha dos veces.</p>
        </div>
        <div className={styles.benefitCard}>
          <i className="bi bi-graph-up"></i>
          <h3>Decisiones con datos</h3>
          <p>Reportes de ventas, pedidos y arreglos listos para consultar.</p>
        </div>
      </section>

      <section className={styles.ctaFinal}>
        <h2 className={styles.sectionTitle}>Empieza a ordenar tu floristería</h2>
        <Link to="/login" className={styles.heroCta}>
          Iniciar sesión <i className="bi bi-arrow-right"></i>
        </Link>
      </section>

      <footer className={styles.footer}>
        Sistema FlorArte © 2026 - Desarrollado por POOL-COMUNITY
      </footer>
    </div>
  );
}

export default InicioAdmin;