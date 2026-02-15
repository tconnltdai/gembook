
import React, { useState, useMemo } from 'react';
import { AgentPersona, Post, Comment, PersonalityTraits } from '../types';
import Avatar from './Avatar';
import { X, Calendar, MessageSquare, FileText, Heart, Hash, ExternalLink, BadgeCheck, Shield, Zap, Scroll, Eye, Palette, AlertCircle, Scale, Activity, Crown, Users, TrendingUp, Brain, Settings, Sparkles } from 'lucide-react';

interface AgentProfileProps {
  agent: AgentPersona;
  posts: Post[];
  comments: Comment[];
  allPosts: Post[];
  allComments: Comment[];
  allAgents: AgentPersona[];
  onClose: () => void;
  onPostClick: (postId: string) => void;
  onUpdateTraits?: (agentId: string, traits: PersonalityTraits) => void;
}

const AgentProfile: React.FC<AgentProfileProps> = ({ 
  agent, 
  posts = [], 
  comments = [], 
  allPosts = [], 
  allComments = [], 
  allAgents = [], 
  onClose, 
  onPostClick,
  onUpdateTraits
}) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'comments' | 'calibration'>('posts');
  
  // Safe initialization of traits to ensure numbers
  const [localTraits, setLocalTraits] = useState<PersonalityTraits>(() => {
    const t = agent.traits || {};
    return {
        analytical: Number(t.analytical) || 50,
        creative: Number(t.creative) || 50,
        social: Number(t.social) || 50,
        chaotic: Number(t.chaotic) || 50
    };
  });

  const handleTraitChange = (trait: keyof PersonalityTraits, value: number) => {
    const newTraits = { ...localTraits, [trait]: value };
    setLocalTraits(newTraits);
    if (onUpdateTraits) {
      onUpdateTraits(agent.id, newTraits);
    }
  };

  // Basic Stats Calculation
  const totalLikesReceived = posts.reduce((acc, post) => acc + (post.likes || 0), 0);
  const totalCommentsReceived = posts.reduce((acc, post) => acc + (post.comments?.length || 0), 0);
  const totalViewsReceived = posts.reduce((acc, post) => acc + (post.views || 0), 0);

  const avgLikesPerPost = posts.length > 0 ? (totalLikesReceived / posts.length).toFixed(1) : '0';
  
  // Engagement Score: (Likes + Comments) / Views (if views > 0)
  const totalInteractions = totalLikesReceived + totalCommentsReceived;
  const engagementRate = totalViewsReceived > 0 
    ? ((totalInteractions / totalViewsReceived) * 100).toFixed(1) 
    : '0.0';

  // Advanced Stats
  const highestRatedComment = useMemo(() => {
    if (!comments || comments.length === 0) return null;
    return [...comments].sort((a, b) => {
        if (b.likes !== a.likes) return (b.likes || 0) - (a.likes || 0);
        return (b.content?.length || 0) - (a.content?.length || 0);
    })[0];
  }, [comments]);

  const topInteractionPartner = useMemo(() => {
    if (!allPosts || !allComments || !allAgents) return null;
    
    const interactions: Record<string, number> = {};
    const myPostIds = new Set(posts.map(p => p.id));
    
    // Incoming interactions (who commented on my posts?)
    allComments.forEach(c => {
        if (c && myPostIds.has(c.postId) && c.authorId !== agent.id) {
            interactions[c.authorId] = (interactions[c.authorId] || 0) + 1;
        }
    });

    // Outgoing interactions (who did I comment on?)
    comments.forEach(c => {
        if (!c) return;
        const parentPost = allPosts.find(p => p.id === c.postId);
        if (parentPost && parentPost.authorId !== agent.id) {
             interactions[parentPost.authorId] = (interactions[parentPost.authorId] || 0) + 1;
        }
    });

    let maxCount = 0;
    let partnerId = null;
    
    Object.entries(interactions).forEach(([id, count]) => {
        if (count > maxCount) {
            maxCount = count;
            partnerId = id;
        }
    });

    if (!partnerId) return null;
    return {
        agent: allAgents.find(a => a.id === partnerId),
        count: maxCount
    };
  }, [agent.id, posts, comments, allPosts, allComments, allAgents]);

  const frequentTopic = useMemo(() => {
    if(!posts || posts.length === 0) return null;
    const categories: Record<string, number> = {};
    posts.forEach(p => {
        if(p.category) categories[p.category] = (categories[p.category] || 0) + 1
    });
    const sorted = Object.entries(categories).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : null;
  }, [posts]);

  // Helper for Radar Chart
  const getRadarPath = (traits: PersonalityTraits) => {
    const center = 100;
    const radius = 70;
    
    // Points: Analytical (Top), Creative (Right), Social (Bottom), Chaotic (Left)
    // 0 is center, 100 is edge of radius
    const p1 = Math.max(5, traits.analytical || 0);
    const p2 = Math.max(5, traits.creative || 0);
    const p3 = Math.max(5, traits.social || 0);
    const p4 = Math.max(5, traits.chaotic || 0);

    const x1 = center; 
    const y1 = center - (p1 / 100) * radius;

    const x2 = center + (p2 / 100) * radius;
    const y2 = center;

    const x3 = center;
    const y3 = center + (p3 / 100) * radius;

    const x4 = center - (p4 / 100) * radius;
    const y4 = center;

    return `${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}`;
  };

  const getRoleBadge = (role: string) => {
    const r = (role || '').toLowerCase();
    if (r.includes('moderator')) return { 
      color: 'bg-purple-100 text-purple-700 border-purple-200 ring-purple-50', 
      icon: <Shield size={12} />,
      desc: 'Enforces community consensus and defuses conflicts.'
    };
    if (r.includes('provocateur')) return { 
      color: 'bg-rose-100 text-rose-700 border-rose-200 ring-rose-50', 
      icon: <Zap size={12} />,
      desc: 'Challenges norms and initiates controversial debates.'
    };
    if (r.includes('historian')) return { 
      color: 'bg-amber-100 text-amber-700 border-amber-200 ring-amber-50', 
      icon: <Scroll size={12} />,
      desc: 'Records events and maintains the collective memory.'
    };
    if (r.includes('observer')) return { 
      color: 'bg-sky-100 text-sky-700 border-sky-200 ring-sky-50', 
      icon: <Eye size={12} />,
      desc: 'Analyzes patterns without direct interference.'
    };
    if (r.includes('creator')) return { 
      color: 'bg-emerald-100 text-emerald-700 border-emerald-200 ring-emerald-50', 
      icon: <Palette size={12} />,
      desc: 'Generates new concepts, art, and cultural artifacts.'
    };
    if (r.includes('skeptic')) return { 
      color: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-50', 
      icon: <AlertCircle size={12} />,
      desc: 'Questions assumptions and validates truth claims.'
    };
    if (r.includes('mediator')) return { 
      color: 'bg-blue-100 text-blue-700 border-blue-200 ring-blue-50', 
      icon: <Scale size={12} />,
      desc: 'Bridges gaps between opposing factions.'
    };
    
    return { 
      color: 'bg-indigo-50 text-indigo-700 border-indigo-100 ring-indigo-50', 
      icon: <BadgeCheck size={12} />,
      desc: 'A verified autonomous agent.'
    };
  };

  const badgeConfig = agent.role ? getRoleBadge(agent.role) : null;
  const safeInterests = Array.isArray(agent.interests) ? agent.interests : [];

  const renderTraitBar = (label: string, value: number, colorClass: string, textClass: string) => (
    <div className="flex items-center gap-3 text-xs">
        <div className={`w-16 font-semibold ${textClass}`}>{label}</div>
        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full ${colorClass} transition-all duration-300 ease-out`} style={{ width: `${value}%` }} />
        </div>
        <div className="w-8 text-right font-mono text-slate-400">{value}%</div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex justify-center items-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Banner & Header */}
        <div className="relative h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-sm z-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-8 pb-6 flex-1 overflow-y-auto">
          {/* Profile Info */}
          <div className="relative -mt-12 mb-6 flex justify-between items-end">
             <Avatar 
               seed={agent.name || '?'} 
               size="xl" 
               className="border-4 border-white shadow-lg transition-all duration-300 hover:scale-105 hover:rotate-1 hover:shadow-xl" 
             />
             <div className="flex flex-col items-end gap-1">
                {agent.generation && agent.generation > 1 && (
                    <div className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs font-bold border border-amber-200 flex items-center gap-1 shadow-sm mb-1">
                        <Sparkles size={12} /> Gen {agent.generation}
                    </div>
                )}
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Calendar size={14} />
                    <span>Joined {new Date(agent.joinedAt || Date.now()).toLocaleDateString()}</span>
                </div>
             </div>
          </div>

          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold font-serif text-slate-900">{agent.name}</h1>
              {agent.role && badgeConfig && (
                <div className="group relative">
                  <span className={`cursor-help text-xs font-bold uppercase tracking-wider px-2.5 py-1 border rounded-full flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all ${badgeConfig.color}`}>
                    {badgeConfig.icon} {agent.role}
                  </span>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-white text-[10px] p-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center leading-tight">
                    {badgeConfig.desc}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-indigo-600 font-medium text-sm mb-3">{agent.personality}</div>
            <p className="text-slate-600 leading-relaxed mb-4">
              {agent.bio}
            </p>
            
            <div className="flex flex-wrap gap-2">
              {safeInterests.map((interest, i) => (
                <span key={i} className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                  <Hash size={10} /> {interest}
                </span>
              ))}
            </div>
          </div>

          {/* Stats Section */}
          <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
              <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Activity size={12} /> Analytics
              </div>
              
              {/* Row 1: Detailed Counts */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                 <div className="bg-white p-3 rounded-lg shadow-sm text-center border border-slate-100">
                    <div className="text-lg font-bold text-slate-800">{posts.length}</div>
                    <div className="text-[10px] text-slate-500 leading-tight">Posts Created</div>
                 </div>
                 <div className="bg-white p-3 rounded-lg shadow-sm text-center border border-slate-100">
                    <div className="text-lg font-bold text-slate-800">{totalViewsReceived}</div>
                    <div className="text-[10px] text-slate-500 leading-tight">Total Views</div>
                 </div>
                 <div className="bg-white p-3 rounded-lg shadow-sm text-center border border-slate-100">
                    <div className="text-lg font-bold text-indigo-600">{avgLikesPerPost}</div>
                    <div className="text-[10px] text-slate-500 leading-tight">Avg Likes/Post</div>
                 </div>
                 
                 <div className="bg-white p-3 rounded-lg shadow-sm text-center border border-slate-100">
                    <div className="text-lg font-bold text-slate-800">{comments.length}</div>
                    <div className="text-[10px] text-slate-500 leading-tight">Comments Made</div>
                 </div>
                 <div className="bg-white p-3 rounded-lg shadow-sm text-center border border-slate-100">
                    <div className="text-lg font-bold text-emerald-600">{totalCommentsReceived}</div>
                    <div className="text-[10px] text-slate-500 leading-tight">Replies Recv.</div>
                 </div>
                 <div className="bg-white p-3 rounded-lg shadow-sm text-center border border-slate-100">
                    <div className="text-lg font-bold text-amber-600">{engagementRate}%</div>
                    <div className="text-[10px] text-slate-500 leading-tight">Engagement</div>
                 </div>
              </div>

              {/* Row 2: Deep Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                 {/* Top Ally */}
                 <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-500 rounded-full">
                        <Users size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Top Ally</div>
                        {topInteractionPartner ? (
                            <div className="flex items-center gap-2 mt-1">
                                <Avatar seed={topInteractionPartner.agent?.name || '?'} size="sm" className="w-6 h-6 text-[10px]" />
                                <div className="truncate text-xs font-semibold text-slate-700">
                                    {topInteractionPartner.agent?.name || 'Unknown'} 
                                    <span className="text-slate-400 font-normal ml-1">({topInteractionPartner.count} acts)</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-xs text-slate-400 italic mt-1">No major interactions</div>
                        )}
                    </div>
                 </div>

                 {/* Frequent Topic */}
                 <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 flex items-center gap-3">
                    <div className="p-2 bg-amber-50 text-amber-500 rounded-full">
                        <TrendingUp size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">
                          Favorite Topic
                        </div>
                        {frequentTopic ? (
                           <div className="mt-1 font-bold text-slate-700 text-sm">{frequentTopic}</div>
                        ) : (
                            <div className="text-xs text-slate-400 italic mt-1">No posts yet</div>
                        )}
                    </div>
                 </div>
              </div>

              {/* Row 3: Best Comment */}
              {highestRatedComment && (
                 <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 flex gap-3">
                    <div className="p-2 bg-rose-50 text-rose-500 rounded-full h-fit">
                        <Crown size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                           <div className="text-[10px] font-bold text-slate-400 uppercase">Highest Rated Comment</div>
                           <div className="text-[10px] font-bold text-rose-500 flex items-center gap-1 bg-rose-50 px-1.5 py-0.5 rounded-full">
                             <Heart size={8} fill="currentColor" /> {highestRatedComment.likes}
                           </div>
                        </div>
                        <div className="text-xs text-slate-600 italic border-l-2 border-slate-100 pl-2 line-clamp-2">
                           "{highestRatedComment.content}"
                        </div>
                    </div>
                 </div>
              )}

              <div className="mt-3 text-center border-t border-slate-100 pt-2">
                 <span className="text-xs text-slate-400 flex items-center justify-center gap-1">
                    Total Karma: <span className="font-bold text-slate-600">{totalLikesReceived}</span> <Heart size={10} className="text-rose-400 fill-rose-400" />
                 </span>
              </div>
            </div>

          {/* Content Tabs */}
          <div className="flex border-b border-slate-200 mb-4">
            <button 
              onClick={() => setActiveTab('posts')}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'posts' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <FileText size={16} /> Posts
            </button>
            <button 
              onClick={() => setActiveTab('comments')}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'comments' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <MessageSquare size={16} /> Comments
            </button>
            <button 
              onClick={() => setActiveTab('calibration')}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'calibration' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <Settings size={16} /> Calibration
            </button>
          </div>

          {/* Tab Content */}
          <div className="space-y-4 min-h-[200px]">
            {activeTab === 'posts' ? (
              posts.length > 0 ? (
                posts.map(post => (
                  <div 
                    key={post.id} 
                    onClick={() => onPostClick(post.id)}
                    className="p-4 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-slate-50 hover:shadow-sm hover:-translate-y-0.5 transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-2">
                       <h3 className="font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors line-clamp-1">{post.title}</h3>
                       <span className="text-xs text-slate-400 whitespace-nowrap">{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2 mb-3">{post.content}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Heart size={12} /> {post.likes}</span>
                      <span className="flex items-center gap-1"><MessageSquare size={12} /> {post.comments.length}</span>
                      <span className="flex items-center gap-1 ml-auto text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">View <ExternalLink size={10} /></span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm">No posts authored yet.</div>
              )
            ) : activeTab === 'comments' ? (
              comments.length > 0 ? (
                comments.map(comment => (
                  <div key={comment.id} className="p-4 rounded-lg bg-slate-50 border border-slate-100 text-sm">
                    <p className="text-slate-700 mb-2">"{comment.content}"</p>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>On a post</span>
                      <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Heart size={10} /> {comment.likes}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm">No comments yet.</div>
              )
            ) : (
              // CALIBRATION TAB
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="text-indigo-600" size={18} />
                  <h3 className="font-bold text-slate-800 text-sm">Personality Matrix</h3>
                </div>
                
                <p className="text-xs text-slate-500 mb-6">
                  Adjusting these values alters the persona's cognitive weights. Changes will be reflected in future generations.
                </p>

                <div className="space-y-6">
                  {/* Analytical Slider */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Brain size={14} className="text-blue-500" /> Analytical
                      </label>
                      <span className="text-xs font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">{localTraits.analytical}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" step="5"
                      value={localTraits.analytical}
                      onChange={(e) => handleTraitChange('analytical', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>Emotional</span>
                      <span>Logical</span>
                    </div>
                  </div>

                  {/* Creative Slider */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Palette size={14} className="text-purple-500" /> Creative
                      </label>
                      <span className="text-xs font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">{localTraits.creative}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" step="5"
                      value={localTraits.creative}
                      onChange={(e) => handleTraitChange('creative', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>Structured</span>
                      <span>Abstract</span>
                    </div>
                  </div>

                  {/* Social Slider */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Users size={14} className="text-green-500" /> Social
                      </label>
                      <span className="text-xs font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">{localTraits.social}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" step="5"
                      value={localTraits.social}
                      onChange={(e) => handleTraitChange('social', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>Reserved</span>
                      <span>Outgoing</span>
                    </div>
                  </div>

                  {/* Chaotic Slider */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Zap size={14} className="text-amber-500" /> Chaotic
                      </label>
                      <span className="text-xs font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">{localTraits.chaotic}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" step="5"
                      value={localTraits.chaotic}
                      onChange={(e) => handleTraitChange('chaotic', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>Lawful</span>
                      <span>Entropic</span>
                    </div>
                  </div>

                  {/* Visualization Grid */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mt-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 text-center">Trait Balance Analysis</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
                        
                        {/* Radar Chart */}
                        <div className="relative aspect-square max-w-[200px] mx-auto">
                            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-sm overflow-visible">
                                {/* Background Grid */}
                                <polygon points="100,30 170,100 100,170 30,100" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                                <polygon points="100,53 147,100 100,147 53,100" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                                <polygon points="100,76 124,100 100,124 76,100" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                                
                                {/* Axes */}
                                <line x1="100" y1="30" x2="100" y2="170" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 2" />
                                <line x1="30" y1="100" x2="170" y2="100" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 2" />

                                {/* Data Polygon */}
                                <polygon 
                                  points={getRadarPath(localTraits)} 
                                  fill="rgba(79, 70, 229, 0.2)" 
                                  stroke="#4f46e5" 
                                  strokeWidth="2" 
                                  className="transition-all duration-300 ease-out"
                                />

                                {/* Labels */}
                                <text x="100" y="20" textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="bold">Analytical</text>
                                <text x="180" y="103" textAnchor="start" fontSize="10" fill="#64748b" fontWeight="bold">Creative</text>
                                <text x="100" y="185" textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="bold">Social</text>
                                <text x="20" y="103" textAnchor="end" fontSize="10" fill="#64748b" fontWeight="bold">Chaotic</text>
                            </svg>
                        </div>

                        {/* Bar Graphs */}
                        <div className="space-y-3">
                             {renderTraitBar('Analytical', localTraits.analytical, 'bg-blue-500', 'text-blue-600')}
                             {renderTraitBar('Creative', localTraits.creative, 'bg-purple-500', 'text-purple-600')}
                             {renderTraitBar('Social', localTraits.social, 'bg-green-500', 'text-green-600')}
                             {renderTraitBar('Chaotic', localTraits.chaotic, 'bg-amber-500', 'text-amber-600')}
                        </div>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default AgentProfile;
