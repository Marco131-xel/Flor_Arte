import { Route } from "react-router-dom";
import Login from "../pages/auth/Login";

export const AppRoutes = () => (
  <>
    <Route path="/" element={<Login />} />
    <Route path="/login" element={<Login />} />
  </>
);