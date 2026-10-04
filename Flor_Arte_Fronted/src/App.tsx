import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppRoutes } from "./routes/AppRoutes";
import { AdminRoutes } from "./routes/AdminRoutes";
import { EmpleadoRoutes } from "./routes/EmpleadoRoute";
import NotFound from "./pages/NotFound";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ruta del login */}
        {AppRoutes()}
        {/* rutas protegidas */}
        {AdminRoutes()}
        {EmpleadoRoutes()}
        {/* Direcciones que no corresponden a una página del sistema */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
