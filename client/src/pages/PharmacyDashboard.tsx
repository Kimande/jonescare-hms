import { Activity, Package, ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export default function PharmacyDashboard() {
  const { logout } = useAuth();
  const [data, setData] = useState<any>({ scripts: [], inventory: [] });
  const [selected, setSelected] = useState<any>(null);

  const fetchPharmacy = async () => {
    try {
      const res = await api.get('/api/core/pharmacy');
      setData({
        scripts: Array.isArray(res.data?.scripts) ? res.data.scripts : [],
        inventory: Array.isArray(res.data?.inventory) ? res.data.inventory : [],
      });
    } catch (error) {
      console.error('Could not load pharmacy data:', error);
      setData({ scripts: [], inventory: [] });
    }
  };

  useEffect(() => {
    fetchPharmacy();
    const timer = setInterval(fetchPharmacy, 5000);
    return () => clearInterval(timer);
  }, []);

  async function dispense() {
    if (!selected) return;
    await api.put(`/api/core/pharmacy/${selected.id}/dispense`);
    setSelected(null);
    await fetchPharmacy();
  }

  return (
    <div className="flex h-screen bg-[#f3f4f6] font-sans">
      <div className="w-64 bg-[#0a0f24] text-white flex flex-col">
        <div className="p-6 text-xl font-bold border-b border-gray-700 flex items-center gap-2">
          <Activity className="text-yellow-500" /> JONESCARE LTD
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <div className="bg-yellow-600 p-3 rounded flex items-center gap-3 cursor-pointer"><ShoppingCart size={18} /> Dispense</div>
          <div className="p-3 hover:bg-gray-800 rounded flex items-center gap-3 cursor-pointer text-gray-400"><Package size={18} /> Inventory</div>
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button onClick={logout} className="w-full text-left p-3 hover:bg-gray-800 rounded text-gray-400">Logout</button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white p-4 shadow-sm flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Pharmacy Portal</h1>
        </header>

        <main className="p-6 overflow-y-auto grid grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded shadow-sm">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Doctor's Recommendations</h2>
            {data.scripts.length === 0 && <p className="text-gray-500">No pending prescriptions.</p>}
            {data.scripts.map((s: any) => {
              const patient = s.visit?.patient || s.visits?.patients;
              const drug = s.drug || s.drugs;
              return (
                <div key={s.id} onClick={() => setSelected(s)} className="p-4 border mb-2 rounded cursor-pointer hover:bg-yellow-50 transition flex justify-between items-center">
                  <div>
                    <p className="font-bold">{patient?.name || 'Unknown patient'} <span className="text-sm text-gray-500">({patient?.patientNo || patient?.patient_no || 'N/A'})</span></p>
                    <p className="text-sm">{drug?.name || 'Unknown drug'} - {s.dosage} (Qty: {s.quantity})</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelected(s);
                    }}
                    className="bg-green-500 text-white px-3 py-1 rounded text-sm font-bold"
                  >
                    Dispense
                  </button>
                </div>
              );
            })}
          </div>

          {selected ? (
            <div className="bg-white p-6 rounded shadow-sm border-t-4 border-yellow-500">
              <h2 className="text-lg font-bold mb-4">Complete & Deduct Stock</h2>
              <p className="mb-2"><b>Drug:</b> {(selected.drug || selected.drugs)?.name}</p>
              <p className="mb-2"><b>Qty:</b> {selected.quantity}</p>
              <p className="mb-6"><b>Current Stock:</b> {(selected.drug || selected.drugs)?.stockQty ?? (selected.drug || selected.drugs)?.stock_qty ?? 0}</p>
              <button onClick={dispense} className="w-full bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700">
                Confirm Dispense
              </button>
            </div>
          ) : (
            <div className="bg-white p-6 rounded shadow-sm">
              <h2 className="text-lg font-bold mb-4 border-b pb-2">Inventory Management</h2>
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100">
                  <tr><th className="p-2">Drug Name</th><th className="p-2">Stock</th><th className="p-2">Status</th></tr>
                </thead>
                <tbody>
                  {data.inventory.map((d: any) => {
                    const stockQty = d.stockQty ?? d.stock_qty ?? 0;
                    const reorderLevel = d.reorderLevel ?? d.reorder_level ?? 0;
                    return (
                      <tr key={d.id} className="border-b">
                        <td className="p-2 font-medium">{d.name}</td>
                        <td className="p-2">{stockQty}</td>
                        <td className="p-2">
                          {stockQty <= reorderLevel
                            ? <span className="text-red-600 font-bold bg-red-100 px-2 py-1 rounded">Reorder Now</span>
                            : <span className="text-green-600 font-bold bg-green-100 px-2 py-1 rounded">OK</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}