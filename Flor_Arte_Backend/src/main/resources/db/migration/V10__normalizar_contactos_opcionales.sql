-- Los campos opcionales vacíos no representan un DPI o correo compartido.
UPDATE persona SET dpi = NULL WHERE dpi IS NOT NULL AND btrim(dpi) = '';
UPDATE persona SET correo = NULL WHERE correo IS NOT NULL AND btrim(correo) = '';
UPDATE persona SET telefono = NULL WHERE telefono IS NOT NULL AND btrim(telefono) = '';
