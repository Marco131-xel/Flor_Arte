import { Route } from "react-router-dom";
import PrivateRoute from "../components/PrivateRoute";
// funcionalidades del admin
import EmpleadoLayout from "../components/empleado/Layout";
import InicioEmpleado from "../pages/empleado/Index";
import IndexFlores from "../pages/empleado/flores/Index";

export const EmpleadoRoutes = () => (
    <Route path="/empleado" element={
        <PrivateRoute allowedRoles={["EMPLEADO"]}>
            <EmpleadoLayout/>
        </PrivateRoute>
    }>
        <Route index element={<InicioEmpleado />}/>
        <Route path="flores" element={<IndexFlores/>}/>
    </Route>
)