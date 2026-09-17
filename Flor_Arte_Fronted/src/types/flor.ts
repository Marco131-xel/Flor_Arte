export interface Color {
    idColor: number;
    nombre: string;
}

export interface TipoFlor {
    idTipoFlor: number;
    nombre: string;
    descripcion: string;
}

export interface Flor {
    idFlor: number;
    idTipoFlor: number;
    nombreTipoFlor: string;
    idColor: number;
    nombreColor: string;
    precio: number;
    stock: number;
    estado: boolean;
}

export interface NewColor {
    nombre: string;
}

export interface NewTipoFlor {
    nombre: string;
    descripcion: string;
}

export interface NewFlor {
    idTipoFlor: number;
    idColor: number;
    precio: number;
    stock: number;
}