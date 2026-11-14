import { Activity, CheckCircle, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export default function DoctorDashboard() {
  const { logout } = useAuth();
  const [visits, setVisits] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [labTest, setLabTest] = useState('');
  const [drugName, setDrugName] = useState('');
  const [dosage, setDosage] = useState('');
  const [qty, setQty] = useState('');

  useEffect(() => { fetchQueue(); }, []);

  async function fetchQueue() {
    const res = await api.get('/api/core/visits/doctor');
    setVisits(res.data);
  }

  async function completeVisit(e: React.FormEvent) {
    e.preventDefault();
    await api.put(`/api/core/visits/${selected.id}/complete`, { diagnosis, notes });
    setSelected(null); setDiagnosis(''); setNotes('');
    fetchQueue();
  }

  async function orderLab(e: React.FormEvent) {
    e.preventDefault();
    await api.post(`/api/core/visits/${selected.id}/lab`, { testName: labTest });
    alert('Lab sent!'); setLabTest('');
  }

  async function prescribe(e: React.FormEvent) {
    e.preventDefault();
    await api.post(`/api/core/visits/${selected.id}/prescribe`, { drugName, dosage, quantity: Number(qty) });
    alert('Prescribed!'); setDrugName(''); setDosage(''); setQty('');
  }

  return (
    <div className="flex h-screen bg-[#f3f4f6] font-sans">
      <div className="w-64 bg-[#0a0f24] text-white flex flex-col">
        <div className="p-6 text-xl font-bold border-b border-gray-700 flex items-center gap-2"><Activity className="text-green-500" /> JONESCARE</div>
        <nav className="flex-1 p-4 space-y-2"><div className="bg-green-600 p-3 rounded flex items-center gap-3"><Users size={18} /> Consultation</div></nav>
        <div className="p-4 border-t border-gray-700"><button onClick={logout} className="w-full text-left p-3 hover:bg-gray-800 rounded text-gray-400">Logout</button></div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white p-4 shadow-sm flex justify-between items-center"><h1 className="text-2xl font-bold text-gray-800">Doctor Consultation</h1></header>
        <main className="p-6 overflow-y-auto grid grid-cols-3 gap-6">
          
          <div className="bg-white p-6 rounded shadow-sm col-span-1">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Queue</h2>
            {visits.map(v => (
              <div key={v.id} onClick={() => setSelected(v)} className={`p-4 border mb-2 rounded cursor-pointer ${selected?.id === v.id ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                <p className="font-bold">{v.patient.name}</p>
                <p className="text-xs text-gray-500">Vitals: {v.vitals?.temp}°C, {v.vitals?.bp}</p>
              </div>
            ))}
          </div>

          {selected ? (
            <div className="bg-white p-6 rounded shadow-sm col-span-2 border-t-4 border-green-500">
              <h2 className="text-xl font-bold mb-4">{selected.patient.name}</h2>
              
              <form onSubmit={completeVisit} className="space-y-4 mb-6">
                <input type="text" placeholder="Diagnosis" required className="w-full border p-2 rounded" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} />
                <textarea placeholder="Clinical Notes" required className="w-full border p-2 rounded h-20" value={notes} onChange={e => setNotes(e.target.value)} />
                <button type="submit" className="bg-green-600 text-white p-2 rounded font-bold w-full flex justify-center gap-2"><CheckCircle size={18} /> Complete</button>
              </form>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <form onSubmit={orderLab} className="space-y-2">
                  <h3 className="font-bold text-sm text-gray-700">Order Lab Test</h3>
                  <input type="text" placeholder="Test Name" required className="w-full border p-2 rounded" value={labTest} onChange={e => setLabTest(e.target.value)} />
                  <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded w-full">Send to Lab</button>
                </form>

                <form onSubmit={prescribe} className="space-y-2">
                  <h3 className="font-bold text-sm text-gray-700">Prescribe Drug</h3>
                  <input type="text" placeholder="Drug Name" required className="w-full border p-2 rounded" value={drugName} onChange={e => setDrugName(e.target.value)} />
                  <div className="flex gap-2">
                    <input type="text" placeholder="Dosage (e.g. 1 tab 3x/day)" required className="w-full border p-2 rounded" value={dosage} onChange={e => setDosage(e.target.value)} />
                    <input type="number" placeholder="Qty" required className="w-20 border p-2 rounded" value={qty} onChange={e => setQty(e.target.value)} />
                  </div>
                  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full">Send to Pharmacy</button>
                </form>
              </div>
            </div>
          ) : (
            <div className="col-span-2 flex items-center justify-center text-gray-400 bg-white rounded shadow-sm">Select patient from queue.</div>
          )}
        </main>
      </div>
    </div>
  );
}