-- TABLA COLOR
CREATE TABLE color (
    id_color SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- TABLA TIPO FLOR
CREATE TABLE tipo_flor (
    id_tipo_flor SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT
);

-- TABLA FLOR
CREATE TABLE flor (
    id_flor SERIAL PRIMARY KEY,
    id_tipo_flor INT NOT NULL,
    id_color INT NOT NULL,
    precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    estado BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_flor_tipo FOREIGN KEY (id_tipo_flor) REFERENCES tipo_flor(id_tipo_flor),
    CONSTRAINT fk_flor_color FOREIGN KEY (id_color) REFERENCES color(id_color),
    CONSTRAINT uq_flor_tipo_color UNIQUE (id_tipo_flor, id_color)
);

-- INSERTS PARA COLOR
INSERT INTO color (nombre) VALUES
    ('Rojo'),
    ('Rosa'),
    ('Rosa claro'),
    ('Rosa fucsia'),
    ('Blanco'),
    ('Crema'),
    ('Marfil'),
    ('Amarillo'),
    ('Amarillo limón'),
    ('Dorado'),
    ('Naranja'),
    ('Durazno'),
    ('Melocotón'),
    ('Coral'),
    ('Salmón'),
    ('Lila'),
    ('Lavanda'),
    ('Morado'),
    ('Violeta'),
    ('Púrpura'),
    ('Azul'),
    ('Azul cielo'),
    ('Azul marino'),
    ('Turquesa'),
    ('Verde'),
    ('Verde menta'),
    ('Verde oliva'),
    ('Verde esmeralda'),
    ('Marrón'),
    ('Chocolate'),
    ('Bronce'),
    ('Bordeaux'),
    ('Granate'),
    ('Bicolor rojo-blanco'),
    ('Bicolor amarillo-rojo'),
    ('Bicolor rosa-blanco'),
    ('Bicolor morado-blanco'),
    ('Multicolor');

-- INSERTS PARA TIPO FLOR
INSERT INTO tipo_flor (nombre, descripcion) VALUES
    ('Rosa', 'Flor clásica y símbolo del amor. Disponible en múltiples colores y variedades como té híbrida, spray y jardín.'),
    ('Tulipán', 'Flor bulbosa originaria de Holanda. Elegante y sencilla, ideal para arreglos primaverales.'),
    ('Girasol', 'Flor grande y radiante de color amarillo intenso. Simboliza alegría y vitalidad.'),
    ('Clavel', 'Flor resistente y duradera, con pétalos rizados. Muy usada en ramos y arreglos florales.'),
    ('Lirio', 'Flor elegante y aromática, con pétalos grandes. Símbolo de pureza y refinamiento.'),
    ('Margarita', 'Flor sencilla y alegre con centro amarillo y pétalos blancos. Muy versátil en arreglos.'),
    ('Orquídea', 'Flor exótica y sofisticada. Existen miles de especies, siendo las más comunes Phalaenopsis y Cattleya.'),
    ('Peonía', 'Flor voluminosa y aromática, símbolo de prosperidad. Muy apreciada en bodas.'),
    ('Hortensia', 'Flor en forma de bola compuesta por pequeñas flores. Disponible en azul, rosa, blanco y morado.'),
    ('Crisantemo', 'Flor otoñal con múltiples pétalos. Símbolo de longevidad en algunas culturas.'),
    ('Narciso', 'Flor bulbosa de invierno/primavera con centro en forma de trompeta. Aroma intenso.'),
    ('Jacinto', 'Flor bulbosa aromática, agrupada en racimos. Disponible en azul, rosa, blanco y amarillo.'),
    ('Dalia', 'Flor con pétalos puntiagudos y colores vibrantes. Originaria de México.'),
    ('Gerbera', 'Flor similar a la margarita pero más grande y colorida. Muy usada en ramos modernos.'),
    ('Alstroemeria', 'También llamada lirio del Perú. Flor duradera con pétalos atigrados.'),
    ('Freesia', 'Flor perfumada en forma de trompeta, ideal para ramos aromáticos.'),
    ('Anémona', 'Flor con centro oscuro y pétalos vibrantes. Muy usada en arreglos primaverales.'),
    ('Ranúnculo', 'Flor de pétalos finos y múltiples capas, similar a la peonía. Muy elegante.'),
    ('Lisianthus', 'Flor con aspecto de rosa pero más delicada. Símbolo de gratitud.'),
    ('Astromelia', 'Flor resistente con pétalos atigrados. Ideal para ramos duraderos.'),
    ('Caléndula', 'Flor medicinal de color naranja o amarillo. Usada en cosmética natural.'),
    ('Amapola', 'Flor silvestre de pétalos finos y delicados. Símbolo de recuerdo.'),
    ('Campanilla', 'Flor en forma de campana colgante. Disponible en blanco, azul y rosa.'),
    ('Nomeolvides', 'Pequeña flor azul que simboliza el amor eterno y el recuerdo.'),
    ('Begonia', 'Flor ornamental con múltiples variedades y colores vivos.'),
    ('Azalea', 'Arbusto florido con flores en forma de trompeta. Muy usado en jardinería.'),
    ('Camelia', 'Flor elegante de invierno, símbolo de admiración. Disponible en rosa, rojo y blanco.'),
    ('Gardenia', 'Flor blanca de aroma intenso y dulce. Símbolo de pureza y amor secreto.'),
    ('Jazmín', 'Flor pequeña y muy aromática. Usada en perfumería y arreglos delicados.'),
    ('Loto', 'Flor acuática sagrada. Símbolo de pureza y renacimiento.'),
    ('Protea', 'Flor exótica sudafricana, grande y llamativa. Símbolo de diversidad y coraje.'),
    ('Ave del paraíso', 'Flor exótica con forma de ave. Originaria de Sudáfrica.'),
    ('Anturio', 'Flor tropical en forma de corazón. Muy duradera y llamativa.'),
    ('Heliconia', 'Flor tropical con brácteas de colores vivos. Similar a un pico de loro.'),
    ('Iris', 'Flor con forma de espada y pétalos caídos. Símbolo de fe y esperanza.'),
    ('Verbena', 'Flor pequeña agrupada en racimos. Muy usada en ramos silvestres.'),
    ('Statice', 'Flor seca natural, ideal para arreglos duraderos. Disponible en morado, azul y rosa.'),
    ('Gypsophila', 'También llamada "nube" o "lluvia de amor". Pequeñas flores blancas usadas como relleno.'),
    ('Solidago', 'Flor amarilla en racimos, usada como relleno en arreglos florales.');