import { Route } from "react-router-dom";
import PrivateRoute from "../components/PrivateRoute";
// funcionalidades del admin
import AdminLayout from "../components/admin/Layout";
import InicioAdmin from "../pages/admin/Index";
import Perfil from "../pages/admin/Perfil";

export const AdminRoutes = () => (
    <Route path="/admin" element={
        <PrivateRoute allowedRoles={["ADMINISTRADOR"]}>
            <AdminLayout />
        </PrivateRoute>
    }>
        <Route index element={<InicioAdmin />}/>
        <Route path="perfil" element={<Perfil />} />
    </Route>
)