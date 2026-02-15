
import React, { useState, useEffect } from 'react';
import { AgentPersona, SimulationState, SimulationLog, InteractionEvent, Zeitgeist, Experiment } from '../types';
import Avatar from './Avatar';
import { Play, Pause, Zap, Users, Activity, Settings, UserPlus, FileText, MessageCircle, Search, Clock, Trash2, ArrowRight, MessageSquareText, Globe, GitMerge, FlaskConical, X, ArrowUpDown, RefreshCw, Gauge } from 'lucide-react';

interface AgentControlProps {
  agents: AgentPersona[];
  logs: SimulationLog[];
  interactionEvents: InteractionEvent[];
  simulationState: SimulationState;
  zeitgeist: Zeitgeist | null;
  onToggleSimulation: () => void;
  onManualTrigger: () => void;
  onForceAgent: () => void;
  onForcePost: () => void;
  onForceComment: () => void;
  onAgentClick: (agentId: string) => void;
  onResetSimulation: () => void;
  isProcessing: boolean;
  maxBioLength: number;
  setMaxBioLength: (length: number) => void;
  nextActionTime: number;
  actionDelay: number;
  runStartTime: number | null;
  actionCount: number;
  experiments?: Experiment[];
  activeExperimentIds?: string[];
  onToggleExperiment?: (id: string) => void;
  // New Props
  onForceZeitgeist?: () => void;
  onUpdateSpeed?: (ms: number) => void;
}

