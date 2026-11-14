import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleRedirects: Record<string, string> = {
  ADMIN: '/admin',
  RECEPTIONIST: '/receptionist',
  NURSE: '/nurse',
  DOCTOR: '/doctor',
  LAB_TECH: '/lab',
  PHARMACIST: '/pharmacy',
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const destination = roleRedirects[user.role];
    if (destination) {
      navigate(destination, { replace: true });
    }
  }, [navigate, user]);

  if (user && roleRedirects[user.role]) {
    return null;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded">
          Logout
        </button>
      </div>

      <div className="bg-white p-6 rounded shadow">
        <p className="text-lg">Welcome, <strong>{user?.name}</strong>!</p>
        <p className="text-gray-600">Role: {user?.role}</p>
      </div>
    </div>
  );
}