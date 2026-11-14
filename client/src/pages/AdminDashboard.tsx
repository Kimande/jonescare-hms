import { Activity, CheckCircle, Clock, DollarSign, Download, FlaskConical, LayoutDashboard, Plus, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Bar, BarChart, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export default function AdminDashboard() {
  const { logout } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [time, setTime] = useState(new Date());
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'DOCTOR', licenseNo: '', gender: 'MALE' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchStats = async () => {
    try { const res = await api.get('/api/admin/stats'); setStats(res.data); } catch (e) {}
  };
  const fetchStaff = async () => {
    try { const res = await api.get('/api/admin/staff'); setStaffList(res.data); } catch (e) {}
  };

  useEffect(() => {
    fetchStats();
    fetchStaff();
    const timer = setInterval(fetchStats, 5000); // Live polling every 5s
    return () => clearInterval(timer);
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg('');
    try {
      await api.post('/api/admin/staff', form);
      setMsg('Staff created successfully! Default password: password123');
      setForm({ name: '', email: '', phone: '', role: 'DOCTOR', licenseNo: '', gender: 'MALE' });
      fetchStaff();
    } catch (err: any) { setMsg(err.response?.data?.error || 'Failed'); }
  };

  if (!stats) return <div className="p-10 text-center font-bold text-xl">Loading System...</div>;

  return (
    <div className="flex h-screen bg-[#f3f4f6] font-sans">
      <div className="w-64 bg-[#0a0f24] text-white flex flex-col">
        <div className="p-6 text-xl font-bold border-b border-gray-700 flex items-center gap-2">
          <Activity className="text-blue-500" /> JONESCARE LTD
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <div onClick={() => setActiveTab('overview')} className={`p-3 rounded flex items-center gap-3 cursor-pointer transition ${activeTab === 'overview' ? 'bg-green-600' : 'hover:bg-gray-800 text-gray-400'}`}>
            <LayoutDashboard size={18} /> Dashboard Overview
          </div>
          <div onClick={() => setActiveTab('staff')} className={`p-3 rounded flex items-center gap-3 cursor-pointer transition ${activeTab === 'staff' ? 'bg-green-600' : 'hover:bg-gray-800 text-gray-400'}`}>
            <Users size={18} /> Staff Management
          </div>
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button onClick={logout} className="w-full text-left p-3 hover:bg-gray-800 rounded text-gray-400">Logout</button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white p-4 shadow-sm flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800 capitalize">{activeTab}</h1>
          <div className="flex gap-4 items-center">
            <span className="text-gray-600 flex items-center gap-2 font-medium">
              <Clock size={16} /> {time.toLocaleTimeString()} | {time.toLocaleDateString()}
            </span>
            <button onClick={() => window.open('http://localhost:4000/api/admin/report/pdf', '_blank')} className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-green-700">
              <Download size={18} /> Weekly PDF Report
            </button>
          </div>
        </header>

        <main className="p-6 overflow-y-auto">
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <Card title="Patients Today" value={stats.patientsToday} icon={<Users className="text-blue-500" />} />
                <Card title="Revenue Today" value={`KES ${stats.revenueToday.toLocaleString()}`} icon={<DollarSign className="text-green-500" />} />
                <Card title="Staff Active" value={stats.staffOnDuty} icon={<Activity className="text-purple-500" />} />
                <Card title="Pending Labs" value={stats.pendingLabs} icon={<FlaskConical className="text-red-500" />} />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded shadow-sm col-span-1">
                  <h3 className="font-bold mb-4">Revenue This Week</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={stats.revenueChart.map((v: number, i: number) => ({ day: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i], value: v }))}>
                      <XAxis dataKey="day" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white p-4 rounded shadow-sm col-span-1">
                  <h3 className="font-bold mb-4">Patient Traffic</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={stats.trafficChart.map((v: number, i: number) => ({ day: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i], value: v }))}>
                      <XAxis dataKey="day" /><YAxis /><Tooltip /><Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white p-4 rounded shadow-sm col-span-1">
                  <h3 className="font-bold mb-4">Top Diagnoses</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={stats.diagnosesChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                        {stats.diagnosesChart.map((_: any, index: number) => (
                          <Cell key={index} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][index % 4]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-[#e8f5e9] p-4 rounded shadow-sm border border-green-200 col-span-1">
                  <h3 className="font-bold mb-4 text-green-900">System AI Analysis</h3>
                  {/* DYNAMIC AI TEXT */}
                  <p className="bg-white p-4 rounded shadow-sm border-l-4 border-blue-500 text-sm font-medium text-gray-700">
                    {stats.aiInsight}
                  </p>
                </div>
              </div>
            </>
          )}

          {activeTab === 'staff' && (
            <div className="bg-white rounded shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Staff Directory</h2>
                <button onClick={() => setShowAddForm(!showAddForm)} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700">
                  <Plus size={18} /> {showAddForm ? 'Close Form' : 'Add New Staff'}
                </button>
              </div>

              {showAddForm && (
                <div className="bg-blue-50 p-4 rounded mb-6 border border-blue-200">
                  <h3 className="font-bold text-blue-900 mb-4">Register New Staff Member</h3>
                  {msg && <p className="bg-white text-green-700 p-2 rounded mb-4 text-sm font-bold">{msg}</p>}
                  <form onSubmit={handleCreateStaff} className="grid grid-cols-3 gap-4">
                    <input type="text" placeholder="Full Name" required className="border p-2 rounded" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                    <input type="email" placeholder="Email" required className="border p-2 rounded" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                    <input type="text" placeholder="Phone Number" required className="border p-2 rounded" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                    <select className="border p-2 rounded" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                      <option value="DOCTOR">Doctor</option><option value="NURSE">Nurse</option>
                      <option value="RECEPTIONIST">Receptionist</option><option value="LAB_TECH">Lab Tech</option><option value="PHARMACIST">Pharmacist</option>
                    </select>
                    <select className="border p-2 rounded" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                      <option value="MALE">Male</option><option value="FEMALE">Female</option>
                    </select>
                    <input type="text" placeholder="License No (Clinical only)" className="border p-2 rounded" value={form.licenseNo} onChange={e => setForm({...form, licenseNo: e.target.value})} />
                    <button type="submit" className="col-span-3 bg-green-600 text-white p-2 rounded font-bold hover:bg-green-700">Create Staff Account</button>
                  </form>
                </div>
              )}

              <table className="w-full text-left">
                <thead className="bg-gray-100 text-gray-600 text-sm">
                  <tr><th className="p-3">Name</th><th className="p-3">Role</th><th className="p-3">Email</th><th className="p-3">Phone</th><th className="p-3">Status</th></tr>
                </thead>
                <tbody>
                  {staffList.map((s: any) => (
                    <tr key={s.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{s.name}</td>
                      <td className="p-3"><span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{s.role}</span></td>
                      <td className="p-3 text-gray-500">{s.email}</td>
                      <td className="p-3 text-gray-500">{s.phone}</td>
                      <td className="p-3"><span className="text-green-600 flex items-center gap-1 text-sm"><CheckCircle size={14}/> {s.status}</span></td>
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

function Card({ title, value, icon }: any) {
  return (
    <div className="bg-white p-6 rounded shadow-sm flex items-center gap-4 border-l-4 border-green-500">
      <div className="p-4 bg-gray-50 rounded-full">{icon}</div>
      <div><p className="text-gray-500 text-sm font-medium">{title}</p><p className="text-2xl font-bold text-gray-800">{value}</p></div>
    </div>
  );
}