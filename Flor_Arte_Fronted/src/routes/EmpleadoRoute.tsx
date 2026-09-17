import { Route } from "react-router-dom";
import PrivateRoute from "../components/PrivateRoute";
// funcionalidades del admin
import EmpleadoLayout from "../components/empleado/Layout";
import InicioEmpleado from "../pages/empleado/Index";
import IndexPerfil from "../pages/empleado/perfil/Index";
// modulo personas
import IndexPersonas from "../pages/empleado/personas/Index";
import CreatePersona from "../pages/empleado/personas/Create";
import UpdatePersona from "../pages/empleado/personas/Update";
// modulo flor
import IndexFlores from "../pages/empleado/flores/Index";
import CreateFlor from "../pages/empleado/flores/Create";
import UpdateFlores from "../pages/empleado/flores/Update";
import Color from "../pages/empleado/flores/Color";
import TipoFlor from "../pages/empleado/flores/Tipo";

export const EmpleadoRoutes = () => (
    <Route path="/empleado" element={
        <PrivateRoute allowedRoles={["EMPLEADO"]}>
            <EmpleadoLayout/>
        </PrivateRoute>
    }>
        <Route index element={<InicioEmpleado />}/>
        <Route path="perfil" element={<IndexPerfil/>}/>
        <Route path="personas" element={<IndexPersonas/>}/>
        <Route path="personas/create" element={<CreatePersona/>}/>
        <Route path="personas/update/:id" element={<UpdatePersona/>}/>
        <Route path="flores" element={<IndexFlores/>}/>
        <Route path="flores/create" element={<CreateFlor/>}/>
        <Route path="flores/update/:id" element={<UpdateFlores/>}/>
        <Route path="flores/color" element={<Color/>}/>
        <Route path="flores/tipoflor" element={<TipoFlor/>}/>
    </Route>
)