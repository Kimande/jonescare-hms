import { Activity, FlaskConical } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export default function LabDashboard() {
  const { logout } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [result, setResult] = useState('');

  const fetchLab = async () => {
    try {
      const res = await api.get('/api/core/lab');
      const payload = Array.isArray(res.data) ? res.data : res.data?.requests ?? [];
      setRequests(payload);
    } catch (error) {
      console.error('Could not load lab queue:', error);
      setRequests([]);
    }
  };

  useEffect(() => {
    fetchLab();
    const timer = setInterval(fetchLab, 5000);
    return () => clearInterval(timer);
  }, []);

  async function submitResult(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    await api.put(`/api/core/lab/${selected.id}`, { result });
    setSelected(null);
    setResult('');
    await fetchLab();
  }

  return (
    <div className="flex h-screen bg-[#f3f4f6] font-sans">
      <div className="w-64 bg-[#0a0f24] text-white flex flex-col">
        <div className="p-6 text-xl font-bold border-b border-gray-700 flex items-center gap-2">
          <Activity className="text-purple-500" /> JONESCARE LTD
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <div className="bg-purple-600 p-3 rounded flex items-center gap-3 cursor-pointer"><FlaskConical size={18} /> Pending Tests</div>
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button onClick={logout} className="w-full text-left p-3 hover:bg-gray-800 rounded text-gray-400">Logout</button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white p-4 shadow-sm flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Lab Technician Dashboard</h1>
        </header>

        <main className="p-6 overflow-y-auto grid grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded shadow-sm">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Pending Tests</h2>
            {requests.length === 0 && <p className="text-gray-500">No lab requests pending.</p>}
            {requests.map((r: any) => {
              const patient = r.visit?.patient || r.visits?.patients;
              return (
                <div key={r.id} onClick={() => setSelected(r)} className="p-4 border mb-2 rounded cursor-pointer hover:bg-purple-50 transition">
                  <p className="font-bold">{r.testName || r.test_name}</p>
                  <p className="text-sm text-gray-500">{patient?.name || 'Unknown patient'} ({patient?.patientNo || patient?.patient_no || 'N/A'})</p>
                </div>
              );
            })}
          </div>

          {selected && (
            <div className="bg-white p-6 rounded shadow-sm border-t-4 border-purple-500">
              <h2 className="text-lg font-bold mb-4">Result Entry: {selected.testName || selected.test_name}</h2>
              <form onSubmit={submitResult} className="space-y-4">
                <textarea placeholder="Enter findings here..." required className="w-full border p-2 rounded h-32" value={result} onChange={e => setResult(e.target.value)} />
                <button type="submit" className="w-full bg-purple-600 text-white p-3 rounded font-bold hover:bg-purple-700">
                  Submit Result to Doctor
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}