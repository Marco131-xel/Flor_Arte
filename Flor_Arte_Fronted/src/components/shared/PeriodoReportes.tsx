import {useId} from "react";
import SelectorMes from "./SelectorMes";
import {fechaLocal} from "../../types/evento";

export type TipoPeriodo = "DIA"|"SEMANA"|"MES"|"ANIO";
export interface FiltroReporte {periodo:TipoPeriodo;fecha:string}
export default function PeriodoReportes({value,onChange}:{value:FiltroReporte;onChange:(value:FiltroReporte)=>void}) {
  const id=useId(),anio=Number(value.fecha.slice(0,4)),actual=new Date().getFullYear();
  const desde=new Date(`${value.fecha}T12:00:00`);
  if(value.periodo==="SEMANA")desde.setDate(desde.getDate()-(desde.getDay()+6)%7);
  const hasta=new Date(desde);if(value.periodo==="SEMANA")hasta.setDate(hasta.getDate()+6);
  return <div className="fa-filters rp-periodo"><label htmlFor={`${id}-tipo`}>Consultar por<select id={`${id}-tipo`} value={value.periodo} onChange={e=>onChange({...value,periodo:e.target.value as TipoPeriodo})}><option value="DIA">Día</option><option value="SEMANA">Semana</option><option value="MES">Mes</option><option value="ANIO">Año</option></select></label>
    {value.periodo==="MES"?<label htmlFor={`${id}-mes`}>Mes y año<SelectorMes id={`${id}-mes`} value={value.fecha.slice(0,7)} onChange={mes=>onChange({...value,fecha:`${mes||fechaLocal(new Date()).slice(0,7)}-01`})}/></label>:value.periodo==="ANIO"?<label htmlFor={`${id}-anio`}>Año<select id={`${id}-anio`} value={anio} onChange={e=>onChange({...value,fecha:`${e.target.value}-01-01`})}>{Array.from({length:Math.max(actual+10,anio)-1899},(_,i)=>1900+i).filter(year=>year<=9998).map(year=><option key={year}>{year}</option>)}</select></label>:<label htmlFor={`${id}-fecha`}>{value.periodo==="SEMANA"?"Día dentro de la semana":"Fecha"}<input id={`${id}-fecha`} type="date" min="1900-01-01" max="9998-12-31" value={value.fecha} onChange={e=>{if(e.target.value)onChange({...value,fecha:e.target.value});}}/></label>}
    {value.periodo==="SEMANA"&&<p className="rp-week-range">Lunes a domingo: {desde.toLocaleDateString("es-GT")} – {hasta.toLocaleDateString("es-GT")}</p>}
    <button className="fa-button tertiary" onClick={()=>onChange({periodo:value.periodo,fecha:fechaLocal(new Date())})}>Período actual</button>
  </div>;
}
