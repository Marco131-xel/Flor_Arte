import { useEffect, useState } from "react";
import { getPersonas, getUsuarios } from "../services/admin/usuarioService";
import { getPedidos } from "../services/shared/pedido/pedidoService";

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
      const datos: Resumen = { ...vacio };
      const fallos: string[] = [];
      const consultas: Promise<void>[] = [
        getPedidos().then((pedidos) => {
          datos.pedidos = pedidos.filter((p) => p.estado === "PENDIENTE").length;
        }).catch(() => { fallos.push("pedidos"); }),
      ];
      if (administrador) {
        consultas.push(
          getPersonas().then((personas) => {
            datos.personas = personas.length;
          }).catch(() => { fallos.push("personas"); }),
          getUsuarios().then((usuarios) => {
            datos.usuarios = usuarios.length;
            datos.activos = usuarios.filter((u) => u.estado).length;
            datos.inactivos = usuarios.filter((u) => !u.estado).length;
          }).catch(() => { fallos.push("usuarios"); }),
        );
      }
      await Promise.all(consultas);
      if (!vigente) return;
      setResumen(datos);
      setErrores(fallos);
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
