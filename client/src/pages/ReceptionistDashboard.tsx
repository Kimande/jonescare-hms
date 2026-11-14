import { Activity, DollarSign, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export default function ReceptionistDashboard() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('patients');
  const [patients, setPatients] = useState<any[]>([]);
  const [pendingBills, setPendingBills] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', dob: '', gender: 'MALE', phone: '', county: '', town: '', shaNumber: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const delay = setTimeout(() => {
      api.get(`/api/core/patients?search=${search}`).then(res => setPatients(res.data));
    }, 300);
    return () => clearTimeout(delay);
  }, [search]);

  useEffect(() => {
    if(activeTab === 'billing') api.get('/api/core/bills/pending').then(res => setPendingBills(res.data));
  }, [activeTab]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault(); setMsg('');
    try {
      await api.post('/api/core/patients', form);
      setMsg('Patient Registered!'); setForm({ name: '', dob: '', gender: 'MALE', phone: '', county: '', town: '', shaNumber: '' });
      api.get('/api/core/patients').then(res => setPatients(res.data));
    } catch (err: any) { setMsg(err.response?.data?.error || 'Error'); }
  }

  async function sendToTriage(patientId: number) {
    try { await api.post('/api/core/visits', { patientId }); alert('Sent to Nurse Triage!'); } catch (e) { alert('Failed'); }
  }

  async function processPayment(visitId: number, amount: number) {
    try { await api.post('/api/core/bills', { visitId, amount, method: 'CASH' }); alert('Payment Recorded!'); setActiveTab('patients'); } catch (e) { alert('Failed'); }
  }

  return (
    <div className="flex h-screen bg-[#f3f4f6] font-sans">
      <div className="w-64 bg-[#0a0f24] text-white flex flex-col">
        <div className="p-6 text-xl font-bold border-b border-gray-700 flex items-center gap-2"><Activity className="text-blue-500" /> JONESCARE</div>
        <nav className="flex-1 p-4 space-y-2">
          <div onClick={() => setActiveTab('patients')} className={`p-3 rounded flex items-center gap-3 cursor-pointer ${activeTab === 'patients' ? 'bg-green-600' : 'hover:bg-gray-800 text-gray-400'}`}><Users size={18} /> Patients</div>
          <div onClick={() => setActiveTab('billing')} className={`p-3 rounded flex items-center gap-3 cursor-pointer ${activeTab === 'billing' ? 'bg-green-600' : 'hover:bg-gray-800 text-gray-400'}`}><DollarSign size={18} /> Billing POS</div>
        </nav>
        <div className="p-4 border-t border-gray-700"><button onClick={logout} className="w-full text-left p-3 hover:bg-gray-800 rounded text-gray-400">Logout</button></div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white p-4 shadow-sm flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800 capitalize">{activeTab}</h1>
        </header>

        <main className="p-6 overflow-y-auto">
          {activeTab === 'patients' && (
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 bg-white p-6 rounded shadow-sm">
                <h2 className="text-lg font-bold mb-4 border-b pb-2">Register Patient</h2>
                {msg && <p className="mb-4 text-green-600 bg-green-50 p-2 rounded">{msg}</p>}
                <form onSubmit={handleRegister} className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Full Name" required className="border p-2 rounded" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                  <input type="text" placeholder="Phone Number" required className="border p-2 rounded" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                  <input type="date" required className="border p-2 rounded" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} />
                  <select className="border p-2 rounded" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}><option value="MALE">Male</option><option value="FEMALE">Female</option></select>
                  <input type="text" placeholder="County" className="border p-2 rounded" value={form.county} onChange={e => setForm({...form, county: e.target.value})} />
                  <input type="text" placeholder="SHA Number (Optional)" className="border p-2 rounded" value={form.shaNumber} onChange={e => setForm({...form, shaNumber: e.target.value})} />
                  <button type="submit" className="col-span-2 bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700">Register</button>
                </form>
              </div>
              <div className="col-span-1 bg-white p-6 rounded shadow-sm">
                <h2 className="text-lg font-bold mb-4">Search</h2>
                <input type="text" placeholder="Search name or ID..." className="w-full border p-2 rounded mb-4" value={search} onChange={e => setSearch(e.target.value)} />
                {patients.map(p => (
                  <div key={p.id} className="border p-3 rounded mb-2">
                    <p className="font-bold">{p.name} <span className="text-xs text-gray-500">({p.patientNo})</span></p>
                    <button onClick={() => sendToTriage(p.id)} className="mt-2 bg-blue-100 text-blue-700 px-3 py-1 text-xs rounded font-bold">Send to Triage</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="bg-white p-6 rounded shadow-sm">
              <h2 className="text-xl font-bold mb-4">Completed Visits (Awaiting Payment)</h2>
              <table className="w-full text-left">
                <thead><tr className="bg-gray-100"><th className="p-3">Patient</th><th className="p-3">Diagnosis</th><th className="p-3">Amount</th><th className="p-3">Action</th></tr></thead>
                <tbody>
                  {pendingBills.map(v => (
                    <tr key={v.id} className="border-b">
                      <td className="p-3">{v.patient.name}</td>
                      <td className="p-3">{v.diagnosis || 'N/A'}</td>
                      <td className="p-3 font-bold">KES 500</td>
                      <td className="p-3"><button onClick={() => processPayment(v.id, 500)} className="bg-green-600 text-white px-4 py-1 rounded">Pay Cash</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}