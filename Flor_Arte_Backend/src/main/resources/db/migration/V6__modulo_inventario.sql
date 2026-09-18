-- TABLA ENTRADA INVENTARIO
CREATE TABLE entrada_inventario (
    id_entrada SERIAL PRIMARY KEY,
    id_persona BIGINT NOT NULL,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    CONSTRAINT fk_entrada_proveedor FOREIGN KEY (id_persona) REFERENCES persona(id_persona)
);

-- TABLA DETALLE ENTRADA
CREATE TABLE detalle_entrada (
    id_detalle_entrada SERIAL PRIMARY KEY,
    id_entrada INT NOT NULL,
    id_flor INT NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_compra NUMERIC(10,2) NOT NULL CHECK (precio_compra >= 0),
    subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
    CONSTRAINT fk_detalle_entrada FOREIGN KEY (id_entrada) REFERENCES entrada_inventario(id_entrada) ON DELETE CASCADE,
    CONSTRAINT fk_detalle_entrada_flor FOREIGN KEY (id_flor) REFERENCES flor(id_flor)
);

-- TABLA MOVIMIENTO INVENTARIO
CREATE TABLE movimiento_inventario (
    id_movimiento_inventario SERIAL PRIMARY KEY,
    id_flor INT NOT NULL,
    tipo_movimiento VARCHAR(20) NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    motivo VARCHAR(50) NOT NULL,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_movimiento_flor FOREIGN KEY (id_flor) REFERENCES flor(id_flor),
    CONSTRAINT chk_tipo_movimiento CHECK (tipo_movimiento IN ('ENTRADA', 'SALIDA')),
    CONSTRAINT chk_motivo_movimiento CHECK (motivo IN ('ENTRADA', 'VENTA', 'ARREGLO', 'MERMA'))
);
