import {NavLink} from "react-router-dom";
import Listado from "../../../components/gestion/Listado";
export default function IndexArreglos({pedidos=false}:{pedidos?:boolean}) {
  const base=localStorage.getItem("role")==="ADMINISTRADOR"?"/admin":"/empleado";
  return <><nav className="fa-tabs" aria-label="Gestión de arreglos"><NavLink end to={`${base}/arreglos`}>Catálogo de arreglos</NavLink><NavLink to={`${base}/arreglos/pedidos`}>Pedidos de arreglos</NavLink></nav><Listado modulo={pedidos?"pedidosArreglos":"arreglos"}/></>;
}
