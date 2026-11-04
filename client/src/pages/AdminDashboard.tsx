import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', gender: 'MALE', role: 'DOCTOR', licenseNo: '' });
  const [msg, setMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    try {
      await api.post('/api/admin/staff', form);
      setMsg('Staff created successfully!');
      setForm({ name: '', email: '', phone: '', gender: 'MALE', role: 'DOCTOR', licenseNo: '' });
    } catch (err: any) {
      setMsg(err.response?.data?.error || 'Failed to create staff');
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
      </div>

      <div className="bg-white p-6 rounded shadow mb-8">
        <p className="text-lg">Welcome, <strong>{user?.name}</strong></p>
      </div>

      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Create New Staff Account</h2>
        {msg && <p className="mb-4 text-blue-600">{msg}</p>}
        
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <input type="text" placeholder="Full Name" required className="border p-2 rounded" 
                 value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          <input type="email" placeholder="Email" required className="border p-2 rounded" 
                 value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          <input type="text" placeholder="Phone" required className="border p-2 rounded" 
                 value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          
          <select className="border p-2 rounded" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
            <option value="DOCTOR">Doctor</option>
            <option value="NURSE">Nurse</option>
            <option value="RECEPTIONIST">Receptionist</option>
            <option value="LAB_TECH">Lab Tech</option>
            <option value="PHARMACIST">Pharmacist</option>
          </select>

          <select className="border p-2 rounded" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>

          <input type="text" placeholder="License No (required for clinical roles)" className="border p-2 rounded" 
                 value={form.licenseNo} onChange={e => setForm({...form, licenseNo: e.target.value})} />

          <button type="submit" className="col-span-2 bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
            Create Staff
          </button>
        </form>
      </div>
    </div>
  );
}