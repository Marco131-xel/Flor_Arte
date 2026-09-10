import { Route } from "react-router-dom";
import PrivateRoute from "../components/PrivateRoute";
// funcionalidades del admin
import AdminLayout from "../components/admin/Layout";
import InicioAdmin from "../pages/admin/Index";
import Perfil from "../pages/admin/Perfil";
import IndexUser from "../pages/admin/user/IndexUser";
import CreateUser from "../pages/admin/user/CreateUser";
import UpdateUser from "../pages/admin/user/UpdateUser";
import CreatePersona from "../pages/admin/user/CreatePersona";
import UpdatePersona from "../pages/admin/user/UpdatePersona";
import EditPerfil from "../pages/admin/EditPerfil";

export const AdminRoutes = () => (
    <Route path="/admin" element={
        <PrivateRoute allowedRoles={["ADMINISTRADOR"]}>
            <AdminLayout />
        </PrivateRoute>
    }>
        <Route index element={<InicioAdmin />}/>
        <Route path="perfil" element={<Perfil />} />
        <Route path="perfil/editar" element={<EditPerfil />} />
        <Route path="usuarios" element={<IndexUser/>} />
        <Route path="usuarios/crear" element={<CreateUser/>} />
        <Route path="usuarios/editar/:id" element={<UpdateUser/>} />
        <Route path="usuarios/crear-Persona" element={<CreatePersona/>} />
        <Route path="usuarios/editar-Persona/:id" element={<UpdatePersona/>} />
    </Route>
)