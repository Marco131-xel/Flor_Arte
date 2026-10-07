CREATE TABLE evento (
    id_evento SERIAL PRIMARY KEY,
    id_cliente BIGINT NOT NULL REFERENCES persona(id_persona),
    id_empleado BIGINT REFERENCES persona(id_persona),
    nombre VARCHAR(150) NOT NULL CHECK (btrim(nombre) <> ''),
    fecha TIMESTAMP NOT NULL,
    dias_preparacion INT NOT NULL DEFAULT 0 CHECK (dias_preparacion BETWEEN 0 AND 365),
    descripcion TEXT,
    ubicacion VARCHAR(250),
    estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE'
        CHECK (estado IN ('PENDIENTE','CONFIRMADO','TRABAJANDO','REALIZADO','PAGADO','CANCELADO')),
    reserva_aplicada BOOLEAN NOT NULL DEFAULT FALSE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_evento_reserva CHECK (reserva_aplicada = (estado IN ('CONFIRMADO','TRABAJANDO','REALIZADO','PAGADO')))
);
CREATE TABLE detalle_evento (
    id_detalle_evento SERIAL PRIMARY KEY,
    id_evento INT NOT NULL REFERENCES evento(id_evento) ON DELETE CASCADE,
    id_flor INT NOT NULL REFERENCES flor(id_flor),
    cantidad INT NOT NULL CHECK (cantidad > 0),
    UNIQUE (id_evento,id_flor)
);
CREATE INDEX idx_evento_fecha ON evento(fecha,id_evento);
CREATE INDEX idx_evento_cliente ON evento(id_cliente);
ALTER TABLE movimiento_inventario DROP CONSTRAINT chk_motivo_movimiento;
ALTER TABLE movimiento_inventario ADD CONSTRAINT chk_motivo_movimiento
    CHECK (motivo IN ('ENTRADA','VENTA','ARREGLO','MERMA','EVENTO'));
