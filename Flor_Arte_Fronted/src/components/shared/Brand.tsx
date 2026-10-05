import { Link } from "react-router-dom";
export default function Brand({ inicio }: { inicio: string }) {
  return <Link to={inicio} className="fa-brand" aria-label="FlorArte, ir al inicio"><span className="fa-brand-mark"><img src="/images/florarte.png" alt="" /></span><span className="fa-brand-copy"><strong>FlorArte</strong><small>Gestión que florece</small></span></Link>;
}
