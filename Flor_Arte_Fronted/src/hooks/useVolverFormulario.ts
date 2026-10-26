import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { rutaRegresoFormulario } from '../utils/regresoFormulario';
export function useVolverFormulario() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const destino = rutaRegresoFormulario(pathname);
  return useCallback(() => navigate(destino, { replace: true }), [navigate, destino]);
}
