-- No altera filas existentes al instalarse. Revoca solo ante futuros cambios de rol.
CREATE FUNCTION revocar_accesos_por_rol() RETURNS trigger LANGUAGE plpgsql AS '
BEGIN
    IF NEW.id_rol IS DISTINCT FROM OLD.id_rol THEN
        UPDATE usuario SET auth_version=auth_version+1, token=NULL WHERE id_persona=NEW.id_persona;
        UPDATE desafio_2fa SET utilizado=TRUE WHERE id_usuario IN
            (SELECT id_usuario FROM usuario WHERE id_persona=NEW.id_persona) AND NOT utilizado;
        UPDATE recuperacion_password SET utilizado=TRUE WHERE id_usuario IN
            (SELECT id_usuario FROM usuario WHERE id_persona=NEW.id_persona) AND NOT utilizado;
    END IF;
    RETURN NEW;
END;
';
CREATE TRIGGER trg_revocar_accesos_por_rol AFTER UPDATE OF id_rol ON persona
FOR EACH ROW EXECUTE FUNCTION revocar_accesos_por_rol();