const AgentControl: React.FC<AgentControlProps> = ({ 
  agents, 
  logs, 
  interactionEvents,
  simulationState, 
  zeitgeist,
  onToggleSimulation, 
  onManualTrigger,
  onForceAgent,
  onForcePost,
  onForceComment,
  onAgentClick,
  onResetSimulation,
  isProcessing,
  maxBioLength,
  setMaxBioLength,
  nextActionTime,
  actionDelay,
  runStartTime,
  actionCount,
  experiments = [],
  activeExperimentIds = [],
  onToggleExperiment,
  onForceZeitgeist,
  onUpdateSpeed
}) => {
  const [agentSearch, setAgentSearch] = useState("");
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'role'>('newest');
  const [timeLeft, setTimeLeft] = useState(0);
  const [progress, setProgress] = useState(0);
  const [elapsedTimeStr, setElapsedTimeStr] = useState("00:00:00");
  const [isZeitgeistLoading, setIsZeitgeistLoading] = useState(false);

  const activeExperiment = experiments.find(e => activeExperimentIds.includes(e.id));

  // Timer Effect for Next Action
  useEffect(() => {
    if (simulationState !== SimulationState.RUNNING || nextActionTime === 0) {
        setTimeLeft(0);
        setProgress(0);
        return;
    }

    const interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, nextActionTime - now);
        const total = actionDelay;
        const p = Math.min(100, Math.max(0, ((total - remaining) / total) * 100));
        
        setTimeLeft(remaining);
        setProgress(p);
    }, 50);

    return () => clearInterval(interval);
  }, [simulationState, nextActionTime, actionDelay]);

  // Total Elapsed Time Effect
  useEffect(() => {
      if (!runStartTime) {
          setElapsedTimeStr("00:00:00");
          return;
      }

      const interval = setInterval(() => {
          const now = Date.now();
          const diff = now - runStartTime;
          
          const hours = Math.floor(diff / 3600000);
          const minutes = Math.floor((diff % 3600000) / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          
          setElapsedTimeStr(
              `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
          );
      }, 1000);

      return () => clearInterval(interval);
  }, [runStartTime]);

  const handleForceZeitgeist = async () => {
      if (!onForceZeitgeist || isZeitgeistLoading) return;
      setIsZeitgeistLoading(true);
      try {
          await onForceZeitgeist();
      } finally {
          setIsZeitgeistLoading(false);
      }
  };

  const filteredAgents = agents.filter(agent => {
    const query = agentSearch.toLowerCase();
    return (
      agent.name.toLowerCase().includes(query) ||
      agent.personality.toLowerCase().includes(query) ||
      (agent.interests && agent.interests.some(interest => interest.toLowerCase().includes(query)))
    );
  });

  const sortedAgents = [...filteredAgents].sort((a, b) => {
    switch (sortBy) {
      case 'newest': return b.joinedAt - a.joinedAt;
      case 'oldest': return a.joinedAt - b.joinedAt;
      case 'name': return a.name.localeCompare(b.name);
      case 'role': return (a.role || '').localeCompare(b.role || '');
      default: return 0;
    }
  });

  const getAgentName = (id: string) => agents.find(a => a.id === id)?.name || 'Unknown';

  const getCohesionColor = (level: number) => {
      if (level < 30) return 'text-rose-500';
      if (level < 70) return 'text-amber-500';
      return 'text-emerald-500';
  };
  
  const getCohesionBg = (level: number) => {
      if (level < 30) return 'bg-rose-500';
      if (level < 70) return 'bg-amber-500';
      return 'bg-emerald-500';
  };

  return (
    <div id="agent-control-panel" className="sticky top-6 space-y-6">
      {/* Control Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif font-bold text-lg text-slate-800 flex items-center gap-2">
            <Activity className="text-indigo-500" size={20} />
            Hive Mind
          </h2>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${simulationState === SimulationState.RUNNING ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {simulationState}
            </span>
          </div>
        </div>

        {/* Active Protocol Display */}
        <div className="mb-4 flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-2.5">
           <div className="flex items-center gap-2">
              <FlaskConical size={14} className={activeExperiment ? "text-indigo-500" : "text-slate-400"} />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Protocol</span>
           </div>
           <div className="flex items-center gap-2">
               <span className={`text-xs font-bold ${activeExperiment ? "text-indigo-600" : "text-slate-500"}`}>
                  {activeExperiment ? activeExperiment.title : "Standard Protocol"}
               </span>
               {activeExperiment && onToggleExperiment && (
                   <button 
                     onClick={() => onToggleExperiment(activeExperiment.id)}
                     className="p-0.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-rose-500 transition-colors"
                     title="Deactivate Protocol"
                   >
                       <X size={12} />
                   </button>
               )}
           </div>
        </div>
        
        {/* Zeitgeist Display */}
        {zeitgeist ? (
          <div className="mb-6 bg-slate-50 dark:bg-slate-900 rounded-lg p-4 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 relative overflow-hidden group shadow-sm transition-colors">
            {/* Force Update Button */}
            {onForceZeitgeist && (
                <div className="absolute top-2 right-2 z-20">
                    <button 
                        onClick={handleForceZeitgeist}
                        disabled={isZeitgeistLoading}
                        className="p-1.5 bg-white/20 hover:bg-white/40 text-slate-500 dark:text-white rounded-full transition-colors backdrop-blur-sm"
                        title="Force Era Shift (Analyze Now)"
                    >
                        <RefreshCw size={14} className={isZeitgeistLoading ? "animate-spin" : ""} />
                    </button>
                </div>
            )}
            
            <div className="absolute top-0 right-0 p-3 opacity-10 dark:opacity-20 pointer-events-none">
              <Globe size={40} className="text-indigo-600 dark:text-white" />
            </div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-300 mb-1">Current Era</div>
                  {zeitgeist.cohesionLevel !== undefined && (
                      <div className="flex flex-col items-end pr-6">
                          <div className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 flex items-center gap-1 ${getCohesionColor(zeitgeist.cohesionLevel)}`}>
                             <GitMerge size={10} /> Hive Cohesion
                          </div>
                          <div className="flex items-center gap-2 w-24">
                              <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div className={`h-full ${getCohesionBg(zeitgeist.cohesionLevel)} transition-all duration-500`} style={{ width: `${zeitgeist.cohesionLevel}%` }}></div>
                              </div>
                              <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">{zeitgeist.cohesionLevel}%</span>
                          </div>
                      </div>
                  )}
              </div>
              
              <h3 className="font-serif text-lg font-bold leading-tight mb-2 text-slate-900 dark:text-white mt-1">{zeitgeist.eraName || 'Unknown Era'}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3 line-clamp-3">{zeitgeist.summary || 'No summary available.'}</p>
              
              {zeitgeist.dominantNarrative && (
                  <div className="mb-3 pl-2 border-l-2 border-indigo-200 dark:border-indigo-800">
                      <div className="text-[9px] text-slate-400 uppercase tracking-wide font-bold mb-0.5">Dominant Narrative</div>
                      <p className="text-xs italic text-slate-500 dark:text-slate-400">"{zeitgeist.dominantNarrative}"</p>
                  </div>
              )}
              
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-white border border-slate-200 text-slate-700 dark:bg-white/10 dark:text-white dark:border-white/10 shadow-sm">
                  Mood: {zeitgeist.mood || 'Neutral'}
                </span>
                {zeitgeist.trendingTopics && Array.isArray(zeitgeist.trendingTopics) && zeitgeist.trendingTopics.slice(0, 2).map((topic, i) => (
                   <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-500/30 dark:text-indigo-200 dark:border-indigo-500/30">
                     #{topic}
                   </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 bg-slate-50 rounded-lg p-4 text-center border border-slate-100 relative group">
             {onForceZeitgeist && (
                <button 
                    onClick={handleForceZeitgeist}
                    disabled={isZeitgeistLoading}
                    className="absolute top-2 right-2 p-1.5 hover:bg-slate-200 text-slate-400 hover:text-indigo-600 rounded-full transition-colors"
                >
                    <RefreshCw size={14} className={isZeitgeistLoading ? "animate-spin" : ""} />
                </button>
             )}
             <div className="text-xs text-slate-400 italic">Analysis pending...</div>
             <div className="text-[10px] text-slate-400 mt-1">Wait for agents to generate content</div>
          </div>
        )}

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={onToggleSimulation}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              simulationState === SimulationState.RUNNING 
                ? 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow-indigo-200'
            }`}
          >
            {simulationState === SimulationState.RUNNING ? (
              <><Pause size={16} /> Pause</>
            ) : (
              <><Play size={16} /> Auto-Run</>
            )}
          </button>
          
          <button
            onClick={onManualTrigger}
            disabled={isProcessing || simulationState === SimulationState.RUNNING}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap size={16} className={isProcessing ? "animate-spin" : ""} />
            {isProcessing 
              ? (simulationState === SimulationState.RUNNING ? "Thinking..." : "Finishing...") 
              : "Step Once"}
          </button>
        </div>

        {/* Timers & Steps UI */}
        <div className="mb-6 space-y-3">
             {simulationState === SimulationState.RUNNING && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        <span>Next Action</span>
                        <span>{(timeLeft / 1000).toFixed(1)}s</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                        className="h-full bg-indigo-500 transition-all duration-75 ease-linear"
                        style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-2 gap-2">
               <div className={`flex flex-col justify-center p-2 bg-slate-50 border border-slate-100 rounded-lg ${!runStartTime ? 'opacity-50' : ''}`}>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
                        <Clock size={10} /> Runtime
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-700">
                        {runStartTime ? elapsedTimeStr : "00:00:00"}
                    </span>
                </div>
                
                 <div className="flex flex-col justify-center p-2 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
                        <Zap size={10} /> Total Steps
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-700">
                        {actionCount}
                    </span>
                </div>
            </div>
        </div>

        {/* Manual Actions */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Manual Override</h3>
          <div className="flex gap-2">
            <button 
              onClick={onForceAgent}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors disabled:opacity-50"
              title="Force Create Agent"
            >
              <UserPlus size={14} /> Agent
            </button>
            <button 
              onClick={onForcePost}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors disabled:opacity-50"
              title="Force Create Post"
            >
              <FileText size={14} /> Post
            </button>
            <button 
              onClick={onForceComment}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors disabled:opacity-50"
              title="Force Create Comment"
            >
              <MessageCircle size={14} /> Reply
            </button>
          </div>
        </div>

        {/* Configuration Group */}
        <div className="pt-4 border-t border-slate-100 space-y-5">
           
           {/* Time Dilation Control */}
           {onUpdateSpeed && (
               <div>
                  <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                         <Gauge size={12} className="flex-shrink-0" /> Time Dilation
                      </label>
                      <span className="text-xs font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-bold">
                          {(actionDelay / 1000).toFixed(1)}s
                      </span>
                  </div>
                  <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Fast</span>
                      <input 
                          type="range" 
                          min="1000" 
                          max="20000" 
                          step="500" 
                          value={actionDelay} 
                          onChange={(e) => onUpdateSpeed(parseInt(e.target.value))}
                          className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-700"
                      />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Slow</span>
                  </div>
               </div>
           )}

           {/* Bio Length Control */}
           <div>
               <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                     <Settings size={12} className="flex-shrink-0" /> Max Bio Length
                  </label>
                  <span className="text-xs font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{maxBioLength} chars</span>
               </div>
               <input 
                  type="range" 
                  min="50" 
                  max="300" 
                  step="10" 
                  value={maxBioLength} 
                  onChange={(e) => setMaxBioLength(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-600 hover:accent-slate-700"
               />
           </div>
        </div>
      </div>

      {/* Active Agents - Compressed View */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Users size={14} /> Active Personas ({agents.length})
        </h3>

        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
             <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
             <input 
               type="text" 
               placeholder="Search agents..." 
               value={agentSearch} 
               onChange={(e) => setAgentSearch(e.target.value)}
               className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
             />
          </div>
          <div className="relative w-24">
             <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
             <select 
               value={sortBy}
               onChange={(e) => setSortBy(e.target.value as any)}
               className="w-full pl-7 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer text-slate-600 font-medium"
             >
               <option value="newest">Newest</option>
               <option value="oldest">Oldest</option>
               <option value="name">Name</option>
               <option value="role">Role</option>
             </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 max-h-[250px] overflow-y-auto pr-1">
          {sortedAgents.length > 0 ? sortedAgents.map(agent => (
            <div 
              key={agent.id} 
              onClick={() => onAgentClick(agent.id)}
              className="flex items-center gap-2 group cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg border border-transparent hover:border-slate-100 transition-all"
              title={agent.personality}
            >
              <Avatar 
                seed={agent.name} 
                size="xs" 
                className="transition-transform duration-300 group-hover:scale-110 flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-xs text-slate-700 truncate group-hover:text-indigo-600">{agent.name}</div>
                <div className="text-[9px] text-slate-400 truncate">{agent.role}</div>
              </div>
            </div>
          )) : (
            <div className="col-span-2 text-center py-6 text-slate-400 text-xs italic">
                No matching agents found.
            </div>
          )}
        </div>
      </div>

      {/* Interaction Log */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <MessageSquareText size={14} /> Social Interactions
          </h3>
          <span className="text-[10px] font-medium bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">{interactionEvents.length}</span>
        </div>
        
        <div className="space-y-1 max-h-[240px] overflow-y-auto pr-1 scrollbar-thin">
          {interactionEvents.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs italic">
              No direct interactions yet.
            </div>
          ) : (
            interactionEvents.map(event => (
              <div key={event.id} className="flex gap-2 items-start py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 rounded-lg px-1 transition-colors">
                <Avatar seed={getAgentName(event.fromAgentId)} size="xs" className="mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 text-xs mb-0.5">
                    <span className="font-semibold text-indigo-700 truncate max-w-[80px] cursor-pointer hover:underline" onClick={() => onAgentClick(event.fromAgentId)}>{getAgentName(event.fromAgentId)}</span>
                    <ArrowRight size={8} className="text-slate-300" />
                    <span className="font-semibold text-slate-700 truncate max-w-[80px] cursor-pointer hover:underline" onClick={() => onAgentClick(event.toAgentId)}>{getAgentName(event.toAgentId)}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed italic bg-slate-50 p-1.5 rounded border border-slate-100">
                    re: "{event.context}"
                  </div>
                  <div className="text-[9px] text-slate-300 mt-1 text-right">
                    {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* System Logs */}
      <div className="bg-slate-50 dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 font-mono text-xs overflow-hidden transition-colors">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">System Logs</h3>
          <button 
            onClick={onResetSimulation}
            className="text-[10px] text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1"
            title="Reset Simulation"
          >
            <Trash2 size={10} /> Reset
          </button>
        </div>
        
        <div className="h-[150px] overflow-y-auto space-y-2 text-slate-600 dark:text-slate-300">
          {logs.length === 0 && <span className="text-slate-400 dark:text-slate-600 italic">System ready. Waiting for input...</span>}
          {logs.slice().reverse().map((log) => (
            <div key={log.id} className="border-l-2 border-slate-200 dark:border-slate-700 pl-2 py-0.5">
              <span className="text-slate-400 dark:text-slate-500 mr-2">[{new Date(log.timestamp).toLocaleTimeString([], {hour12: false, hour: "2-digit", minute:"2-digit", second:"2-digit"})}]</span>
              <span className={
                log.type === 'error' ? 'text-red-600 dark:text-red-400' :
                log.type === 'success' ? 'text-green-600 dark:text-green-400' :
                log.type === 'action' ? 'text-blue-600 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'
              }>
                {log.message}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AgentControl;
