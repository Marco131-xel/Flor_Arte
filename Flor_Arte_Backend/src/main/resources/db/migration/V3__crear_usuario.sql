CREATE TABLE usuario (
    id_usuario BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    token VARCHAR(500),
    estado BOOLEAN NOT NULL DEFAULT TRUE,
    id_persona BIGINT NOT NULL UNIQUE,
    CONSTRAINT fk_usuario_persona FOREIGN KEY (id_persona) REFERENCES persona(id_persona)
);