import { Route } from "react-router-dom";
import PrivateRoute from "../components/PrivateRoute";
// funcionalidades del admin
import EmpleadoLayout from "../components/empleado/Layout";
import InicioEmpleado from "../pages/empleado/Index";
import IndexFlores from "../pages/empleado/flores/Index";
import IndexPerfil from "../pages/empleado/perfil/Index";

export const EmpleadoRoutes = () => (
    <Route path="/empleado" element={
        <PrivateRoute allowedRoles={["EMPLEADO"]}>
            <EmpleadoLayout/>
        </PrivateRoute>
    }>
        <Route index element={<InicioEmpleado />}/>
        <Route path="perfil" element={<IndexPerfil/>}/>
        <Route path="flores" element={<IndexFlores/>}/>
    </Route>
)