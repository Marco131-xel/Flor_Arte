-- TABLA PEDIDO
CREATE TABLE pedido (
    id_pedido SERIAL PRIMARY KEY,
    id_cliente BIGINT NOT NULL,
    id_empleado BIGINT,
    estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
    total NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    CONSTRAINT fk_pedido_cliente FOREIGN KEY (id_cliente) REFERENCES persona(id_persona),
    CONSTRAINT fk_pedido_empleado FOREIGN KEY (id_empleado) REFERENCES persona(id_persona),
    CONSTRAINT chk_estado_pedido
        CHECK (
            estado IN (
                'PENDIENTE',
                'CONFIRMADO',
                'PREPARANDO',
                'LISTO',
                'ENTREGADO',
                'CANCELADO'
            )
        )
);

-- TABLA DETALLE PEDIDO
CREATE TABLE detalle_pedido (
    id_detalle_pedido SERIAL PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_flor INT NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
    subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
    CONSTRAINT fk_detalle_pedido FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido) ON DELETE CASCADE,
    CONSTRAINT fk_detalle_pedido_flor FOREIGN KEY (id_flor) REFERENCES flor(id_flor)
);
