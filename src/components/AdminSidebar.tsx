import React from 'react';
import { 
  BarChart3, 
  Grid, 
  Users, 
  CreditCard, 
  Clock, 
  Settings, 
  LogOut,
  ChevronRight,
  BookOpen,
  X,
  Sparkles
} from 'lucide-react';

interface AdminSidebarProps {
  currentSection: string;
  setSection: (section: string) => void;
  onLogout: () => void;
  adminUser: { username: string } | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentSection,
  setSection,
  onLogout,
  adminUser,
  isOpen,
  onClose
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'seats', label: 'Seat Management', icon: <Grid className="w-4 h-4" /> },
    { id: 'students', label: 'Student Management', icon: <Users className="w-4 h-4" /> },
    { id: 'fees', label: 'Fee Management', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'testimonials', label: 'Achievers\' Say', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'settings', label: 'Library Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Mobile Sidebar backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-40 transition-opacity duration-300 md:hidden"
        />
      )}

      <aside className={`fixed inset-y-0 left-0 w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col justify-between shrink-0 h-full z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:sticky md:top-0 md:h-screen md:w-64 md:flex ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Top Brand Info */}
        <div className="space-y-6">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="text-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white p-2 rounded-xl font-bold shadow-md shadow-indigo-500/10">
                🏢
              </span>
              <div>
                <span className="block font-sans font-bold text-white text-sm tracking-tight text-left">Admin Console</span>
                <span className="block text-[10px] text-indigo-400 font-semibold font-sans tracking-wider text-left">● LIVE WORKSPACE</span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1 -mr-2 text-slate-400 hover:text-white md:hidden"
              aria-label="Close sidebar menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Logged in admin profile */}
          <div className="mx-4 p-3 bg-slate-800/50 border border-slate-800 rounded-xl flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 font-bold flex items-center justify-center text-xs uppercase font-sans">
              {adminUser?.username ? adminUser.username[0] : 'A'}
            </div>
            <div className="overflow-hidden text-left">
              <span className="block text-white text-xs font-bold truncate">@{adminUser?.username || 'admin'}</span>
              <span className="block text-[9px] text-slate-505 font-mono">System Controller</span>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="px-3 space-y-1">
            {menuItems.map((item) => {
              const isActive = currentSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSection(item.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold tracking-tight transition duration-150 ${
                    isActive 
                      ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-900/30' 
                      : 'hover:bg-slate-800/60 hover:text-white text-slate-400'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className={`${isActive ? 'text-white' : 'text-slate-400'}`}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 transition ${isActive ? 'text-white opacity-80' : 'text-slate-400'}`} />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-2.5 p-3 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 hover:text-red-400 transition"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Exit Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
