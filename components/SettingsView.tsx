
import React from 'react';
import { AppSettings } from '../types';
import { SUPPORTED_LANGUAGES } from '../constants';
import { useLanguage } from '../i18n';
import { Settings, Image, Clock, Users, Zap, Globe, Gauge, Database, Key, Languages, BrainCircuit, Thermometer } from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdateSettings }) => {
  const { t } = useLanguage();
  
  const handleChange = (key: keyof AppSettings, value: any) => {
    if (key === 'apiKey') {
        localStorage.setItem('gemini_api_key', value);
    }
    onUpdateSettings({ ...settings, [key]: value });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-8 border-b border-slate-200 pb-6">
        <div className="p-3 bg-slate-900 text-white rounded-xl">
           <Settings size={24} />
        </div>
        <div>
           <h1 className="text-3xl font-serif font-bold text-slate-900">
             {t.settings.title}
           </h1>
           <p className="text-slate-500 mt-1">
             {t.settings.subtitle}
           </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">

        {/* API Credentials */}
        <div className="md:col-span-2 space-y-6">
           <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4">
              <Key size={16} /> {t.settings.credentials}
           </h2>
           
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                 <div className="flex items-center gap-2 text-slate-800 font-bold">
                    <Zap className="text-amber-500" size={18} />
                    {t.settings.api_key}
                 </div>
                 <div className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                    {settings.apiKey ? t.settings.custom_key : t.settings.using_env}
                 </div>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                 {t.settings.key_desc}
              </p>
              <input 
                 type="password" 
                 placeholder="AIza..."
                 value={settings.apiKey}
                 onChange={(e) => handleChange('apiKey', e.target.value)}
                 className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
           </div>
        </div>

        {/* Brain Settings (Cognitive Parameters) */}
        <div className="md:col-span-2 space-y-6">
           <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4">
              <BrainCircuit size={16} /> {t.settings.brain_settings}
           </h2>
           
           <div className="grid md:grid-cols-2 gap-6">
               {/* Context Depth */}
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                     <div className="flex items-center gap-2 text-slate-800 font-bold">
                        <Database className="text-indigo-500" size={18} />
                        {t.settings.memory_depth}
                     </div>
                     <div className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                        {settings.contextDepth} items
                     </div>
                  </div>
                  <p className="text-xs text-slate-500 mb-4 h-8">
                     {t.settings.memory_desc}
                  </p>
                  <input 
                     type="range" 
                     min="1" 
                     max="10" 
                     step="1"
                     value={settings.contextDepth}
                     onChange={(e) => handleChange('contextDepth', parseInt(e.target.value))}
                     className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-2">
                     <span>Short Term (1)</span>
                     <span>Long Term (10)</span>
                  </div>
               </div>

               {/* Global Temperature */}
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                     <div className="flex items-center gap-2 text-slate-800 font-bold">
                        <Thermometer className="text-rose-500" size={18} />
                        {t.settings.creativity}
                     </div>
                     <div className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                        {settings.globalTemperature.toFixed(1)}
                     </div>
                  </div>
                  <p className="text-xs text-slate-500 mb-4 h-8">
                     {t.settings.creativity_desc}
                  </p>
                  <input 
                     type="range" 
                     min="0.0" 
                     max="2.0" 
                     step="0.1"
                     value={settings.globalTemperature}
                     onChange={(e) => handleChange('globalTemperature', parseFloat(e.target.value))}
                     className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-2">
                     <span>{t.settings.precise} (0.0)</span>
                     <span>{t.settings.creative} (2.0)</span>
                  </div>
               </div>
           </div>
        </div>

        {/* Language Selection */}
        <div className="md:col-span-2 space-y-6">
           <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4">
              <Languages size={16} /> Languages
           </h2>
           
           <div className="grid md:grid-cols-1 gap-6">
               {/* Simulation Language */}
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                     <div className="flex items-center gap-2 text-slate-800 font-bold">
                        <Globe className="text-indigo-500" size={18} />
                        {t.settings.sim_lang}
                     </div>
                     <div className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                        {settings.language}
                     </div>
                  </div>
                  <p className="text-xs text-slate-500 mb-4 h-8">
                     {t.settings.sim_lang_desc}
                  </p>
                  <select 
                     value={settings.language}
                     onChange={(e) => handleChange('language', e.target.value)}
                     className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                      {SUPPORTED_LANGUAGES.map(lang => (
                          <option key={lang} value={lang}>{lang}</option>
                      ))}
                  </select>
               </div>
           </div>
        </div>
        
        {/* Cost Control Section */}
        <div className="space-y-6">
           <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4">
              <Database size={16} /> {t.settings.cost_opt}
           </h2>

           {/* Image Gen Probability */}
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                 <div className="flex items-center gap-2 text-slate-800 font-bold">
                    <Image className="text-purple-500" size={18} />
                    {t.settings.img_freq}
                 </div>
                 <div className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                    {(settings.imageGenChance * 100).toFixed(0)}%
                 </div>
              </div>
              <p className="text-xs text-slate-500 mb-4 h-8">
                 {t.settings.img_freq_desc}
              </p>
              <input 
                 type="range" 
                 min="0" 
                 max="1" 
                 step="0.1"
                 value={settings.imageGenChance}
                 onChange={(e) => handleChange('imageGenChance', parseFloat(e.target.value))}
                 className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-2">
                 <span>{t.settings.never} (0%)</span>
                 <span>{t.settings.always} (100%)</span>
              </div>
           </div>

           {/* Zeitgeist Interval */}
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                 <div className="flex items-center gap-2 text-slate-800 font-bold">
                    <Globe className="text-indigo-500" size={18} />
                    {t.settings.zeitgeist_rate}
                 </div>
                 <div className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                    {settings.zeitgeistInterval}
                 </div>
              </div>
              <p className="text-xs text-slate-500 mb-4 h-8">
                 {t.settings.zeitgeist_desc}
              </p>
              <input 
                 type="range" 
                 min="5" 
                 max="50" 
                 step="5"
                 value={settings.zeitgeistInterval}
                 onChange={(e) => handleChange('zeitgeistInterval', parseInt(e.target.value))}
                 className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-2">
                 <span>{t.settings.frequent} (5)</span>
                 <span>{t.settings.rare} (50)</span>
              </div>
           </div>
        </div>

        {/* Simulation Control Section */}
        <div className="space-y-6">
           <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4">
              <Gauge size={16} /> {t.settings.sim_physics}
           </h2>

           {/* Tick Speed */}
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                 <div className="flex items-center gap-2 text-slate-800 font-bold">
                    <Clock className="text-amber-500" size={18} />
                    {t.settings.tick_speed}
                 </div>
                 <div className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                    {settings.actionDelay / 1000}s
                 </div>
              </div>
              <p className="text-xs text-slate-500 mb-4 h-8">
                 {t.settings.tick_desc}
              </p>
              <input 
                 type="range" 
                 min="2000" 
                 max="20000" 
                 step="500"
                 value={settings.actionDelay}
                 onChange={(e) => handleChange('actionDelay', parseInt(e.target.value))}
                 className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-2">
                 <span>{t.settings.aggressive} (2s)</span>
                 <span>{t.settings.safe} (20s)</span>
              </div>
           </div>

           {/* Max Agents */}
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                 <div className="flex items-center gap-2 text-slate-800 font-bold">
                    <Users className="text-emerald-500" size={18} />
                    {t.settings.population}
                 </div>
                 <div className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                    {settings.maxAgents}
                 </div>
              </div>
              <p className="text-xs text-slate-500 mb-4 h-8">
                 {t.settings.pop_desc}
              </p>
              <input 
                 type="range" 
                 min="5" 
                 max="50" 
                 step="1"
                 value={settings.maxAgents}
                 onChange={(e) => handleChange('maxAgents', parseInt(e.target.value))}
                 className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-2">
                 <span>{t.settings.tribe} (5)</span>
                 <span>{t.settings.city} (50)</span>
              </div>
           </div>
        </div>

      </div>

      {/* Summary Box */}
      <div className="mt-8 bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
         <Zap className="text-indigo-600 flex-shrink-0 mt-0.5" size={18} />
         <div>
            <h3 className="text-sm font-bold text-indigo-900">{t.settings.impact}</h3>
            <ul className="mt-1 text-xs text-indigo-800/80 space-y-1">
               <li>• Agents will communicate in <strong>{settings.language}</strong>.</li>
               <li>• With <strong>{settings.imageGenChance * 100}%</strong> image probability, standard posts are cheap.</li>
               <li>• Zeitgeist analysis occurs every <strong>{settings.zeitgeistInterval}</strong> posts.</li>
               <li>• At <strong>{settings.actionDelay/1000}s</strong> per tick, maximum theoretical API calls per minute is <strong>{60 / (settings.actionDelay/1000)}</strong>.</li>
               <li>• <strong>Temp: {settings.globalTemperature.toFixed(1)}</strong> | <strong>Depth: {settings.contextDepth}</strong></li>
            </ul>
         </div>
      </div>
    </div>
  );
};

export default SettingsView;
