import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Wifi, 
  Shield, 
  Droplet, 
  Zap, 
  Car, 
  BookOpen, 
  Clock, 
  Mail, 
  MapPin, 
  Check, 
  AlertCircle,
  RefreshCw,
  Grid,
  HelpCircle
} from 'lucide-react';
import { LibrarySettings, Notice } from '../types';
import { api } from '../lib/api';

interface PublicHomeProps {
  settings: LibrarySettings;
  notices: Notice[];
  stats: {
    totalSeats: number;
    occupiedSeats: number;
    reservedSeats: number;
    availableSeats: number;
    availableFullDaySeats?: number;
    availableHalfDaySeats?: number;
    availableMorningSlots?: number;
    availableEveningSlots?: number;
  };
  onSubmitEnquiry: (data: { name: string; mobile: string; message: string }) => Promise<boolean>;
  setTab: (tab: string) => void;
}

export const PublicHome: React.FC<PublicHomeProps> = ({
  settings,
  notices,
  stats,
  onSubmitEnquiry,
  setTab
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [liveStats, setLiveStats] = useState<any>(stats);

  const loadStatsData = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const statsData = await api.getStats();
      setLiveStats(statsData);
    } catch (err: any) {
      console.error("Failed loading real-time seating stats", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Load fresh stats on mount
    loadStatsData(true);
    // Auto sync every 5 seconds for live local updates after admin changes.
    const interval = setInterval(() => {
      loadStatsData(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update liveStats local copy when the parent prop changes
  useEffect(() => {
    setLiveStats(stats);
  }, [stats]);

  const fullDayOpen = liveStats.availableFullDaySeats !== undefined ? liveStats.availableFullDaySeats : 0;
  const halfDayOpen = liveStats.availableHalfDaySeats !== undefined ? liveStats.availableHalfDaySeats : 0;
  const morningOpen = liveStats.availableMorningSlots !== undefined ? liveStats.availableMorningSlots : 0;
  const eveningOpen = liveStats.availableEveningSlots !== undefined ? liveStats.availableEveningSlots : 0;
  const totalOpenSeats = halfDayOpen;

  const getFacilityIcon = (facility: string) => {
    const term = facility.toLowerCase();
    if (term.includes('air conditioning') || term.includes('ac')) return <Zap className="w-5 h-5 text-sky-500" />;
    if (term.includes('wifi') || term.includes('internet')) return <Wifi className="w-5 h-5 text-blue-500" />;
    if (term.includes('cctv') || term.includes('security')) return <Shield className="w-5 h-5 text-emerald-500" />;
    if (term.includes('water') || term.includes('drinking')) return <Droplet className="w-5 h-5 text-indigo-500" />;
    if (term.includes('power') || term.includes('backup')) return <Zap className="w-5 h-5 text-amber-500" />;
    if (term.includes('parking')) return <Car className="w-5 h-5 text-orange-500" />;
    return <BookOpen className="w-5 h-5 text-purple-500" />;
  };

  return (
    <div className="space-y-16 py-8">
      {/* 1. HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-50/90 via-violet-50/85 to-purple-50/90 border border-indigo-200/60 text-indigo-950 px-4 py-2 rounded-full text-xs font-bold shadow-[0_4px_24px_-2px_rgba(99,102,241,0.18)] hover:shadow-[0_4px_32px_rgba(139,92,246,0.35)] hover:border-indigo-400 transition-all duration-350 backdrop-blur-md relative overflow-hidden group">
              {/* Dynamic light refraction reflection swipe across the badge on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out z-0" />
              
              <span className="relative flex h-2.5 w-2.5 shrink-0 z-10">
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
              </span>
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 relative z-10" />
              <span className="tracking-wide relative z-10 font-extrabold bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 bg-clip-text text-transparent">Premium Air-Conditioned Co-working Study Space</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-sans font-extrabold tracking-tight text-slate-900 leading-[1.08] leading-tight">
              Focus Better. <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Achieve More.</span>
            </h1>
            <p className="text-slate-600 text-base sm:text-lg max-w-xl">
              Experience the perfect academic atmosphere at <strong className="text-slate-800">{settings.libraryName}</strong>. Standard and Premium cabins equipped with ergonomic high-speed utilities to fuel long hours of focus.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => setTab('contact')}
                className="bg-indigo-600 text-white font-semibold text-sm px-7 py-3.5 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20 cursor-pointer"
              >
                Inquire for Admission
              </button>
            </div>

            {/* Live Available Seats Banner */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl max-w-xl space-y-3 shadow-3xs">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 tracking-wider uppercase flex items-center gap-1.5">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Live Seat Availability:</span>
                </h4>
                <button 
                  onClick={() => loadStatsData()}
                  disabled={isRefreshing}
                  className="p-1 px-2 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-600 hover:text-indigo-650 hover:bg-slate-50 transition flex items-center gap-1 cursor-pointer disabled:opacity-60"
                  title="Click to manual sync seat data"
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${isRefreshing ? 'animate-spin text-indigo-650' : ''}`} />
                  <span>{isRefreshing ? 'Syncing...' : 'Sync Now'}</span>
                </button>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="p-3 bg-white border border-emerald-100 rounded-xl shadow-2xs flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-100/50 px-1.5 py-0.5 rounded-md">Full Day Open</span>
                    <p className="text-xl sm:text-2xl font-sans font-black text-slate-900 mt-1.5">
                      {fullDayOpen}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">Full-Day Seats Free</p>
                </div>

                <div className="p-3 bg-white border border-indigo-100 rounded-xl shadow-2xs flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-indigo-800 bg-indigo-50 border border-indigo-100/50 px-1.5 py-0.5 rounded-md">Half Day Seats</span>
                    <p className="text-xl sm:text-2xl font-sans font-black text-slate-900 mt-1.5">
                      {halfDayOpen}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">M: {morningOpen} / E: {eveningOpen}</p>
                </div>

                <div className="p-3 bg-white border border-sky-100 rounded-xl shadow-2xs flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-sky-800 bg-sky-50 border border-sky-100/50 px-1.5 py-0.5 rounded-md">Seats With Open Slot</span>
                    <p className="text-xl sm:text-2xl font-sans font-black text-slate-900 mt-1.5">
                      {totalOpenSeats}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">Physical seats</p>
                </div>

                <div className="p-3 bg-white border border-rose-100 rounded-xl shadow-2xs flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-rose-800 bg-rose-50 border border-rose-100/50 px-1.5 py-0.5 rounded-md">Assigned Seats</span>
                    <p className="text-xl sm:text-2xl font-sans font-black text-slate-900 mt-1.5">
                      {liveStats.occupiedSeats !== undefined ? liveStats.occupiedSeats : 0}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">Un-available Seats</p>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-slate-700 bg-slate-100 border border-slate-200/50 px-1.5 py-0.5 rounded-md">Total Pool</span>
                    <p className="text-xl sm:text-2xl font-sans font-black text-slate-900 mt-1.5">
                      {liveStats.totalSeats || 103}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">Physical Seats</p>
                </div>
              </div>
            </div>

            {/* Timings summary */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-slate-500 border-t border-slate-100 pt-6">
              <div className="flex items-center space-x-1.5 shrink-0">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Open: <strong>{settings.openingTime} - {settings.closingTime}</strong></span>
              </div>
              <div className="hidden sm:block w-1.5 h-1.5 bg-slate-200 rounded-full" />
              <div className="flex items-center space-x-1.5 min-w-0 max-w-full">
                <MapPin className="w-4 h-4 text-violet-600 shrink-0" />
                <span className="truncate py-0.5 font-medium text-slate-700" title={settings.address}>{settings.address}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="absolute -inset-1.5 bg-indigo-500/10 rounded-3xl blur-2xl" />
            <div className="relative overflow-hidden rounded-3xl border border-indigo-100 shadow-xl bg-slate-900">
              <img 
                src="https://i.ibb.co/gQ2jwnv/0c4c05ac-5b5d-4db1-ad1b-410c053fda6a.png" 
                alt="Modern quiet library reading seats with laptops and lamps"
                className="w-full h-[400px] object-cover opacity-90 transition duration-500 hover:scale-[1.02]"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 5. LOCATION & DIRECTIONS SECTION */}
      <section id="library-location-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white border border-slate-200/80 rounded-[24px] overflow-hidden shadow-xs hover:shadow-md transition-all duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Address Details & Quick Actions */}
            <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-between space-y-8 bg-slate-50/55 border-r border-slate-100">
              <div className="space-y-4">
                <div className="inline-flex items-center space-x-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider font-mono">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Physical Study Campus</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-sans font-extrabold text-slate-900 tracking-tight leading-tight">Our Location</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Walk into our quiet learning space anytime during library hours. Speak directly with our reception support desk to verify seat allocations.
                </p>
                
                <div className="h-[1px] bg-slate-200/60 my-2" />
                
                <div className="space-y-4 pt-1">
                  <div className="flex items-start space-x-3.5">
                    <div className="p-2 border border-slate-200 bg-white rounded-xl text-slate-705 shadow-2xs shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-widest leading-none">Located At</p>
                      <p className="text-xs sm:text-sm font-bold text-slate-800 mt-1">{settings.address}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3.5">
                    <div className="p-2 border border-slate-200 bg-white rounded-xl text-slate-705 shadow-2xs shrink-0 mt-0.5">
                      <Clock className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-widest leading-none">Operational Timings</p>
                      <p className="text-xs sm:text-sm font-bold text-slate-800 mt-1">{settings.openingTime} to {settings.closingTime}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Open 7 Days (including weekends)</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <a 
                  href={settings.googleMapsLocation || "https://share.google/mHtoVrAe4sliDlg15"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3.5 px-4 rounded-xl cursor-pointer shadow-md shadow-indigo-600/10 transition"
                >
                  Get Google Maps Directions
                </a>
                <a 
                  href={`tel:${(settings.contactNumber || '').replace(/[\s-]/g, '')}`}
                  className="flex-1 text-center bg-white border border-slate-200 text-slate-750 hover:bg-slate-50 font-bold text-xs py-3.5 px-4 rounded-xl transition"
                >
                  Call Reception Desk
                </a>
              </div>
            </div>

            {/* Google Map Viewer (right side) */}
            <div className="lg:col-span-7 h-[320px] sm:h-[420px] lg:h-auto min-h-[350px] relative overflow-hidden bg-slate-100">
              {settings.googleMapsLocation && settings.googleMapsLocation.includes('embed') ? (
                <iframe 
                  src={settings.googleMapsLocation} 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen={false} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Google Maps Location of Library"
                  className="absolute inset-0 w-full h-full"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-indigo-50/20 via-white to-slate-50 text-center space-y-5">
                  <div className="p-3.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full">
                    <MapPin className="w-8 h-8 text-indigo-600" />
                  </div>
                  <div className="max-w-md space-y-2">
                    <h4 className="text-sm font-sans font-bold text-slate-800">{settings.libraryName} Navigation Board</h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                      Our official address location and landmark markers are set. Tap below to launch your map directions directly.
                    </p>
                    <div className="inline-block bg-slate-100/80 border border-slate-200/60 py-2 px-3.5 rounded-xl text-[11px] font-medium text-slate-600 mt-2 font-mono">
                      {settings.address}
                    </div>
                  </div>
                  <a 
                    href={settings.googleMapsLocation || "https://share.google/mHtoVrAe4sliDlg15"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] px-6 py-3.5 rounded-xl cursor-pointer shadow-lg shadow-indigo-650/20 transition"
                  >
                    <span>🎯 Launch Google Maps Directions</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
