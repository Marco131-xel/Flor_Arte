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
// modulo flor
import IndexFlores from "../pages/empleado/flores/Index";
import CreateFlor from "../pages/empleado/flores/Create";
import UpdateFlores from "../pages/empleado/flores/Update";
import Color from "../pages/empleado/flores/Color";
import TipoFlor from "../pages/empleado/flores/Tipo";
// modulo inventario
import IndexInventario from "../pages/empleado/inventario/Index";
import CreateInventario from "../pages/empleado/inventario/Create";
import UpdateInventario from "../pages/empleado/inventario/Update";
import Merma from "../pages/empleado/inventario/Merma";
// modulo pedidos
import IndexPedidos from "../pages/empleado/pedidos/Index";
import CreatePedidos from "../pages/empleado/pedidos/Create";
import UpdatePedidos from "../pages/empleado/pedidos/Update";

export const EmpleadoRoutes = () => (
    <Route path="/empleado" element={
        <PrivateRoute allowedRoles={["EMPLEADO"]}>
            <EmpleadoLayout/>
        </PrivateRoute>
    }>
        {/* PAGINA DE INICIO */}
        <Route index element={<InicioEmpleado />}/>
        {/* VISTA MI PERFIL */}
        <Route path="perfil" element={<IndexPerfil/>}/>
        {/* VISTAS PERSONAS */}
        <Route path="personas" element={<IndexPersonas/>}/>
        <Route path="personas/create" element={<CreatePersona/>}/>
        <Route path="personas/update/:id" element={<UpdatePersona/>}/>
        {/* VISTA A FLORES */}
        <Route path="flores" element={<IndexFlores/>}/>
        <Route path="flores/create" element={<CreateFlor/>}/>
        <Route path="flores/update/:id" element={<UpdateFlores/>}/>
        <Route path="flores/color" element={<Color/>}/>
        <Route path="flores/tipoflor" element={<TipoFlor/>}/>
        {/*VISTA A INVENTARIO */}
        <Route path="inventario" element={<IndexInventario/>}/>
        <Route path="inventario/create" element={<CreateInventario/>}/>
        <Route path="inventario/update/:id" element={<UpdateInventario/>}/>
        <Route path="inventario/merma" element={<Merma/>}/>
        {/* VISTA A PEDIDOS */}
        <Route path="pedidos" element={<IndexPedidos/>}/>
        <Route path="pedidos/create" element={<CreatePedidos/>}/>
        <Route path="pedidos/update/:id" element={<UpdatePedidos/>}/>
    </Route>
)