import { Activity, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export default function NurseDashboard() {
  const { logout } = useAuth();
  const [visits, setVisits] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [vitals, setVitals] = useState({ temp: '', bp: '', weight: '' });

  const fetchVisits = async () => {
    try {
      const res = await api.get('/api/core/visits/waiting');
      const payload = Array.isArray(res.data) ? res.data : res.data?.visits ?? [];
      setVisits(payload);
    } catch (error) {
      console.error('Could not load waiting room:', error);
      setVisits([]);
    }
  };

  useEffect(() => {
    fetchVisits();
    const timer = setInterval(fetchVisits, 5000);
    return () => clearInterval(timer);
  }, []);

  async function submitVitals(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    await api.put(`/api/core/visits/${selected.id}/vitals`, {
      temp: vitals.temp,
      bp: vitals.bp,
      weight: vitals.weight,
    });
    setSelected(null);
    setVitals({ temp: '', bp: '', weight: '' });
    await fetchVisits();
  }

  return (
    <div className="flex h-screen bg-[#f3f4f6] font-sans">
      <div className="w-64 bg-[#0a0f24] text-white flex flex-col">
        <div className="p-6 text-xl font-bold border-b border-gray-700 flex items-center gap-2">
          <Activity className="text-blue-500" /> JONESCARE LTD
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <div className="bg-blue-600 p-3 rounded flex items-center gap-3 cursor-pointer"><Users size={18} /> Triage Dashboard</div>
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button onClick={logout} className="w-full text-left p-3 hover:bg-gray-800 rounded text-gray-400">Logout</button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white p-4 shadow-sm flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Nurse Triage Dashboard</h1>
        </header>

        <main className="p-6 overflow-y-auto grid grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded shadow-sm">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Waiting Room</h2>
            {visits.length === 0 && <p className="text-gray-500">No patients waiting.</p>}
            {visits.map((v: any) => (
              <div key={v.id} onClick={() => setSelected(v)} className="p-4 border mb-2 rounded cursor-pointer hover:bg-blue-50 transition">
                <p className="font-bold">{v.patient?.name || v.patients?.name} <span className="text-sm text-gray-500">({v.patient?.patientNo || v.patients?.patientNo || v.patients?.patient_no || 'N/A'})</span></p>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Waiting</span>
              </div>
            ))}
          </div>

          {selected && (
            <div className="bg-white p-6 rounded shadow-sm border-t-4 border-blue-500">
              <h2 className="text-lg font-bold mb-4 text-blue-800">Vitals Form: {selected.patient?.name || selected.patients?.name}</h2>
              <form onSubmit={submitVitals} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Temperature (°C)</label>
                  <input type="text" required className="w-full border p-2 rounded" value={vitals.temp} onChange={e => setVitals({ ...vitals, temp: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Blood Pressure (mmHg)</label>
                  <input type="text" required className="w-full border p-2 rounded" value={vitals.bp} onChange={e => setVitals({ ...vitals, bp: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Weight (kg)</label>
                  <input type="text" required className="w-full border p-2 rounded" value={vitals.weight} onChange={e => setVitals({ ...vitals, weight: e.target.value })} />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700">
                  Save & Send to Doctor
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}