ALTER TABLE evento ADD COLUMN importe NUMERIC(10,2) CHECK (importe>=0);
ALTER TABLE evento ADD COLUMN fecha_pago TIMESTAMP;
CREATE INDEX idx_evento_fecha_pago_reporte ON evento(fecha_pago) WHERE estado='PAGADO';
-- Los eventos históricos no tenían precio ni fecha de pago. Se conservan como desconocidos.
CREATE VIEW vw_reporte_ingresos AS
SELECT 'PEDIDOS'::text AS modulo,id_pedido AS id_operacion,id_cliente,fecha,total AS importe,false AS fecha_estimada
FROM pedido WHERE estado='ENTREGADO'
UNION ALL
SELECT 'ARREGLOS',id_pedido_arreglo,id_cliente,fecha,total,false
FROM pedido_arreglo WHERE estado='ENTREGADO'
UNION ALL
SELECT 'EVENTOS',id_evento,id_cliente,coalesce(fecha_pago,fecha),importe,fecha_pago IS NULL
FROM evento WHERE estado='PAGADO';

CREATE VIEW vw_reporte_ingresos_diarios AS
SELECT modulo,fecha::date AS fecha,count(*) AS operaciones,sum(importe) AS importe,
       count(*) FILTER (WHERE importe IS NULL) AS sin_importe,count(*) FILTER (WHERE fecha_estimada) AS fechas_estimadas
FROM vw_reporte_ingresos GROUP BY modulo,fecha::date;

CREATE VIEW vw_reporte_perdidas_diarias AS
SELECT fecha::date AS fecha,sum(cantidad) AS unidades,sum(perdida_costo_estimada) AS importe,
       count(*) FILTER (WHERE costo_referencia IS NULL) AS sin_costo
FROM vw_reporte_mermas GROUP BY fecha::date;

CREATE VIEW vw_reporte_gastos_mensuales AS
SELECT date_trunc('month',fecha)::date AS mes,count(*) AS compras,sum(total) AS importe
FROM vw_reporte_compras GROUP BY date_trunc('month',fecha)::date;
