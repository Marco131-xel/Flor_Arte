import { useState } from "react";
import Listado from "../../../components/gestion/Listado";
export default function IndexUser() {
  const [tab, setTab] = useState<"personas" | "usuarios">("personas");
  return <><div className="fa-tabs" role="group" aria-label="Sección de contactos"><button aria-pressed={tab==="personas"} onClick={() => setTab("personas")}><i aria-hidden="true" className="bi bi-people" /> Personas</button><button aria-pressed={tab==="usuarios"} onClick={() => setTab("usuarios")}><i aria-hidden="true" className="bi bi-person-badge" /> Usuarios del sistema</button></div><Listado key={tab} modulo={tab} personasAdmin={tab==="personas"} /></>;
}
