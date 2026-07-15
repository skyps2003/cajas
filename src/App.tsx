
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { 
  LoginPage, 
  ForgotPasswordPage, 
  AdminDashboard, 
  CajeroDashboard,
  AdminUsersPage,
  AdminSedesPage,
  AdminBoxTypesPage,
  AdminEmpresasPage,
  AdminApprovalsPage,
  AdminDocumentsPage,
  AdminComprobantesPage,
  CajeroMovimientosPage,
  CajeroCierresPage,
  ContribuyentesListPage,
  ContribuyentesFormPage,
  ContribuyentesTelefonosPage,
  ContribuyentesCredencialesPage,
  ContribuyentesDocumentosPage,
  ContribuyentesRubrosPage,
  ContribuyentesTiposCredencialesPage,
  ContribuyentesTiposTelefonoPage,
  ContribuyentesTiposDocumentoPage,
  AdminMovimientosCerradosPage
} from './pages';
import { AdminLayout, CajeroLayout } from './layouts';
import { ThemeProvider, AuthProvider } from './contexts';
import { ProtectedRoute } from './components';
import { ToastProvider } from './components/Toast/ToastContext';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            
            {/* Rutas de Administrador */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="usuarios" element={<AdminUsersPage />} />
                <Route path="sedes" element={<AdminSedesPage />} />
                <Route path="cajas" element={<AdminBoxTypesPage />} />
                <Route path="empresas" element={<AdminEmpresasPage />} />
                <Route path="aprobaciones" element={<AdminApprovalsPage />} />
                <Route path="comprobantes" element={<AdminComprobantesPage />} />
                <Route path="documentos" element={<AdminDocumentsPage />} />
                <Route path="movimientos-cerrados" element={<AdminMovimientosCerradosPage />} />

                
                {/* Contribuyentes Admin */}
                <Route path="contribuyentes" element={<ContribuyentesListPage />} />
                <Route path="contribuyentes/registrar" element={<ContribuyentesFormPage />} />
                <Route path="contribuyentes/telefonos" element={<ContribuyentesTelefonosPage />} />
                <Route path="contribuyentes/credenciales" element={<ContribuyentesCredencialesPage />} />
                <Route path="contribuyentes/documentos" element={<ContribuyentesDocumentosPage />} />
                <Route path="contribuyentes/rubros" element={<ContribuyentesRubrosPage />} />
                <Route path="contribuyentes/tipos-credencial" element={<ContribuyentesTiposCredencialesPage />} />
                <Route path="contribuyentes/tipos-telefono" element={<ContribuyentesTiposTelefonoPage />} />
                <Route path="contribuyentes/tipos-documento" element={<ContribuyentesTiposDocumentoPage />} />
              </Route>
            </Route>

            {/* Rutas de Cajero */}
            <Route element={<ProtectedRoute allowedRoles={['cajero']} />}>
              <Route path="/cajero" element={<CajeroLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<CajeroDashboard />} />
                <Route path="movimientos" element={<CajeroMovimientosPage />} />
                <Route path="cierres" element={<CajeroCierresPage />} />
                
                {/* Contribuyentes Cajero */}
                <Route path="contribuyentes" element={<ContribuyentesListPage />} />
                <Route path="contribuyentes/registrar" element={<ContribuyentesFormPage />} />
                <Route path="contribuyentes/telefonos" element={<ContribuyentesTelefonosPage />} />
                <Route path="contribuyentes/credenciales" element={<ContribuyentesCredencialesPage />} />
                <Route path="contribuyentes/documentos" element={<ContribuyentesDocumentosPage />} />
                <Route path="contribuyentes/rubros" element={<ContribuyentesRubrosPage />} />
                <Route path="contribuyentes/tipos-credencial" element={<ContribuyentesTiposCredencialesPage />} />
                <Route path="contribuyentes/tipos-telefono" element={<ContribuyentesTiposTelefonoPage />} />
                <Route path="contribuyentes/tipos-documento" element={<ContribuyentesTiposDocumentoPage />} />
              </Route>
            </Route>

            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
