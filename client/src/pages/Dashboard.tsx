import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();

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