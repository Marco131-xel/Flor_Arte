import { useEffect, useState } from "react";
import { cargarPagina, mensajeError } from "../services/gestionService";
import type { Filtros, Modulo, Pagina } from "../services/gestionService";

export function usePagina(modulo: Modulo) {
  const [filtros, setFiltros] = useState<Filtros>({ pagina: 0, tamano: 10, q: "", mes: "", estado: "", rol: "", orden: "recientes" });
  const [version, setVersion] = useState(0);
  const clave = JSON.stringify([modulo, filtros, version]);
  const [resultado, setResultado] = useState<{clave: string; data?: Pagina; error?: string; recibido: number}>({ clave: "", recibido: 0 });
  useEffect(() => {
    const controller = new AbortController();
    const [tipo, params] = JSON.parse(clave) as [Modulo, Filtros, number];
    const timer = setTimeout(() => {
      cargarPagina(tipo, params, controller.signal).then(data => {
        if (!controller.signal.aborted) setResultado({ clave, data, recibido: Date.now() });
      }).catch(err => {
        if (!controller.signal.aborted) setResultado({ clave, error: mensajeError(err), recibido: Date.now() });
      });
    }, params.q ? 300 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [clave]);
  const cargando = resultado.clave !== clave;
  const cambiar = (cambio: Partial<Filtros>) => setFiltros(prev => ({ ...prev, ...cambio, pagina: cambio.pagina ?? 0 }));
  return { filtros, cambiar, cargando, data: cargando ? undefined : resultado.data, error: cargando ? undefined : resultado.error,
    desfase: resultado.data ? new Date(resultado.data.horaServidor).getTime() - resultado.recibido : 0,
    recargar: () => setVersion(v => v + 1) };
}
