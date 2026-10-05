import PermisoEdicion from "../components/shared/PermisoEdicion";
import EditarMerma from "../pages/shared/inventario/EditarMerma";
import { Route } from "react-router-dom";
import IndexFlores from "../pages/shared/flores/Index";
import CreateFlor from "../pages/shared/flores/Create";
import UpdateFlores from "../pages/shared/flores/Update";
import Color from "../pages/shared/flores/Color";
import TipoFlor from "../pages/shared/flores/Tipo";
import IndexInventario from "../pages/shared/inventario/Index";
import CreateInventario from "../pages/shared/inventario/Create";
import UpdateInventario from "../pages/shared/inventario/Update";
import Merma from "../pages/shared/inventario/Merma";
import IndexPedidos from "../pages/shared/pedidos/Index";
import CreatePedidos from "../pages/shared/pedidos/Create";
import UpdatePedidos from "../pages/shared/pedidos/Update";

// Cada panel monta estas rutas dentro de su propio layout y protección de rol.
export const GestionRoutes = () => (
  <>
    <Route path="flores">
      <Route index element={<IndexFlores />} />
      <Route path="create" element={<CreateFlor />} />
      <Route path="update/:id" element={<PermisoEdicion modulo="flores"><UpdateFlores /></PermisoEdicion>} />
      <Route path="color" element={<Color />} />
      <Route path="tipoflor" element={<TipoFlor />} />
    </Route>
    <Route path="inventario">
      <Route index element={<IndexInventario />} />
      <Route path="create" element={<CreateInventario />} />
      <Route path="update/:id" element={<PermisoEdicion modulo="inventario"><UpdateInventario /></PermisoEdicion>} />
      <Route path="merma" element={<Merma />} />
      <Route path="merma/editar/:id" element={<PermisoEdicion modulo="mermas"><EditarMerma /></PermisoEdicion>} />
    </Route>
    <Route path="pedidos">
      <Route index element={<IndexPedidos />} />
      <Route path="create" element={<CreatePedidos />} />
      <Route path="update/:id" element={<PermisoEdicion modulo="pedidos"><UpdatePedidos /></PermisoEdicion>} />
    </Route>
  </>
);
