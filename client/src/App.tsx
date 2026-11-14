import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import AdminDashboard from './pages/AdminDashboard';
import Dashboard from './pages/Dashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import LabDashboard from './pages/LabDashboard';
import Login from './pages/Login';
import NurseDashboard from './pages/NurseDashboard';
import PharmacyDashboard from './pages/PharmacyDashboard';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import RegisterAdmin from './pages/RegisterAdmin';
import Unauthorized from './pages/Unauthorized';

const roleRoutes = [
  { path: '/admin', roles: ['ADMIN'], element: <AdminDashboard /> },
  { path: '/receptionist', roles: ['RECEPTIONIST'], element: <ReceptionistDashboard /> },
  { path: '/nurse', roles: ['NURSE'], element: <NurseDashboard /> },
  { path: '/doctor', roles: ['DOCTOR'], element: <DoctorDashboard /> },
  { path: '/lab', roles: ['LAB_TECH'], element: <LabDashboard /> },
  { path: '/pharmacy', roles: ['PHARMACIST'], element: <PharmacyDashboard /> },
];

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/register-admin" element={<RegisterAdmin />} />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          {roleRoutes.map(({ path, roles, element }) => (
            <Route
              key={path}
              path={path}
              element={
                <ProtectedRoute allowedRoles={roles}>
                  {element}
                </ProtectedRoute>
              }
            />
          ))}

          <Route path="/reception" element={<Navigate to="/receptionist" replace />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}