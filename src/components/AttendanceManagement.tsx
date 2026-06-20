import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { AttendanceRecord, Student } from '../types';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar, 
  Search, 
  ArrowLeft, 
  ArrowRight, 
  Activity, 
  TrendingUp, 
  AlertCircle 
} from 'lucide-react';

export const AttendanceManagement: React.FC = () => {
  const [todayLog, setTodayLog] = useState<any[]>([]);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sub section selector: 'take' (Today's Checklist) | 'history' (Log)
  const [activeTab, setActiveTab] = useState<'take' | 'history'>('take');

  // Search histories
  const [historySearch, setHistorySearch] = useState('');
  const [todaySearch, setTodaySearch] = useState('');

  // History Pagination
  const [historyPage, setHistoryPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    loadAttendanceData();
  }, [activeTab]);

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (activeTab === 'take') {
        const todayData = await api.getAttendanceToday();
        setTodayLog(todayData);
      } else {
        const historyData = await api.getAttendanceHistory();
        setHistory(historyData);
      }
    } catch (err: any) {
      setError(err.message || "Failed to download attendance tracking information.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (studentId: string) => {
    try {
      await api.checkIn(studentId);
      loadAttendanceData();
    } catch (err: any) {
      alert(err.message || "Check-in failed");
    }
  };

  const handleCheckOut = async (studentId: string) => {
    try {
      await api.checkOut(studentId);
      loadAttendanceData();
    } catch (err: any) {
      alert(err.message || "Check-out failed");
    }
  };

  // Today calculations
  const presentCount = todayLog.filter(s => s.status === 'Present').length;
  const totalActive = todayLog.length || 1;
  const absentCount = totalActive - presentCount;
  const attendancePercentage = Math.round((presentCount / totalActive) * 100);

  // Filter lists
  const filteredToday = todayLog.filter(s => 
    s.fullName.toLowerCase().includes(todaySearch.toLowerCase()) || 
    (s.seatNumber && s.seatNumber.toLowerCase().includes(todaySearch.toLowerCase()))
  );

  const filteredHistory = history.filter(h => 
    h.studentName.toLowerCase().includes(historySearch.toLowerCase()) || 
    h.date.includes(historySearch)
  );

  // Pagination for History
  const totalHistory = filteredHistory.length;
  const totalHistoryPages = Math.ceil(totalHistory / itemsPerPage) || 1;
  const historyStartIndex = (historyPage - 1) * itemsPerPage;
  const paginatedHistory = filteredHistory.slice(historyStartIndex, historyStartIndex + itemsPerPage);

  const handlePageChange = (p: number) => {
    if (p >= 1 && p <= totalHistoryPages) {
      setHistoryPage(p);
    }
  };

  if (loading && todayLog.length === 0 && history.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-sans font-extrabold text-slate-900 tracking-tight">Attendance Roll</h1>
          <p className="text-xs text-slate-500">Track check-ins/check-outs, study durations, and log historic class percentages.</p>
        </div>

        {/* Tab Toggle buttons */}
        <div className="flex w-full sm:w-auto space-x-1 sm:space-x-1.5 p-1 bg-slate-100 border border-slate-150 rounded-xl">
          <button
            onClick={() => setActiveTab('take')}
            className={`flex-1 sm:flex-none text-center text-xs font-bold px-3 sm:px-4 py-2 rounded-lg transition ${
              activeTab === 'take' 
                ? 'bg-white text-slate-850 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Today's Checklist
          </button>
          <button
            onClick={() => { setActiveTab('history'); setHistoryPage(1); }}
            className={`flex-1 sm:flex-none text-center text-xs font-bold px-3 sm:px-4 py-2 rounded-lg transition ${
              activeTab === 'history' 
                ? 'bg-white text-slate-850 shadow-xs' 
                : 'text-slate-500 hover:text-slate-850'
            }`}
          >
            History Ledger
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-00 rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-650 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* DYNAMIC SUMMARIES PANEL (only on take tab) */}
      {activeTab === 'take' && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { label: 'Present Students Today', val: presentCount, clr: 'text-emerald-700 bg-emerald-50 border-emerald-100', icon: <CheckCircle className="w-4 h-4 text-emerald-650" /> },
            { label: 'Absent Students Today', val: absentCount, clr: 'text-red-700 bg-red-50 border-red-100', icon: <XCircle className="w-4 h-4 text-red-650" /> },
            { label: 'Total Active Accounts', val: totalActive, clr: 'text-slate-800 bg-white border-slate-200', icon: <TrendingUp className="w-4 h-4 text-slate-650" /> },
            { label: 'Attendance Percentage', val: `${attendancePercentage}%`, clr: 'text-amber-700 bg-amber-50 border-amber-100', icon: <Activity className="w-4 h-4 text-amber-650" /> }
          ].map((c, i) => (
            <div key={i} className={`p-5 rounded-2xl border ${c.clr} flex flex-col justify-between shadow-xs`}>
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{c.label}</span>
                <span className="p-1.5 bg-white border border-slate-105 rounded-lg shrink-0">{c.icon}</span>
              </div>
              <span className="text-2xl font-sans font-black tracking-tight">{c.val}</span>
            </div>
          ))}
        </div>
      )}

      {/* TODAY CHECKLIST TAB */}
      {activeTab === 'take' ? (
        <div className="bg-white border border-slate-200 rounded-[22px] p-6 space-y-5 overflow-hidden shadow-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 pb-4">
            <div>
              <h3 className="font-sans font-bold text-slate-850 text-sm">Active Attendance Logger</h3>
              <p className="text-[10px] text-slate-450 mt-0.5">Toggle daily study logs here. Actions write to live database instantly.</p>
            </div>
            <div className="relative w-full sm:w-72">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={todaySearch}
                onChange={(e) => setTodaySearch(e.target.value)}
                placeholder="Search today's registry by name or seat..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-amber-500/30"
              />
            </div>
          </div>

          {/* CHECKLIST LIST */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredToday.length === 0 ? (
              <p className="p-8 text-center text-slate-400 font-mono text-xs col-span-3">No active students found matching search.</p>
            ) : (
              filteredToday.map((item) => (
                <div key={item.studentId} className="bg-white border border-slate-150 p-4.5 rounded-xl flex flex-col justify-between shadow-xs hover:border-amber-300 transition duration-150">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{item.fullName}</h4>
                      <p className="text-[10px] text-slate-450 font-mono mt-0.5">Seat No: {item.seatNumber || 'Pending'} • Mob: {item.mobile}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                      item.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                      ● {item.status}
                    </span>
                  </div>

                  {/* CHECK IN DETAILS */}
                  <div className="grid grid-cols-2 gap-3 text-slate-600 font-medium text-xs py-3 border-y border-slate-50 mt-4 bg-slate-50/50 px-2 rounded-lg">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Check In:</span>
                      <span className="font-mono mt-0.5 block">{item.checkIn || '--:--'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Check Out:</span>
                      <span className="font-mono mt-0.5 block">{item.checkOut || '--:--'}</span>
                    </div>
                  </div>

                  {/* LOGGINGS BUTTONS */}
                  <div className="flex gap-2 mt-4 pt-1">
                    <button
                      onClick={() => handleCheckIn(item.studentId)}
                      disabled={item.isCheckedIn}
                      className="bg-emerald-600 font-bold text-white py-2 px-3.5 rounded-lg text-xs hover:bg-emerald-700 transition flex-1 disabled:opacity-45"
                    >
                      Check In
                    </button>
                    <button
                      onClick={() => handleCheckOut(item.studentId)}
                      disabled={!item.isCheckedIn || item.isCheckedOut}
                      className="bg-amber-500 font-bold text-slate-950 py-2 px-3.5 rounded-lg text-xs hover:bg-amber-600 transition flex-1 disabled:opacity-45"
                    >
                      Check Out
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* HISTORY TAB */
        <div className="bg-white border border-slate-200 rounded-[22px] p-6 space-y-5 overflow-hidden shadow-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-105 pb-4">
            <div>
              <h3 className="font-sans font-bold text-slate-850 text-sm">Historic Attendance Ledger</h3>
              <p className="text-[10px] text-slate-450 mt-0.5">Filter entire attendance archives by student names or calendar days.</p>
            </div>
            <div className="relative w-full sm:w-72">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search history by name or date..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-amber-500/30"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-105 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="p-3.5">Student Name</th>
                  <th className="p-3.5">Log Date</th>
                  <th className="p-3.5">Checked In Time</th>
                  <th className="p-3.5">Checked Out Time</th>
                  <th className="p-3.5">Log Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 font-mono">No historical logs matched terms.</td>
                  </tr>
                ) : (
                  paginatedHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/40">
                      <td className="p-3.5 font-bold text-slate-800">{item.studentName}</td>
                      <td className="p-3.5 text-slate-500 font-medium font-mono">{item.date}</td>
                      <td className="p-3.5 text-slate-600 font-mono font-medium">{item.checkIn || '--:--'}</td>
                      <td className="p-3.5 text-slate-600 font-mono font-medium">{item.checkOut || '--:--'}</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'Present' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-705'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* HISTORY PAGINATION */}
          <div className="flex justify-between items-center text-xs text-slate-500 font-medium pt-3 text-slate-505 font-semibold">
            <span>Showing {paginatedHistory.length > 0 ? historyStartIndex + 1 : 0} to {Math.min(historyStartIndex + itemsPerPage, totalHistory)} of {totalHistory} logs</span>
            <div className="flex space-x-1.5 items-center">
              <button
                onClick={() => handlePageChange(historyPage - 1)}
                disabled={historyPage === 1}
                className="p-1 px-2 border border-slate-205 rounded-lg bg-white disabled:opacity-40 hover:bg-slate-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(historyPage + 1)}
                disabled={historyPage === totalHistoryPages}
                className="p-1 px-2 border border-slate-205 rounded-lg bg-white disabled:opacity-40 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
