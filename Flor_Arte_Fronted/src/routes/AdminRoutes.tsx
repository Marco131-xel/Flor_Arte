import { Route } from "react-router-dom";
import PrivateRoute from "../components/PrivateRoute";
// funcionalidades del admin
import AdminLayout from "../components/admin/Layout";
import InicioAdmin from "../pages/admin/Index";

export const AdminRoutes = () => (
    <Route path="/admin" element={
        <PrivateRoute allowedRoles={["administrador"]}>
            <AdminLayout />
        </PrivateRoute>
    }>
        <Route index element={<InicioAdmin />}/>
    </Route>
)