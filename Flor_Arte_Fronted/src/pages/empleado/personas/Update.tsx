import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPersonaById, updatePersona } from "../../../services/admin/usuarioService";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function UpdatePersona() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [nombre, setNombre] = useState("");
    const [telefono, setTelefono] = useState("");
    const [dpi, setDpi] = useState("");
    const [correo, setCorreo] = useState("");
    const [idRol, setIdRol] = useState("");

    const [idRolOriginal, setIdRolOriginal] = useState("");
    const [tipoRolOriginal, setTipoRolOriginal] = useState("");

    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarPersona();
    }, [id]);

    const cargarPersona = async () => {
        try {
            setCargando(true);
            setError("");
            const data = await getPersonaById(Number(id));
            setNombre(data.nombre);
            setTelefono(data.telefono);
            setDpi(data.dpi);
            setCorreo(data.correo);
            setIdRol(String(data.idRol));
            setIdRolOriginal(String(data.idRol));
            setTipoRolOriginal(data.tipoRol);
        } catch (error) {
            console.error("Error al cargar la persona:", error);
            setError("No se pudo cargar la persona");
        } finally {
            setCargando(false);
        }
    };

    const rolCambiado = idRol !== "" && idRol !== idRolOriginal;

    // Nombres legibles para mostrar en la advertencia y en el select
    const ROLES: Record<string, string> = {
        "1": "Administrador",
        "2": "Empleado",
        "3": "Cliente",
        "4": "Proveedor",
    };

    const validate = () => {
        const errors: Record<string, string> = {};

        if (correo.trim() && !EMAIL_REGEX.test(correo.trim())) {
            errors.correo = "El correo no tiene un formato válido";
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!validate()) {
            setError("Revisa los campos marcados");
            return;
        }

        if (rolCambiado) {
            const confirmado = window.confirm(
            `Estás cambiando el rol de "${nombre}" de ${tipoRolOriginal} a ${ROLES[idRol] ?? idRol}.\n\nEsto puede afectar sus permisos y accesos en el sistema. ¿Deseas continuar?`
            );
            if (!confirmado) return;
        }

        try {
            setLoading(true);

            await updatePersona(Number(id), {
            nombre,
            telefono,
            dpi,
            correo,
            idRol,
            });

            setSuccess("Persona actualizada exitosamente");
            setIdRolOriginal(idRol);
            setTipoRolOriginal(ROLES[idRol] ?? tipoRolOriginal);
        } catch (error: any) {
            console.error("Error al actualizar persona:", error);

            if (error.response?.data?.error) {
            setError(error.response.data.error);
            } else {
            setError("Ocurrió un error al actualizar la persona");
            }
        } finally {
            setLoading(false);
        }
        };

        if (cargando) {
        return (
            <div className="cp-page">
            <div className="cp-card">
                <p className="cp-cargando">Cargando datos de la persona...</p>
            </div>
            </div>
        );
    }

    return (
        <div className="cp-page">
            <div className="cp-card">
                <div className="cp-header">
                    <h1 className="cp-title">Editar Persona</h1>
                    <p className="cp-subtitle">Actualiza los datos de tus clientes y proveedores registrados</p>
                </div>

                {error && <div className="cp-alert cp-alert-error">{error}</div>}
                {success && <div className="cp-alert cp-alert-success">{success}</div>}

                <form className="cp-form" onSubmit={handleSubmit} noValidate>

                    {/* NOMBRE */}
                    <div className="cp-field">
                        <label htmlFor="nombre" className="cp-label"><i className="bi bi-person-fill"></i> Nombre </label>
                        <input 
                        id="nombre"
                        type="text" 
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Ingrese el nombre"
                        className="cp-input"
                        />
                    </div>

                    {/* TELEFONO */}
                    <div className="cp-field">
                        <label htmlFor="telefono" className="cp-label"><i className="bi bi-telephone-fill"></i> Telefono </label>
                        <input 
                        id="telefono"
                        type="text"
                        inputMode="numeric"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ""))}
                        placeholder="Ingrese el número de teléfono"
                        maxLength={8}
                        className="cp-input"
                        />
                    </div>

                    {/* DPI */}
                    <div className="cp-field">
                        <label htmlFor="dpi" className="cp-label"><i className="bi bi-card-text"></i> DPI</label>
                        <input
                            id="dpi"
                            type="text"
                            inputMode="numeric"
                            value={dpi}
                            onChange={(e) => setDpi(e.target.value.replace(/\D/g, ""))}
                            placeholder="Ingrese el DPI"
                            maxLength={13}
                            className="cp-input"
                        />
                    </div>

                    {/* CORREO */}
                    <div className="cp-field">
                        <label htmlFor="correo" className="cp-label"><i className="bi bi-envelope-fill"></i> Correo</label>
                        <input
                            id="correo"
                            type="email"
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                            placeholder="Ingrese su correo"
                            className={`cp-input ${fieldErrors.correo ? "cp-input-error" : ""}`}
                        />
                        {fieldErrors.correo && (
                            <span className="cp-field-error">{fieldErrors.correo}</span>
                        )}
                    </div>

                    {/* ROL */}
                    <div className="cp-field">
                        <label htmlFor="idRol" className="cp-label"><i className="bi bi-person-rolodex"></i> Rol</label>
                        <select
                        id="idRol"
                        value={idRol}
                        onChange={(e) => setIdRol(e.target.value)}
                        className="cp-select"
                        >
                            <option value="">Seleccione un rol</option>
                            <option value="3">Cliente</option>
                            <option value="4">Proveedor</option>
                        </select>
                        <span className="cp-rol-actual">
                            Rol actual: {tipoRolOriginal}
                        </span>
                    </div>

                    {rolCambiado && (
                        <div className="cp-mensaje-advertencia">
                            <i className="bi bi-exclamation-triangle-fill"></i> Vas a cambiar el rol de{" "}
                            <strong>{tipoRolOriginal}</strong> a{" "}
                            <strong>{ROLES[idRol] ?? idRol}</strong>. Esto puede afectar los registros del sistema.
                        </div>
                    )}

                    {/* BOTONES DE ACCIONES */}
                    <div className="cp-actions">
                        <button
                        type="button"
                        onClick={() => navigate(-1)}
                        disabled={loading}
                        className="cp-btn-secondary"
                        >
                            Cancelar
                        </button>

                        <button type="submit" disabled={loading} className="cp-btn-primary">
                            {loading ? "Guardando..." : "Guardar cambios"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default UpdatePersona;