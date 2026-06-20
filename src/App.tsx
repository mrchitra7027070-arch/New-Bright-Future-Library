import React, { useEffect, useState } from 'react';
import { api } from './lib/api';
import { LibrarySettings, Notice } from './types';
import { PublicNavbar } from './components/PublicNavbar';
import { PublicHome } from './components/PublicHome';
import { PublicAbout } from './components/PublicAbout';
import { PublicGallery } from './components/PublicGallery';
import { PublicContact } from './components/PublicContact';
import { AdminLogin } from './components/AdminLogin';
import { AdminSidebar } from './components/AdminSidebar';
import { AdminDashboard } from './components/AdminDashboard';
import { SeatManagement } from './components/SeatManagement';
import { StudentManagement } from './components/StudentManagement';
import { FeeManagement } from './components/FeeManagement';
import { AttendanceManagement } from './components/AttendanceManagement';
import { LibrarySettingsComponent } from './components/LibrarySettings';
import { TestimonialManagement } from './components/TestimonialManagement';
import { BookOpen, ShieldCheck, Mail, Phone, ExternalLink, Menu } from 'lucide-react';

export default function App() {
  const [settings, setSettings] = useState<LibrarySettings | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [stats, setStats] = useState({ 
    totalSeats: 40, 
    occupiedSeats: 5, 
    reservedSeats: 2, 
    availableSeats: 33,
    availableFullDaySeats: 15,
    availableHalfDaySeats: 18,
    availableMorningSlots: 18,
    availableEveningSlots: 18
  });
  const [loading, setLoading] = useState(true);

  // Authentication State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState<{ id: string; username: string } | null>(null);

  // Navigation State
  // viewMode: 'public' | 'admin'
  const [viewMode, setViewMode] = useState<'public' | 'admin'>('public');
  // publicTab: 'home' | 'about' | 'gallery' | 'contact' | 'admin_login'
  const [publicTab, setPublicTab] = useState<string>('home');
  // adminSection: matching Admin sidebar modules
  const [adminSection, setAdminSection] = useState<string>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    bootstrapApp();
  }, []);

  // Sync stats when switching view or landing on home page
  useEffect(() => {
    const syncStats = async () => {
      try {
        const liveStats = await api.getStats();
        setStats(liveStats);
      } catch (err) {
        console.error("Failed to dynamically sync stats", err);
      }
    };
    if (viewMode === 'public' && publicTab === 'home') {
      syncStats();
    }
  }, [viewMode, publicTab]);

  const bootstrapApp = async () => {
    try {
      setLoading(true);
      
      // Load public configurations
      const currentSettings = await api.getSettings();
      setSettings(currentSettings);
      
      const activeNotices = await api.getNotices();
      setNotices(activeNotices);

      const liveStats = await api.getStats();
      setStats(liveStats);

      // Verify Auth session
      const authSession = await api.verifyAuth();
      if (authSession?.success) {
        setIsAdminLoggedIn(true);
        setAdminUser(authSession.user);
      }
    } catch (e) {
      console.error("Bootstrapping failure, loaded offline default configs.", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLoginSuccess = (token: string, user: { id: string; username: string }) => {
    setIsAdminLoggedIn(true);
    setAdminUser(user);
    setViewMode('admin');
    setAdminSection('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setIsAdminLoggedIn(false);
    setAdminUser(null);
    setViewMode('public');
    setPublicTab('home');
  };

  const handleEnquirySubmit = async (data: { name: string; mobile: string; message: string }) => {
    try {
      const res = await api.submitEnquiry(data);
      if (res.success) {
        // Refetch stats/notices if required, return confirmation
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  if (loading || !settings) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="text-4xl">📚</div>
          <p className="font-sans font-bold text-slate-800 text-sm">Resuming quiet lounge workspace configs...</p>
          <div className="w-48 h-1 bg-indigo-100 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-indigo-600 w-full shadow-[0_0_12px_rgba(79,70,229,0.5)]" />
          </div>
        </div>
      </div>
    );
  }

  // Determine current active component workspace in public website
  const renderPublicContent = () => {
    switch (publicTab) {
      case 'home':
        return (
          <PublicHome 
            settings={settings} 
            notices={notices} 
            stats={stats} 
            onSubmitEnquiry={handleEnquirySubmit}
            setTab={setPublicTab}
          />
        );
      case 'about':
        return <PublicAbout settings={settings} />;
      case 'gallery':
        return <PublicGallery />;
      case 'contact':
        return <PublicContact settings={settings} />;
      case 'admin_login':
        return (
          <AdminLogin 
            onLoginSuccess={handleAdminLoginSuccess} 
            onBackToPublic={() => setPublicTab('home')}
            logo={settings.logo}
            libraryName={settings.libraryName}
          />
        );
      default:
        return <PublicHome settings={settings} notices={notices} stats={stats} onSubmitEnquiry={handleEnquirySubmit} setTab={setPublicTab} />;
    }
  };

  // Determine current active component in secure admin console
  const renderAdminContent = () => {
    switch (adminSection) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'seats':
        return <SeatManagement />;
      case 'students':
        return <StudentManagement setSection={setAdminSection} />;
      case 'fees':
        return <FeeManagement />;
      case 'attendance':
        return <AttendanceManagement />;
      case 'testimonials':
        return <TestimonialManagement />;
      case 'settings':
        return <LibrarySettingsComponent />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {viewMode === 'public' ? (
        /* PUBLIC VISITOR FRONTEND */
        <div className="flex flex-col min-h-screen">
          <PublicNavbar 
            currentTab={publicTab} 
            setTab={setPublicTab} 
            logo={settings.logo}
            libraryName={settings.libraryName}
            onAdminClick={() => setPublicTab('admin_login')}
            isAdminLoggedIn={isAdminLoggedIn}
            onGoToDashboard={() => setViewMode('admin')}
          />

          <main className="flex-grow bg-white">
            {renderPublicContent()}
          </main>

          {/* PUBLIC SITE FOOTER */}
          <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  {(settings.logo && (settings.logo.startsWith('http://') || settings.logo.startsWith('https://') || settings.logo.startsWith('/'))) ? (
                    <img 
                      src={settings.logo} 
                      alt="Logo" 
                      className="w-8 h-8 object-cover rounded-lg" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-2xl">{settings.logo}</span>
                  )}
                  <span className="font-sans font-bold text-white text-lg">{settings.libraryName}</span>
                </div>
                <p className="text-xs text-slate-450 leading-relaxed">
                  Established with high-standards of co-working ergonomics. Strictest code of conduct ensuring pin-drop silent studies on all slot categories.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest font-mono mb-4">Timings Open</h4>
                <p className="text-xs leading-relaxed">
                  We are open 7 days a week.<br />
                  Slots: <strong>{settings.openingTime} - {settings.closingTime}</strong><br />
                  Holiday slots are published on Notices.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest font-mono mb-4">Workspace Address</h4>
                <p className="text-xs leading-relaxed">{settings.address}</p>
                <div className="text-xs space-y-1 select-all">
                  <p className="flex items-center space-x-1"><Phone className="w-3.5 h-3.5 text-slate-500" /><span>{settings.contactNumber}</span></p>
                  <p className="flex items-center space-x-1"><Mail className="w-3.5 h-3.5 text-slate-500" /><span>{settings.email}</span></p>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 font-mono gap-4">
              <span>&copy; {new Date().getFullYear()} {settings.libraryName}. All rights and seats reserved.</span>
              <div className="flex space-x-4">
                <span className="text-slate-400">Hisar Zone, Haryana</span>
                <span className="w-[1px] bg-slate-800" />
                <button onClick={() => setPublicTab('admin_login')} className="text-indigo-500 hover:text-indigo-400 hover:underline font-semibold">Staff Admin Login</button>
              </div>
            </div>
          </footer>
        </div>
      ) : (
        /* SECURED ADMINISTRATIVE CO-WORKING CONSOLE PANEL */
        <div className="flex min-h-screen bg-slate-50 overflow-hidden">
          <AdminSidebar 
            currentSection={adminSection} 
            setSection={(sec) => {
              setAdminSection(sec);
              setIsMobileSidebarOpen(false); // Auto close sidebar on mobile tap
            }}
            onLogout={handleLogout}
            adminUser={adminUser}
            isOpen={isMobileSidebarOpen}
            onClose={() => setIsMobileSidebarOpen(false)}
          />

          <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
            {/* Sec header */}
            <header className="sticky top-0 z-30 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-8 gap-2">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="p-2 -ml-2 text-slate-600 hover:text-slate-800 md:hidden hover:bg-slate-50 rounded-xl"
                  aria-label="Open sidebar menu"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider bg-slate-50 border border-indigo-100 rounded-lg py-1 px-2 sm:px-3 truncate max-w-[160px] sm:max-w-xs md:max-w-none">
                  🏢 {settings.libraryName}
                </span>
              </div>
              
              <div className="flex items-center space-x-2 text-xs shrink-0">
                <button
                  onClick={() => setViewMode('public')}
                  className="inline-flex items-center space-x-1 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-950 font-bold px-2 sm:px-3 py-1.5 rounded-lg transition"
                  title="Preview Public Site"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Preview Site</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-red-50 text-red-650 hover:bg-red-100 border border-red-150 font-bold px-2 sm:px-3 py-1.5 rounded-lg transition"
                >
                  Logout
                </button>
              </div>
            </header>

            {/* MAIN ROUTER PANEL */}
            <main className="flex-grow p-4 sm:p-8 max-w-7xl w-full mx-auto">
              {renderAdminContent()}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
