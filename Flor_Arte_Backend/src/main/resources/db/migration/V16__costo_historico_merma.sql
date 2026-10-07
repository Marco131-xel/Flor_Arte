-- El costo guardado no cambia al modificar compras o precios de venta.
-- Las mermas anteriores sin costo conservan la referencia estimada de las compras.
ALTER TABLE movimiento_inventario ADD COLUMN costo_unitario NUMERIC(16,6) CHECK (costo_unitario>=0);
CREATE OR REPLACE VIEW vw_reporte_mermas AS
SELECT m.id_movimiento_inventario AS id_merma,m.fecha,m.id_flor,concat(t.nombre,' ',c.nombre) AS flor,
       m.cantidad,f.precio AS precio_venta_actual,
       coalesce(m.costo_unitario,costo.valor) AS costo_referencia,
       round(m.cantidad*coalesce(m.costo_unitario,costo.valor),2) AS perdida_costo_estimada,
       round(m.cantidad*f.precio,2) AS valor_venta_actual, m.costo_unitario IS NOT NULL AS costo_registrado
FROM movimiento_inventario m JOIN flor f ON f.id_flor=m.id_flor
JOIN tipo_flor t ON t.id_tipo_flor=f.id_tipo_flor JOIN color c ON c.id_color=f.id_color
LEFT JOIN LATERAL (
    SELECT sum(d.cantidad::numeric*d.precio_compra)/NULLIF(sum(d.cantidad),0) AS valor
    FROM detalle_entrada d JOIN entrada_inventario e ON e.id_entrada=d.id_entrada
    WHERE d.id_flor=m.id_flor AND e.fecha<=m.fecha
) costo ON TRUE
WHERE m.motivo='MERMA' AND m.tipo_movimiento='SALIDA';
