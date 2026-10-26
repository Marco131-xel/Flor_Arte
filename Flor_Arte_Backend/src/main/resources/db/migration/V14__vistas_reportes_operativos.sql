-- Una fila por solicitud: los importes de cabecera no se multiplican por sus flores.
CREATE INDEX idx_detalle_entrada_flor_reporte ON detalle_entrada(id_flor,id_entrada);
CREATE VIEW vw_reporte_clientes AS
SELECT 'PEDIDOS'::text AS modulo,p.id_pedido AS id_operacion,p.id_cliente,c.nombre AS cliente,p.fecha,p.estado,1::bigint AS unidades
FROM pedido p JOIN persona c ON c.id_persona=p.id_cliente
UNION ALL
SELECT 'ARREGLOS',p.id_pedido_arreglo,p.id_cliente,c.nombre,p.fecha,p.estado,p.cantidad::bigint
FROM pedido_arreglo p JOIN persona c ON c.id_persona=p.id_cliente
UNION ALL
SELECT 'EVENTOS',e.id_evento,e.id_cliente,c.nombre,e.fecha,e.estado,1::bigint
FROM evento e JOIN persona c ON c.id_persona=e.id_cliente;

-- Flores utilizadas en operaciones finalizadas. Las reservas y solicitudes no son compras concretadas.
CREATE VIEW vw_reporte_demanda_flores AS
SELECT x.modulo,x.id_operacion,x.fecha,x.id_flor,concat(t.nombre,' ',c.nombre) AS flor,x.cantidad
FROM (
    SELECT 'PEDIDOS'::text AS modulo,p.id_pedido AS id_operacion,p.fecha,d.id_flor,d.cantidad::bigint AS cantidad
    FROM pedido p JOIN detalle_pedido d ON d.id_pedido=p.id_pedido WHERE p.estado='ENTREGADO'
    UNION ALL
    SELECT 'ARREGLOS',p.id_pedido_arreglo,p.fecha,d.id_flor,d.cantidad::bigint*p.cantidad::bigint
    FROM pedido_arreglo p JOIN detalle_pedido_arreglo d ON d.id_pedido_arreglo=p.id_pedido_arreglo WHERE p.estado='ENTREGADO'
    UNION ALL
    SELECT 'EVENTOS',e.id_evento,e.fecha,d.id_flor,d.cantidad::bigint
    FROM evento e JOIN detalle_evento d ON d.id_evento=e.id_evento WHERE e.estado IN ('REALIZADO','PAGADO')
) x JOIN flor f ON f.id_flor=x.id_flor JOIN tipo_flor t ON t.id_tipo_flor=f.id_tipo_flor JOIN color c ON c.id_color=f.id_color;

CREATE VIEW vw_reporte_arreglos AS
SELECT p.id_pedido_arreglo,p.id_arreglo,a.nombre AS arreglo,p.id_cliente,p.fecha,p.estado,p.cantidad,p.total
FROM pedido_arreglo p JOIN arreglo a ON a.id_arreglo=p.id_arreglo;

CREATE VIEW vw_reporte_compras AS
SELECT e.id_entrada,e.id_persona AS id_proveedor,p.nombre AS proveedor,e.fecha,e.total
FROM entrada_inventario e JOIN persona p ON p.id_persona=e.id_persona;

CREATE VIEW vw_reporte_compras_flores AS
SELECT e.id_entrada,e.id_persona AS id_proveedor,p.nombre AS proveedor,e.fecha,d.id_flor,
       concat(t.nombre,' ',c.nombre) AS flor,d.cantidad,d.precio_compra,d.subtotal
FROM entrada_inventario e JOIN persona p ON p.id_persona=e.id_persona
JOIN detalle_entrada d ON d.id_entrada=e.id_entrada JOIN flor f ON f.id_flor=d.id_flor
JOIN tipo_flor t ON t.id_tipo_flor=f.id_tipo_flor JOIN color c ON c.id_color=f.id_color;

-- El costo de referencia usa únicamente compras registradas hasta el día de la merma.
-- Si no hay compras, el costo permanece NULL; no se inventa una pérdida igual a cero.
CREATE VIEW vw_reporte_mermas AS
SELECT m.id_movimiento_inventario AS id_merma,m.fecha,m.id_flor,concat(t.nombre,' ',c.nombre) AS flor,
       m.cantidad,f.precio AS precio_venta_actual,
       costo.valor AS costo_referencia,
       round(m.cantidad*costo.valor,2) AS perdida_costo_estimada,
       round(m.cantidad*f.precio,2) AS valor_venta_actual
FROM movimiento_inventario m JOIN flor f ON f.id_flor=m.id_flor
JOIN tipo_flor t ON t.id_tipo_flor=f.id_tipo_flor JOIN color c ON c.id_color=f.id_color
LEFT JOIN LATERAL (
    SELECT sum(d.cantidad::numeric*d.precio_compra)/NULLIF(sum(d.cantidad),0) AS valor
    FROM detalle_entrada d JOIN entrada_inventario e ON e.id_entrada=d.id_entrada
    WHERE d.id_flor=m.id_flor AND e.fecha<=m.fecha
) costo ON TRUE
WHERE m.motivo='MERMA' AND m.tipo_movimiento='SALIDA';
