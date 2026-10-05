import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './styles/empleado/style.css'
import './styles/empleado/form.css'
import './styles/empleado/table.css'
import './styles/admin/style.css'
import './styles/professional.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
