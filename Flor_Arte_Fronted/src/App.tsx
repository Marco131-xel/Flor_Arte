import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppRoutes } from "./routes/AppRoutes";
import { AdminRoutes } from "./routes/AdminRoutes";
import { EmpleadoRoutes } from "./routes/EmpleadoRoute";
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
        {/* redireccion por defecto */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;