import {Link} from "react-router-dom";
import type {Resumen} from "../../hooks/useResumenInicio";
import {dinero,fechaTexto} from "../../services/gestionService";
export default function ActividadInicio({resumen,cargando,error,administrador}:{resumen:Resumen;cargando:boolean;error:boolean;administrador:boolean}) {
  const base=administrador?"/admin":"/empleado";
  const estado=cargando?"Cargando…":error?"No disponible":null;
  const importe=(n:number|null)=>estado||(n==null?"No disponible":dinero(n));
  return <>
    {administrador&&<section className="inicio-section inicio-finance" aria-busy={cargando}><h2 className="inicio-section-title">Finanzas del mes actual</h2><div className="fa-metrics">
      <div><span>Ingresos registrados</span><strong>{importe(resumen.ingresosMes)}</strong><small>Pedidos y arreglos entregados; eventos pagados</small></div>
      <div><span>Compras de inventario</span><strong>{importe(resumen.gastosMes)}</strong><small>Entradas registradas este mes</small></div>
      <div><span>Balance de ingresos y compras</span><strong>{importe(resumen.ingresosMes==null||resumen.gastosMes==null?null:resumen.ingresosMes-resumen.gastosMes)}</strong><small>No representa ganancia neta</small></div>
      <div><span>Pérdidas por merma</span><strong>{importe(resumen.perdidasMes)}</strong><small>Costo guardado o referencia estimada para registros antiguos</small></div>
    </div>{!estado&&(!!resumen.ingresosSinImporte||!!resumen.mermasSinCosto)&&<p className="fa-alert">Totales parciales: {resumen.ingresosSinImporte??0} ingresos sin importe y {resumen.mermasSinCosto??0} mermas sin costo.</p>}
    <div className="inicio-finance-footer"><p><i className="bi bi-wallet2" aria-hidden="true" /> Eventos realizados pendientes de pago: <strong>{estado??resumen.eventosPorCobrar??"No disponible"}</strong></p><Link className="inicio-section-link" to={`${base}/reportes`}>Consultar reportes <i className="bi bi-arrow-up-right" aria-hidden="true" /></Link></div></section>}
    <div className="inicio-activity-grid" aria-busy={cargando}>
      <section className="inicio-activity-card inicio-activity-events"><div className="inicio-activity-heading"><span className="inicio-activity-icon"><i className="bi bi-calendar-event" aria-hidden="true" /></span><h2>Próximos eventos</h2><Link className="inicio-section-link" to={`${base}/eventos`}>Ver calendario <i className="bi bi-arrow-up-right" aria-hidden="true" /></Link></div><p className="text-secondary small">Próximos 7 días · Hasta 5 eventos</p>
        {estado?<p role="status">{estado}</p>:resumen.agenda.length?<ul>{resumen.agenda.map(e=><li key={e.id}><Link className="inicio-activity-record" to={`${base}/eventos`}><span className="inicio-record-icon"><i className="bi bi-calendar2-check" aria-hidden="true" /></span><span className="inicio-record-copy"><strong>{e.nombre}</strong><span>{fechaTexto(e.fecha)}</span></span><span className={`fa-badge ev-status-${e.estado.toLowerCase()}`}>{e.estado.toLowerCase()}</span></Link></li>)}</ul>:<p className="inicio-activity-empty"><i className="bi bi-calendar2" aria-hidden="true" />No hay eventos próximos registrados.</p>}
      </section>
      <section className="inicio-activity-card inicio-activity-stock"><div className="inicio-activity-heading"><span className="inicio-activity-icon"><i className="bi bi-flower3" aria-hidden="true" /></span><h2>Atención al inventario</h2><Link className="inicio-section-link" to={`${base}/flores`}>Ver flores <i className="bi bi-arrow-up-right" aria-hidden="true" /></Link></div><p className="text-secondary small">Flores disponibles con 5 unidades o menos · Hasta 5 variedades</p>
        {estado?<p role="status">{estado}</p>:resumen.alertasStock.length?<ul>{resumen.alertasStock.map(f=><li key={f.id}><Link className="inicio-activity-record" to={`${base}/flores`}><span className="inicio-record-icon"><i className="bi bi-box-seam" aria-hidden="true" /></span><span className="inicio-record-copy"><strong>{f.nombre}</strong><span>{f.stock===0?"Agotada":`${f.stock} unidades disponibles`}</span></span><span className={`fa-badge ${f.stock===0?"muted":"warning"}`}>{f.stock===0?"Sin stock":"Stock bajo"}</span></Link></li>)}</ul>:<p className="inicio-activity-empty"><i className="bi bi-check-circle" aria-hidden="true" />No hay alertas de stock bajo.</p>}
      </section>
    </div>
  </>;
}
