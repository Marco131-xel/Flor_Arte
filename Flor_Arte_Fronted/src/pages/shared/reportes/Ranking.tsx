import {dinero} from "../../../services/gestionService";
import type {RankingReporte} from "../../../types/reporte";

export interface ColumnaRanking {campo:"unidades"|"solicitudes"|"compras"|"importe";titulo:string}
export default function Ranking({titulo,descripcion,datos,columnas}:{titulo:string;descripcion:string;datos:RankingReporte[];columnas:ColumnaRanking[]}) {
  return <section className="fa-list-card rp-ranking"><header><p className="fa-eyebrow">Top 5</p><h2>{titulo}</h2><p>{descripcion}</p></header><div className="fa-table-scroll"><table className="fa-table"><thead><tr><th>Puesto</th><th>Nombre</th>{columnas.map(c=><th key={c.campo}>{c.titulo}</th>)}</tr></thead><tbody>{datos.map((fila,i)=><tr key={fila.id}><td><span className={`rp-position ${i===0?"first":""}`}>{i+1}</span></td><td><strong>{fila.nombre}</strong>{!!fila.sinCosto&&<small className="rp-missing">{fila.sinCosto} mermas sin costo; importe parcial</small>}</td>{columnas.map(c=><td key={c.campo} className={c.campo==="importe"?"fa-amount":""}>{c.campo==="importe"?dinero(fila.importe):fila[c.campo]??0}</td>)}</tr>)}{!datos.length&&<tr><td colSpan={columnas.length+2}><div className="fa-empty">No hay registros para este período.</div></td></tr>}</tbody></table></div></section>;
}
