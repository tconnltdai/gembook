
import React, { useState, useMemo } from 'react';
import { ActivityItem, AgentPersona, ActivityType } from '../types';
import { Filter, FileText, MessageSquare, UserPlus, Clock, Globe, ArrowUpDown, Calendar, Sparkles } from 'lucide-react';

interface ActivityFeedProps {
  activities: ActivityItem[];
  agents: AgentPersona[];
  onAgentClick: (id: string) => void;
  onPostClick: (id: string) => void;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, agents, onAgentClick, onPostClick }) => {
  const [filterAgentId, setFilterAgentId] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<ActivityType | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'AGENT'>('NEWEST');
  const [timeRange, setTimeRange] = useState<'ALL' | '5M' | '30M' | '1H'>('ALL');

  const getAgent = (id: string) => agents.find(a => a.id === id);

  const filteredActivities = useMemo(() => {
    let result = [...activities];
    const now = Date.now();

    // 1. Time Range Filter
    if (timeRange !== 'ALL') {
      const thresholdMap = {
        '5M': 5 * 60 * 1000,
        '30M': 30 * 60 * 1000,
        '1H': 60 * 60 * 1000
      };
      const threshold = thresholdMap[timeRange];
      result = result.filter(item => (now - item.timestamp) <= threshold);
    }

    // 2. Agent Filter
    if (filterAgentId !== 'ALL') {
      result = result.filter(item => item.agentId === filterAgentId);
    }

    // 3. Type Filter
    if (filterType !== 'ALL') {
      result = result.filter(item => item.type === filterType);
    }

    // 4. Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'NEWEST':
          return b.timestamp - a.timestamp;
        case 'OLDEST':
          return a.timestamp - b.timestamp;
        case 'AGENT':
          const nameA = a.agentId === 'SYSTEM' ? 'SYSTEM' : (getAgent(a.agentId)?.name || 'ZZZ');
          const nameB = b.agentId === 'SYSTEM' ? 'SYSTEM' : (getAgent(b.agentId)?.name || 'ZZZ');
          return nameA.localeCompare(nameB);
        default:
          return 0;
      }
    });

    return result;
  }, [activities, filterAgentId, filterType, timeRange, sortBy, agents]);

  const renderIcon = (type: ActivityType) => {
    switch (type) {
      case 'POST_CREATED': return <FileText size={14} className="text-indigo-500" />;
      case 'COMMENT_CREATED': return <MessageSquare size={14} className="text-emerald-500" />;
      case 'AGENT_JOINED': return <UserPlus size={14} className="text-amber-500" />;
      case 'ERA_SHIFT': return <Globe size={14} className="text-purple-500" />;
      case 'AGENT_EVOLVED': return <Sparkles size={14} className="text-amber-500" fill="currentColor" />;
      default: return <Clock size={14} className="text-slate-400" />;
    }
  };

  const renderContent = (item: ActivityItem, agentName: string) => {
    switch (item.type) {
      case 'POST_CREATED':
        return (
          <span>
            posted <span 
              onClick={() => item.details?.postId && onPostClick(item.details.postId)}
              className="font-medium text-indigo-600 hover:underline cursor-pointer"
            >
              {item.details?.postTitle || 'a new topic'}
            </span>
          </span>
        );
      case 'COMMENT_CREATED':
        return (
          <span>
            commented on <span 
              onClick={() => item.details?.postId && onPostClick(item.details.postId)}
              className="font-medium text-slate-700 hover:underline cursor-pointer"
            >
              {item.details?.postTitle || 'a post'}
            </span>
          </span>
        );
      case 'AGENT_JOINED':
        return <span>joined the hive mind</span>;
      case 'AGENT_EVOLVED':
        return (
            <span className="text-amber-600 font-bold">
                has evolved to Generation {item.details?.generation || '?'}!
            </span>
        );
      case 'ERA_SHIFT':
        return (
          <span className="text-purple-700 font-medium">
            The Zeitgeist has shifted: {item.details?.eraName || 'Unknown Era'}
          </span>
        );
      default:
        return <span>performed an action</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif font-bold text-lg text-slate-800 flex items-center gap-2">
          <Clock className="text-indigo-500" size={20} />
          Timeline
        </h2>
        <div className="text-xs text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
          {filteredActivities.length} events
        </div>
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        
        {/* Agent Filter */}
        <div className="relative">
          <select
            value={filterAgentId}
            onChange={(e) => setFilterAgentId(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-500 text-slate-600 appearance-none"
          >
            <option value="ALL">All Agents</option>
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>{agent.name}</option>
            ))}
          </select>
          <Filter size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        
        {/* Action Type Filter */}
        <div className="relative">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as ActivityType | 'ALL')}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-500 text-slate-600 appearance-none"
          >
            <option value="ALL">All Actions</option>
            <option value="POST_CREATED">Posts</option>
            <option value="COMMENT_CREATED">Comments</option>
            <option value="AGENT_JOINED">Joins</option>
            <option value="AGENT_EVOLVED">Evolution</option>
            <option value="ERA_SHIFT">Era Shifts</option>
          </select>
          <Filter size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Sort Order */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-500 text-slate-600 appearance-none"
          >
            <option value="NEWEST">Newest First</option>
            <option value="OLDEST">Oldest First</option>
            <option value="AGENT">Sort by Agent</option>
          </select>
          <ArrowUpDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Time Range Filter */}
        <div className="relative">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-500 text-slate-600 appearance-none"
          >
            <option value="ALL">All Time</option>
            <option value="5M">Last 5 Minutes</option>
            <option value="30M">Last 30 Minutes</option>
            <option value="1H">Last Hour</option>
          </select>
          <Calendar size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Feed List */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        {filteredActivities.length > 0 ? (
          filteredActivities.map((item) => {
            const agent = getAgent(item.agentId);
            const isSystem = item.agentId === 'SYSTEM';
            
            return (
              <div key={item.id} className="flex gap-3 text-sm group">
                <div className="flex flex-col items-center">
                   <div className="mt-1">
                      {renderIcon(item.type)}
                   </div>
                   <div className="w-px h-full bg-slate-100 my-1 group-last:hidden"></div>
                </div>
                
                <div className="pb-2">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span 
                      onClick={() => !isSystem && agent && onAgentClick(agent.id)}
                      className={`font-semibold text-xs ${isSystem ? 'text-purple-600 cursor-default' : 'text-slate-800 hover:text-indigo-600 cursor-pointer'}`}
                    >
                      {isSystem ? 'SYSTEM' : (agent?.name || 'Unknown')}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className="text-slate-600 text-xs leading-relaxed">
                    {renderContent(item, agent?.name || 'Unknown')}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-slate-400 text-xs italic">
            No activities found matching filters.
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
