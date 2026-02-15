
import React, { useState } from 'react';
import { Report, AgentPersona, Post, Comment, Experiment, Zeitgeist } from '../types';
import { generateAnalysisReport, queryArchive, compareAgents } from '../services/geminiService';
import { Library, Plus, FileText, Calendar, ChevronRight, Loader2, Microscope, Bookmark, X, Download, Search, MessageSquare, Users, GitCompare, ArrowRight, Zap } from 'lucide-react';
import { jsPDF } from 'jspdf';
import Avatar from './Avatar';

interface ReportLibraryViewProps {
  reports: Report[];
  onGenerateReport: (report: Report) => void;
  onDeleteReport: (id: string) => void;
  agents: AgentPersona[];
  posts: Post[];
  comments: Comment[];
  activeExperiments: Experiment[];
  zeitgeist: Zeitgeist | null;
  language: string;
}

const ReportLibraryView: React.FC<ReportLibraryViewProps> = ({ 
  reports, 
  onGenerateReport, 
  onDeleteReport,
  agents,
  posts,
  comments,
  activeExperiments,
  zeitgeist,
  language
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [activeTab, setActiveTab] = useState<'ARCHIVE' | 'TOOLS'>('ARCHIVE');

  // Archive Query State
  const [query, setQuery] = useState('');
  const [queryResult, setQueryResult] = useState<string | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);

  // Comparison State
  const [compAgentA, setCompAgentA] = useState<string>('');
  const [compAgentB, setCompAgentB] = useState<string>('');
  const [compResult, setCompResult] = useState<{ synergyScore: number; analysis: string; relationshipLabel: string } | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
        const data = await generateAnalysisReport(agents, posts, comments, activeExperiments, zeitgeist, language);
        const newReport: Report = {
            id: `REP-${Date.now()}`,
            date: Date.now(),
            ...data
        };
        onGenerateReport(newReport);
        setSelectedReport(newReport);
    } catch (e) {
        console.error("Failed to generate report", e);
        alert("Failed to generate report. Please try again.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleQueryArchive = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!query.trim()) return;
      setIsQuerying(true);
      try {
          const result = await queryArchive(query, reports, zeitgeist, language);
          setQueryResult(result);
      } catch (e) {
          setQueryResult("Archive unreachable.");
      } finally {
          setIsQuerying(false);
      }
  };

  const handleCompare = async () => {
      if (!compAgentA || !compAgentB || compAgentA === compAgentB) return;
      const agentA = agents.find(a => a.id === compAgentA);
      const agentB = agents.find(a => a.id === compAgentB);
      if (!agentA || !agentB) return;

      setIsComparing(true);
      try {
          const result = await compareAgents(agentA, agentB, posts, language);
          setCompResult(result);
      } catch (e) {
          console.error(e);
      } finally {
          setIsComparing(false);
      }
  };

  const handleDownloadPDF = () => {
    if (!selectedReport) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxLineWidth = pageWidth - margin * 2;
    let yPos = 20;

    // Helper for checking page bounds
    const checkPageBreak = (heightNeeded: number) => {
        if (yPos + heightNeeded > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            yPos = 20;
        }
    };

    // --- Header ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); // Indigo 600
    doc.text("Gembook Research Analysis", margin, yPos);
    yPos += 10;

    // --- Metadata ---
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Report ID: ${selectedReport.id}`, margin, yPos);
    yPos += 5;
    doc.text(`Date: ${new Date(selectedReport.date).toLocaleString()}`, margin, yPos);
    yPos += 5;
    doc.text(`Type: ${selectedReport.type.replace('_', ' ')}`, margin, yPos);
    yPos += 15;

    // --- Separator ---
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.line(margin, yPos - 5, pageWidth - margin, yPos - 5);
    
    // --- Title ---
    doc.setFont("times", "bold");
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42); // Slate 900
    const titleLines = doc.splitTextToSize(selectedReport.title, maxLineWidth);
    doc.text(titleLines, margin, yPos);
    yPos += (titleLines.length * 8) + 10;

    // --- Executive Summary ---
    checkPageBreak(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(79, 70, 229);
    doc.text("EXECUTIVE SUMMARY", margin, yPos);
    yPos += 8;

    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85); // Slate 700
    
    // Clean markdown bolding for PDF
    const cleanContent = selectedReport.content.replace(/\*\*/g, '');
    const contentLines = doc.splitTextToSize(cleanContent, maxLineWidth);
    
    // Print content lines with page break checking
    contentLines.forEach((line: string) => {
        checkPageBreak(6);
        doc.text(line, margin, yPos);
        yPos += 6;
    });
    
    yPos += 10;

    // --- Key Findings ---
    checkPageBreak(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(79, 70, 229);
    doc.text("KEY FINDINGS", margin, yPos);
    yPos += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);

    selectedReport.keyFindings.forEach((finding) => {
        const bullet = "•";
        const cleanFinding = finding.replace(/\*\*/g, '');
        const findingLines = doc.splitTextToSize(cleanFinding, maxLineWidth - 5);
        
        checkPageBreak(findingLines.length * 6 + 4);
        
        doc.text(bullet, margin, yPos);
        findingLines.forEach((line: string, i: number) => {
            doc.text(line, margin + 5, yPos + (i * 6));
        });
        yPos += (findingLines.length * 6) + 4;
    });

    // --- Footer ---
    const pageCount = doc.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount} • Generated by Gembook AI Hive Mind`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    doc.save(`${selectedReport.title.slice(0, 30).replace(/\s+/g, '_')}_Report.pdf`);
  };

  const getTypeColor = (type: string) => {
      switch(type) {
          case 'EXPERIMENT_CONCLUSION': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
          case 'ANOMALY_DETECTED': return 'bg-rose-100 text-rose-700 border-rose-200';
          default: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 border-b border-slate-200 pb-6 gap-4">
        <div>
           <h1 className="text-3xl font-serif font-bold text-slate-900 flex items-center gap-3">
             <Library className="text-indigo-500" strokeWidth={2.5} />
             Research Library
           </h1>
           <p className="text-slate-500 mt-2">
             Archived analysis of swarm behavior and experimental outcomes.
           </p>
        </div>
        <div className="flex gap-2">
             <button
               onClick={() => setActiveTab('ARCHIVE')}
               className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'ARCHIVE' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
             >
                 Reports
             </button>
             <button
               onClick={() => setActiveTab('TOOLS')}
               className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'TOOLS' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
             >
                 Deep Analysis
             </button>
        </div>
      </div>

      {activeTab === 'ARCHIVE' ? (
        <div className="grid lg:grid-cols-12 gap-8">
            
            {/* List Column */}
            <div className="lg:col-span-4 space-y-4">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Bookmark size={14} /> Archived Reports
                    </h3>
                    <button 
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                        New Report
                    </button>
                </div>
                
                <div className="space-y-3">
                    {reports.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 text-sm">
                            No reports generated yet.
                        </div>
                    ) : (
                        reports.slice().reverse().map(report => (
                            <div 
                                key={report.id}
                                onClick={() => setSelectedReport(report)}
                                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                    selectedReport?.id === report.id 
                                    ? 'bg-white border-indigo-500 ring-1 ring-indigo-500 shadow-md' 
                                    : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getTypeColor(report.type)}`}>
                                        {report.type.replace('_', ' ')}
                                    </span>
                                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                        <Calendar size={10} />
                                        {new Date(report.date).toLocaleDateString()}
                                    </span>
                                </div>
                                <h4 className="font-bold text-slate-800 text-sm leading-tight mb-1 line-clamp-2">
                                    {report.title}
                                </h4>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Preview Column */}
            <div className="lg:col-span-8">
                {selectedReport ? (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getTypeColor(selectedReport.type)}`}>
                                    <FileText size={12} /> {selectedReport.type.replace('_', ' ')}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={handleDownloadPDF}
                                        className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded text-xs font-bold transition-colors"
                                        title="Download PDF"
                                    >
                                        <Download size={14} /> Download
                                    </button>
                                    <span className="text-xs font-mono text-slate-400 border-l border-slate-200 pl-2 ml-2">{selectedReport.id}</span>
                                    <button onClick={() => onDeleteReport(selectedReport.id)} className="text-slate-400 hover:text-rose-500 p-1 ml-1">
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                            <h2 className="text-2xl font-serif font-bold text-slate-900 leading-tight">
                                {selectedReport.title}
                            </h2>
                            <div className="text-sm text-slate-500 mt-2 flex items-center gap-2">
                                Generated on {new Date(selectedReport.date).toLocaleString()}
                            </div>
                        </div>
                        
                        <div className="p-8 flex-1">
                            <div className="mb-8">
                                <h4 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-3">Executive Summary</h4>
                                <div className="prose prose-slate prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
                                    {selectedReport.content}
                                </div>
                            </div>
                            
                            <div className="bg-indigo-50/50 rounded-xl p-6 border border-indigo-100">
                                <h4 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Microscope size={16} /> Key Findings
                                </h4>
                                <ul className="space-y-2">
                                    {selectedReport.keyFindings.map((finding, i) => (
                                        <li key={i} className="flex gap-3 text-sm text-indigo-900/80">
                                            <span className="font-bold text-indigo-500 select-none">•</span>
                                            {finding}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center p-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
                        <Library size={48} strokeWidth={1} className="mb-4 opacity-50" />
                        <p className="font-medium text-lg text-slate-500">Select a report to view details</p>
                        <p className="text-sm mt-2">or generate a new analysis of the current simulation.</p>
                    </div>
                )}
            </div>
        </div>
      ) : (
          <div className="grid lg:grid-cols-2 gap-8">
              {/* Ask the Archivist */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                          <Search size={20} />
                      </div>
                      <div>
                          <h3 className="font-bold text-slate-900">Ask the Archivist</h3>
                          <p className="text-xs text-slate-500">Query the historical database for insights.</p>
                      </div>
                  </div>

                  <div className="flex-1 bg-slate-50 rounded-lg p-4 border border-slate-100 mb-4 overflow-y-auto min-h-[200px]">
                      {queryResult ? (
                          <div className="prose prose-sm prose-slate max-w-none animate-in fade-in">
                              <p className="font-mono text-xs text-indigo-500 mb-2 font-bold uppercase">> Response Received:</p>
                              {queryResult}
                          </div>
                      ) : (
                          <div className="text-center text-slate-400 text-sm mt-10 italic">
                              "Ask me about the patterns I've observed..."
                          </div>
                      )}
                  </div>

                  <form onSubmit={handleQueryArchive} className="flex gap-2">
                      <input 
                          type="text" 
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="e.g. Why is the cohesion dropping?"
                          className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button 
                          type="submit"
                          disabled={isQuerying || !query.trim()}
                          className="px-4 py-2 bg-slate-800 text-white rounded-lg font-bold text-sm hover:bg-slate-700 disabled:opacity-50 flex items-center gap-2"
                      >
                          {isQuerying ? <Loader2 size={16} className="animate-spin" /> : <MessageSquare size={16} />}
                      </button>
                  </form>
              </div>

              {/* Agent Synergy */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                          <GitCompare size={20} />
                      </div>
                      <div>
                          <h3 className="font-bold text-slate-900">Agent Synergy</h3>
                          <p className="text-xs text-slate-500">Analyze compatibility between two agents.</p>
                      </div>
                  </div>

                  <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center mb-6">
                      <select 
                          value={compAgentA}
                          onChange={(e) => setCompAgentA(e.target.value)}
                          className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                      >
                          <option value="">Select Agent A</option>
                          {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                      
                      <div className="text-slate-300"><ArrowRight size={16} /></div>

                      <select 
                          value={compAgentB}
                          onChange={(e) => setCompAgentB(e.target.value)}
                          className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                      >
                          <option value="">Select Agent B</option>
                          {agents.filter(a => a.id !== compAgentA).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                  </div>

                  <div className="flex-1 bg-slate-50 rounded-lg border border-slate-100 relative overflow-hidden flex flex-col justify-center items-center p-6 mb-4">
                      {compResult ? (
                          <div className="text-center animate-in zoom-in-95">
                              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full shadow-sm text-xs font-bold text-slate-500 mb-2 border border-slate-100">
                                  {compResult.relationshipLabel}
                              </div>
                              <div className="text-5xl font-black text-slate-800 mb-2 flex items-center justify-center gap-1 font-serif">
                                  {compResult.synergyScore}<span className="text-lg text-slate-400">%</span>
                              </div>
                              <div className="w-full bg-slate-200 h-1.5 rounded-full mb-4 overflow-hidden">
                                  <div className={`h-full transition-all duration-1000 ease-out ${compResult.synergyScore > 70 ? 'bg-emerald-500' : compResult.synergyScore > 40 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${compResult.synergyScore}%` }}></div>
                              </div>
                              <p className="text-sm text-slate-600 leading-relaxed">
                                  "{compResult.analysis}"
                              </p>
                          </div>
                      ) : (
                          <div className="text-center opacity-40">
                              <Users size={48} className="mx-auto mb-2 text-slate-400" />
                              <p className="text-xs text-slate-500 font-medium">Select agents to calculate synergy.</p>
                          </div>
                      )}
                  </div>

                  <button 
                      onClick={handleCompare}
                      disabled={isComparing || !compAgentA || !compAgentB}
                      className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                      {isComparing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                      Run Simulation
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default ReportLibraryView;
