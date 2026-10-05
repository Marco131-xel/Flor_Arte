import { useState } from "react";
import Modal from "./Modal";

import {meses,nombrePeriodo} from "../../utils/periodo";
export default function SelectorMes({id,value,onChange}:{id:string;value:string;onChange:(value:string)=>void}) {
  const [abierto,setAbierto]=useState(false);
  const [anio,setAnio]=useState(new Date().getFullYear());
  return <>
    <button type="button" id={id} className="fa-month-trigger" aria-label="Mes y año" aria-haspopup="dialog" onClick={()=>{setAnio(Number(value.slice(0,4))||new Date().getFullYear());setAbierto(true);}}><i className="bi bi-calendar3" aria-hidden="true"/><span>{nombrePeriodo(value)}</span><i className="bi bi-chevron-down" aria-hidden="true"/></button>
    {abierto && <Modal titulo="Selecciona un mes" cerrar={()=>setAbierto(false)}><div className="fa-month-picker">
      <div className="fa-year-picker"><button type="button" className="fa-icon-button" aria-label="Año anterior" disabled={anio<=1900} onClick={()=>setAnio(a=>a-1)}><i className="bi bi-chevron-left" aria-hidden="true"/></button><label>Año<select aria-label="Año" value={anio} onChange={e=>setAnio(Number(e.target.value))}>{Array.from({length:Math.max(new Date().getFullYear()+10,anio)-1899},(_,i)=>1900+i).map(year=><option key={year}>{year}</option>)}</select></label><button type="button" className="fa-icon-button" aria-label="Año siguiente" onClick={()=>setAnio(a=>a+1)}><i className="bi bi-chevron-right" aria-hidden="true"/></button></div>
      <div className="fa-month-grid">{meses.map((mes,index)=>{const periodo=`${anio}-${String(index+1).padStart(2,"0")}`;return <button type="button" key={mes} aria-pressed={value===periodo} aria-label={`${mes} de ${anio}`} onClick={()=>{onChange(periodo);setAbierto(false);}}>{mes}</button>;})}</div>
      <button type="button" className="fa-button secondary" onClick={()=>{onChange("");setAbierto(false);}}>Todos los períodos</button>
    </div></Modal>}
  </>;
}
