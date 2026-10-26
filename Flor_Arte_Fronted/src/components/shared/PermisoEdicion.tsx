import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../services/apiService";
import { mensajeError } from "../../services/gestionService";
import {useVolverFormulario} from "../../hooks/useVolverFormulario";
export default function PermisoEdicion({ modulo, children }: { modulo: string; children: ReactNode }) {
  const { id } = useParams();
  const volver=useVolverFormulario();
  const admin = localStorage.getItem("role") === "ADMINISTRADOR";
  const [resultado, setResultado] = useState<{id?: string; limite: number; permitido: boolean; error?: string} | null>(null);
  const [ahora, setAhora] = useState(Date.now);
  useEffect(() => {
    if (admin) return;
    const controller = new AbortController();
    api.get<{puedeEditar:boolean; editableHasta:string; horaServidor:string}>(`/gestion/${modulo}/${id}/permiso`, { signal: controller.signal }).then(({data}) => {
      if (!controller.signal.aborted) setResultado({id, permitido:data.puedeEditar, limite: Date.now() + new Date(data.editableHasta).getTime() - new Date(data.horaServidor).getTime()});
    }).catch(err => { if (!controller.signal.aborted) setResultado({id, permitido:false, limite:0, error:mensajeError(err)}); });
    const timer = setInterval(() => setAhora(Date.now()),1000);
    return () => {controller.abort();clearInterval(timer);};
  }, [modulo,id,admin]);
  if (admin) return <>{children}</>;
  if (!resultado || resultado.id!==id) return <div className="fa-empty" role="status">Comprobando el plazo de edición…</div>;
  if (!resultado.permitido || ahora>=resultado.limite) return <section className="fa-permission"><i aria-hidden="true" className="bi bi-lock" /><h1>Edición no disponible</h1><p>{resultado.error || "Los empleados pueden editar durante los primeros 30 minutos desde la creación. Solicita el cambio al administrador."}</p><button className="fa-button secondary" onClick={volver}>Volver al listado</button></section>;
  return <><p className="fa-edit-notice" role="status"><i aria-hidden="true" className="bi bi-clock" /> Puedes guardar cambios durante {Math.max(0,Math.ceil((resultado.limite-ahora)/60000))} minutos más.</p>{children}</>;
}
