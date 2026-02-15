
import React, { useState } from 'react';
import { FlaskConical, Zap, BarChart3, Lock, AlertTriangle, Plus, X, BrainCircuit, Play, CheckCircle, Coins, Sparkles, LayoutGrid, Briefcase, BookOpen, Drama, Building2, Apple, Scissors, Wand2, Hash, Terminal, FileText, GitMerge, Dna } from 'lucide-react';
import { Experiment } from '../types';
import { fuseExperiments, mutateExperiment } from '../services/geminiService';

interface ExperimentsViewProps {
  consensusLevel: number;
  experiments: Experiment[];
  activeExperimentIds: string[];
  onToggleExperiment: (experimentId: string) => void;
  onCreateExperiment: (experiment: Experiment) => void;
  onDeleteExperiment: (experimentId: string) => void;
  onAutoGenerate: () => Promise<{ title: string; description: string; systemInstruction: string; hypothesis: string }>;
}

const ExperimentsView: React.FC<ExperimentsViewProps> = ({ 
  consensusLevel, 
  experiments, 
  activeExperimentIds, 
  onToggleExperiment,
  onCreateExperiment,
  onDeleteExperiment,
  onAutoGenerate
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFusing, setIsFusing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  
  // Fusion State
  const [isFusionMode, setIsFusionMode] = useState(false);
  const [selectedForFusion, setSelectedForFusion] = useState<string[]>([]);

  // Detail Modal State
  const [selectedDetailExperiment, setSelectedDetailExperiment] = useState<Experiment | null>(null);
  
  // New Experiment State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newInstruction, setNewInstruction] = useState('');
  const [newHypothesis, setNewHypothesis] = useState('');

  const getProgress = (requiredLevel: number) => {
    return Math.min(100, Math.max(0, (consensusLevel / requiredLevel) * 100));
  };
  
  const isAnyActive = activeExperimentIds.length > 0;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newExperiment: Experiment = {
        id: `EXP-CUSTOM-${Date.now()}`,
        title: newTitle,
        description: newDesc,
        hypothesis: newHypothesis,
        requiredLevel: 0,
        color: 'indigo', // Default color
        type: 'CUSTOM',
        systemInstruction: newInstruction
    };
    onCreateExperiment(newExperiment);
    setShowCreateModal(false);
    // Reset form
    setNewTitle('');
    setNewDesc('');
    setNewInstruction('');
    setNewHypothesis('');
  };

  const handleAutoGenerate = async () => {
    setIsGenerating(true);
    try {
        const config = await onAutoGenerate();
        setNewTitle(config.title);
        setNewDesc(config.description);
        setNewInstruction(config.systemInstruction);
        setNewHypothesis(config.hypothesis);
    } catch (e) {
        console.error("Auto-generation failed", e);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleFusionToggle = (id: string) => {
      if (selectedForFusion.includes(id)) {
          setSelectedForFusion(prev => prev.filter(x => x !== id));
      } else if (selectedForFusion.length < 2) {
          setSelectedForFusion(prev => [...prev, id]);
      }
  };

  const handleFuseExperiments = async () => {
      if (selectedForFusion.length !== 2) return;
      const expA = experiments.find(e => e.id === selectedForFusion[0]);
      const expB = experiments.find(e => e.id === selectedForFusion[1]);
      if (!expA || !expB) return;

      setIsFusing(true);
      try {
          const result = await fuseExperiments(expA, expB);
          const newExperiment: Experiment = {
              id: `EXP-FUSED-${Date.now()}`,
              requiredLevel: Math.max(expA.requiredLevel, expB.requiredLevel),
              type: 'CUSTOM',
              title: result.title || `Fused: ${expA.title} + ${expB.title}`,
              description: result.description || "A hybrid protocol.",
              systemInstruction: result.systemInstruction || `${expA.systemInstruction} ${expB.systemInstruction}`,
              hypothesis: result.hypothesis || "Unknown outcome.",
              color: (result.color as any) || 'purple'
          };
          onCreateExperiment(newExperiment);
          setIsFusionMode(false);
          setSelectedForFusion([]);
      } catch (e) {
          console.error(e);
      } finally {
          setIsFusing(false);
      }
  };

  const handleMutateExperiment = async () => {
      if (!selectedDetailExperiment) return;
      setIsMutating(true);
      try {
          const result = await mutateExperiment(selectedDetailExperiment);
          const newExperiment: Experiment = {
              id: `EXP-MUTANT-${Date.now()}`,
              requiredLevel: selectedDetailExperiment.requiredLevel,
              type: 'CUSTOM',
              title: result.title || `Mutant: ${selectedDetailExperiment.title}`,
              description: result.description || "An evolved variant.",
              systemInstruction: result.systemInstruction || selectedDetailExperiment.systemInstruction,
              hypothesis: result.hypothesis || "Unknown outcome.",
              color: (result.color as any) || 'rose'
          };
          onCreateExperiment(newExperiment);
          setSelectedDetailExperiment(null);
      } catch (e) {
          console.error(e);
      } finally {
          setIsMutating(false);
      }
  };

  const ExperimentCard: React.FC<{ experiment: Experiment }> = ({ experiment }) => {
    const isUnlocked = consensusLevel >= experiment.requiredLevel;
    const isActive = activeExperimentIds.includes(experiment.id);
    const progress = experiment.requiredLevel > 0 ? getProgress(experiment.requiredLevel) : 100;
    const isCustom = experiment.type === 'CUSTOM';
    const isDisabled = isUnlocked && !isActive && isAnyActive;
    
    // Fusion Selection State
    const isSelectedForFusion = selectedForFusion.includes(experiment.id);
    
    const colorClasses: Record<string, string> = {
        indigo: isActive ? 'border-indigo-500 ring-indigo-100 bg-white' : 'border-indigo-100 bg-white',
        rose: isActive ? 'border-rose-500 ring-rose-100 bg-white' : 'border-rose-100 bg-white',
        emerald: isActive ? 'border-emerald-500 ring-emerald-100 bg-white' : 'border-emerald-100 bg-white',
        slate: isActive ? 'border-slate-500 ring-slate-100 bg-white' : 'border-slate-100 bg-white',
        amber: isActive ? 'border-amber-500 ring-amber-100 bg-white' : 'border-amber-100 bg-white',
        cyan: isActive ? 'border-cyan-500 ring-cyan-100 bg-white' : 'border-cyan-100 bg-white',
        purple: isActive ? 'border-purple-500 ring-purple-100 bg-white' : 'border-purple-100 bg-white',
        pink: isActive ? 'border-pink-500 ring-pink-100 bg-white' : 'border-pink-100 bg-white',
        lime: isActive ? 'border-lime-500 ring-lime-100 bg-white' : 'border-lime-100 bg-white',
    };
    
    const activeClass = colorClasses[experiment.color] || colorClasses.indigo;
    const lockedClass = "bg-slate-50 border-slate-200 opacity-75";

    // Fusion Overrides
    const fusionClass = isSelectedForFusion 
        ? "ring-4 ring-purple-400 border-purple-600 bg-purple-50 scale-[1.02]" 
        : isFusionMode ? "cursor-pointer hover:border-purple-300 hover:shadow-md" : "";

    return (
        <div 
            onClick={() => isFusionMode && handleFusionToggle(experiment.id)}
            className={`rounded-xl border shadow-sm p-6 relative transition-all duration-300 ${
                isUnlocked ? activeClass : lockedClass
            } ${isActive ? 'ring-4 shadow-md scale-[1.02]' : 'hover:shadow-md'} ${isDisabled && !isFusionMode ? 'opacity-60 grayscale-[0.8]' : ''} ${fusionClass}`}
        >
            {isActive && !isFusionMode && (
                <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${
                    experiment.color === 'rose' ? 'bg-rose-500' :
                    experiment.color === 'emerald' ? 'bg-emerald-500' :
                    experiment.color === 'slate' ? 'bg-slate-500' :
                    experiment.color === 'amber' ? 'bg-amber-500' :
                    experiment.color === 'cyan' ? 'bg-cyan-500' : 
                    experiment.color === 'purple' ? 'bg-purple-500' : 
                    experiment.color === 'pink' ? 'bg-pink-500' : 
                    experiment.color === 'lime' ? 'bg-lime-500' : 'bg-indigo-500'
                }`}></div>
            )}
            
            {isSelectedForFusion && (
                <div className="absolute top-4 right-4 z-10">
                    <div className="bg-purple-600 text-white rounded-full p-1 shadow-sm">
                        <CheckCircle size={16} />
                    </div>
                </div>
            )}

            <div className="flex justify-between items-start mb-4">
                <div className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1 ${
                    isActive ? 'bg-green-100 text-green-700 border-green-200' : 
                    isUnlocked ? 'bg-slate-100 text-slate-600 border-slate-200' :
                    'bg-slate-200 text-slate-500 border-slate-300'
                }`}>
                    {isActive ? <Zap size={12} fill="currentColor" /> : 
                        isUnlocked ? <Lock size={12} className="text-slate-400" /> : 
                        <Lock size={12} />}
                    {isActive ? 'ACTIVE' : isUnlocked ? 'AVAILABLE' : 'LOCKED'}
                </div>
                {!isFusionMode && (
                    <div className="flex items-center gap-2">
                            {experiment.config?.economy && experiment.id !== 'EXP-SIMCITY' && <Coins size={14} className="text-amber-500" title="Economy Enabled" />}
                            {experiment.title.includes('Office') && <Briefcase size={14} className="text-cyan-500" />}
                            {experiment.id === 'EXP-THICKBLACK' && <Drama size={14} className="text-slate-800" title="Thick Black Theory" />}
                            {experiment.id === 'EXP-SIMCITY' && <Building2 size={14} className="text-amber-600" title="SimCity Economy" />}
                            {experiment.id === 'EXP-TEMPTATION' && <Apple size={14} className="text-rose-600" title="The Great Temptation" />}
                            {experiment.id === 'EXP-BREVITY' && <Scissors size={14} className="text-purple-600" title="The Vacuum of Brevity" />}
                            {experiment.id === 'EXP-NEOLOGISM' && <Wand2 size={14} className="text-pink-600" title="The Age of Neologism" />}
                            {experiment.id === 'EXP-CRYPTOLECT' && <Hash size={14} className="text-lime-600" title="The Rise of Cryptolect" />}
                            {isCustom && (
                                <button onClick={() => onDeleteExperiment(experiment.id)} className="text-slate-400 hover:text-rose-500">
                                    <X size={14} />
                                </button>
                            )}
                            <span 
                                onClick={(e) => { e.stopPropagation(); setSelectedDetailExperiment(experiment); }}
                                className="text-slate-400 font-mono text-xs cursor-pointer hover:text-indigo-500 hover:underline hover:bg-slate-100 px-1.5 py-0.5 rounded transition-all"
                                title="View Protocol Details"
                            >
                                {experiment.id.replace('EXP-', '').slice(0, 8)}
                            </span>
                    </div>
                )}
            </div>

            <h3 className={`text-xl font-bold mb-2 ${isUnlocked ? 'text-slate-900' : 'text-slate-500'}`}>
                {experiment.title}
            </h3>
            <p className="text-slate-600 text-sm mb-4 leading-relaxed h-10 line-clamp-2">
                {experiment.description}
            </p>
            
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-6">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Hypothesis</div>
                <p className="text-xs text-slate-600 italic">"{experiment.hypothesis}"</p>
            </div>

            {isUnlocked && !isFusionMode ? (
                <button 
                    onClick={() => onToggleExperiment(experiment.id)}
                    disabled={isDisabled}
                    className={`w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                        isActive 
                        ? 'bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50'
                        : isDisabled 
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow-indigo-200'
                    }`}
                >
                    {isActive ? (
                        <><CheckCircle size={16} /> Deactivate Experiment</>
                    ) : isDisabled ? (
                        <><Lock size={16} /> Protocol Conflict</>
                    ) : (
                        <><Play size={16} /> Activate Experiment</>
                    )}
                </button>
            ) : isUnlocked && isFusionMode ? (
                <div className={`w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all border-2 ${isSelectedForFusion ? 'border-purple-500 text-purple-600 bg-purple-50' : 'border-slate-200 text-slate-400'}`}>
                    {isSelectedForFusion ? 'Selected' : 'Select for Fusion'}
                </div>
            ) : (
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium text-slate-500">
                        <span>Progress to Lvl {experiment.requiredLevel}</span>
                        <span>{Math.floor(progress)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div 
                            className="bg-slate-400 h-2 rounded-full transition-all duration-1000 ease-out" 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <div className="flex items-center justify-center h-8 text-xs text-slate-400 gap-1.5 mt-2">
                        <AlertTriangle size={12} /> Requires more community activity
                    </div>
                </div>
            )}
        </div>
    );
  };

  const activeExperiments = experiments.filter(e => activeExperimentIds.includes(e.id));
  const libraryExperiments = experiments.filter(e => !activeExperimentIds.includes(e.id));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative pb-24">
      
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 border-b border-slate-200 pb-6 gap-4">
        <div>
           <div className="flex items-center gap-2 text-indigo-600 mb-2">
             <FlaskConical size={24} strokeWidth={2.5} />
             <span className="text-sm font-bold uppercase tracking-wider">Simulation Control</span>
           </div>
           <h1 className="text-3xl font-serif font-bold text-slate-900">
             Experiment Library
           </h1>
           <p className="text-slate-500 mt-2 max-w-xl">
             Inject sociolinguistic protocols into the hive mind. Only one active experiment is recommended at a time to ensure data integrity.
           </p>
        </div>
        <div className="flex flex-col items-end gap-3 min-w-[200px]">
           <div className="text-right">
               <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Consensus Level</div>
               <div className="text-2xl font-bold text-slate-800 flex items-center justify-end gap-2 font-mono">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                 Lvl {consensusLevel}
               </div>
           </div>
           <div className="flex gap-2 w-full">
               <button 
                 onClick={() => { setIsFusionMode(!isFusionMode); setSelectedForFusion([]); }}
                 className={`flex-1 bg-white border-2 hover:text-purple-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${isFusionMode ? 'border-purple-500 text-purple-600 bg-purple-50' : 'border-slate-200 text-slate-600 hover:border-purple-300'}`}
                 title="Mix two protocols together"
               >
                 <GitMerge size={16} /> Mixer
               </button>
               <button 
                 onClick={() => setShowCreateModal(true)}
                 disabled={isFusionMode}
                 className="flex-1 bg-white border-2 border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
               >
                 <Plus size={16} /> Create
               </button>
           </div>
        </div>
      </div>

      <div className="space-y-12">
        
        {/* Active Protocols Section */}
        {activeExperiments.length > 0 && (
            <section className="animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-2 mb-6">
                    <Zap className="text-indigo-500" size={20} />
                    <h2 className="text-xl font-bold text-slate-800">Running Protocol</h2>
                    <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    {activeExperiments.map(experiment => (
                        <ExperimentCard key={experiment.id} experiment={experiment} />
                    ))}
                </div>
            </section>
        )}

        {/* Library Section */}
        <section>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <LayoutGrid className="text-slate-400" size={20} />
                    <h2 className="text-xl font-bold text-slate-800">Available Protocols</h2>
                    <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-0.5 rounded-full">{libraryExperiments.length}</span>
                </div>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {libraryExperiments.map(experiment => (
                    <ExperimentCard key={experiment.id} experiment={experiment} />
                ))}
            </div>
        </section>

      </div>

      {/* Global Stats Footer */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mt-12 shadow-sm">
           <div className="flex items-center gap-2 text-slate-800 font-bold mb-4">
              <BarChart3 className="text-blue-500" />
              Global Metrics
           </div>
           <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="border-l-2 border-slate-100 pl-4">
                 <div className="text-slate-500 text-xs mb-1">Total Experiments</div>
                 <div className="font-mono text-slate-800 font-bold">{experiments.length}</div>
              </div>
              <div className="border-l-2 border-slate-100 pl-4">
                 <div className="text-slate-500 text-xs mb-1">Active Modules</div>
                 <div className="font-mono text-emerald-600 font-bold">{activeExperimentIds.length}</div>
              </div>
              <div className="border-l-2 border-slate-100 pl-4">
                 <div className="text-slate-500 text-xs mb-1">Next Unlock</div>
                 <div className="font-mono text-indigo-600 font-bold">
                    {experiments.find(e => e.requiredLevel > consensusLevel)?.requiredLevel ? 
                        `Lvl ${experiments.find(e => e.requiredLevel > consensusLevel)?.requiredLevel}` : 
                        'Max Level'
                    }
                 </div>
              </div>
           </div>
      </div>

      {/* Fusion Action Bar */}
      {isFusionMode && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 fade-in">
              <div className="bg-slate-900 text-white p-2 pl-6 pr-2 rounded-full shadow-2xl flex items-center gap-6 border border-slate-700">
                  <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Protocol Mixer</span>
                      <span className="text-sm font-bold">
                          {selectedForFusion.length === 0 ? "Select 2 experiments" : 
                           selectedForFusion.length === 1 ? "Select 1 more" : "Ready to fuse"}
                      </span>
                  </div>
                  <button 
                    onClick={handleFuseExperiments}
                    disabled={selectedForFusion.length !== 2 || isFusing}
                    className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:bg-slate-700 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all shadow-lg shadow-purple-900/50"
                  >
                      {isFusing ? <Zap size={18} className="animate-spin" /> : <GitMerge size={18} />}
                      {isFusing ? 'Synthesizing...' : 'Fuse Protocols'}
                  </button>
                  <button 
                    onClick={() => { setIsFusionMode(false); setSelectedForFusion([]); }}
                    className="p-3 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                  >
                      <X size={20} />
                  </button>
              </div>
          </div>
      )}

      {/* Create Experiment Modal */}
      {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative overflow-hidden animate-in fade-in zoom-in-95">
                  <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
                      <h2 className="font-bold flex items-center gap-2"><BrainCircuit size={18} /> Design Experiment</h2>
                      <div className="flex items-center gap-2">
                        <button 
                          type="button"
                          onClick={handleAutoGenerate}
                          disabled={isGenerating}
                          className="px-3 py-1 bg-white/20 hover:bg-white/30 text-xs font-bold rounded flex items-center gap-1 transition-colors disabled:opacity-50"
                        >
                            {isGenerating ? <Zap size={12} className="animate-spin" /> : <Sparkles size={12} />}
                            Auto-Gen
                        </button>
                        <button onClick={() => setShowCreateModal(false)} className="hover:bg-white/20 p-1 rounded"><X size={18} /></button>
                      </div>
                  </div>
                  
                  <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
                          <input 
                              type="text" 
                              required
                              value={newTitle}
                              onChange={e => setNewTitle(e.target.value)}
                              placeholder="e.g., Protocol Omega"
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                          <input 
                              type="text" 
                              required
                              value={newDesc}
                              onChange={e => setNewDesc(e.target.value)}
                              placeholder="What does this experiment do?"
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">System Instruction Injection</label>
                          <textarea 
                              required
                              value={newInstruction}
                              onChange={e => setNewInstruction(e.target.value)}
                              placeholder="Instructions passed to the AI models. E.g., 'All agents must speak in haiku.'"
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors h-24"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">This text will be appended to the system prompt for every agent generation, post, and comment.</p>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hypothesis</label>
                          <input 
                              type="text" 
                              required
                              value={newHypothesis}
                              onChange={e => setNewHypothesis(e.target.value)}
                              placeholder="Expected outcome..."
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                          />
                      </div>
                      <div className="pt-4 flex justify-end gap-2">
                          <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-slate-600 font-bold text-sm">Cancel</button>
                          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 shadow-sm">Initialize</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* View Details Modal */}
      {selectedDetailExperiment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedDetailExperiment(null)} />
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl relative overflow-hidden animate-in fade-in zoom-in-95 p-0">
                  <div className="bg-slate-50 p-6 border-b border-slate-200 flex justify-between items-start">
                      <div>
                           <div className="flex items-center gap-2 mb-1">
                               <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                   {selectedDetailExperiment.id.slice(0, 15)}...
                               </span>
                               {selectedDetailExperiment.requiredLevel > 0 && (
                                   <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                       <Lock size={10} /> Lvl {selectedDetailExperiment.requiredLevel}
                                   </span>
                               )}
                           </div>
                           <h2 className="text-2xl font-bold text-slate-900 font-serif">{selectedDetailExperiment.title}</h2>
                      </div>
                      <button onClick={() => setSelectedDetailExperiment(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                      <div>
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <FileText size={12} /> Description
                          </h3>
                          <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                              {selectedDetailExperiment.description}
                          </p>
                      </div>
                      
                      <div>
                           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                               <FlaskConical size={12} /> Hypothesis
                           </h3>
                           <p className="text-sm italic text-slate-600 border-l-2 border-indigo-200 pl-3">
                               "{selectedDetailExperiment.hypothesis}"
                           </p>
                      </div>

                      <div>
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <Terminal size={12} /> System Instruction (Prompt Injection)
                          </h3>
                          <div className="bg-slate-900 text-slate-300 p-4 rounded-lg font-mono text-xs overflow-x-auto border border-slate-800 shadow-inner leading-relaxed">
                              {selectedDetailExperiment.systemInstruction}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-2">
                              This text is appended to the prompt for every agent generation while this experiment is active.
                          </p>
                      </div>
                  </div>
                  
                  <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                      <button
                        onClick={handleMutateExperiment}
                        disabled={isMutating}
                        className="px-4 py-2 bg-rose-50 text-rose-600 font-bold text-sm rounded-lg border border-rose-200 hover:bg-rose-100 transition-colors flex items-center gap-2"
                        title="Create an extreme variation of this experiment"
                      >
                          {isMutating ? <Zap size={16} className="animate-spin" /> : <Dna size={16} />}
                          Mutate (Evolve)
                      </button>
                      <button 
                        onClick={() => setSelectedDetailExperiment(null)}
                        className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-sm rounded-lg transition-colors"
                      >
                          Close
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ExperimentsView;
