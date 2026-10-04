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
import ModuloPendiente from "../pages/ModuloPendiente";
import NotFound from "../pages/NotFound";
import { GestionRoutes } from "./GestionRoutes";

export const AdminRoutes = () => (
    <Route path="/admin" element={
        <PrivateRoute allowedRoles={["ADMINISTRADOR"]}>
            <AdminLayout />
        </PrivateRoute>
    }>
        <Route index element={<InicioAdmin />}/>
        {GestionRoutes()}
        <Route path="arreglos" element={<ModuloPendiente nombre="Arreglos" inicio="/admin" />} />
        <Route path="eventos" element={<ModuloPendiente nombre="Eventos" inicio="/admin" />} />
        <Route path="reportes" element={<ModuloPendiente nombre="Reportes" inicio="/admin" />} />
        <Route path="recibos" element={<ModuloPendiente nombre="Recibos" inicio="/admin" />} />
        <Route path="perfil" element={<Perfil />} />
        <Route path="perfil/editar" element={<EditPerfil />} />
        <Route path="usuarios" element={<IndexUser/>} />
        <Route path="usuarios/crear" element={<CreateUser/>} />
        <Route path="usuarios/editar/:id" element={<UpdateUser/>} />
        <Route path="usuarios/crear-Persona" element={<CreatePersona/>} />
        <Route path="usuarios/editar-Persona/:id" element={<UpdatePersona/>} />
        <Route path="*" element={<NotFound inicio="/admin" />} />
    </Route>
)
