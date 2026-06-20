import React, { useState } from 'react';
import { BookOpen, LogIn, Menu, X, ShieldCheck, Home, Mail, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface PublicNavbarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  logo: string;
  libraryName: string;
  onAdminClick: () => void;
  isAdminLoggedIn: boolean;
  onGoToDashboard: () => void;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({
  currentTab,
  setTab,
  logo,
  libraryName,
  onAdminClick,
  isAdminLoggedIn,
  onGoToDashboard
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-4 z-50 max-w-7xl mx-auto w-[calc(100%-1rem)] xs:w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] md:w-[calc(100%-3rem)] my-2 bg-white/85 hover:bg-white/95 border border-slate-200/90 hover:border-indigo-300/80 rounded-2xl sm:rounded-3xl shadow-[0_12px_36px_-6px_rgba(99,102,241,0.12),0_4px_16px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_48px_-10px_rgba(99,102,241,0.22)] backdrop-blur-xl transition-all duration-500">
      <div className="px-3 xs:px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 sm:h-20 items-center">
          {/* Logo & Name */}
          <div 
            onClick={() => {
              setTab('home');
              setIsOpen(false);
            }} 
            className="flex items-center space-x-2.5 xs:space-x-3.5 cursor-pointer group relative min-w-0"
          >
            {/* Pulsating premium logo with multi-colored ambient background glow & elegant bordering */}
            <div className="relative shrink-0">
              {/* Premium surrounding aura blur */}
              <div className="absolute -inset-2 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur-md opacity-25 group-hover:opacity-60 group-hover:scale-115 transition-all duration-500" />
              
              {/* Double border stylish container */}
              <div className="relative text-xl xs:text-2xl bg-slate-950 border border-slate-800 h-9 w-9 xs:h-11 xs:w-11 sm:h-12 sm:w-12 flex items-center justify-center rounded-xl sm:rounded-2xl shadow-[0_4px_18px_rgba(99,102,241,0.3)] group-hover:scale-105 group-hover:border-indigo-400 group-hover:shadow-[0_0_24px_rgba(139,92,246,0.6)] transition-all duration-300 overflow-hidden">
                {(logo && (logo.startsWith('http://') || logo.startsWith('https://') || logo.startsWith('/'))) ? (
                  <img
                    src={logo}
                    alt="Logo"
                    className="w-full h-full object-cover rounded-xl sm:rounded-2xl relative z-10 transition-transform duration-300 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="relative z-10 transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]">
                    {logo || '📚'}
                  </span>
                )}
                
                {/* Gloss light strip effect inside logo */}
                <span className="absolute inset-x-0 top-0 h-1/2 bg-white/10 rounded-t-xl sm:rounded-t-2xl z-20" />
                <span className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent rounded-xl sm:rounded-2xl z-20" />
              </div>
            </div>

            <div className="flex flex-col justify-center min-w-0">
              {/* Double line premium typography layout - library name is shown fully on mobile without hard truncation */}
              <div className="relative">
                <span className="font-sans font-black tracking-tight text-slate-900 text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl block bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 bg-clip-text text-transparent group-hover:from-indigo-650 group-hover:via-purple-600 group-hover:to-pink-600 transition-all duration-500 whitespace-normal break-words max-w-[180px] xs:max-w-[260px] sm:max-w-md md:max-w-lg lg:max-w-none leading-tight sm:leading-snug">
                  {libraryName || 'Library Seat Manager'}
                </span>
              </div>
              <div className="flex items-center mt-0.5">
                <div className="hidden xs:inline-flex items-center space-x-1.5 bg-indigo-500/10 border border-indigo-200/50 px-2 py-0.5 rounded-full shadow-[0_2px_10px_rgba(99,102,241,0.06)]">
                  <span className="relative flex h-1.5 w-1.5 shrink-0">
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-[8px] text-indigo-700 font-extrabold tracking-widest uppercase font-mono whitespace-nowrap">Premium Workspace Gateway</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links with border contour design - Hidden on mobile */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100/60 p-1.5 border border-slate-200/60 rounded-2xl">
            {['home', 'about', 'contact'].map((tab) => {
              const isActive = currentTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setTab(tab)}
                  className={`font-sans text-xs font-bold transition-all px-4 py-2 rounded-xl capitalize relative overflow-hidden ${
                    isActive
                      ? 'text-white bg-slate-950 shadow-sm border border-slate-900'
                      : 'text-slate-650 hover:text-slate-900 hover:bg-slate-200/50 border border-transparent'
                  }`}
                >
                  <span className="relative z-10">{tab}</span>
                </button>
              );
            })}
          </nav>

          {/* Contact & Auth Buttons - Hidden on mobile, handled elegantly inside Mobile menu */}
          <div className="hidden md:flex items-center space-x-1.5 xs:space-x-2 sm:space-x-3 shrink-0">
            <button
              onClick={() => setTab('contact')}
              className="hidden lg:inline-flex bg-slate-50 border border-slate-200/80 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all duration-300 shadow-xs"
            >
              Inquire Now
            </button>
            {isAdminLoggedIn ? (
              <button
                onClick={onGoToDashboard}
                className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-2.5 xs:px-3 sm:px-5 py-1.5 xs:py-2 sm:py-2.5 rounded-xl text-[10px] xs:text-xs font-bold hover:from-emerald-500 hover:to-teal-500 transition-all duration-300 shadow-[0_4px_14px_rgba(16,185,129,0.25)] shrink-0 group border border-emerald-500/20"
              >
                <div className="w-1.5 h-1.5 xs:w-2 xs:h-2 bg-emerald-300 rounded-full" />
                <span>
                  <span className="hidden xs:inline">Dashboard</span>
                  <span className="xs:hidden">Console</span>
                </span>
              </button>
            ) : (
              <button
                onClick={onAdminClick}
                className="inline-flex items-center space-x-1.5 bg-slate-950 text-white px-2.5 xs:px-3 sm:px-5 py-1.5 xs:py-3 sm:py-2.5 rounded-xl text-[10px] xs:text-xs font-bold hover:bg-indigo-650 transition-all duration-300 shadow-[0_4px_16px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_22px_-4px_rgba(99,102,241,0.5)] shrink-0 border border-slate-900 group"
              >
                <LogIn className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform shrink-0" />
                <span>
                  <span className="hidden xs:inline">Admin Login</span>
                  <span className="xs:hidden">Login</span>
                </span>
              </button>
            )}
          </div>

          {/* Premium Hamburger Toggle Button on Mobile */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 xs:p-2.5 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-slate-100 hover:border-indigo-300 text-indigo-950 hover:text-indigo-600 transition-all duration-300 shadow-xs relative group focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              <div className="relative w-5 h-5 flex flex-col justify-between items-center z-10">
                <span className={`w-5 h-[2px] bg-current rounded-full transition-all duration-300 transform origin-left ${isOpen ? 'rotate-45 translate-x-[3px] -translate-y-[1px]' : ''}`} />
                <span className={`w-5 h-[2px] bg-current rounded-full transition-all duration-300 ${isOpen ? 'opacity-0 scale-0' : ''}`} />
                <span className={`w-5 h-[2px] bg-current rounded-full transition-all duration-300 transform origin-left ${isOpen ? '-rotate-45 translate-x-[3px] translate-y-[1px]' : ''}`} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Animated Dropdown Navigation Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden overflow-hidden border-t border-slate-100/90 bg-white/95 backdrop-blur-xl rounded-b-2xl sm:rounded-b-3xl"
          >
            <div className="px-4 py-5 space-y-4 flex flex-col">
              {/* Premium indicator label */}
              <div className="flex items-center justify-between px-2.5 py-1.5 bg-indigo-50/70 border border-indigo-100/50 rounded-xl">
                <span className="text-[10px] text-slate-500 font-extrabold tracking-wider uppercase font-sans">WORKSPACE PANEL</span>
                <div className="flex items-center">
                  <span className="relative flex h-1.5 w-1.5 shrink-0 mr-1.5">
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-[9px] text-indigo-700 font-extrabold tracking-wide font-mono">ONLINE</span>
                </div>
              </div>

              {/* Navigation Items list */}
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { id: 'home', label: 'Home Page', icon: Home, subtitle: 'Virtual seat grid & booking' },
                  { id: 'about', label: 'About Workspace', icon: BookOpen, subtitle: 'Cabin view & premium features' },
                  { id: 'contact', label: 'Inquire Now', icon: Mail, subtitle: 'Get in touch / Ask questions' }
                ].map((item) => {
                  const IconComp = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setTab(item.id);
                        setIsOpen(false);
                      }}
                      className={`flex items-center justify-between w-full p-3 rounded-xl border font-sans transition-all text-left group ${
                        isActive
                          ? 'bg-slate-950 border-slate-900 text-white shadow-md'
                          : 'bg-transparent border-transparent hover:bg-indigo-50/50 text-slate-700 hover:text-indigo-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className={`p-2 rounded-lg ${isActive ? 'bg-white/10' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100'}`}>
                          <IconComp className="w-4 h-4 shrink-0" />
                        </div>
                        <div>
                          <p className="text-xs font-black tracking-wide leading-none">{item.label}</p>
                          <p className={`text-[10px] mt-1 font-medium ${isActive ? 'text-white/60' : 'text-slate-400 group-hover:text-indigo-500'}`}>{item.subtitle}</p>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 opacity-40 transition-transform ${isActive ? 'translate-x-0.5' : 'group-hover:translate-x-1 text-slate-400 group-hover:text-indigo-500'}`} />
                    </button>
                  );
                })}
              </div>

              <div className="h-[1px] bg-slate-100" />

              {/* Call-to-action Action buttons */}
              <div className="pt-1 flex flex-col gap-2">
                {isAdminLoggedIn ? (
                  <button
                    onClick={() => {
                      onGoToDashboard();
                      setIsOpen(false);
                    }}
                    className="flex items-center justify-center space-x-2 w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-xl text-xs font-bold hover:from-emerald-500 hover:to-teal-500 transition-all duration-300 shadow-md border border-emerald-500/10 active:scale-[0.98]"
                  >
                    <div className="w-1.5 h-1.5 bg-emerald-300 rounded-full" />
                    <span>Go to Dashboard Console</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onAdminClick();
                      setIsOpen(false);
                    }}
                    className="flex items-center justify-center space-x-2.5 w-full bg-slate-950 text-white py-3 rounded-xl text-xs font-bold hover:bg-indigo-650 transition-all duration-300 shadow-md border border-slate-900 active:scale-[0.98]"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Access Admin Console Login</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
