CREATE TABLE comprobante (
    id_comprobante BIGSERIAL PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('PEDIDO','ARREGLO','EVENTO','INVENTARIO')),
    id_origen INT NOT NULL CHECK (id_origen>0),
    documento JSONB NOT NULL CHECK (jsonb_typeof(documento)='object'),
    emitido_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    emitido_por VARCHAR(100) NOT NULL,
    UNIQUE(tipo,id_origen)
);
-- El documento permanece aunque se corrija o elimine la operación original.
CREATE INDEX idx_comprobante_fecha ON comprobante(emitido_en DESC,id_comprobante DESC);
