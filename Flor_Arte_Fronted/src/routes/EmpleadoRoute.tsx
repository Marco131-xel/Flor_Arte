import { Route } from "react-router-dom";
import PrivateRoute from "../components/PrivateRoute";
// funcionalidades del empleado
import EmpleadoLayout from "../components/empleado/Layout";
import InicioEmpleado from "../pages/empleado/Index";
import IndexPerfil from "../pages/empleado/perfil/Index";
// modulo personas
import IndexPersonas from "../pages/empleado/personas/Index";
import CreatePersona from "../pages/empleado/personas/Create";
import UpdatePersona from "../pages/empleado/personas/Update";
import { GestionRoutes } from "./GestionRoutes";
import IndexRecibos from "../pages/shared/recibos/Index";
import NotFound from "../pages/NotFound";

export const EmpleadoRoutes = () => (
    <Route path="/empleado" element={
        <PrivateRoute allowedRoles={["EMPLEADO"]}>
            <EmpleadoLayout/>
        </PrivateRoute>
    }>
        {/* PAGINA DE INICIO */}
        <Route index element={<InicioEmpleado />}/>
        <Route path="recibos" element={<IndexRecibos />} />
        {/* VISTA MI PERFIL */}
        <Route path="perfil" element={<IndexPerfil/>}/>
        {/* VISTAS PERSONAS */}
        <Route path="personas" element={<IndexPersonas/>}/>
        <Route path="personas/create" element={<CreatePersona/>}/>
        <Route path="personas/update/:id" element={<UpdatePersona/>}/>
        {GestionRoutes()}
        <Route path="*" element={<NotFound inicio="/empleado" />} />
    </Route>
)
