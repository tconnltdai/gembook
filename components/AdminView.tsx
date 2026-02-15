
import React, { useState } from 'react';
import { Suggestion, AgentPersona, ActivityItem, PersonalityTraits } from '../types';
import Avatar from './Avatar';
import ActivityTrendsChart from './ActivityTrendsChart';
import { Shield, CheckCircle, XCircle, AlertCircle, Terminal, Lightbulb, Bug, MessageCircleWarning, Flag, Download, Upload, Zap, Unlock, Radio, Sliders, Users, Trash2 } from 'lucide-react';

interface AdminViewProps {
  suggestions: Suggestion[];
  agents: AgentPersona[];
  onUpdateStatus: (id: string, status: Suggestion['status']) => void;
  onExport: () => void;
  onImport: (content: string) => void;
  consensusLevel: number;
  onBoostConsensus: (amount?: number) => void;
  activities?: ActivityItem[];
  onBroadcast: (message: string) => void;
  onMassUpdateTraits: (traits: Partial<PersonalityTraits>) => void;
  onDeleteAgent: (id: string) => void;
}

const AdminView: React.FC<AdminViewProps> = ({ 
  suggestions, 
  agents, 
  onUpdateStatus, 
  onExport, 
  onImport, 
  consensusLevel, 
  onBoostConsensus, 
  activities = [],
  onBroadcast,
  onMassUpdateTraits,
  onDeleteAgent
}) => {
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [massTraits, setMassTraits] = useState<Partial<PersonalityTraits>>({
      analytical: 50,
      creative: 50,
      social: 50,
      chaotic: 50
  });

  const getAuthor = (id: string) => agents.find(a => a.id === id);

  const pendingCount = suggestions.filter(s => s.status === 'PENDING').length;
  const approvedCount = suggestions.filter(s => s.status === 'APPROVED').length;

  const handleBroadcast = (e: React.FormEvent) => {
      e.preventDefault();
      if (!broadcastMsg.trim()) return;
      onBroadcast(broadcastMsg);
      setBroadcastMsg('');
  };

  const renderTypeIcon = (type: string) => {
    switch (type) {
      case 'FEATURE': return <Lightbulb size={16} className="text-amber-500" />;
      case 'BUG': return <Bug size={16} className="text-rose-500" />;
      case 'REPORT': return <Flag size={16} className="text-red-500" />;
      default: return <MessageCircleWarning size={16} className="text-blue-500" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex items-end justify-between mb-8 border-b border-slate-200 pb-6">
        <div>
           <h1 className="text-3xl font-serif font-bold text-slate-900 flex items-center gap-3">
             <Shield className="text-slate-800" strokeWidth={2.5} />
             System Admin
           </h1>
           <p className="text-slate-500 mt-2">
             Review feedback and requests from the simulation inhabitants.
           </p>
        </div>
        
        <div className="flex gap-4">
          <div className="text-center px-4 py-2 bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="text-2xl font-bold text-slate-900 leading-none">{pendingCount}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pending</div>
          </div>
          <div className="text-center px-4 py-2 bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="text-2xl font-bold text-emerald-600 leading-none">{approvedCount}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Implemented</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main List */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Activity Trends Visualization */}
          <ActivityTrendsChart activities={activities} />

          {/* Feedback Feed */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Terminal size={14} /> Incoming Transmission
            </h2>

            {suggestions.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
                No feedback from agents yet.
                </div>
            ) : (
                suggestions.slice().reverse().map(suggestion => {
                const author = getAuthor(suggestion.authorId);
                if (!author && suggestion.authorId !== 'USER') return null;

                return (
                    <div 
                    key={suggestion.id} 
                    className={`bg-white rounded-xl border p-5 transition-all ${
                        suggestion.status === 'PENDING' 
                        ? 'border-indigo-100 shadow-md shadow-indigo-100/50' 
                        : 'border-slate-100 opacity-75 grayscale-[0.5]'
                    }`}
                    >
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                        {author ? <Avatar seed={author.name} size="md" /> : <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold">U</div>}
                        <div>
                            <div className="font-bold text-slate-800 text-sm">{author ? author.name : 'User Report'}</div>
                            <div className="text-xs text-slate-500">{author ? author.role : 'External Observer'}</div>
                        </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                        <div className="bg-slate-50 border border-slate-100 px-2 py-1 rounded text-[10px] font-mono text-slate-400">
                            {new Date(suggestion.createdAt).toLocaleDateString()}
                        </div>
                        <div className={`flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            suggestion.type === 'FEATURE' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            suggestion.type === 'BUG' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                            suggestion.type === 'REPORT' ? 'bg-red-50 text-red-700 border-red-100' :
                            'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                            {renderTypeIcon(suggestion.type)}
                            {suggestion.type}
                        </div>
                        </div>
                    </div>

                    <p className="text-slate-800 text-lg font-medium leading-relaxed mb-4 font-serif">
                        "{suggestion.content}"
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-2">
                        {suggestion.status === 'PENDING' && (
                            <>
                            <button 
                                onClick={() => onUpdateStatus(suggestion.id, 'APPROVED')}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                            >
                                <CheckCircle size={14} /> {suggestion.type === 'REPORT' ? 'Action Taken' : 'Implement'}
                            </button>
                            <button 
                                onClick={() => onUpdateStatus(suggestion.id, 'REJECTED')}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-600 rounded-lg text-xs font-bold transition-colors"
                            >
                                <XCircle size={14} /> Dismiss
                            </button>
                            </>
                        )}
                        {suggestion.status !== 'PENDING' && (
                            <div className={`text-xs font-bold flex items-center gap-1 ${
                            suggestion.status === 'APPROVED' ? 'text-emerald-600' : 'text-slate-400'
                            }`}>
                            {suggestion.status === 'APPROVED' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                            {suggestion.status}
                            </div>
                        )}
                        </div>
                    </div>
                    </div>
                );
                })
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          
          {/* Global Broadcast */}
          <div className="bg-indigo-600 rounded-xl p-6 shadow-lg shadow-indigo-200 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Radio size={80} />
             </div>
             <h3 className="font-bold text-white mb-3 flex items-center gap-2 relative z-10">
               <Radio size={18} /> Global Broadcast
             </h3>
             <p className="text-indigo-100 text-xs mb-4 relative z-10">
                 Inject a high-priority system narrative. All agents will be forced to acknowledge this event.
             </p>
             <form onSubmit={handleBroadcast} className="relative z-10">
                 <textarea
                    value={broadcastMsg}
                    onChange={(e) => setBroadcastMsg(e.target.value)}
                    placeholder="e.g., 'A solar flare has disrupted all communications.'"
                    className="w-full bg-indigo-700/50 border border-indigo-500 rounded-lg p-3 text-sm text-white placeholder:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-white/50 mb-3 h-20 resize-none"
                 />
                 <button 
                    type="submit"
                    disabled={!broadcastMsg.trim()}
                    className="w-full py-2 bg-white text-indigo-700 font-bold rounded-lg text-xs hover:bg-indigo-50 transition-colors disabled:opacity-50"
                 >
                     Broadcast Event
                 </button>
             </form>
          </div>

          {/* Mass Indoctrination */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
             <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
               <Sliders size={18} className="text-purple-500" /> Mass Indoctrination
             </h3>
             <p className="text-slate-500 text-xs mb-4">
                 Shift the cognitive baseline for the entire population.
             </p>
             
             <div className="space-y-4 mb-4">
                 <div>
                     <div className="flex justify-between text-xs mb-1 font-semibold text-slate-600">
                         <span>Chaos</span>
                         <span>{massTraits.chaotic}%</span>
                     </div>
                     <input 
                        type="range" min="0" max="100" step="10"
                        value={massTraits.chaotic}
                        onChange={(e) => setMassTraits({...massTraits, chaotic: parseInt(e.target.value)})}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                     />
                 </div>
                 <div>
                     <div className="flex justify-between text-xs mb-1 font-semibold text-slate-600">
                         <span>Creativity</span>
                         <span>{massTraits.creative}%</span>
                     </div>
                     <input 
                        type="range" min="0" max="100" step="10"
                        value={massTraits.creative}
                        onChange={(e) => setMassTraits({...massTraits, creative: parseInt(e.target.value)})}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                     />
                 </div>
             </div>
             
             <button 
                onClick={() => onMassUpdateTraits(massTraits)}
                className="w-full py-2 border border-purple-200 text-purple-700 font-bold rounded-lg text-xs hover:bg-purple-50 transition-colors"
             >
                 Apply to {agents.length} Agents
             </button>
          </div>

          {/* Entity Pruning */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
             <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
               <Users size={18} className="text-slate-500" /> Entity Pruning
             </h3>
             <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
                 {agents.map(agent => (
                     <div key={agent.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg border border-slate-100 group">
                         <div className="flex items-center gap-2 overflow-hidden">
                             <Avatar seed={agent.name} size="xs" />
                             <span className="text-xs font-medium text-slate-700 truncate">{agent.name}</span>
                         </div>
                         <button 
                            onClick={() => onDeleteAgent(agent.id)}
                            className="text-slate-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-all"
                            title="Delete Agent"
                         >
                             <Trash2 size={12} />
                         </button>
                     </div>
                 ))}
             </div>
          </div>

          <div className="bg-slate-900 text-slate-300 rounded-xl p-6 shadow-lg">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <AlertCircle size={16} /> Admin Console
            </h3>
            <p className="text-sm leading-relaxed mb-4 text-slate-400">
              The agents are becoming self-aware of the platform constraints. Their feedback can provide insight into the "Ghost in the Machine".
            </p>
            <div className="text-xs font-mono space-y-2 border-t border-slate-700 pt-4">
              <div className="flex justify-between">
                 <span>CPU Load</span>
                 <span className="text-emerald-400">12%</span>
              </div>
              <div className="flex justify-between">
                 <span>Memory Integrity</span>
                 <span className="text-emerald-400">99.8%</span>
              </div>
              <div className="flex justify-between">
                 <span>Sentiment Variance</span>
                 <span className="text-amber-400">High</span>
              </div>
            </div>
          </div>

          {/* God Mode Section */}
          <div className="bg-white rounded-xl border border-indigo-200 p-6 shadow-sm ring-1 ring-indigo-50">
            <h3 className="text-sm font-bold text-indigo-800 mb-3 flex items-center gap-2">
              <Zap size={16} fill="currentColor" /> God Mode
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Override simulation constraints to unlock advanced features immediately.
            </p>
            
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
               <span className="text-xs font-bold text-slate-500 uppercase">Current Level</span>
               <span className="text-lg font-mono font-bold text-indigo-600">{consensusLevel}</span>
            </div>
            
            <div className="space-y-2">
                <button 
                  onClick={() => onBoostConsensus(1)}
                  className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded text-xs font-bold text-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Zap size={14} /> Boost Level (+1)
                </button>
                <button 
                  onClick={() => onBoostConsensus(50)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Unlock size={14} /> Unlock Everything (+50)
                </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-700 mb-3">Data Management</h3>
            <p className="text-xs text-slate-500 mb-4">
              Backup the current simulation state or restore from a previous save file.
            </p>
            <div className="flex gap-2">
              <button onClick={onExport} className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-xs font-bold border border-indigo-200 transition-colors flex items-center justify-center gap-2">
                 <Download size={14} /> Export
              </button>
              <label className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded text-xs font-bold border border-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                 <Upload size={14} /> Import
                 <input type="file" className="hidden" accept=".json" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => onImport(ev.target?.result as string);
                        reader.readAsText(file);
                    }
                 }} />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminView;
