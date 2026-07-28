import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import Programs from "./pages/Programs";
import Students from "./pages/Students";
import Enrollments from "./pages/Enrollments";
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
            <Programs />
          </InstitutionRoute>
        }
      />
      <Route
        path="/estudiantes"
        element={
          <InstitutionRoute>
            <Students />
          </InstitutionRoute>
        }
      />
      <Route
        path="/matriculas"
        element={
          <InstitutionRoute>
            <Enrollments />
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

      {/* Públicas */}
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/terminos" element={<TermsAndConditions />} />

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
