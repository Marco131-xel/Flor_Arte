ALTER TABLE usuario ADD COLUMN twofa_habilitado BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE usuario ADD COLUMN auth_version BIGINT NOT NULL DEFAULT 0 CHECK (auth_version>=0);
CREATE TABLE desafio_2fa (
    id_desafio UUID PRIMARY KEY,
    id_usuario BIGINT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    proposito VARCHAR(15) NOT NULL CHECK (proposito IN ('LOGIN','CONFIGURAR')),
    habilitar BOOLEAN,
    codigo_hash CHAR(64) NOT NULL,
    auth_version BIGINT NOT NULL,
    expira_en TIMESTAMPTZ NOT NULL,
    limite_en TIMESTAMPTZ NOT NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reenviado_en TIMESTAMPTZ NOT NULL,
    intentos INT NOT NULL DEFAULT 0 CHECK (intentos BETWEEN 0 AND 5),
    reenvios INT NOT NULL DEFAULT 0 CHECK (reenvios BETWEEN 0 AND 3),
    utilizado BOOLEAN NOT NULL DEFAULT FALSE,
    CHECK ((proposito='CONFIGURAR')=(habilitar IS NOT NULL))
);
CREATE INDEX idx_desafio_usuario ON desafio_2fa(id_usuario) WHERE NOT utilizado;
CREATE INDEX idx_desafio_expira ON desafio_2fa(limite_en);
CREATE TABLE recuperacion_password (
    token_hash CHAR(64) PRIMARY KEY,
    id_usuario BIGINT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    auth_version BIGINT NOT NULL,
    expira_en TIMESTAMPTZ NOT NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    utilizado BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_recuperacion_usuario ON recuperacion_password(id_usuario) WHERE NOT utilizado;
CREATE INDEX idx_recuperacion_expira ON recuperacion_password(expira_en);
CREATE TABLE limite_autenticacion (
    clave CHAR(64) PRIMARY KEY,
    inicio_en TIMESTAMPTZ NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad>0)
);
CREATE INDEX idx_limite_autenticacion_inicio ON limite_autenticacion(inicio_en);
-- Cubre cambios por recuperación, servicios existentes y correcciones directas.
CREATE FUNCTION revocar_accesos_usuario() RETURNS trigger LANGUAGE plpgsql AS '
BEGIN
    IF NEW.password IS DISTINCT FROM OLD.password OR NEW.email IS DISTINCT FROM OLD.email
       OR NEW.estado IS DISTINCT FROM OLD.estado OR NEW.id_persona IS DISTINCT FROM OLD.id_persona
       OR NEW.twofa_habilitado IS DISTINCT FROM OLD.twofa_habilitado THEN
        NEW.auth_version := OLD.auth_version + 1;
        NEW.token := NULL;
        UPDATE desafio_2fa SET utilizado=TRUE WHERE id_usuario=OLD.id_usuario AND NOT utilizado;
        UPDATE recuperacion_password SET utilizado=TRUE WHERE id_usuario=OLD.id_usuario AND NOT utilizado;
    END IF;
    RETURN NEW;
END;
';
CREATE TRIGGER trg_revocar_accesos_usuario BEFORE UPDATE ON usuario
FOR EACH ROW EXECUTE FUNCTION revocar_accesos_usuario();
