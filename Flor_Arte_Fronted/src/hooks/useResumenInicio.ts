import { useEffect, useState } from "react";
import { api } from "../services/apiService";

export interface Resumen {
  personas: number|null; usuarios:number|null; activos:number|null; inactivos:number|null;
  pedidos:number|null; pedidosProceso:number|null; pedidosListos:number|null;
  arreglosPendientes:number|null; arreglosProceso:number|null; arreglosListos:number|null;
  eventos:number|null; eventosHoy:number|null; eventosPorCobrar:number|null;
  unidadesStock:number|null; stockBajo:number|null; agotadas:number|null; comprasMes:number|null; mermasMes:number|null;
  ingresosMes:number|null; gastosMes:number|null; perdidasMes:number|null; ingresosSinImporte:number|null; mermasSinCosto:number|null;
  fecha?:string;
  agenda:{id:number;nombre:string;fecha:string;estado:string}[];
  alertasStock:{id:number;nombre:string;stock:number}[];
}
const vacio:Resumen={personas:null,usuarios:null,activos:null,inactivos:null,pedidos:null,pedidosProceso:null,pedidosListos:null,arreglosPendientes:null,arreglosProceso:null,arreglosListos:null,eventos:null,eventosHoy:null,eventosPorCobrar:null,unidadesStock:null,stockBajo:null,agotadas:null,comprasMes:null,mermasMes:null,ingresosMes:null,gastosMes:null,perdidasMes:null,ingresosSinImporte:null,mermasSinCosto:null,agenda:[],alertasStock:[]};

export function useResumenInicio(administrador: boolean) {
  const [resumen, setResumen] = useState<Resumen>(vacio);
  const [errores, setErrores] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    const cargar = async () => {
      try {
        const { data } = await api.get<Partial<Resumen>>("/gestion/resumen");
        if (!vigente) return;
        setResumen({ ...vacio, ...data });
        setErrores([]);
      } catch {
        if (!vigente) return;
        setResumen(vacio);
        setErrores(["resumen"]);
      }
      setCargando(false);
    };
    void cargar();
    return () => { vigente = false; };
  }, [administrador, intento]);

  const reintentar = () => {
    setCargando(true);
    setErrores([]);
    setIntento((valor) => valor + 1);
  };

  const valor = (campo: Exclude<keyof Resumen,"agenda"|"alertasStock">): string | number =>
    cargando ? "Cargando…" : resumen[campo] ?? "No disponible";

  return { resumen, valor, errores, cargando, reintentar };
}
