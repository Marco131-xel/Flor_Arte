import SelectorMes from "../shared/SelectorMes";
import {nombrePeriodo} from "../../utils/periodo";
import EstadoPedido from "./EstadoPedido";
import { useEffect, useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/apiService";
import { usePagina } from "../../hooks/usePagina";
import { dinero, fechaTexto, mensajeError } from "../../services/gestionService";
import type { Modulo, Registro } from "../../services/gestionService";
import { configuracion, estadosPedido } from "./configuracion";
import Detalle from "./Detalle";
import ImagenFlor from "./ImagenFlor";
import Modal from "../shared/Modal";

export default function Listado({ modulo, personasAdmin = false }: { modulo: Modulo; personasAdmin?: boolean }) {
  const config = configuracion[modulo];
  const navigate = useNavigate();
  const id = useId();
  const admin = localStorage.getItem("role") === "ADMINISTRADOR";
  const [usuario] = useState(() => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } });
  const { filtros, cambiar, data, error, cargando, recargar, desfase } = usePagina(modulo);
  const [estadoPedido,setEstadoPedido]=useState<Registro|null>(null);
  const [ver, setVer] = useState<Registro | null>(null);
  const [eliminar, setEliminar] = useState<Registro | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [errorOperacion, setErrorOperacion] = useState("");
  const [ahora, setAhora] = useState(Date.now);
  const [personaActual, setPersonaActual] = useState<number>();
  useEffect(() => {
    if (!personasAdmin || !usuario.id) return;
    const controller = new AbortController();
    api.get<{ idPersona: number }>(`/user/${usuario.id}`, { signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) setPersonaActual(data.idPersona); })
      .catch(() => { /* El listado mantiene su propio manejo de errores. */ });
    return () => controller.abort();
  }, [personasAdmin, usuario.id]);
  useEffect(() => { const timer = setInterval(() => setAhora(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const esPedido = modulo === "pedidos" || modulo === "pedidosArreglos";
  const esCatalogo = modulo === "flores" || modulo === "arreglos";
  const temporal = ["arreglos", "pedidosArreglos", "flores", "inventario", "mermas", "pedidos"].includes(modulo);
  const propia = (fila: Registro) => (modulo === "usuarios" && fila.id === Number(usuario.id)) || (personasAdmin && fila.id === personaActual);
  const puedeEditar = (fila: Registro) => !propia(fila) && (admin || !temporal || (fila.puedeEditar && !!fila.editableHasta && ahora + desfase < new Date(fila.editableHasta).getTime()));
  const crear = personasAdmin ? "crear-Persona" : config.crear;
  const editar = personasAdmin ? "editar-Persona" : config.editar;
  const conImporte = ["pedidosArreglos", "pedidos", "inventario", "flores"].includes(modulo);
  const contactos = modulo === "personas" || modulo === "usuarios";
  const estados = esPedido ? estadosPedido.map(e => [e,e.toLowerCase()]) : modulo === "flores" ? [["activa","Disponibles"],["inactiva","No disponibles"],["bajo","Stock bajo (1–5)"],["agotada","Agotadas"]] : [["activo","Activos"],["inactivo","Inactivos"]];
  const hayFiltros = !!(filtros.q || filtros.mes || filtros.estado || filtros.rol);
  const borrar = async () => {
    if (!eliminar || ocupado || (!admin && !puedeEditar(eliminar))) return;
    setOcupado(true); setErrorOperacion("");
    try { await api.delete(`/${config.api}/delete/${eliminar.id}`); setEliminar(null); recargar(); }
    catch(err) { setErrorOperacion(mensajeError(err)); }
    finally { setOcupado(false); }
  };
  return <section className="fa-management" aria-labelledby={`${id}-title`}>
    <header className="fa-page-heading"><div><p className="fa-eyebrow">FlorArte / Gestión</p><h1 id={`${id}-title`}><i className={`bi bi-${config.icono}`} aria-hidden="true" />{config.titulo}</h1><p>{config.descripcion}</p></div>
      <div className="fa-heading-actions">
        {modulo === "flores" && <><button className="fa-button secondary" onClick={() => navigate("color")}>Colores</button><button className="fa-button secondary" onClick={() => navigate("tipoflor")}>Tipos de flor</button></>}
        <button className="fa-button" onClick={() => navigate(crear)}><i className="bi bi-plus-lg" aria-hidden="true" />{config.nuevo}</button>
      </div>
    </header>
    <div className="fa-metrics" aria-busy={cargando}>
      <div><span>{hayFiltros ? "Registros encontrados" : "Registros en total"}</span><strong>{cargando ? "…" : data?.totalElementos ?? "—"}</strong><small>{filtros.mes ? `Período: ${nombrePeriodo(filtros.mes)}` : "Todos los períodos"}</small></div>
      {conImporte && <div><span>{modulo === "flores" ? "Valor del stock a precio de venta" : "Importe registrado"}</span><strong>{cargando ? "…" : data ? dinero(data.resumen.importe) : "—"}</strong><small>{esPedido && !filtros.estado ? "Incluye todos los estados" : "Según los filtros seleccionados"}</small></div>}
      {["mermas", "flores", "pedidosArreglos"].includes(modulo) && <div><span>{modulo === "mermas" ? "Unidades dadas de baja" : modulo === "pedidosArreglos" ? "Arreglos pedidos" : "Unidades en inventario"}</span><strong>{cargando ? "…" : data?.resumen.unidades ?? "—"}</strong><small>En todos los resultados del filtro</small></div>}
      <div className="fa-metric-note"><i className={`bi bi-${admin ? "shield-check" : "clock-history"}`} aria-hidden="true" /><span>{admin ? "Panel de administración" : temporal ? "Edición y eliminación durante 30 minutos" : "Directorio de contactos"}</span><small>{admin ? "Control y seguimiento de tus registros" : esPedido ? "Datos y eliminación: 30 minutos. El estado se puede cambiar en cualquier momento." : temporal ? "Desde la creación. Después, solicita un cambio al administrador." : "Clientes y proveedores"}</small></div>
    </div>
    <div className="fa-list-card">
      <div className="fa-filters">
        <label className="fa-search" htmlFor={`${id}-q`}><span>Buscar</span><div><i className="bi bi-search" aria-hidden="true" /><input id={`${id}-q`} maxLength={100} value={filtros.q} onChange={e => cambiar({ q:e.target.value })} placeholder={contactos ? "Nombre, correo o contacto…" : "Nombre o número de registro…"} /></div></label>
        {config.fecha && <label htmlFor={`${id}-mes`}><span>Mes y año</span><SelectorMes id={`${id}-mes`} value={filtros.mes} onChange={mes => cambiar({mes})} /></label>}
        {["flores","pedidos","pedidosArreglos","usuarios"].includes(modulo) && <label htmlFor={`${id}-estado`}><span>Estado</span><select id={`${id}-estado`} value={filtros.estado} onChange={e => cambiar({estado:e.target.value})}><option value="">Todos los estados</option>{estados.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>}
        {contactos && <label htmlFor={`${id}-rol`}><span>Rol</span><select id={`${id}-rol`} value={filtros.rol} onChange={e => cambiar({rol:e.target.value})}><option value="">Todos los roles</option>{(admin ? ["ADMINISTRADOR","EMPLEADO","CLIENTE","PROVEEDOR"] : ["CLIENTE","PROVEEDOR"]).map(rol => <option key={rol}>{rol}</option>)}</select></label>}
        <label htmlFor={`${id}-orden`}><span>Ordenar</span><select id={`${id}-orden`} value={filtros.orden} onChange={e => cambiar({orden:e.target.value})}><option value="recientes">Más recientes</option><option value="antiguos">Más antiguos</option><option value="nombre">Nombre A–Z</option></select></label>
        {hayFiltros && <button className="fa-button tertiary" onClick={() => cambiar({q:"",mes:"",estado:"",rol:""})}>Limpiar filtros</button>}
      </div>
      <div className="fa-table-scroll" tabIndex={0} aria-label={`Tabla de ${config.titulo.toLowerCase()}`} aria-busy={cargando}>
        <table className="fa-table"><thead><tr><th scope="col">Registro</th>{config.fecha && <th scope="col">Fecha</th>}{contactos && <><th scope="col">Contacto</th><th scope="col">Rol</th></>}{esCatalogo && <><th scope="col">Precio</th><th scope="col">Existencias</th></>}{["flores","pedidos","pedidosArreglos","usuarios"].includes(modulo) && <th scope="col">Estado</th>}{["inventario","pedidos","pedidosArreglos"].includes(modulo) && <th scope="col">Total</th>}{["mermas", "pedidosArreglos"].includes(modulo) && <th scope="col">Unidades</th>}<th scope="col" className="fa-actions-heading">Acciones</th></tr></thead>
        <tbody>{cargando ? <tr><td colSpan={8}><div className="fa-empty" role="status"><span className="spinner-border spinner-border-sm" /> Cargando registros…</div></td></tr> : error ? <tr><td colSpan={8}><div className="fa-empty"><p role="alert">{error}</p><button className="fa-button secondary" onClick={recargar}>Reintentar</button></div></td></tr> : !data?.contenido.length ? <tr><td colSpan={8}><div className="fa-empty"><i className="bi bi-inbox" aria-hidden="true" /><h3>{hayFiltros ? "No encontramos coincidencias" : "Aún no hay registros"}</h3><p>{hayFiltros ? "Prueba otro mes o ajusta los filtros." : "Los registros que agregues aparecerán aquí."}</p></div></td></tr> : data.contenido.map(fila => <tr key={fila.id}>
          <td data-label="Registro"><div className="fa-record">{["flores", "arreglos", "pedidosArreglos"].includes(modulo) && fila.imagen ? <ImagenFlor key={fila.imagen} src={fila.imagen} nombre={modulo === "pedidosArreglos" ? fila.secundario || fila.nombre : fila.nombre} /> : <span className="fa-record-icon"><i className={`bi bi-${config.icono}`} aria-hidden="true" /></span>}<div><strong>{fila.nombre}</strong><small>#{fila.id}{fila.secundario ? ` · ${fila.secundario}` : ""}</small></div></div></td>
          {config.fecha && <td data-label="Fecha" className="fa-date">{fechaTexto(fila.fecha)}</td>}
          {contactos && <><td data-label="Contacto"><span className="fa-contact">{fila.correo || "Sin correo"}<small>{fila.telefono}</small></span></td><td data-label="Rol"><span className="fa-badge">{fila.rol}</span></td></>}
          {esCatalogo && <><td data-label="Precio">{dinero(fila.precio)}</td><td data-label="Existencias"><span className={`fa-badge ${(fila.stock ?? 0) <= 5 ? "warning" : "success"}`}>{fila.stock} {modulo === "arreglos" ? "arreglos posibles" : "unidades"}</span></td></>}
          {["flores","pedidos","pedidosArreglos","usuarios"].includes(modulo) && <td data-label="Estado"><span className={`fa-badge ${fila.estado === false || fila.estado === "CANCELADO" ? "muted" : fila.estado === "PENDIENTE" ? "warning" : "success"}`}>{typeof fila.estado === "boolean" ? modulo === "flores" ? fila.estado ? "Disponible" : "No disponible" : fila.estado ? "Activo" : "Inactivo" : fila.estado}</span></td>}
          {["inventario","pedidos","pedidosArreglos"].includes(modulo) && <td data-label="Total" className="fa-amount">{dinero(fila.total)}</td>}
          {["mermas", "pedidosArreglos"].includes(modulo) && <td data-label="Unidades">{fila.cantidad}</td>}
          <td data-label="Acciones"><div className="fa-row-actions"><button className="fa-icon-button" title="Ver detalle" aria-label={`Ver ${config.singular.toLowerCase()} ${fila.id}`} onClick={() => setVer(fila)}><i aria-hidden="true" className="bi bi-eye" /></button>
            <button className="fa-icon-button" disabled={!puedeEditar(fila)} title={propia(fila) ? "Edita tus datos desde Mi perfil" : puedeEditar(fila) ? "Editar" : "Plazo de edición terminado. Contacta al administrador."} aria-label={`Editar ${config.singular.toLowerCase()} ${fila.id}`} onClick={() => navigate(`${editar}/${fila.id}`)}><i aria-hidden="true" className={`bi bi-${puedeEditar(fila) ? "pencil-square" : "lock"}`} /></button>
            {esPedido && <button className="fa-button secondary fa-state-button" aria-label={`Cambiar estado pedido ${fila.id}`} title="Cambiar estado" onClick={()=>setEstadoPedido(fila)}><i className="bi bi-arrow-repeat" aria-hidden="true"/>Estado</button>}
            {(admin || temporal) && !propia(fila) && <button disabled={!admin && !puedeEditar(fila)} className="fa-icon-button danger" aria-label={`Eliminar ${config.singular.toLowerCase()} ${fila.id}`} title={admin || puedeEditar(fila) ? "Eliminar" : "Plazo de eliminación terminado"} onClick={() => {setErrorOperacion("");setEliminar(fila);}}><i aria-hidden="true" className="bi bi-trash3" /></button>}
          </div></td>
        </tr>)}</tbody></table>
      </div>
      <footer className="fa-pagination"><label htmlFor={`${id}-size`}>Mostrar <select id={`${id}-size`} value={filtros.tamano} onChange={e => cambiar({tamano:Number(e.target.value)})}>{[10,20,50].map(n => <option key={n} value={n}>{n}</option>)}</select> por página</label>
        <p aria-live="polite">{data ? `${data.totalElementos ? data.pagina * data.tamano + 1 : 0}–${Math.min((data.pagina+1)*data.tamano,data.totalElementos)} de ${data.totalElementos}` : "…"}</p>
        <nav aria-label={`Paginación de ${config.titulo}`}><button className="fa-icon-button" aria-label="Página anterior" disabled={cargando || !data || data.pagina===0} onClick={() => cambiar({pagina:(data?.pagina ?? 0)-1})}><i aria-hidden="true" className="bi bi-chevron-left" /></button><span>{data ? `${data.pagina+1} / ${Math.max(1,data.totalPaginas)}` : "…"}</span><button className="fa-icon-button" aria-label="Página siguiente" disabled={cargando || !data || data.pagina+1>=data.totalPaginas} onClick={() => cambiar({pagina:(data?.pagina ?? 0)+1})}><i aria-hidden="true" className="bi bi-chevron-right" /></button></nav>
      </footer>
    </div>
    {estadoPedido && <EstadoPedido apiNombre={config.api} id={estadoPedido.id} cerrar={()=>setEstadoPedido(null)} guardado={recargar} />}
    {ver && <Detalle key={ver.id} modulo={modulo} registro={ver} cerrar={() => setVer(null)} />}
    {eliminar && <Modal titulo={`Eliminar ${config.singular.toLowerCase()} #${eliminar.id}`} cerrar={() => setEliminar(null)} ocupado={ocupado}><div className="fa-confirm"><i className="bi bi-exclamation-triangle" aria-hidden="true" /><h3>¿Eliminar este registro?</h3><p><strong>{eliminar.nombre}</strong>. Esta acción no se puede deshacer.</p>{!admin && !puedeEditar(eliminar) && <p className="fa-alert" role="alert">Terminó el plazo de eliminación. Contacta al administrador.</p>}{errorOperacion && <p role="alert" className="fa-alert">{errorOperacion}</p>}<button className="fa-button danger" disabled={ocupado || (!admin && !puedeEditar(eliminar))} onClick={borrar}>{ocupado ? "Eliminando…" : "Confirmar eliminación"}</button></div></Modal>}
  </section>;
}
