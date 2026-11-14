import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function RegisterAdmin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/api/auth/register-admin', form);
      setSuccess('Admin created successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2 text-center text-blue-900">Create Admin</h1>
        <p className="text-gray-500 text-center mb-6 text-sm">Add another admin account without needing the existing password</p>

        {error && <p className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</p>}
        {success && <p className="bg-green-50 text-green-600 p-3 rounded mb-4 text-sm font-bold">{success}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="text" placeholder="Full Name" required className="border p-2 rounded"
                 value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          
          <input type="email" placeholder="Admin Email" required className="border p-2 rounded"
                 value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          
          <input type="text" placeholder="Phone Number" required className="border p-2 rounded"
                 value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          
          <input type="password" placeholder="Password (min 6 chars)" required minLength={6} className="border p-2 rounded"
                 value={form.password} onChange={e => setForm({...form, password: e.target.value})} />

          <button type="submit" className="bg-blue-600 text-white font-bold p-2 rounded hover:bg-blue-700 mt-2">
            Create Admin Account
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link to="/login" className="text-blue-500 hover:underline">Already have an account? Log in</Link>
        </div>
      </div>
    </div>
  );
}