import type {Comprobante} from '../../../types/comprobante';
import {nombresComprobante,numeroComprobante} from '../../../types/comprobante';
import {dinero,fechaTexto} from '../../../services/gestionService';
export default function Documento({comprobante:c}:{comprobante:Comprobante}){
 const d=c.documento;
 return <article className="rc-document"><header className="rc-company"><img src="/images/florarte.png" alt="Logo de FlorArte"/><div><h2>{d.empresa.nombre}</h2><p>{d.empresa.direccion}</p><p>{d.empresa.telefono} · {d.empresa.correo}</p></div></header>
 <div className="rc-document-title"><h3>{nombresComprobante[c.tipo]}</h3><strong>{numeroComprobante(c)}</strong></div>
 <p className="rc-meta">Emisión: {fechaTexto(c.emitidoEn)} · {c.tipo} #{c.idOrigen}</p>
 <dl className="fa-detail-grid rc-party"><div><dt>{c.tipo==='INVENTARIO'?'Proveedor':'Cliente'}</dt><dd>{d.persona}</dd></div><div><dt>Fecha de la operación</dt><dd>{fechaTexto(d.fecha)}</dd></div><div><dt>Estado al emitir</dt><dd><span className="fa-badge">{d.estado.toLowerCase()}</span></dd></div><div><dt>Atendido por</dt><dd>{d.responsable||'Sin asignar'}</dd></div>{d.telefono&&<div><dt>Teléfono</dt><dd>{d.telefono}</dd></div>}{d.correo&&<div><dt>Correo</dt><dd>{d.correo}</dd></div>}</dl>
 <div className="fa-table-scroll"><table className="fa-table"><thead><tr><th>Cantidad</th><th>Descripción</th><th>Precio unitario</th><th>Subtotal</th></tr></thead><tbody>{d.lineas.map((l,i)=><tr key={i}><td data-label="Cantidad">{l.cantidad}</td><td data-label="Descripción">{l.descripcion}</td><td data-label="Precio unitario">{dinero(l.precio)}</td><td data-label="Subtotal">{dinero(l.subtotal)}</td></tr>)}</tbody></table></div>
 <div className="rc-total"><span>Total registrado</span><strong>{dinero(d.total)}</strong></div><footer className="rc-document-footer"><p>{c.tipo==='INVENTARIO'?'Detalle de la compra registrada en inventario.':'Gracias por confiar en FlorArte.'}</p><small>Documento de la operación registrada. No confirma por sí solo el pago.</small></footer></article>;
}
