import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import type { Persona } from "../../../types/user";
import { 
    getPersonas,
    deletePersona
} from "../../../services/admin/usuarioService";
import "../../../styles/empleado/table.css";

const ROLES_VISIBLES = ["CLIENTE", "PROVEEDOR"];

function IndexPersonas() {
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const [busqueda, setBusqueda] = useState("");

    const [personaAVer, setPersonaAVer] = useState<Persona | null>(null);
    const [personaAEliminar, setPersonaAEliminar] = useState<Persona | null>(null);
    const [eliminando, setEliminando] = useState(false);

    useEffect(() => {
        cargarPersonas();
    }, []);

    useEffect(() => {
        const hayModalAbierto = personaAVer !== null || personaAEliminar !== null;
        document.body.style.overflow = hayModalAbierto ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [personaAVer, personaAEliminar]);

    const cargarPersonas = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await getPersonas();
            setPersonas(data);
        } catch (error) {
            console.error("Error al cargar a personas: ", error);
            setError("No se pudieron cargar las personas");
        } finally {
            setLoading(false);
        }
    };

    // Solo Clientes y Proveedores en esta vista de empleado
    const personasVisibles = useMemo(
        () => personas.filter((p) => ROLES_VISIBLES.includes(p.tipoRol?.toUpperCase())),
        [personas]
    );

    const personasFiltradas = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();
        if (!termino) return personasVisibles;
        return personasVisibles.filter((p) => p.nombre.toLowerCase().includes(termino));
    }, [personasVisibles, busqueda]);

    const confirmarEliminar = async () => {
        if (!personaAEliminar) return;
        try {
            setEliminando(true);
            await deletePersona(personaAEliminar.idPersona);
            setPersonas((prev) =>
                prev.filter((p) => p.idPersona !== personaAEliminar.idPersona)
            );
            setPersonaAEliminar(null);
        } catch (error) {
            console.error("Error al eliminar persona:", error);
            setError("No se pudo eliminar la persona");
        } finally {
            setEliminando(false);
        }
    };

    const badgeClase = (rol: string) =>
        rol?.toUpperCase() === "CLIENTE" ? "personas-badge-cliente" : "personas-badge-proveedor";

    return (
        <div className="personas-page">
            {/* ENCABEZADO */}
            <div className="personas-header">
                <div>
                    <h1 className="personas-title">Personas</h1>
                    <p className="personas-subtitle">Gestiona los Clientes y Proveedores</p>
                </div>
                <button
                    className="personas-btn-primary"
                    onClick={() => navigate("/empleado/personas/create")}
                >
                    <i className="bi bi-person-plus"></i>
                    <span>Nueva persona</span>
                </button>
            </div>

            {/* BUSCADOR */}
            <div className="personas-search-box">
                <i className="bi bi-search"></i>
                <input
                    type="text"
                    className="personas-search-input"
                    placeholder="Buscar persona por nombre..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
                {busqueda && (
                    <button
                        type="button"
                        className="personas-search-clear"
                        onClick={() => setBusqueda("")}
                        title="Limpiar búsqueda"
                    >
                        <i className="bi bi-x-lg"></i>
                    </button>
                )}
            </div>

            {loading && <div className="personas-state-box">Cargando personas...</div>}
            {error && <div className="personas-error-box">{error}</div>}

            {!loading && !error && (
                <div className="personas-table-card">
                    <table className="personas-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Correo</th>
                                <th>Rol</th>
                                <th className="personas-th-acciones">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {personasVisibles.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="personas-empty-row">
                                        No hay clientes ni proveedores registrados
                                    </td>
                                </tr>
                            ) : personasFiltradas.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="personas-empty-row">
                                        No se encontraron personas con "{busqueda}"
                                    </td>
                                </tr>
                            ) : (
                                personasFiltradas.map((persona) => (
                                    <tr key={persona.idPersona} className="personas-tr">
                                        <td className="personas-td-muted">{persona.idPersona}</td>
                                        <td className="personas-td-nombre">{persona.nombre}</td>
                                        <td className="personas-td-muted">{persona.correo}</td>
                                        <td>
                                            <span className={`personas-badge ${badgeClase(persona.tipoRol)}`}>
                                                {persona.tipoRol}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="personas-acciones">
                                                <button
                                                    className="personas-icon-btn personas-icon-btn-view"
                                                    onClick={() => setPersonaAVer(persona)}
                                                    title="Ver"
                                                >
                                                    <i className="bi bi-eye"></i>
                                                </button>
                                                <button
                                                    className="personas-icon-btn personas-icon-btn-edit"
                                                    onClick={() => navigate(`/empleado/personas/update/${persona.idPersona}`)}
                                                    title="Editar"
                                                >
                                                    <i className="bi bi-pencil-square"></i>
                                                </button>
                                                <button
                                                    className="personas-icon-btn personas-icon-btn-delete"
                                                    onClick={() => setPersonaAEliminar(persona)}
                                                    title="Eliminar"
                                                >
                                                    <i className="bi bi-trash3"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* MODAL "VER PERSONA" */}
            {personaAVer && createPortal(
                <div className="personas-overlay" onClick={() => setPersonaAVer(null)}>
                    <div className="personas-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="personas-modal-header">
                            <div>
                                <h2 className="personas-modal-title">{personaAVer.nombre}</h2>
                                <span className={`personas-badge ${badgeClase(personaAVer.tipoRol)}`}>
                                    {personaAVer.tipoRol}
                                </span>
                            </div>
                            <button className="personas-close-x" onClick={() => setPersonaAVer(null)}>
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>

                        <div className="personas-modal-body">
                            <div className="personas-info-row">
                                <span className="personas-info-label">ID</span>
                                <span className="personas-info-value">{personaAVer.idPersona}</span>
                            </div>
                            <div className="personas-info-row">
                                <span className="personas-info-label">Correo</span>
                                <span className="personas-info-value">{personaAVer.correo}</span>
                            </div>
                            <div className="personas-info-row">
                                <span className="personas-info-label">Teléfono</span>
                                <span className="personas-info-value">{personaAVer.telefono}</span>
                            </div>
                            <div className="personas-info-row">
                                <span className="personas-info-label">DPI</span>
                                <span className="personas-info-value">{personaAVer.dpi}</span>
                            </div>
                        </div>

                        <div className="personas-modal-footer">
                            <button className="personas-btn-secondary" onClick={() => setPersonaAVer(null)}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* MODAL ELIMINAR PERSONA */}
            {personaAEliminar && createPortal(
                <div className="personas-overlay" onClick={() => !eliminando && setPersonaAEliminar(null)}>
                    <div className="personas-modal personas-modal-danger" onClick={(e) => e.stopPropagation()}>
                        <div className="personas-danger-icon">
                            <i className="bi bi-exclamation-triangle"></i>
                        </div>
                        <h2 className="personas-modal-title-centered">¿Eliminar persona?</h2>
                        <p className="personas-modal-text">
                            Esta acción eliminará permanentemente a{" "}
                            <strong>{personaAEliminar.nombre}</strong>. No se puede deshacer.
                        </p>
                        <div className="personas-modal-footer-centered">
                            <button
                                className="personas-btn-secondary"
                                onClick={() => setPersonaAEliminar(null)}
                                disabled={eliminando}
                            >
                                Cancelar
                            </button>
                            <button
                                className="personas-btn-danger"
                                onClick={confirmarEliminar}
                                disabled={eliminando}
                            >
                                {eliminando ? "Eliminando..." : "Sí, eliminar"}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

export default IndexPersonas;