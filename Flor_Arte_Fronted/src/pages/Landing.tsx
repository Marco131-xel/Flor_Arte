import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "../styles/landing.module.css";

// Fotografías de referencia: reemplazar estas URL por las imágenes de FlorArte.
const photographs = {
  hero: "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&w=1400&q=85",
  flowers: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=900&q=85",
  arrangements: "https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto=format&fit=crop&w=900&q=85",
  events: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=900&q=85",
};

const collections = [
  { number: "01", title: "Flores que enamoran", text: "Colores y formas para decir lo que sientes. Encuentra las flores para ese detalle especial.", image: photographs.flowers, alt: "Flores amarillas al aire libre", tag: "Un detalle, muchas emociones" },
  { number: "02", title: "Arreglos con intención", text: "Composiciones que reúnen belleza y significado para regalar, celebrar o acompañar.", image: photographs.arrangements, alt: "Arreglo de flores frescas en tonos suaves", tag: "Hechos para compartir" },
  { number: "03", title: "Eventos para recordar", text: "Dale vida a tu celebración con flores que acompañen la esencia de ese gran día.", image: photographs.events, alt: "Mesa preparada para una celebración con decoración floral", tag: "Celebremos juntos" },
];

function referenceFallback(event: React.SyntheticEvent<HTMLImageElement>) {
  if (!event.currentTarget.src.endsWith("/images/fondo1.jpg")) {
    event.currentTarget.src = "/images/fondo1.jpg";
  }
}

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className={styles.landing} id="inicio">
      <a href="#contenido" className={styles.skipLink}>Ir al contenido</a>
      <div className={styles.announcement}>
        <i className="bi bi-flower1" aria-hidden="true" />
        Flores, detalles y momentos especiales · Quetzaltenango
      </div>

      <header className={styles.header}>
        <div className={styles.headerInner}>
          <a href="#inicio" className={styles.brand} aria-label="FlorArte, inicio" onClick={closeMenu}>
            <img src="/images/florarte.png" alt="" width="58" height="58" />
            <span><strong>FlorArte</strong><small>El arte de regalar flores</small></span>
          </a>
          <button type="button" className={styles.menuToggle} onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen} aria-controls="landing-navigation" aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}>
            <i className={`bi ${menuOpen ? "bi-x-lg" : "bi-list"}`} aria-hidden="true" />
          </button>
          <nav id="landing-navigation" aria-label="Navegación principal" className={`${styles.navigation} ${menuOpen ? styles.navigationOpen : ""}`}>
            <a href="#nosotros" onClick={closeMenu}>Nuestra esencia</a>
            <a href="#colecciones" onClick={closeMenu}>Lo que creamos</a>
            <a href="#contacto" onClick={closeMenu}>Contacto</a>
            <Link to="/login" className={styles.loginLink} onClick={closeMenu}>
              Iniciar sesión <i className="bi bi-arrow-up-right" aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </header>

      <main id="contenido">
        <section className={styles.hero} aria-labelledby="landing-title">
          <div className={styles.heroText}>
            <p className={styles.eyebrow}><span /> FLORISTERÍA EN QUETZALTENANGO</p>
            <h1 id="landing-title">Hay emociones<br />que florecen<br /><em>con un detalle.</em></h1>
            <p className={styles.heroDescription}>Flores, arreglos y detalles que hablan por ti. En FlorArte, transformamos tus ideas en momentos que se quedan en el corazón.</p>
            <div className={styles.heroActions}>
              <a href="#colecciones" className={styles.primaryButton}>Descubre FlorArte <i className="bi bi-arrow-right" aria-hidden="true" /></a>
              <Link to="/login" className={styles.textLink}>Iniciar sesión <i className="bi bi-arrow-up-right" aria-hidden="true" /></Link>
            </div>
            <div className={styles.heroNote}><i className="bi bi-flower2" aria-hidden="true" /><span>Para los grandes días.<br /><strong>Y los pequeños «pensé en ti».</strong></span></div>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.heroImageWrap}>
              <img src={photographs.hero} onError={referenceFallback} alt="Ramo de flores en tonos rosa, blanco y verde" className={styles.heroImage} fetchPriority="high" width="700" height="850" />
            </div>
            <span className={styles.imageLabel}>NATURALMENTE ESPECIAL</span>
            <div className={styles.flowerSeal} aria-hidden="true"><i className="bi bi-flower1" /><span>CON AMOR<br />FLORARTE</span></div>
            <div className={styles.imageCaption}><span>Un gesto que lo dice todo.</span><i className="bi bi-heart" aria-hidden="true" /></div>
          </div>
        </section>

        <div className={styles.valuesStrip} aria-label="Nuestra propuesta">
          <span><i className="bi bi-flower1" aria-hidden="true" /> Belleza en cada flor</span>
          <span><i className="bi bi-heart" aria-hidden="true" /> Detalles con significado</span>
          <span><i className="bi bi-stars" aria-hidden="true" /> Momentos para recordar</span>
        </div>

        <section className={styles.collections} id="colecciones" aria-labelledby="collections-title">
          <div className={styles.sectionHeading}>
            <div><p className={styles.eyebrow}>LO QUE CREAMOS PARA TI</p><h2 id="collections-title">Una flor para cada historia.</h2></div>
            <p>Un cumpleaños, una celebración o simplemente porque sí. Siempre hay una razón para regalar flores.</p>
          </div>
          <div className={styles.collectionGrid}>
            {collections.map((collection) => (
              <article className={styles.collectionCard} key={collection.number}>
                <a href="#contacto" className={styles.collectionImage} aria-label={`Consultar sobre ${collection.title.toLowerCase()}`}>
                  <img src={collection.image} alt={collection.alt} onError={referenceFallback} loading="lazy" width="600" height="680" />
                  <span>{collection.tag}</span><i className="bi bi-arrow-up-right" aria-hidden="true" />
                </a>
                <div className={styles.collectionTitle}><h3>{collection.title}</h3><span>{collection.number}</span></div>
                <p>{collection.text}</p>
              </article>
            ))}
          </div>
          <p className={styles.referenceNote}>Fotografías de referencia. Consulta por las flores y opciones disponibles.</p>
        </section>

        <section className={styles.about} id="nosotros" aria-labelledby="about-title">
          <div className={styles.aboutBrand}><img src="/images/florarte.png" alt="Logo de FlorArte" loading="lazy" width="210" height="210" /><span>Flores que conectan.</span></div>
          <div className={styles.aboutText}>
            <p className={styles.eyebrow}>NUESTRA ESENCIA</p>
            <h2 id="about-title">Más que flores,<br /><em>una forma de sentir.</em></h2>
            <p>Somos FlorArte, una floristería en Quetzaltenango donde las flores son el inicio de algo especial. Nos gusta acompañarte en esos momentos que merecen un detalle diferente.</p>
            <p>Desde una flor hasta un arreglo para tu evento, queremos ayudarte a encontrar una combinación que cuente tu historia.</p>
            <a href="#contacto" className={styles.textLink}>Hablemos de tu próxima ocasión <i className="bi bi-arrow-right" aria-hidden="true" /></a>
          </div>
        </section>

        <section className={styles.contact} id="contacto" aria-labelledby="contact-title">
          <div className={styles.contactIntro}>
            <p className={styles.eyebrow}>ESTAMOS CERCA DE TI</p>
            <h2 id="contact-title">¿Qué te gustaría<br /><em>hacer florecer?</em></h2>
            <p>Cuéntanos tu idea, la ocasión y la fecha. Con gusto te orientamos sobre flores, arreglos y eventos.</p>
            <a href="https://wa.me/50235847828" target="_blank" rel="noopener noreferrer" className={styles.primaryButton}><i className="bi bi-whatsapp" aria-hidden="true" /> Escríbenos por WhatsApp <i className="bi bi-arrow-up-right" aria-hidden="true" /></a>
          </div>
          <div className={styles.contactDetails}>
            <a href="https://www.google.com/maps/search/?api=1&query=1+Calle+25-78+Zona+1+Quetzaltenango" target="_blank" rel="noopener noreferrer"><i className="bi bi-geo-alt" aria-hidden="true" /><span><small>VISÍTANOS</small><strong>1 Calle 25-78 Zona 1</strong><span>Quetzaltenango, Guatemala</span></span><i className="bi bi-arrow-up-right" aria-hidden="true" /></a>
            <a href="tel:+50235847828"><i className="bi bi-telephone" aria-hidden="true" /><span><small>LLÁMANOS</small><strong>+502 3584 7828</strong></span><i className="bi bi-arrow-up-right" aria-hidden="true" /></a>
            <a href="mailto:jadestrella7@gmail.com"><i className="bi bi-envelope" aria-hidden="true" /><span><small>ESCRÍBENOS</small><strong>jadestrella7@gmail.com</strong></span><i className="bi bi-arrow-up-right" aria-hidden="true" /></a>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerMain}>
          <a href="#inicio" className={styles.brand}><img src="/images/florarte.png" alt="" width="50" height="50" /><span><strong>FlorArte</strong><small>El arte de regalar flores</small></span></a>
          <p>Pequeños detalles. Grandes emociones.</p>
          <Link to="/login">Iniciar sesión <i className="bi bi-arrow-up-right" aria-hidden="true" /></Link>
        </div>
        <div className={styles.footerBottom}><span>© {new Date().getFullYear()} FlorArte. Todos los derechos reservados.</span><span>Hecho para florecer en Quetzaltenango.</span></div>
      </footer>
    </div>
  );
}
