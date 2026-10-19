import { Route } from "react-router-dom";
import Login from "../pages/auth/Login";

import RecuperarContrasena from "../pages/auth/RecuperarContrasena";
import RestablecerContrasena from "../pages/auth/RestablecerContrasena";

export const AppRoutes = () => (
  <>
    <Route path="/" element={<Login />} />
    <Route path="/login" element={<Login />} />
    <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />
    <Route path="/restablecer-contrasena" element={<RestablecerContrasena />} />
  </>
);