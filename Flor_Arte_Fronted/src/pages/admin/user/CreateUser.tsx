import { useState } from "react";
import { createUser } from "../../../services/userService";

function CreateUser() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rolPersona, setRolPersona] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // Validar campos
    if (!nombre || !email || !password || !rolPersona) {
      setError("Todos los campos son obligatorios");
      return;
    }

    try {
      setLoading(true);

      await createUser({
        nombre,
        email,
        password,
        rolPersona,
      });

      setSuccess("Usuario registrado exitosamente");

      // Limpiar formulario
      setNombre("");
      setEmail("");
      setPassword("");
      setRolPersona("");

    } catch (error: any) {
      console.error("Error al crear usuario:", error);

      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError("Ocurrió un error al registrar el usuario");
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Crear usuario</h1>

      {error && (
        <div>
          {error}
        </div>
      )}

      {success && (
        <div>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>

        {/* Nombre */}
        <div>
          <label htmlFor="nombre">
            Nombre
          </label>

          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ingrese el nombre"
          />
        </div>

        {/* Correo */}
        <div>
          <label htmlFor="email">
            Correo electrónico
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Ingrese el correo"
          />
        </div>

        {/* Contraseña */}
        <div>
          <label htmlFor="password">
            Contraseña
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ingrese la contraseña"
          />
        </div>

        {/* Rol */}
        <div>
          <label htmlFor="rolPersona">
            Rol
          </label>

          <select
            id="rolPersona"
            value={rolPersona}
            onChange={(e) => setRolPersona(e.target.value)}
          >
            <option value="">
              Seleccione un rol
            </option>

            <option value="ADMINISTRADOR">
              Administrador
            </option>

            <option value="EMPLEADO">
              Empleado
            </option>

            <option value="CLIENTE">
              Cliente
            </option>

            <option value="PROVEEDOR">
              Proveedor
            </option>
          </select>
        </div>

        {/* Botón */}
        <button
          type="submit"
          disabled={loading}
        >
          {loading ? "Registrando..." : "Crear usuario"}
        </button>

      </form>
    </div>
  );
}

export default CreateUser;