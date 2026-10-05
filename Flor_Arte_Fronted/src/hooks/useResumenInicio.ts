import { useEffect, useState } from "react";
import { api } from "../services/apiService";

interface Resumen {
  personas: number | null;
  usuarios: number | null;
  activos: number | null;
  inactivos: number | null;
  pedidos: number | null;
}

const vacio: Resumen = {
  personas: null, usuarios: null, activos: null, inactivos: null, pedidos: null,
};

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

  const valor = (campo: keyof Resumen): string | number =>
    cargando ? "Cargando…" : resumen[campo] ?? "No disponible";

  return { valor, errores, cargando, reintentar };
}
