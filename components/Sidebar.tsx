
import React from 'react';
import { ViewType } from '../types';
import { Sparkles, FlaskConical, ScrollText, Shield, Activity, Check, RefreshCw, AlertCircle, Library, BookOpen, Settings } from 'lucide-react';
import Logo from './Logo';
import { useLanguage } from '../i18n';

interface SidebarProps {
  currentView: ViewType | 'SIMULATION';
  onChangeView: (view: ViewType | 'SIMULATION') => void;
  saveStatus?: 'saved' | 'saving' | 'error';
  isOpen?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, saveStatus = 'saved', isOpen = false }) => {
  const { t } = useLanguage();

  const menuItems = [
    { id: 'DISCUSSIONS', label: t.nav.discussions, icon: <Sparkles size={18} /> },
    { id: 'SIMULATION', label: t.nav.hive_mind, icon: <Activity size={18} /> },
    { id: 'EXPERIMENTS', label: t.nav.experiments, icon: <FlaskConical size={18} /> },
    { id: 'REPORTS', label: t.nav.library, icon: <Library size={18} /> },
    { id: 'DOCUMENTATION', label: t.nav.docs, icon: <BookOpen size={18} /> },
    { id: 'MANIFESTO', label: t.nav.manifesto, icon: <ScrollText size={18} /> },
    { id: 'ADMIN', label: t.nav.admin, icon: <Shield size={18} /> },
    { id: 'SETTINGS', label: t.nav.settings, icon: <Settings size={18} /> },
  ];

  return (
    <aside id="sidebar-nav" className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 flex flex-col z-50 transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
      {/* Brand */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100">
        <div className="filter drop-shadow-sm">
          <Logo size={32} />
        </div>
        <span className="font-serif font-black text-xl tracking-tight text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
          Gembook
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            id={`nav-item-${item.id}`}
            onClick={() => onChangeView(item.id as ViewType | 'SIMULATION')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              currentView === item.id
                ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="p-6 border-t border-slate-100">
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 space-y-2">
           <div>
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t.status.system}</div>
             <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
               {t.status.online}
             </div>
           </div>
           
           <div className="pt-2 border-t border-slate-200">
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.status.storage}</span>
                <span className={`flex items-center gap-1.5 text-xs font-medium ${
                  saveStatus === 'saved' ? 'text-slate-500' : 
                  saveStatus === 'saving' ? 'text-indigo-600' : 'text-rose-500'
                }`}>
                  {saveStatus === 'saved' && <><Check size={12} /> {t.status.synced}</>}
                  {saveStatus === 'saving' && <><RefreshCw size={12} className="animate-spin" /> {t.status.saving}</>}
                  {saveStatus === 'error' && <><AlertCircle size={12} /> {t.status.full}</>}
                </span>
             </div>
           </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
