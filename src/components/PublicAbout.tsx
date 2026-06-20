import React, { useState, useEffect } from 'react';
import { LibrarySettings, Testimonial } from '../types';
import { api } from '../lib/api';
import { 
  Compass, 
  ShieldCheck, 
  HeartHandshake, 
  Eye,
  Star,
  Quote,
  Send,
  MessageSquare,
  AlertCircle
} from 'lucide-react';

interface PublicAboutProps {
  settings: LibrarySettings;
}

export const PublicAbout: React.FC<PublicAboutProps> = ({ settings }) => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [testimonialName, setTestimonialName] = useState('');
  const [testimonialView, setTestimonialView] = useState('');
  const [rating, setRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<{ text: string; success: boolean } | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const data = await api.getTestimonials();
      setTestimonials(data);
    } catch (e) {
      console.error("Failed to load reviews:", e);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testimonialName.trim() || !testimonialView.trim()) {
      setReviewMessage({ text: 'Please fill out your name and feedback view.', success: false });
      return;
    }
    try {
      setSubmittingReview(true);
      setReviewMessage(null);
      await api.submitTestimonial({
        name: testimonialName.trim(),
        view: testimonialView.trim(),
        rating: rating
      });
      setReviewMessage({ text: 'Thank you for sharing your experience! Your view has been added successfully.', success: true });
      setTestimonialName('');
      setTestimonialView('');
      setRating(5);
      fetchReviews();
    } catch (err: any) {
      setReviewMessage({ text: err.message || 'Error occurred while saving your review. Please try again.', success: false });
    } finally {
      setSubmittingReview(false);
    }
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* 1. BRAND STORY HEADER */}
      <section className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest font-mono">Our Heritage & Mission</span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-sans font-extrabold tracking-tight text-slate-900 leading-tight">
          Where Quiet Meets Productivity
        </h1>
        <p className="text-slate-650 text-sm sm:text-base leading-relaxed">
          {settings.libraryName} was established to solve the ultimate academic challenge: finding a comfortable, pin-drop silent environment built for persistent, long-duration exam preparations and co-working.
        </p>
      </section>

      {/* 2. THE CORE EXPERIENCE PILLARS */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
        {[
          {
            icon: <Compass className="w-6 h-6 text-indigo-500" />,
            title: 'Laser Focus Environment',
            desc: 'Strictest code of conduct ensuring 100% pin-drop quietness in study rooms.'
          },
          {
            icon: <ShieldCheck className="w-6 h-6 text-emerald-500" />,
            title: 'High Security Standard',
            desc: 'Continuous CCTV monitoring and digital entry access for your peace of mind.'
          },
          {
            icon: <HeartHandshake className="w-6 h-6 text-blue-500" />,
            title: 'Peerless Amenities',
            desc: 'High speed fiber, pure organic drinking water, and constant backup power.'
          },
          {
            icon: <Eye className="w-6 h-6 text-purple-500" />,
            title: 'Modern Ergonomics',
            desc: 'Tailored study desks with private electrical docks, mesh backing and proper height.'
          }
        ].map((item, i) => (
          <div key={i} className="p-6 bg-slate-5.0 rounded-2xl border border-slate-100 flex flex-col items-center space-y-3">
            <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-105">
              {item.icon}
            </div>
            <h3 className="font-sans font-bold text-slate-800 text-sm">{item.title}</h3>
            <p className="text-xs text-slate-550 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </section>

      {/* 3. CO-WORKING & STUDY ROOM RULES */}
      <section className="bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 space-y-4">
            <span className="text-xs font-bold text-indigo-400 font-sans uppercase tracking-widest bg-indigo-900/40 px-3 py-1 rounded-full">Workspace Guidelines</span>
            <h2 className="text-2xl sm:text-3xl font-sans font-extrabold tracking-tight">Our Golden Rules for Group Success</h2>
            <p className="text-slate-300 text-xs">
              Maintaining high-standards of discipline is our top priority. Self-discipline fosters a superior environment.
            </p>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { rule: 'Pin Drop Silence', desc: 'No group discussions or voice calls allowed inside the primary study vaults.' },
              { rule: 'Deactive Ringers', desc: 'All phones must be switched to silent or vibrate mode when entering desks.' },
              { rule: 'Clean Desks Policy', desc: 'Clean up your workspaces at checkouts. Bin files are distributed on all bays.' },
              { rule: 'Pantry Guidelines', desc: 'Avoid heavy meals or robust snacks inside the main cabins. Pantry is accessible for food.' }
            ].map((item, i) => (
              <div key={i} className="p-4 bg-indigo-900/40 border border-indigo-550/40 rounded-xl">
                <span className="text-indigo-405 text-indigo-305 font-sans font-bold text-xs block">{item.rule}</span>
                <span className="text-slate-300 text-xs mt-1 block leading-relaxed">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. DYNAMIC STUDENT REVIEWS & SUBMISSION FORM */}
      <section className="space-y-8 border-t border-slate-100 pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left panel: Testimonial feed */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-bold text-indigo-600 bg-indigo-55/10 px-3 py-1 rounded-full uppercase tracking-widest font-mono">
                Student Achievements
              </span>
              <h2 className="text-3xl font-sans font-extrabold text-slate-900 tracking-tight leading-tight">
                What Our Achievers Say
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm">
                Hear directly from our active workspace members who clear competitive exams and share their learning experience.
              </p>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {testimonials.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 font-mono text-xs">
                  No active reviews posted yet. Be the first to share your workspace experience below!
                </div>
              ) : (
                testimonials.map((item) => (
                  <div key={item.id} className="p-6 bg-white border border-slate-100 rounded-[20px] shadow-xs relative hover:border-indigo-150 transition duration-200">
                    <Quote className="absolute right-6 top-6 w-8 h-8 text-indigo-100/50" />
                    <div className="flex items-center space-x-1.5 mb-2">
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
                    <p className="text-slate-700 text-sm leading-relaxed mb-4 italic">
                      "{item.view}"
                    </p>
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="font-bold text-slate-800">
                        ✨ {item.name}
                      </span>
                      <span className="text-slate-400 font-medium">
                        {item.date}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right panel: Form for submitting reviews */}
          <div className="lg:col-span-5">
            <div className="p-6 sm:p-8 bg-slate-50 border border-slate-205 rounded-[28px] shadow-xs space-y-5 sticky top-24">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-50 border border-indigo-150 text-indigo-600 rounded-xl shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-slate-800 text-sm">Add Your Review / View</h3>
                  <p className="text-[10px] text-slate-500">Your feedback helps fellow aspirants study better.</p>
                </div>
              </div>

              {reviewMessage && (
                <div className={`p-4 rounded-xl text-xs flex items-center space-x-2.5 ${reviewMessage.success ? 'bg-indigo-50 border border-indigo-100 text-indigo-950' : 'bg-red-50 border border-red-100 text-red-950'}`}>
                  <AlertCircle className={`w-4 h-4 shrink-0 ${reviewMessage.success ? 'text-indigo-600' : 'text-red-500'}`} />
                  <span className="font-semibold">{reviewMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Your Name *</label>
                  <input
                    type="text"
                    value={testimonialName}
                    onChange={(e) => setTestimonialName(e.target.value)}
                    placeholder="Enter your name (e.g. Amit Sharma)"
                    className="w-full text-xs font-medium p-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500/50"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Your Score / Rating</label>
                  <div className="flex items-center space-x-2.5 py-1">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const starVal = i + 1;
                      const isActive = starVal <= rating;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setRating(starVal)}
                          className="focus:outline-none transition-all duration-200 active:scale-95 hover:scale-110"
                        >
                          <Star 
                            className={`w-7 h-7 cursor-pointer transition-all duration-300 ${
                              isActive 
                                ? 'fill-amber-400 text-amber-500 drop-shadow-[0_0_12px_rgba(245,158,11,0.95)]' 
                                : 'text-slate-300 hover:text-amber-400 hover:scale-105'
                            }`} 
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Your View / Review *</label>
                  <textarea
                    rows={4}
                    value={testimonialView}
                    onChange={(e) => setTestimonialView(e.target.value)}
                    placeholder="Tell us about the environment, silent slots, or cleared exams (SBI, SSC, IAS)..."
                    className="w-full text-xs font-medium p-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3.5 rounded-xl transition shadow-md shadow-indigo-600/10 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingReview ? 'Publishing view...' : 'Submit / Publish View'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
