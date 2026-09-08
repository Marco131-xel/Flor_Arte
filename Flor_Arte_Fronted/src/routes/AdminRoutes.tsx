import { Route } from "react-router-dom";
import PrivateRoute from "../components/PrivateRoute";
// funcionalidades del admin
import AdminLayout from "../components/admin/Layout";
import InicioAdmin from "../pages/admin/Index";
import Perfil from "../pages/admin/Perfil";
import IndexUser from "../pages/admin/user/IndexUser";
import CreateUser from "../pages/admin/user/CreateUser";
import UpdateUser from "../pages/admin/user/UpdateUser";

export const AdminRoutes = () => (
    <Route path="/admin" element={
        <PrivateRoute allowedRoles={["ADMINISTRADOR"]}>
            <AdminLayout />
        </PrivateRoute>
    }>
        <Route index element={<InicioAdmin />}/>
        <Route path="perfil" element={<Perfil />} />
        <Route path="usuarios" element={<IndexUser/>} />
        <Route path="usuarios/crear" element={<CreateUser/>} />
        <Route path="usuarios/actualizar" element={<UpdateUser/>} />
    </Route>
)