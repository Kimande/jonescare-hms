import { useState } from 'react';
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

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');
      const destination = roleRedirects[loggedInUser.role] || '/dashboard';
      navigate(destination, { replace: true });
    } catch {
      setError('Invalid email or password');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-md w-full max-w-md border border-slate-200">
        <h1 className="text-2xl font-bold mb-2 text-center text-slate-900">Jones Care HMS</h1>
        <p className="text-sm text-slate-500 text-center mb-6">Secure access to the hospital system</p>

        {error && (
          <p className="text-red-600 text-sm mb-4 text-center bg-red-50 border border-red-200 rounded-lg p-2">
            {error}
          </p>
        )}

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-slate-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-slate-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Login
          </button>
        </div>
      </form>
    </div>
  );
}