-- Instante de creación independiente de la fecha comercial editable.
-- No se abre una nueva ventana de edición a registros anteriores a esta migración.
ALTER TABLE flor ADD COLUMN creado_en TIMESTAMPTZ;
ALTER TABLE entrada_inventario ADD COLUMN creado_en TIMESTAMPTZ;
ALTER TABLE pedido ADD COLUMN creado_en TIMESTAMPTZ;
ALTER TABLE movimiento_inventario ADD COLUMN creado_en TIMESTAMPTZ;
UPDATE flor SET creado_en = CURRENT_TIMESTAMP - INTERVAL '31 minutes';
UPDATE entrada_inventario SET creado_en = CURRENT_TIMESTAMP - INTERVAL '31 minutes';
UPDATE pedido SET creado_en = CURRENT_TIMESTAMP - INTERVAL '31 minutes';
UPDATE movimiento_inventario SET creado_en = CURRENT_TIMESTAMP - INTERVAL '31 minutes';
ALTER TABLE flor ALTER COLUMN creado_en SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN creado_en SET NOT NULL;
ALTER TABLE entrada_inventario ALTER COLUMN creado_en SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN creado_en SET NOT NULL;
ALTER TABLE pedido ALTER COLUMN creado_en SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN creado_en SET NOT NULL;
ALTER TABLE movimiento_inventario ALTER COLUMN creado_en SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN creado_en SET NOT NULL;
CREATE INDEX idx_pedido_fecha_id ON pedido(fecha DESC, id_pedido DESC);
CREATE INDEX idx_entrada_fecha_id ON entrada_inventario(fecha DESC, id_entrada DESC);
CREATE INDEX idx_merma_fecha_id ON movimiento_inventario(motivo, fecha DESC, id_movimiento_inventario DESC);
