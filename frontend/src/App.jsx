import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Pages
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

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <PrivateRoute>
            <AdminDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/documentos"
        element={
          <PrivateRoute>
            <DocumentList />
          </PrivateRoute>
        }
      />
      <Route
        path="/documentos/nuevo"
        element={
          <PrivateRoute>
            <DocumentNew />
          </PrivateRoute>
        }
      />
      <Route
        path="/usuarios"
        element={
          <PrivateRoute>
            <UserList />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/instituciones"
        element={
          <PrivateRoute>
            <AdminInstitutions />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/plantillas"
        element={
          <PrivateRoute>
            <AdminTemplates />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/transacciones"
        element={
          <PrivateRoute>
            <AdminTransactions />
          </PrivateRoute>
        }
      />
      <Route
        path="/suscripcion"
        element={
          <PrivateRoute>
            <Subscription />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
