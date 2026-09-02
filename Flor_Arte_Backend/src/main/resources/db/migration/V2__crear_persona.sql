CREATE TABLE persona (
    id_persona BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    dpi VARCHAR(20) UNIQUE,
    correo VARCHAR(150) UNIQUE,
    id_rol BIGINT NOT NULL,
    CONSTRAINT fk_persona_rol FOREIGN KEY (id_rol) REFERENCES rol(id_rol)
);