import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Student, StudentStatus, Seat } from '../types';
import { 
  Search, 
  Edit, 
  Trash, 
  User, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight, 
  FileText, 
  Contact,
  CreditCard,
  MapPin,
  CheckCircle,
  XCircle,
  Eye,
  Download
} from 'lucide-react';

export const getExpiryStatus = (endDateStr?: string) => {
  if (!endDateStr) return null;
  const today = new Date();
  today.setHours(0,0,0,0);
  const end = new Date(endDateStr);
  if (isNaN(end.getTime())) return null;
  end.setHours(0,0,0,0);
  
  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { type: 'expired', label: 'Expired', class: 'bg-rose-50 text-rose-700 border-rose-200 font-bold' };
  } else if (diffDays === 0) {
    return { type: 'warning', label: 'Ends Today', class: 'bg-amber-100 text-amber-800 border-amber-300 font-bold' };
  } else if (diffDays <= 5) {
    return { type: 'warning', label: `Ends in ${diffDays}d`, class: 'bg-amber-50 text-amber-700 border-amber-200' };
  }
  return null;
};

export const getFeeAlert = (student: Student) => {
  const isPending = student.feeStatus === 'Pending';
  const today = new Date();
  today.setHours(0,0,0,0);
  const due = student.dueDate ? new Date(student.dueDate) : null;
  const isOverdue = due ? due < today : false;
  
  if (isOverdue) {
    return {
      type: 'overdue',
      label: '🚨 Overdue Alert',
      class: 'bg-rose-50 text-red-700 border-red-300 font-extrabold shadow-sm',
      desc: `Overdue since ${student.dueDate}`
    };
  } else if (isPending) {
    return {
      type: 'pending',
      label: '⚠️ Fee Pending',
      class: 'bg-amber-50 text-amber-800 border-amber-200 font-bold',
      desc: `Due date: ${student.dueDate}`
    };
  }
  return {
    type: 'paid',
    label: '✨ Fee Paid',
    class: 'bg-emerald-50 text-emerald-700 border-emerald-205 font-bold',
    desc: `Next Due: ${student.dueDate}`
  };
};

