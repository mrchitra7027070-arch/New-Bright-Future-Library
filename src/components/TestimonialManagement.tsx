import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Testimonial } from '../types';
import { 
  Star, 
  Trash2, 
  AlertCircle, 
  Search, 
  Sparkles,
  CheckCircle2,
  Calendar
} from 'lucide-react';

export const TestimonialManagement: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getTestimonials();
      setTestimonials(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load achiever testimonials');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    triggerConfirm(
      "🗑️ Delete Achiever Review?",
      `Are you sure you want to permanently delete the review shared by "${name}"? This removes it instantly from the public feedback feed.`,
      async () => {
        try {
          setError(null);
          setSuccessMsg(null);
          await api.deleteTestimonial(id);
          setSuccessMsg('Testimonial view deleted successfully.');
          await loadTestimonials();
        } catch (err: any) {
          setError(err.message || 'Failed to delete testimonial review');
        }
      },
      "Yes, Delete Review",
      "No, Cancel",
      true
    );
  };

  const handleClearAllTestimonials = () => {
    triggerConfirm(
      "☢️ WARNING: Clear All Achievers Reviews?",
      "Are you absolutely certain you want to permanently delete ALL defined testimonial ratings and reviews from the registry? This clears the entire public feedback carousel instantly. This action is irreversible!",
      async () => {
        try {
          setError(null);
          setSuccessMsg(null);
          setLoading(true);
          await api.clearAllTestimonials();
          setSuccessMsg('All custom achievers feed and reviews cleared successfully.');
          await loadTestimonials();
        } catch (err: any) {
          setError(err.message || 'Failed to clear reviews.');
        } finally {
          setLoading(false);
        }
      },
      "Yes, Clear Feedback Feed",
      "No, Cancel Clear",
      true
    );
  };

  const filtered = testimonials.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.view.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && testimonials.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-sans font-extrabold text-slate-900 tracking-tight">Achievers Feed & Reviews</h1>
          <p className="text-xs text-slate-500">View, monitor, and moderate the "What Our Achievers Say" testimonials on the public portal.</p>
        </div>
        {testimonials.length > 0 && (
          <button
            onClick={handleClearAllTestimonials}
            className="inline-flex items-center space-x-2 bg-red-50 text-red-650 border border-red-200 hover:bg-red-100 active:bg-red-200 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-3xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Reviews</span>
          </button>
        )}
      </div>

      {/* FEEDBACK BARS */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-150 text-red-950 text-xs font-semibold rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-505 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-150 text-emerald-950 text-xs font-semibold rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* SEARCH AND CONTROL TOOLBAR */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by author name or view text..."
            className="w-full text-xs font-medium pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500/30 transition"
          />
        </div>
        <div className="text-[10px] text-slate-500 font-mono self-end sm:self-center">
          Showing {filtered.length} of {testimonials.length} reviews
        </div>
      </div>

      {/* LIST OF TESTIMONIALS */}
      {filtered.length === 0 ? (
        <div className="bg-slate-50 border border-slate-150 p-12 rounded-3xl text-center space-y-2">
          <p className="text-slate-500 font-medium text-sm">No testimonials matched your search query.</p>
          <p className="text-xs text-slate-400 font-mono">Try searching with a different name or keyword.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((item) => (
            <div 
              key={item.id} 
              className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col justify-between hover:border-indigo-150 transition"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 transition-all duration-300 ${
                          i < item.rating 
                            ? 'fill-amber-400 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.85)] filter' 
                            : 'text-slate-200'
                        }`} 
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => handleDelete(item.id, item.name)}
                    className="text-red-500 hover:text-red-700 p-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition"
                    title="Delete Testimonial"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-slate-705 text-xs sm:text-sm leading-relaxed italic pr-2 font-medium">
                  "{item.view}"
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center space-x-1.5">
                  <span className="text-indigo-650 font-bold">✨ {item.name}</span>
                </div>
                <div className="flex items-center space-x-1 text-slate-450 font-medium">
                  <Calendar className="w-3 h-3" />
                  <span>{item.date}</span>
                </div>
              </div>
            </div>
          ))}
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
