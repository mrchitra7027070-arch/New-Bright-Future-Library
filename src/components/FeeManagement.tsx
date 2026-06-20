import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { FeeRecord, Student, PaymentMode, FeeStatus } from '../types';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash, 
  CreditCard, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight, 
  TrendingUp, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  PlusCircle, 
  FileCheck2 
} from 'lucide-react';

export const FeeManagement: React.FC = () => {
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modeFilter, setModeFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form Mode: 'list' | 'add' | 'edit'
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingFee, setEditingFee] = useState<FeeRecord | null>(null);

  // Form fields
  const [studentId, setStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [month, setMonth] = useState('June 2026');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [status, setStatus] = useState<FeeStatus>('Paid');

  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Clear confirm state
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const feeList = await api.getFees();
      const studentList = await api.getStudents();
      setFees(feeList);
      setStudents(studentList);
    } catch (err: any) {
      setError(err.message || "Failed to load fee records directory.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllFees = async () => {
    try {
      setClearing(true);
      setError(null);
      await api.clearAllFees();
      await loadData();
      setShowClearConfirm(false);
    } catch (err: any) {
      setError(err.message || "Failed to clear fee records.");
    } finally {
      setClearing(false);
    }
  };

  const handleDeleteFee = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this fee record?")) return;
    try {
      setError(null);
      await api.deleteFee(id);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to delete fee record.");
    }
  };

  const handleCreateClick = () => {
    setStudentId(students[0]?.id || '');
    setAmount(students[0]?.feeAmount.toString() || '1500');
    setMonth(new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMode('UPI');
    setStatus('Paid');
    setFormError(null);
    setMode('add');
  };

  const handleEditClick = (fee: FeeRecord) => {
    setEditingFee(fee);
    setStudentId(fee.studentId);
    setAmount(fee.amount.toString());
    setMonth(fee.month);
    setPaymentDate(fee.paymentDate || new Date().toISOString().split('T')[0]);
    setPaymentMode(fee.paymentMode);
    setStatus(fee.status);
    setFormError(null);
    setMode('edit');
  };

  const handleQuickCollect = (student: Student) => {
    setStudentId(student.id);
    setAmount(student.feeAmount.toString());
    setMonth(new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMode('UPI');
    setStatus('Paid');
    setFormError(null);
    setMode('add');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!studentId) return setFormError("Missing student reference.");
    if (!amount || parseFloat(amount) <= 0) return setFormError("Introduce a valid payment amount.");

    setFormLoading(true);
    try {
      const payload = {
        studentId,
        amount: parseFloat(amount),
        month,
        paymentDate: status === 'Paid' ? (paymentDate || new Date().toISOString().split('T')[0]) : "",
        paymentMode,
        status
      };

      if (mode === 'add') {
        await api.addFee(payload);
      } else if (mode === 'edit' && editingFee) {
        await api.editFee(editingFee.id, payload);
      }

      await loadData();
      setMode('list');
    } catch (err: any) {
      setFormError(err.message || "Operation failed.");
    } finally {
      setFormLoading(false);
    }
  };

  // Change student update form amount automatically
  const handleStudentChange = (id: string) => {
    setStudentId(id);
    const stud = students.find(s => s.id === id);
    if (stud) setAmount(stud.feeAmount.toString());
  };

  const filteredFees = fees.filter(fee => {
    const matchesSearch = fee.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          fee.month.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter ? fee.status === statusFilter : true;
    const matchesMode = modeFilter ? fee.paymentMode === modeFilter : true;
    return matchesSearch && matchesStatus && matchesMode;
  });

  // Pagination bounds
  const totalItems = filteredFees.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFees = filteredFees.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, modeFilter]);

  // Aggregate stats
  const todayStr = new Date().toISOString().split('T')[0];
  const monthlyPrefix = todayStr.substring(0, 7); // YYYY-MM
  const yearlyPrefix = todayStr.substring(0, 4);  // YYYY

  let todaySum = 0;
  let monthlySum = 0;
  let yearlySum = 0;
  let pendingSum = 0;

  fees.forEach(f => {
    if (f.status === 'Paid' && f.paymentDate) {
      if (f.paymentDate === todayStr) todaySum += f.amount;
      if (f.paymentDate.startsWith(monthlyPrefix)) monthlySum += f.amount;
      if (f.paymentDate.startsWith(yearlyPrefix)) yearlySum += f.amount;
    } else if (f.status === 'Pending' || f.status === 'Overdue') {
      pendingSum += f.amount;
    }
  });

  if (loading) {
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
          <h1 className="text-2xl font-sans font-extrabold text-slate-900 tracking-tight">Fee Management</h1>
          <p className="text-xs text-slate-500">Record billing cycles, handle dynamic collections, inspect transaction histories.</p>
        </div>
        {mode === 'list' && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {fees.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="inline-flex items-center justify-center space-x-2 bg-red-50 text-red-700 border border-red-100 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-red-100/80 transition shadow-xs cursor-pointer"
              >
                <Trash className="w-3.5 h-3.5" />
                <span>Clear Fees Data (All)</span>
              </button>
            )}
            <button
              onClick={handleCreateClick}
              className="inline-flex items-center justify-center space-x-2 bg-amber-500 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-amber-600 transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Collect Fee</span>
            </button>
          </div>
        )}
      </div>

      {/* CLEAR ALL FEES CONFIRMATION MODAL */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-3 text-red-650">
              <div className="p-2.5 bg-red-50 rounded-xl">
                <AlertCircle className="w-6 h-6 text-red-650" />
              </div>
              <h3 className="text-base font-sans font-extrabold text-slate-900">Are you sure?</h3>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              This action was explicitly requested to <strong>clear all student fee records</strong>. 
              Are you sure you want to perform this operation? This will reset all transaction and billing history to empty.
            </p>

            <div className="flex items-center justify-end space-x-2.5 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                disabled={clearing}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-205 rounded-xl transition cursor-pointer"
              >
                No, Cancel
              </button>
              <button
                onClick={handleClearAllFees}
                disabled={clearing}
                className="px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-md shadow-red-600/15 flex items-center space-x-2 cursor-pointer disabled:opacity-55"
              >
                {clearing ? (
                  <span>Clearing All Fees...</span>
                ) : (
                  <>
                    <Trash className="w-3.5 h-3.5" />
                    <span>Yes, Clear All Fee Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-650 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* QUICK VIEW CARDS PANEL */}
      {mode === 'list' && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { label: "Today's Collection", val: `₹${todaySum}`, icon: <CheckCircle className="w-4 h-4 text-emerald-600" />, clr: 'bg-emerald-50/50 border-emerald-100' },
            { label: "This Month's Collections", val: `₹${monthlySum}`, icon: <TrendingUp className="w-4 h-4 text-slate-650" />, clr: 'bg-white border-slate-200' },
            { label: "Year-to-date Collection", val: `₹${yearlySum}`, icon: <DollarSign className="w-4 h-4 text-amber-600" />, clr: 'bg-amber-50 border-amber-100' },
            { label: "Outstanding Pending fees", val: `₹${pendingSum}`, icon: <Clock className="w-4 h-4 text-red-600" />, clr: 'bg-red-50 border-red-100' }
          ].map((c, i) => (
            <div key={i} className={`p-5 rounded-2xl border ${c.clr} flex flex-col justify-between`}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{c.label}</span>
                <div className="p-1 bg-white border border-slate-105 rounded-lg shrink-0">
                  {c.icon}
                </div>
              </div>
              <span className="block text-xl font-sans font-black tracking-tight text-slate-850">{c.val}</span>
            </div>
          ))}
        </div>
      )}

      {/* VIEW LISTS AND LOGS */}
      {mode === 'list' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* QUICK COLLECT LIST (left-4) */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-[22px] overflow-hidden p-5 space-y-4">
            <div>
              <h3 className="font-sans font-bold text-slate-800 text-sm">Quick Fee Collection</h3>
              <p className="text-[10px] text-slate-500 mt-1">Select active students below to record payment with standard contract rates.</p>
            </div>

            <div className="divide-y divide-slate-50 max-h-[460px] overflow-y-auto pr-1">
              {students.filter(s => s.status === 'Active').length === 0 ? (
                <p className="p-4 text-center text-slate-400 font-mono text-xs">No active students on pool.</p>
              ) : (
                students.filter(s => s.status === 'Active').map((stud) => (
                  <div key={stud.id} className="py-3 flex justify-between items-center text-xs">
                    <div>
                      <h4 className="font-bold text-slate-800">{stud.fullName}</h4>
                      <p className="text-[10px] text-slate-450 font-mono">Seat: {stud.seatNumber || 'Unassigned'} • Mob: {stud.mobile}</p>
                    </div>
                    <button
                      onClick={() => handleQuickCollect(stud)}
                      className="bg-amber-100 font-semibold text-amber-850 py-1.5 px-3 rounded-lg hover:bg-amber-100 transition whitespace-nowrap text-[11px]"
                    >
                      Receive Fee (₹{stud.feeAmount})
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* MAIN HISTORY REGISTRY (right-8) */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-[22px] p-6 space-y-5 overflow-hidden shadow-xs">
            
            {/* SEARCH FILTERS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search fee registry..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-amber-500/30"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-2 text-xs border border-slate-205 rounded-xl bg-white outline-none focus:ring-1 focus:ring-amber-500/30"
              >
                <option value="">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
              </select>

              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
                className="p-2 text-xs border border-slate-205 rounded-xl bg-white outline-none focus:ring-1 focus:ring-amber-500/30"
              >
                <option value="">All Modes</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-105 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    <th className="p-3.5">Student</th>
                    <th className="p-3.5">Target Month</th>
                    <th className="p-3.5">Fee Amount</th>
                    <th className="p-3.5">Pay Date / Mode</th>
                    <th className="p-3.5">Billing Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedFees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-mono">No matching transaction logs found.</td>
                    </tr>
                  ) : (
                    paginatedFees.map((fee) => (
                      <tr key={fee.id} className="hover:bg-slate-50/50">
                        <td className="p-3.5 font-bold text-slate-800">{fee.studentName}</td>
                        <td className="p-3.5 text-slate-550 font-medium">{fee.month}</td>
                        <td className="p-3.5 font-mono text-slate-805 font-bold">₹{fee.amount}</td>
                        <td className="p-3.5">
                          {fee.status === 'Paid' ? (
                            <div>
                              <p className="font-semibold text-slate-700">{fee.paymentDate}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{fee.paymentMode}</p>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono text-[10px]">Unpaid</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            fee.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' :
                            fee.status === 'Pending' ? 'bg-amber-50 text-amber-700' :
                            'bg-red-50 text-red-700'
                          }`}>
                            {fee.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right flex justify-end gap-1.5">
                          <button
                            onClick={() => handleEditClick(fee)}
                            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 p-1.5 rounded-lg text-slate-700 transition"
                            title="Edit Record"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteFee(fee.id)}
                            className="bg-red-50 hover:bg-red-100 border border-red-100 p-1.5 rounded-lg text-red-650 transition"
                            title="Delete Record"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
              <span>Page {currentPage} of {totalPages}</span>
              <div className="flex space-x-1.5 items-center">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1 border border-slate-205 rounded-lg bg-white disabled:opacity-40 hover:bg-slate-50"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1 border border-slate-205 rounded-lg bg-white disabled:opacity-40 hover:bg-slate-50"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* BILLING COLLECTION FORM */
        <div className="bg-white border border-slate-205 p-8 rounded-[24px] max-w-2xl shadow-xs space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-sans font-bold text-slate-800 text-lg">
              {mode === 'add' ? 'Record Fee Collection' : 'Edit Transaction Receipt'}
            </h2>
            <button onClick={() => setMode('list')} className="text-xs text-slate-550 hover:text-slate-805 font-bold transition">
              Cancel Back
            </button>
          </div>

          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-655 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Student Account Selection *</label>
                <select
                  value={studentId}
                  onChange={(e) => handleStudentChange(e.target.value)}
                  className="w-full text-xs font-medium p-3.5 border border-slate-202 rounded-xl bg-white outline-none focus:ring-1 focus:ring-amber-500/50"
                  disabled={mode === 'edit'}
                  required
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.fullName} ({s.status} - Monthly: ₹{s.feeAmount})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 font-mono">Amount Received *</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-xs font-medium p-3.5 border border-slate-202 rounded-xl outline-none focus:ring-1 focus:ring-amber-500/50"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Billing Cycle Month *</label>
                <input
                  type="text"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  placeholder="e.g. June 2026"
                  className="w-full text-xs font-medium p-3.5 border border-slate-202 rounded-xl outline-none focus:ring-1 focus:ring-amber-500/50"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Payment Date (if Paid)</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full text-xs font-medium p-3.5 border border-slate-202 rounded-xl outline-none focus:ring-1 focus:ring-amber-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Channel Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                  className="w-full text-xs font-medium p-3.5 border border-slate-202 rounded-xl bg-white outline-none focus:ring-1 focus:ring-amber-500/50"
                >
                  <option value="UPI">UPI (GPay / PhonePe)</option>
                  <option value="Cash">Cash Handover</option>
                  <option value="Bank Transfer">Bank Transfer / IMPS</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Invoice Payment Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as FeeStatus)}
                className="w-fit text-xs font-medium p-3.5 border border-slate-202 rounded-xl bg-white outline-none focus:ring-1 focus:ring-amber-500/50"
              >
                <option value="Paid">Paid (Active log)</option>
                <option value="Pending">Pending (Outstanding)</option>
                <option value="Overdue">Overdue (Unpaid)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={formLoading}
              className="w-full bg-slate-950 text-white font-bold text-xs p-3.5 rounded-xl hover:bg-slate-800 transition disabled:opacity-50"
            >
              {formLoading ? 'Submitting Receipt...' : 'Save Transaction Receipt'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