export const exportStudentCSV = (student: Student) => {
  const headers = ["Field", "Value"];
  
  const escapeCSVValue = (val: string | number | undefined) => {
    if (val === undefined || val === null) return '""';
    const str = String(val);
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const rows = [
    ["ID Reference", student.id],
    ["Full Name", student.fullName],
    ["Father's Name", student.fatherName || ''],
    ["Mobile Number", student.mobile],
    ["Email Address", student.email || ''],
    ["Aadhaar Number", student.aadhaar || ''],
    ["Seat Number", student.seatNumber || 'Unassigned'],
    ["Booking Type", student.shift || ''],
    ["Timing Slot / Shift", student.shift || ''],
    ["Joining Date", student.joiningDate],
    ["Admission End Date", student.endDate || 'No expiration set'],
    ["Fee Amount (INR)", student.feeAmount],
    ["Fee Payment Status", student.feeStatus || 'Pending'],
    ["Next Due Date", student.dueDate || ''],
    ["Account Status", student.status],
    ["Residential Address", student.address || '']
  ];

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => escapeCSVValue(cell)).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  
  const cleanName = student.fullName.trim().replace(/[^a-zA-Z0-9]/g, '_');
  link.setAttribute("download", `${cleanName}_backup_record.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const StudentManagement: React.FC<{ setSection?: (section: string) => void }> = ({ setSection }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
    cancelText?: string;
    isDangerous?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    onConfirm: () => {}
  });

  const triggerConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDangerous = false
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm: () => {
        onConfirm();
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
      isDangerous
    });
  };

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // View state: records list, edit form, or read-only profile.
  const [mode, setMode] = useState<'list' | 'edit' | 'profile'>('list');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [seatNumber, setSeatNumber] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [feeAmount, setFeeAmount] = useState('');
  const [status, setStatus] = useState<StudentStatus>('Active');

  // New fields
  const [email, setEmail] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [shift, setShift] = useState<'Full Day' | 'Morning Shift' | 'Evening Shift'>('Full Day');
  const [feeStatus, setFeeStatus] = useState<'Paid' | 'Pending'>('Pending');
  const [dueDate, setDueDate] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const studentList = await api.getStudents();
      const seatList = await api.getSeats();
      setStudents(studentList);
      setSeats(seatList);
    } catch (err: any) {
      setError(err.message || "Failed to load students registry.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (student: Student) => {
    setSelectedStudent(student);
    setFullName(student.fullName);
    setFatherName(student.fatherName);
    setMobile(student.mobile);
    setAddress(student.address);
    setSeatNumber(student.seatNumber);
    setJoiningDate(student.joiningDate);
    setEndDate(student.endDate || '');
    setFeeAmount(student.feeAmount.toString());
    setStatus(student.status);

    setEmail(student.email || '');
    setAadhaar(student.aadhaar || '');
    setProfilePhoto(student.profilePhoto || '');
    setShift(student.shift || 'Full Day');
    setFeeStatus(student.feeStatus || 'Pending');
    setDueDate(student.dueDate || '');

    setFormError(null);
    setMode('edit');
  };

  const handleViewProfile = (student: Student) => {
    setSelectedStudent(student);
    setMode('profile');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim()) return setFormError("Full Name is mandatory.");
    if (!mobile.trim() || mobile.trim().length < 10) return setFormError("Enter a valid 10-digit Mobile Number.");
    if (!dueDate) return setFormError("Please define next payment due date.");
    if (!feeAmount || parseFloat(feeAmount) <= 0) return setFormError("Please define valid monthly fee.");

    const actionText = `save changes to "${selectedStudent?.fullName || 'this student'}"'s profile`;

    triggerConfirm(
      "✏️ Confirm Profile Edits?",
      `Are you sure you want to ${actionText}? This binds the details instantly to our student registry.`,
      async () => {
        setFormLoading(true);
        try {
          const payload = {
            fullName: fullName.trim(),
            fatherName: fatherName.trim(),
            mobile: mobile.trim(),
            email: email.trim(),
            address: address.trim(),
            aadhaar: aadhaar.trim(),
            seatNumber,
            joiningDate,
            endDate,
            profilePhoto: profilePhoto.trim() || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop",
            feeAmount: parseFloat(feeAmount),
            shift,
            feeStatus,
            dueDate,
            status
          };

          if (selectedStudent) {
            await api.editStudent(selectedStudent.id, payload);
          }

          await loadData();
          setMode('list');
        } catch (err: any) {
          setFormError(err.message || "Failed to submit student information.");
        } finally {
          setFormLoading(false);
        }
      },
      "Yes, Save Changes",
      "No, Cancel"
    );
  };

  const handleDelete = (id: string, name: string) => {
    triggerConfirm(
      "🗑️ Delete Student Record?",
      `Are you sure you want to permanently delete the student "${name}"? This action is irreversible and will automatically release their assigned seat!`,
      async () => {
        try {
          await api.deleteStudent(id);
          await loadData();
        } catch (err: any) {
          alert(err.message || "Failed to remove student record.");
        }
      },
      "Yes, Delete Student",
      "No, Cancel",
      true
    );
  };

  // Filter lists & naturally sort by seat number (e.g., Row 1, Row 2, Row 10...)
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          student.mobile.includes(searchQuery) ||
                          student.seatNumber.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesStatus = true;
    if (statusFilter === 'Active') {
      matchesStatus = student.status === 'Active';
    } else if (statusFilter === 'Inactive') {
      matchesStatus = student.status === 'Inactive';
    } else if (statusFilter === 'Expired') {
      matchesStatus = student.status === 'Active' && getExpiryStatus(student.endDate)?.type === 'expired';
    } else if (statusFilter === 'ExpiringSoon') {
      matchesStatus = student.status === 'Active' && getExpiryStatus(student.endDate)?.type === 'warning';
    }
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (!a.seatNumber && !b.seatNumber) return 0;
    if (!a.seatNumber) return 1;
    if (!b.seatNumber) return -1;
    return a.seatNumber.localeCompare(b.seatNumber, undefined, { numeric: true, sensitivity: 'base' });
  });

  // Pagination bounds
  const totalItems = filteredStudents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    if (mode !== 'list') return;
    const interval = setInterval(() => {
      loadData(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [mode]);

  // Available seats for selection (includes currently assigned seat when editing)
  // Smart filters seats depending on shift compatibility and double conflicts
  const availableSeatsForSelection = seats.filter(s => {
    if (mode === 'edit' && selectedStudent && s.seatNumber === selectedStudent.seatNumber) return true;

    // Find active students on this seat (excluding the current student if we are editing)
    const activesOnSeat = students.filter(st => {
      const isSelf = selectedStudent && st.id === selectedStudent.id;
      return !isSelf && st.status === 'Active' && st.seatNumber === s.seatNumber;
    });

    // If any active occupant is Full Day, this seat cannot be shared at all
    if (activesOnSeat.some(st => st.shift === 'Full Day')) {
      return false;
    }

    // If the chosen shift is Full Day, the seat must be completely vacant
    if (shift === 'Full Day') {
      return activesOnSeat.length === 0;
    }

    // Otherwise, we are assigning a Morning or Evening shift.
    // It is available if there is no other student occupying the exact same shift of this seat.
    const shiftConflict = activesOnSeat.some(st => st.shift === shift);
    return !shiftConflict;
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
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-sans font-extrabold text-slate-900 tracking-tight">Student Management</h1>
          <p className="text-xs text-slate-555 flex items-center space-x-1.5">
            <span>View student records, inspect profiles, edit existing details, and delete records when needed.</span>
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-650 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* VIEW LISTS VIEW */}
      {mode === 'list' && (
        <div className="bg-white border border-slate-200 rounded-[24px] shadow-xs p-6 space-y-6 overflow-hidden">
          
          {/* EXPIRY WARNING STATS BANNER */}
          {(() => {
            const expiredCount = students.filter(s => s.status === 'Active' && getExpiryStatus(s.endDate)?.type === 'expired').length;
            const expiringCount = students.filter(s => s.status === 'Active' && getExpiryStatus(s.endDate)?.type === 'warning').length;
            if (expiredCount > 0 || expiringCount > 0) {
              return (
                <div className="p-4 bg-rose-50/50 border border-rose-150 text-rose-955 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                  <div className="flex items-center space-x-2.5">
                    <AlertCircle className="w-5.5 h-5.5 text-rose-600 shrink-0" />
                    <div>
                      <span className="font-bold block text-rose-900">Membership Expiry Warnings:</span>
                      <span className="text-slate-600">
                        {expiredCount > 0 && <span>Currently <strong className="text-rose-700 font-extrabold">{expiredCount} students</strong> have expired memberships. </span>}
                        {expiringCount > 0 && <span>Currently <strong className="text-amber-700 font-extrabold">{expiringCount} students</strong> have memberships expiring soon (within 5 days).</span>}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {expiredCount > 0 && (
                      <button 
                        onClick={() => setStatusFilter('Expired')}
                        className="py-1 px-3 bg-rose-100 border border-rose-200 text-rose-800 font-bold rounded-lg hover:bg-rose-200 transition text-[11px]"
                      >
                        Filter Expired
                      </button>
                    )}
                    {expiringCount > 0 && (
                      <button 
                        onClick={() => setStatusFilter('ExpiringSoon')}
                        className="py-1 px-3 bg-amber-100 border border-amber-200 text-amber-800 font-bold rounded-lg hover:bg-amber-200 transition text-[11px]"
                      >
                        Filter Expiring Soon
                      </button>
                    )}
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* SEARCH FILTERS */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student name, phone or seat..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-amber-500/30"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 text-xs border border-slate-200 rounded-xl bg-white outline-none focus:ring-1 focus:ring-amber-500/30 min-w-[150px]"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Expired">⚠️ Expired</option>
              <option value="ExpiringSoon">⚠️ Expiring Soon</option>
            </select>
          </div>

          {/* STUDENT DATA GRID LAYOUT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {paginatedStudents.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-mono col-span-4">No registered student records found.</div>
            ) : (
              paginatedStudents.map((stud, idx) => {
                const feeAlert = getFeeAlert(stud);
                return (
                  <div key={stud.id} className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-xs hover:border-amber-400 hover:shadow-sm transition-all duration-300 relative group">
                    <div className="space-y-4">
                      {/* Upper identity */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center space-x-3 overflow-hidden">
                          <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                          <div className="overflow-hidden">
                            <h3 className="font-sans font-black text-slate-900 text-xs truncate leading-tight">{stud.fullName}</h3>
                            <p className="text-[10px] text-slate-500 font-mono select-all">{stud.mobile}</p>
                          </div>
                        </div>
                        {/* Sequence and Status Badges */}
                        <div className="flex flex-col items-end space-y-1 shrink-0">
                          <span className="font-mono text-[9px] font-black bg-indigo-50 border border-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                            S.No #{startIndex + idx + 1}
                          </span>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            stud.status === 'Active' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-slate-100 border-slate-200 text-slate-655'
                          }`}>
                            {stud.status}
                          </span>
                        </div>
                      </div>

                      {/* Prominent Sheet (Seat) Allocation */}
                      <div className="p-3 bg-indigo-50/40 border border-indigo-100/50 rounded-xl flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider">Allocated Seat</span>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono text-xs font-black text-indigo-950 bg-indigo-50 border border-indigo-200/55 rounded-lg px-2 py-0.5 shadow-2xs">
                            {stud.seatNumber ? `Sheet No: ${stud.seatNumber}` : 'Unassigned Pool'}
                          </span>
                        </div>
                      </div>

                      {/* Fields */}
                      <div className="text-xs space-y-2 text-slate-600 font-medium">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Monthly Fee:</span>
                          <span className="font-mono text-slate-900 font-extrabold text-[12px]">₹{stud.feeAmount}</span>
                        </div>
                        
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400">Joining Date:</span>
                          <span className="font-mono text-slate-800 font-bold">{stud.joiningDate}</span>
                        </div>

                        <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-slate-100">
                          <span className="text-slate-400">End Date (Time):</span>
                          {stud.endDate ? (
                            <div className="flex items-center space-x-1.5">
                              <span className="font-mono text-slate-800 font-bold">{stud.endDate}</span>
                              {(() => {
                                const expStatus = getExpiryStatus(stud.endDate);
                                if (expStatus) {
                                  return (
                                    <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-md border text-center shrink-0 ${expStatus.class}`}>
                                      {expStatus.label}
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono italic">No expiry limit</span>
                          )}
                        </div>

                        {/* FEE ALERT BADGE */}
                        <div className="pt-2 border-t border-slate-100">
                          <div className="flex flex-col space-y-1">
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">Real-time Fee Alert:</span>
                            <div className={`p-2 rounded-lg border flex items-center justify-between text-xs transition-all ${feeAlert.class}`}>
                              <span className="font-sans font-extrabold text-[10px]">{feeAlert.label}</span>
                              <span className="text-[9px] font-mono opacity-85">{feeAlert.desc}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions bar at bottom */}
                    <div className="mt-5 pt-3.5 border-t border-slate-50 flex justify-between gap-1.5">
                      <button
                        onClick={() => handleViewProfile(stud)}
                        className="bg-slate-50 hover:bg-slate-100 p-2 border border-slate-105 rounded-xl text-xs font-semibold text-slate-750 transition flex-1 flex items-center justify-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Profile Details</span>
                      </button>
                      <button
                        onClick={() => triggerConfirm(
                          "✏️ Edit Student Profile?",
                          `Are you sure you want to modify active profile details and seat assignments for "${stud.fullName}"?`,
                          () => handleEditClick(stud),
                          "Yes, Edit Profile",
                          "Cancel"
                        )}
                        className="bg-slate-50 hover:bg-slate-100 p-2 border border-slate-105 rounded-xl text-xs font-semibold text-slate-700 transition"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(stud.id, stud.fullName)}
                        className="bg-red-50 hover:bg-red-100 p-2 border border-red-105 rounded-xl text-xs font-semibold text-red-650 transition"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* PAGINATION */}
          <div className="flex justify-between items-center text-xs text-slate-505 font-semibold border-t border-slate-50 pt-5">
            <span>Showing {paginatedStudents.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} accounts</span>
            <div className="flex space-x-1.5 items-center">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 border border-slate-205 rounded-lg bg-white disabled:opacity-45 hover:bg-slate-50 transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="font-mono">{currentPage}/{totalPages}</span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-slate-205 rounded-lg bg-white disabled:opacity-45 hover:bg-slate-50 transition"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT FORM VIEW */}
      {mode === 'edit' && (
        <div className="bg-white border border-slate-205 p-8 rounded-[24px] max-w-3xl shadow-xs space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-sans font-bold text-slate-800 text-lg">
              Update Student profile
            </h2>
            <button onClick={() => setMode('list')} className="text-xs text-slate-550 hover:text-slate-800 font-bold transition">
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
                <label className="text-xs font-bold text-slate-700">Student Full Name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full text-xs font-medium p-3.5 border border-slate-202 rounded-xl outline-none focus:ring-1 focus:ring-amber-500/50"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Father's Name (optional)</label>
                <input
                  type="text"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  placeholder="Father's full name"
                  className="w-full text-xs font-medium p-3.5 border border-slate-202 rounded-xl outline-none focus:ring-1 focus:ring-amber-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Mobile Number *</label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="e.g. 9812404561"
                  className="w-full text-xs font-medium p-3.5 border border-slate-202 rounded-xl outline-none focus:ring-1 focus:ring-amber-500/50"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Email Address (optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. name@domain.com"
                  className="w-full text-xs font-medium p-3.5 border border-slate-202 rounded-xl outline-none focus:ring-1 focus:ring-amber-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Timing Slot / Shift *</label>
                <select
                  value={shift}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setShift(val);
                    // Smart preset prices: ₹750 for Full Day, ₹550 for shifts of Half Day
                    if (val === 'Full Day') {
                      setFeeAmount('750');
                    } else {
                      setFeeAmount('550');
                    }
                  }}
                  className="w-full text-xs font-medium p-3.5 border border-slate-202 rounded-xl bg-white outline-none focus:ring-1 focus:ring-amber-500/50"
                >
                  <option value="Full Day">Full Day (₹700 - ₹800)</option>
                  <option value="Morning Shift">Morning Shift (₹500 - ₹600)</option>
                  <option value="Evening Shift">Evening Shift (₹500 - ₹600)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Seat Number Allocation</label>
                <select
                  value={seatNumber}
                  onChange={(e) => {
                    const seatNo = e.target.value;
                    setSeatNumber(seatNo);
                  }}
                  className="w-full text-xs font-medium p-3.5 border border-slate-202 rounded-xl bg-white outline-none focus:ring-1 focus:ring-amber-500/50"
                >
                  <option value="">Leave Unassigned (Pending)</option>
                  {availableSeatsForSelection.map(s => (
                    <option key={s.id} value={s.seatNumber}>
                      {s.seatNumber} ({s.floor})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Monthly Fee Amount (INR) *</label>
                <input
                  type="number"
                  value={feeAmount}
                  onChange={(e) => setFeeAmount(e.target.value)}
                  placeholder="e.g. 750"
                  className="w-full text-xs font-medium p-3.5 border border-slate-202 rounded-xl outline-none focus:ring-1 focus:ring-amber-500/50"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Fee Status *</label>
                <select
                  value={feeStatus}
                  onChange={(e) => setFeeStatus(e.target.value as any)}
                  className="w-full text-xs font-medium p-3.5 border border-slate-202 rounded-xl bg-white outline-none focus:ring-1 focus:ring-amber-500/50"
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Next Payment Due Date *</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full text-xs font-medium p-3.5 border border-slate-202 rounded-xl outline-none focus:ring-1 focus:ring-amber-500/50"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Student Aadhaar Number</label>
                <input
                  type="text"
                  value={aadhaar}
                  onChange={(e) => setAadhaar(e.target.value)}
                  placeholder="12-digit Aadhaar"
                  className="w-full text-xs font-medium p-3.5 border border-slate-202 rounded-xl outline-none focus:ring-1 focus:ring-amber-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Joining Date *</label>
                <input
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="w-full text-xs font-medium p-3.5 border border-slate-202 rounded-xl outline-none focus:ring-1 focus:ring-amber-500/50"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Admission End Date (Optional)</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs font-medium p-3.5 border border-slate-202 rounded-xl outline-none focus:ring-1 focus:ring-amber-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Student Account Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StudentStatus)}
                  className="w-full text-xs font-medium p-3.5 border border-slate-202 rounded-xl bg-white outline-none focus:ring-1 focus:ring-amber-500/50"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Profile Photo URL (optional)</label>
                <input
                  type="text"
                  value={profilePhoto}
                  onChange={(e) => setProfilePhoto(e.target.value)}
                  placeholder="https://..."
                  className="w-full text-xs font-medium p-3.5 border border-slate-202 rounded-xl outline-none focus:ring-1 focus:ring-amber-500/50"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Residential Address Details</label>
              <textarea
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Full residential address, landmarks and city state details..."
                className="w-full text-xs font-medium p-3.5 border border-slate-202 rounded-xl outline-none focus:ring-1 focus:ring-amber-500/50 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={formLoading}
              className="w-full bg-slate-950 text-white font-bold text-xs p-3.5 rounded-xl hover:bg-slate-800 transition disabled:opacity-50"
            >
              {formLoading ? 'Submitting student detail configs...' : 'Save Student file'}
            </button>
          </form>
        </div>
      )}

      {/* PROFILE MODAL DETAILED VIEW */}
      {mode === 'profile' && selectedStudent && (
        <div className="bg-white border border-slate-205 p-8 rounded-[24px] max-w-2xl shadow-xs space-y-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                <User className="w-7 h-7" />
              </div>
              <div>
                <h2 className="font-sans font-extrabold text-slate-900 text-lg">{selectedStudent.fullName}</h2>
                <p className="text-xs text-slate-450 font-mono">ID Reference: {selectedStudent.id}</p>
              </div>
            </div>
            <button onClick={() => setMode('list')} className="text-xs text-slate-550 hover:text-slate-805 font-bold transition">
              Back to List
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-650 border-t border-slate-100 pt-6">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Personal Information</span>
              <p><strong>Father's Name:</strong> {selectedStudent.fatherName || 'Not recorded'}</p>
              <p><strong>Mobile Number:</strong> {selectedStudent.mobile}</p>
              <p><strong>Email Address:</strong> {selectedStudent.email || 'Not recorded'}</p>
              <p><strong>Aadhaar Card:</strong> {selectedStudent.aadhaar || 'Not recorded'}</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Allocation details</span>
              <p><strong>Seat Assigned:</strong> {selectedStudent.seatNumber || 'Unassigned'}</p>
              <p><strong>Booking Type:</strong> {selectedStudent.shift || 'Full Day'}</p>
              <p><strong>Timing / Shift:</strong> <span className="font-bold text-indigo-700">{selectedStudent.shift || 'Full Day'}</span></p>
              <p><strong>Joining Date:</strong> {selectedStudent.joiningDate}</p>
              <p>
                <strong>End Date:</strong> {selectedStudent.endDate || 'No expiration set'}
                {selectedStudent.endDate && (() => {
                  const expStatus = getExpiryStatus(selectedStudent.endDate);
                  if (expStatus) {
                    return (
                      <span className={`ml-2 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border inline-block ${expStatus.class}`}>
                        {expStatus.label}
                      </span>
                    );
                  }
                  return null;
                })()}
              </p>
              <p><strong>Account Status:</strong> <span className={`font-bold ${selectedStudent.status === 'Active' ? 'text-green-600' : 'text-slate-450'}`}>{selectedStudent.status}</span></p>
              <p><strong>Monthly Fee Amount:</strong> ₹{selectedStudent.feeAmount}/month</p>
              <p><strong>Fee Payment Status:</strong> <span className={`font-semibold ${selectedStudent.feeStatus === 'Paid' ? 'text-emerald-600' : 'text-rose-600'}`}>{selectedStudent.feeStatus || 'Pending'}</span></p>
              <p><strong>Next Payment Due Date:</strong> <span className="font-mono font-bold text-slate-800">{selectedStudent.dueDate || 'N/A'}</span></p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Registered Address</span>
            <p className="leading-relaxed leading-normal text-slate-650">{selectedStudent.address || 'No location saved.'}</p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => triggerConfirm(
                "✏️ Edit Student Profile?",
                `Are you sure you want to modify active profile details and seat assignments for "${selectedStudent.fullName}"?`,
                () => handleEditClick(selectedStudent),
                "Yes, Edit Profile",
                "Cancel"
              )}
              className="bg-slate-950 text-white font-bold text-xs px-6 py-2.5 rounded-xl hover:bg-slate-800 transition flex-1 sm:flex-initial"
            >
              Modify profile details
            </button>
            <button
              onClick={() => exportStudentCSV(selectedStudent)}
              className="bg-indigo-50 border border-indigo-150 text-indigo-700 font-bold text-xs px-6 py-2.5 rounded-xl hover:bg-indigo-100 transition flex-1 sm:flex-initial flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              Backup CSV
            </button>
            <button
              onClick={() => handleDelete(selectedStudent.id, selectedStudent.fullName)}
              className="bg-red-50 border border-red-150 text-red-650 font-bold text-xs px-6 py-2.5 rounded-xl hover:bg-red-100 transition flex-1 sm:flex-initial"
            >
              Delete Record
            </button>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION DIALOG MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-[24px] p-6 max-w-sm w-full shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl ${confirmModal.isDangerous ? 'bg-red-50 text-red-600 border border-red-105' : 'bg-indigo-50 text-indigo-600 border border-indigo-105'}`}>
                <AlertCircle className="w-5 h-5 shrink-0" />
              </div>
              <h3 className="text-sm font-sans font-black text-slate-900 tracking-tight">{confirmModal.title}</h3>
            </div>
            <p className="text-xs text-slate-650 leading-relaxed font-sans font-medium">{confirmModal.message}</p>
            <div className="flex space-x-2.5 pt-2">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition"
              >
                {confirmModal.cancelText || 'Cancel'}
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className={`flex-1 font-bold text-xs py-2.5 rounded-xl transition text-white ${
                  confirmModal.isDangerous 
                    ? 'bg-red-600 hover:bg-red-700 active:bg-red-850' 
                    : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-850'
                }`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
