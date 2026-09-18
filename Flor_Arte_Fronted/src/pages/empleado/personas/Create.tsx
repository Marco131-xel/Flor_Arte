import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPersona } from "../../../services/admin/usuarioService";
import "../../../styles/empleado/form.css";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function CreatePersona() {
    const navigate = useNavigate();

    const [nombre, setNombre] = useState("");
    const [telefono, setTelefono] = useState("");
    const [dpi, setDpi] = useState("");
    const [correo, setCorreo] = useState("");
    const [idRol, setIdRol] = useState("");

    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const validate = () => {
        const errors: Record<string, string> = {};

        if (!nombre.trim()) {
            errors.nombre = "El nombre es obligatorio";
        }

        if (!idRol) {
            errors.idRol = "Selecciona un rol";
        }

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

        try {
            setLoading(true);

            await createPersona({
                nombre: nombre.trim(),
                telefono,
                dpi,
                correo: correo.trim(),
                idRol,
            });

            setSuccess("Persona registrada exitosamente");

            setNombre("");
            setTelefono("");
            setDpi("");
            setCorreo("");
            setIdRol("");
            setFieldErrors({});
        } catch (error: any) {
            console.error("Error al crear persona: ", error);

            const mensaje = (error.response?.data?.message ?? error.response?.data?.error) as
                | string
                | undefined;

            if (mensaje?.toLowerCase().includes("dpi")) {
                setFieldErrors((prev) => ({ ...prev, dpi: mensaje }));
                setError("Revisa los campos marcados");
            } else if (mensaje) {
                setError(mensaje);
            } else {
                setError("Ocurrió un error al registrar la persona");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cp-page">
            <div className="cp-card">
                <div className="cp-header">
                    <h1 className="cp-title">Crear Cliente o Proveedor</h1>
                    <p className="cp-subtitle">Registra los datos de tus clientes o proveedores</p>
                </div>

                {error && <div className="cp-alert cp-alert-error">{error}</div>}
                {success && <div className="cp-alert cp-alert-success">{success}</div>}

                <form onSubmit={handleSubmit} noValidate className="cp-form">
                    
                    {/* NOMBRE */}
                    <div className="cp-field">
                        <label htmlFor="nombre" className="cp-label">
                            <i className="bi bi-person-fill"></i> Nombre <span className="cp-required">*</span>
                        </label>
                        <input
                            id="nombre"
                            type="text"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="Ingrese el nombre"
                            className={`cp-input ${fieldErrors.nombre ? "cp-input-error" : ""}`}
                        />
                        {fieldErrors.nombre && (
                            <span className="cp-field-error">{fieldErrors.nombre}</span>
                        )}
                    </div>

                    {/* TELEFONO */}
                    <div className="cp-field">
                        <label htmlFor="telefono" className="cp-label"><i className="bi bi-telephone-fill"></i> Teléfono</label>
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
                            onChange={(e) => {
                                setDpi(e.target.value.replace(/\D/g, ""));
                                if (fieldErrors.dpi) {
                                    setFieldErrors((prev) => {
                                        const { dpi: _dpi, ...rest } = prev;
                                        return rest;
                                    });
                                }
                            }}
                            placeholder="Ingrese el DPI"
                            maxLength={13}
                            className={`cp-input ${fieldErrors.dpi ? "cp-input-error" : ""}`}
                        />
                        {fieldErrors.dpi && (
                            <span className="cp-field-error">{fieldErrors.dpi}</span>
                        )}
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
                        <label htmlFor="idRol" className="cp-label">
                            <i className="bi bi-person-rolodex"></i> Rol <span className="cp-required">*</span>
                        </label>
                        <select
                            id="idRol"
                            value={idRol}
                            onChange={(e) => setIdRol(e.target.value)}
                            className={`cp-select ${fieldErrors.idRol ? "cp-input-error" : ""}`}
                        >
                            <option value="">Seleccione un rol</option>
                            <option value="3">Cliente</option>
                            <option value="4">Proveedor</option>
                        </select>
                        {fieldErrors.idRol && (
                            <span className="cp-field-error">{fieldErrors.idRol}</span>
                        )}
                    </div>

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
                            {loading ? "Registrando..." : "Crear Persona"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreatePersona;