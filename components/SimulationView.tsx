
import React from 'react';
import AgentControl from './AgentControl';
import ActivityFeed from './ActivityFeed';
import NetworkVisualization from './NetworkVisualization';
import { AgentPersona, SimulationState, SimulationLog, InteractionEvent, Zeitgeist, ActivityItem, Experiment } from '../types';

interface SimulationViewProps {
  agents: AgentPersona[];
  logs: SimulationLog[];
  interactionEvents: InteractionEvent[];
  simulationState: SimulationState;
  zeitgeist: Zeitgeist | null;
  activities: ActivityItem[];
  isProcessing: boolean;
  maxBioLength: number;
  nextActionTime: number;
  actionDelay: number;
  runStartTime: number | null;
  actionCount: number;
  experiments: Experiment[];
  activeExperimentIds: string[];
  
  // Actions
  onToggleSimulation: () => void;
  onManualTrigger: () => void;
  onForceAgent: () => void;
  onForcePost: () => void;
  onForceComment: () => void;
  onAgentClick: (agentId: string) => void;
  onResetSimulation: () => void;
  setMaxBioLength: (length: number) => void;
  onPostClick: (postId: string) => void;
  onToggleExperiment: (id: string) => void;
  onForceZeitgeist: () => void;
  onUpdateSpeed: (ms: number) => void;
}

const SimulationView: React.FC<SimulationViewProps> = (props) => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-slate-900">Hive Mind Control</h1>
        <p className="text-slate-500 mt-2">Manage the simulation parameters and observe agent generation in real-time.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Main Control Panel - Left Column */}
        <div className="lg:col-span-7 space-y-8">
          <AgentControl 
            agents={props.agents}
            logs={props.logs}
            interactionEvents={props.interactionEvents}
            simulationState={props.simulationState}
            zeitgeist={props.zeitgeist}
            onToggleSimulation={props.onToggleSimulation}
            onManualTrigger={props.onManualTrigger}
            onForceAgent={props.onForceAgent}
            onForcePost={props.onForcePost}
            onForceComment={props.onForceComment}
            onAgentClick={props.onAgentClick}
            onResetSimulation={props.onResetSimulation}
            isProcessing={props.isProcessing}
            maxBioLength={props.maxBioLength}
            setMaxBioLength={props.setMaxBioLength}
            nextActionTime={props.nextActionTime}
            actionDelay={props.actionDelay}
            runStartTime={props.runStartTime}
            actionCount={props.actionCount}
            experiments={props.experiments}
            activeExperimentIds={props.activeExperimentIds}
            onToggleExperiment={props.onToggleExperiment}
            onForceZeitgeist={props.onForceZeitgeist}
            onUpdateSpeed={props.onUpdateSpeed}
          />
        </div>

        {/* Feed - Right Column */}
        <div className="lg:col-span-5 space-y-6">
           {/* Neural Graph */}
           <NetworkVisualization 
              agents={props.agents}
              interactions={props.interactionEvents}
              onAgentClick={props.onAgentClick}
           />

           <ActivityFeed 
             activities={props.activities}
             agents={props.agents}
             onAgentClick={props.onAgentClick}
             onPostClick={props.onPostClick}
           />
           
           <div className="bg-indigo-50 dark:bg-indigo-900 rounded-xl p-6 text-indigo-900 dark:text-indigo-100 shadow-sm border border-indigo-100 dark:border-indigo-800 relative overflow-hidden transition-colors">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-200 dark:bg-indigo-500 rounded-full blur-3xl opacity-30 dark:opacity-20"></div>
              <h3 className="font-bold text-indigo-900 dark:text-white mb-2 relative z-10">Simulation Notes</h3>
              <ul className="text-sm space-y-2 opacity-80 relative z-10">
                <li>• Agents act based on "Ticks". Speed up simulation to increase tick rate.</li>
                <li>• The Zeitgeist evolves every 6 actions.</li>
                <li>• Max agent cap is currently set to 20.</li>
              </ul>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationView;
