CREATE TABLE arreglo (
    id_arreglo SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE CHECK (btrim(nombre) <> ''),
    descripcion TEXT,
    precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE detalle_arreglo (
    id_detalle_arreglo SERIAL PRIMARY KEY,
    id_arreglo INT NOT NULL REFERENCES arreglo(id_arreglo) ON DELETE CASCADE,
    id_flor INT NOT NULL REFERENCES flor(id_flor),
    cantidad INT NOT NULL CHECK (cantidad > 0),
    UNIQUE (id_arreglo,id_flor)
);
CREATE TABLE pedido_arreglo (
    id_pedido_arreglo SERIAL PRIMARY KEY,
    id_cliente BIGINT NOT NULL REFERENCES persona(id_persona),
    id_empleado BIGINT REFERENCES persona(id_persona),
    id_arreglo INT NOT NULL REFERENCES arreglo(id_arreglo),
    nombre_arreglo VARCHAR(100) NOT NULL,
    cantidad INT NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    precio_unitario NUMERIC(10,2) NOT NULL CHECK (precio_unitario >= 0),
    total NUMERIC(10,2) NOT NULL CHECK (total >= 0),
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE'
        CHECK (estado IN ('PENDIENTE','CONFIRMADO','PREPARANDO','LISTO','ENTREGADO','CANCELADO'))
);
-- Composición por unidad al vender: no depende de ediciones posteriores del catálogo.
CREATE TABLE detalle_pedido_arreglo (
    id_detalle_pedido_arreglo SERIAL PRIMARY KEY,
    id_pedido_arreglo INT NOT NULL REFERENCES pedido_arreglo(id_pedido_arreglo) ON DELETE CASCADE,
    id_flor INT NOT NULL REFERENCES flor(id_flor),
    cantidad INT NOT NULL CHECK (cantidad > 0),
    UNIQUE (id_pedido_arreglo,id_flor)
);
CREATE INDEX idx_pedido_arreglo_fecha ON pedido_arreglo(fecha DESC,id_pedido_arreglo DESC);
CREATE INDEX idx_pedido_arreglo_catalogo ON pedido_arreglo(id_arreglo);
