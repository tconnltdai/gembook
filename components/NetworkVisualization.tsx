import React, { useMemo, useState } from 'react';
import { AgentPersona, InteractionEvent } from '../types';
import { Share2 } from 'lucide-react';
import { generateColorFromSeed } from '../utils';

interface NetworkVisualizationProps {
  agents: AgentPersona[];
  interactions: InteractionEvent[];
  onAgentClick: (id: string) => void;
}

const NetworkVisualization: React.FC<NetworkVisualizationProps> = ({ agents, interactions, onAgentClick }) => {
  const [hoveredAgentId, setHoveredAgentId] = useState<string | null>(null);

  const { nodes, links } = useMemo(() => {
    if (agents.length === 0) return { nodes: [], links: [] };

    const nodeCount = agents.length;
    const radius = 110; 
    const center = 150;
    
    // Sort agents by join time to keep layout stable
    const sortedAgents = [...agents].sort((a, b) => a.joinedAt - b.joinedAt);

    const calculatedNodes = sortedAgents.map((agent, i) => {
      const angle = (i / nodeCount) * 2 * Math.PI - Math.PI / 2;
      return {
        ...agent,
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle),
        color: generateColorFromSeed(agent.name)
      };
    });

    // Aggregate interactions
    const pairCounts: Record<string, number> = {};
    let maxCount = 0;

    interactions.forEach(event => {
      // Use undirected edges for relationship strength
      const participants = [event.fromAgentId, event.toAgentId].sort();
      const key = participants.join('|');
      pairCounts[key] = (pairCounts[key] || 0) + 1;
      maxCount = Math.max(maxCount, pairCounts[key]);
    });

    const calculatedLinks = Object.entries(pairCounts).map(([key, count]) => {
      const [sourceId, targetId] = key.split('|');
      const sourceNode = calculatedNodes.find(n => n.id === sourceId);
      const targetNode = calculatedNodes.find(n => n.id === targetId);
      
      if (!sourceNode || !targetNode) return null;

      return {
        source: sourceNode,
        target: targetNode,
        count,
        opacity: Math.max(0.15, Math.min(1, count / (maxCount || 1)))
      };
    }).filter(Boolean) as { source: any, target: any, count: number, opacity: number }[];

    return { nodes: calculatedNodes, links: calculatedLinks };
  }, [agents, interactions]);

  if (agents.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Share2 className="text-indigo-500" size={18} />
          Neural Map
        </h3>
        <span className="text-[10px] font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
          {interactions.length} recent interactions
        </span>
      </div>
      
      <div className="flex justify-center -my-4">
        <svg width="300" height="300" viewBox="0 0 300 300" className="overflow-visible select-none">
            {/* Links */}
            {links.map((link, i) => {
               const isHovered = hoveredAgentId && (link.source.id === hoveredAgentId || link.target.id === hoveredAgentId);
               const isDimmed = hoveredAgentId && !isHovered;
               
               return (
                <line
                  key={`link-${i}`}
                  x1={link.source.x}
                  y1={link.source.y}
                  x2={link.target.x}
                  y2={link.target.y}
                  stroke={isHovered ? link.source.color : "#cbd5e1"}
                  strokeWidth={isHovered ? 2 : Math.max(1, link.count * 0.8)}
                  strokeOpacity={isDimmed ? 0.05 : link.opacity}
                  strokeLinecap="round"
                  className="transition-all duration-300 ease-out"
                />
               );
            })}

            {/* Nodes */}
            {nodes.map((node) => {
               const isHovered = hoveredAgentId === node.id;
               const isDimmed = hoveredAgentId && hoveredAgentId !== node.id && 
                 !links.some(l => (l.source.id === hoveredAgentId && l.target.id === node.id) || (l.target.id === hoveredAgentId && l.source.id === node.id));

               return (
                 <g 
                    key={node.id} 
                    transform={`translate(${node.x}, ${node.y})`}
                    onMouseEnter={() => setHoveredAgentId(node.id)}
                    onMouseLeave={() => setHoveredAgentId(null)}
                    onClick={() => onAgentClick(node.id)}
                    className={`cursor-pointer transition-all duration-300 ${isDimmed ? 'opacity-20 blur-[1px]' : 'opacity-100'}`}
                 >
                    {/* Hover connection guide circle */}
                    {isHovered && <circle r={18} fill={node.color} opacity={0.2} className="animate-pulse" />}
                    
                    {/* Main Node */}
                    <circle 
                      r={12} 
                      fill={node.color}
                      className="stroke-white shadow-sm transition-transform duration-300" 
                      strokeWidth={2}
                      style={{ transform: isHovered ? 'scale(1.1)' : 'scale(1)' }}
                    />
                    
                    <text 
                        dy=".35em" 
                        textAnchor="middle" 
                        className="font-bold text-[10px] fill-white pointer-events-none"
                    >
                        {node.name.charAt(0)}
                    </text>
                    
                    {/* Name Label - Show on Hover */}
                    <g 
                        className={`transition-all duration-200 pointer-events-none ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
                        transform="translate(0, -24)"
                    >
                        <rect x="-40" y="-8" width="80" height="16" rx="4" fill="white" fillOpacity="0.9" />
                        <text
                           textAnchor="middle"
                           dy=".3em"
                           className="text-[10px] font-bold fill-slate-700"
                        >
                            {node.name}
                        </text>
                    </g>
                 </g>
               );
            })}
        </svg>
      </div>
      <div className="text-center mt-6 text-[10px] text-slate-400">
         Visualizing the last 50 interactions between agents.
      </div>
    </div>
  );
};

export default NetworkVisualization;