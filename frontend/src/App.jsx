import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import DocumentList from "./pages/DocumentList";
import DocumentNew from "./pages/DocumentNew";
import UserList from "./pages/UserList";
import AdminInstitutions from "./pages/AdminInstitutions";
import AdminTemplates from "./pages/AdminTemplates";
import AdminTransactions from "./pages/AdminTransactions";
import Subscription from "./pages/Subscription";
import Settings from "./pages/Settings";
import { ThemeProvider } from "./context/ThemeContext";
import AdminSettings from "./pages/AdminSettings";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import TermsAndConditions from "./pages/TermsAndConditions";
import Checkout from "./pages/Checkout";
import AdminPlans from "./pages/AdminPlans";
import NotFound from "./pages/NotFound";
import CalendarPage from "./pages/Calendar";
import AdminCalendar from "./pages/AdminCalendar";
import BlockAccount from "./pages/BlockAccount";
import Academic from "./pages/Academic";
import Notifications from "./pages/Notifications";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        Cargando...
      </div>
    );
  return user ? children : <Navigate to="/" />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        Cargando...
      </div>
    );
  if (!user) return <Navigate to="/" />;
  if (user.role !== "superadmin") return <NotFound />;
  return children;
}

function InstitutionRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        Cargando...
      </div>
    );
  if (!user) return <Navigate to="/" />;
  if (user.role === "superadmin") return <NotFound />;
  return children;
}

// Las rutas antiguas redirigen a la página académica, conservando filtros
function AcademicRedirect({ tab }) {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  params.set("tab", tab);
  return <Navigate to={`/academico?${params.toString()}`} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Register />} />

      {/* Rutas de instituciones */}
      <Route
        path="/dashboard"
        element={
          <InstitutionRoute>
            <Dashboard />
          </InstitutionRoute>
        }
      />
      <Route
        path="/documentos"
        element={
          <InstitutionRoute>
            <DocumentList />
          </InstitutionRoute>
        }
      />
      <Route
        path="/documentos/nuevo"
        element={
          <InstitutionRoute>
            <DocumentNew />
          </InstitutionRoute>
        }
      />
      <Route
        path="/usuarios"
        element={
          <InstitutionRoute>
            <UserList />
          </InstitutionRoute>
        }
      />
      <Route
        path="/suscripcion"
        element={
          <InstitutionRoute>
            <Subscription />
          </InstitutionRoute>
        }
      />
      <Route
        path="/programas"
        element={
          <InstitutionRoute>
            <AcademicRedirect tab="programas" />
          </InstitutionRoute>
        }
      />
      <Route
        path="/estudiantes"
        element={
          <InstitutionRoute>
            <AcademicRedirect tab="estudiantes" />
          </InstitutionRoute>
        }
      />
      <Route
        path="/matriculas"
        element={
          <InstitutionRoute>
            <AcademicRedirect tab="matriculas" />
          </InstitutionRoute>
        }
      />
      <Route
        path="/academico"
        element={
          <InstitutionRoute>
            <Academic />
          </InstitutionRoute>
        }
      />
      <Route
        path="/configuracion"
        element={
          <InstitutionRoute>
            <Settings />
          </InstitutionRoute>
        }
      />
      <Route
        path="/checkout"
        element={
          <InstitutionRoute>
            <Checkout />
          </InstitutionRoute>
        }
      />
      <Route
        path="/calendario"
        element={
          <InstitutionRoute>
            <CalendarPage />
          </InstitutionRoute>
        }
      />
      <Route
        path="/notificaciones"
        element={
          <InstitutionRoute>
            <Notifications />
          </InstitutionRoute>
        }
      />

      {/* Rutas de superadmin */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/instituciones"
        element={
          <AdminRoute>
            <AdminInstitutions />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/plantillas"
        element={
          <AdminRoute>
            <AdminTemplates />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/transacciones"
        element={
          <AdminRoute>
            <AdminTransactions />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/configuracion"
        element={
          <AdminRoute>
            <AdminSettings />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/planes"
        element={
          <AdminRoute>
            <AdminPlans />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/calendario"
        element={
          <AdminRoute>
            <AdminCalendar />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/notificaciones"
        element={
          <AdminRoute>
            <Notifications />
          </AdminRoute>
        }
      />

      {/* Públicas */}
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/terminos" element={<TermsAndConditions />} />
      <Route path="/block-account" element={<BlockAccount />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}
