-- INSERTS PARA ROLES
INSERT INTO rol (tipo) VALUES
                           ('ADMINISTRADOR'),
                           ('EMPLEADO'),
                           ('CLIENTE'),
                           ('PROVEEDOR');

-- INSERTA PARA CREAR AL ADMINISTRADOR
INSERT INTO persona (nombre, telefono, dpi, correo, id_rol) VALUES
                                                                ('Marco Chiché', '53438485', '3357975470901', 'marcopoolchichesapon@gmail.com', 1);
INSERT INTO persona (nombre, telefono, dpi, correo, id_rol) VALUES
                                                                ('Ilse Sapón', '35847828', '217718000901', 'jadestrella7@gmail.com', 2);
INSERT INTO usuario (name, email, password, token, estado, id_persona) VALUES
                                                                           ('M4RC0', 'marcopoolchichesapon@gmail.com', '$2a$10$olma6oC9nuIqg5TIXXN5w.ooQ.C82.3e0EfEgvpa4oq5bUEVlkPNO', NULL, true, 1);
INSERT INTO usuario (name, email, password, token, estado, id_persona) VALUES
                                                                           ('MISTICA', 'jadestrella7@gmail.com', '$2a$10$8.WlIzo64dQm10oCzXeSg.HZdfHbrKpMB2lZegJlWxPiHPFb6Tf0y', NULL, true, 2);