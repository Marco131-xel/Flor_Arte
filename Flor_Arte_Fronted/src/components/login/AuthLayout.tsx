import type { ReactNode } from "react";
import styles from "../../styles/login.module.css";
export default function AuthLayout({ titulo, children }: { titulo: string; children: ReactNode }) {
  return <main className={`${styles.loginWrapper} fa-auth`}><div className={`card ${styles.loginCard} fa-auth-card`}>
    <div className="row g-0"><aside className={`col-md-6 ${styles.leftSide} d-flex flex-column justify-content-center align-items-center p-5`}>
      <h4>Sistema FlorArte</h4><p className="text-center">Tu cuenta, protegida en cada paso.</p>
      <img src="/images/florarte.png" alt="FlorArte" width="200" className="img-fluid" />
    </aside><section className="col-md-6 p-4 p-sm-5 bg-white fa-auth-panel"><div className="fa-auth-mobile-brand"><img src="/images/florarte.png" alt="FlorArte"/><strong>FlorArte</strong></div><span className="fa-eyebrow">Tu cuenta · Seguridad</span><div className="fa-auth-symbol" aria-hidden="true"><i className="bi bi-shield-lock"/></div><h1 className="h3 fw-bold mb-4">{titulo}</h1>{children}</section></div>
  </div></main>;
}
