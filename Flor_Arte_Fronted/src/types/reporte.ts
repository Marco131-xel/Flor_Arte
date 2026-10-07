export interface RangoReporte {desde:string;hasta:string}
export interface RankingReporte {id:number;nombre:string;unidades?:number;solicitudes?:number;compras?:number;importe?:number;sinCosto?:number}
export interface ReporteOperativo {
  periodo:RangoReporte; floresDemandadas:RankingReporte[]; clientesPEDIDOS:RankingReporte[];
  clientesARREGLOS:RankingReporte[]; clientesEVENTOS:RankingReporte[]; arreglosSolicitados:RankingReporte[];
  floresCompradas:RankingReporte[]; proveedores:RankingReporte[];
  gastos:{compras:number;importe:number}; gastosMensuales:{mes:string;compras:number;importe:number}[];
}
export interface ReporteFinanciero {
  periodo:RangoReporte; ingresos:{modulo:"PEDIDOS"|"ARREGLOS"|"EVENTOS";operaciones:number;importe:number;sinImporte:number;fechasEstimadas:number}[];
  totalIngresos:number; gastos:{compras:number;importe:number}; perdidas:{importe:number;unidades:number;sinCosto:number};
  balance:number; floresDesechadas:RankingReporte[];
}
export interface PaginaMermaReporte {
  periodo:RangoReporte;contenido:{id:number;fecha:string;idFlor:number;nombre:string;cantidad:number;costoRegistrado?:boolean;costoUnitario:number|null;importe:number|null}[];
  resumen:{registros:number;unidades:number;importe:number;sinCosto:number};pagina:number;tamano:number;totalElementos:number;totalPaginas:number;
}
