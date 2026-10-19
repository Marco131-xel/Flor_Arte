import { useSearchParams } from "react-router-dom";
import Listado from "../../../components/gestion/Listado";
export default function IndexInventario() {
  const [params,setParams]=useSearchParams();
  const tab=params.get("seccion")==="mermas"?"mermas":"inventario";
  const setTab=(valor:string)=>setParams(prev=>{prev.set("seccion",valor);return prev;});
  return <><div className="fa-tabs" role="group" aria-label="Sección de inventario"><button aria-pressed={tab==="inventario"} onClick={() => setTab("inventario")}><i aria-hidden="true" className="bi bi-box-seam" /> Entradas de inventario</button><button aria-pressed={tab==="mermas"} onClick={() => setTab("mermas")}><i aria-hidden="true" className="bi bi-clipboard2-pulse" /> Mermas</button></div><Listado key={tab} modulo={tab} /></>;
}
