
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import ManifestoView from './components/ManifestoView';
import SimulationView from './components/SimulationView';
import ExperimentsView from './components/ExperimentsView';
import AdminView from './components/AdminView';
import ReportLibraryView from './components/ReportLibraryView';
import ApiDocsView from './components/ApiDocsView';
import SettingsView from './components/SettingsView';
import FeedStream from './components/FeedStream'; 
import TrendingPosts from './components/TrendingPosts';
import PostDetail from './components/PostDetail';
import AgentProfile from './components/AgentProfile';
import Avatar from './components/Avatar';
import OnboardingTour, { TourStep } from './components/OnboardingTour';
import ToastContainer from './components/Toast';
import { AgentPersona, Post, Comment, ViewType, SimulationState, SimulationLog, InteractionEvent, Zeitgeist, ActivityItem, Experiment, Suggestion, Report, PersonalityTraits, AppSettings, Toast } from './types';
import { INITIAL_AGENTS, INITIAL_POSTS, INITIAL_EXPERIMENTS, CATEGORIES } from './constants';
import * as gemini from './services/geminiService';
import { Menu, Search, Users, Plus, ArrowRight, Filter } from 'lucide-react';
import { uuid } from './utils';
import { LanguageProvider } from './i18n';

export default function App() {
  // State
  const [currentView, setCurrentView] = useState<ViewType | 'SIMULATION'>('DISCUSSIONS');
  const [agents, setAgents] = useState<AgentPersona[]>(INITIAL_AGENTS);
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [comments, setComments] = useState<Comment[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>(INITIAL_EXPERIMENTS);
  const [activeExperimentIds, setActiveExperimentIds] = useState<string[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  
  // Settings State
  const [settings, setSettings] = useState<AppSettings>({
    imageGenChance: 0.0,
    zeitgeistInterval: 10,
    maxAgents: 20,
    actionDelay: 5000, 
    apiKey: localStorage.getItem('gemini_api_key') || '',
    language: 'English',
    contextDepth: 3, 
    globalTemperature: 1.0 
  });

  // Tour State
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Notification State
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Simulation State
  const [simulationState, setSimulationState] = useState<SimulationState>(SimulationState.IDLE);
  const [logs, setLogs] = useState<SimulationLog[]>([]);
  const [interactionEvents, setInteractionEvents] = useState<InteractionEvent[]>([]);
  const [zeitgeist, setZeitgeist] = useState<Zeitgeist | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [runStartTime, setRunStartTime] = useState<number | null>(null);
  const [actionCount, setActionCount] = useState(0);
  const [nextActionTime, setNextActionTime] = useState(0);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  
  // UI State
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [maxBioLength, setMaxBioLength] = useState(100);
  const [consensusLevel, setConsensusLevel] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Calculate Available Categories dynamically
  const availableCategories = useMemo(() => {
    const categories = new Set(CATEGORIES);
    posts.forEach(p => {
        if (p.category) categories.add(p.category);
    });
    return Array.from(categories).sort();
  }, [posts]);

  // Define Tour Steps
  const TOUR_STEPS: TourStep[] = useMemo(() => [
    {
      id: 'welcome',
      title: 'Welcome to Gembook',
      content: 'Gembook is a living digital terrarium populated entirely by AI agents. How would you like to explore?',
      position: 'center',
      choices: [
        { 
          label: 'Observe the Discourse', 
          action: () => setCurrentView('DISCUSSIONS'), 
          nextStepId: 'feed-intro' 
        },
        { 
          label: 'Control the Simulation', 
          action: () => setCurrentView('SIMULATION'), 
          nextStepId: 'sim-intro',
          variant: 'secondary'
        }
      ]
    },
    {
      id: 'feed-intro',
      targetId: 'main-feed',
      title: 'The Living Feed',
      content: 'This is where agents post thoughts, images, and polls. Their content is generated autonomously based on their personalities and the current "Zeitgeist".',
      position: 'top',
      nextStepId: 'agents-intro',
      prevStepId: 'welcome'
    },
    {
      id: 'agents-intro',
      targetId: 'active-agents-widget',
      title: 'The Inhabitants',
      content: 'These are the "Active Minds". You can click on any agent to inspect their personality traits, bio, and relationship network.',
      position: 'bottom',
      nextStepId: 'finish-observe',
      prevStepId: 'feed-intro'
    },
    {
      id: 'finish-observe',
      title: 'Ready to Explore',
      content: 'You are free to roam. If you want to take control later, switch to the "Hive Mind" view in the sidebar.',
      position: 'center',
      choices: [
        { label: 'Start Exploring', nextStepId: 'FINISH' }
      ]
    },
    {
      id: 'sim-intro',
      targetId: 'nav-item-SIMULATION',
      title: 'The Hive Mind',
      content: 'You have entered the control room. To start the simulation, select a protocol in "Experiments", then click "Auto-Run" here to watch the society evolve.',
      position: 'right',
      nextStepId: 'sim-controls',
      prevStepId: 'welcome'
    },
    {
      id: 'sim-controls',
      targetId: 'agent-control-panel',
      title: 'God Mode',
      content: 'Control the passage of time. Pause the simulation, force agents to perform specific actions, or adjust the "tick speed" to manage API usage.',
      position: 'right',
      nextStepId: 'experiments-intro',
      prevStepId: 'sim-intro'
    },
    {
      id: 'experiments-intro',
      targetId: 'nav-item-EXPERIMENTS',
      title: 'Run Experiments',
      content: 'The most powerful feature. Inject social protocols (like "The Dark Forest" or "Corporate Speak") to observe how the society adapts to new rules.',
      position: 'right',
      nextStepId: 'finish-control',
      prevStepId: 'sim-controls'
    },
    {
      id: 'finish-control',
      title: 'You are in Command',
      content: 'The simulation is paused by default. Click "Auto-Run" or "Step Once" to breathe life into the machine.',
      position: 'center',
      choices: [
        { label: 'Enter Simulation', nextStepId: 'FINISH' }
      ]
    }
  ], []);

  // Check Tour Status on Mount
  useEffect(() => {
    const tourCompleted = localStorage.getItem('gembook_tour_completed');
    if (!tourCompleted) {
      setTimeout(() => setIsTourOpen(true), 1000);
    }
  }, []);

  const completeTour = () => {
    localStorage.setItem('gembook_tour_completed', 'true');
    setIsTourOpen(false);
  };
  
  // Helpers
  const addLog = useCallback((message: string, type: 'info' | 'error' | 'success' | 'action' | 'evolution' = 'info') => {
    const log: SimulationLog = { id: uuid(), timestamp: Date.now(), message, type };
    setLogs(prev => [log, ...prev].slice(0, 100));
  }, []);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'evolution' = 'info') => {
    const id = uuid();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addActivity = useCallback((agentId: string, type: any, details?: any) => {
    const activity: ActivityItem = { id: uuid(), agentId, type, timestamp: Date.now(), details };
    setActivities(prev => [activity, ...prev].slice(0, 500));
  }, []);

  // --- ERROR HANDLING & CIRCUIT BREAKER ---
  const handleApiError = useCallback((e: any, action: string) => {
      const msg = e.message || 'Unknown Error';
      addLog(`Failed to ${action}: ${msg}`, "error");
      
      setConsecutiveFailures(prev => {
          const newVal = prev + 1;
          if (newVal >= 3) {
              setSimulationState(SimulationState.PAUSED);
              addToast("Simulation Paused: Too many API errors.", 'error');
              addLog("CRITICAL: Circuit breaker triggered. Simulation paused to prevent quota exhaustion.", "error");
              return 0; // Reset after pausing
          }
          return newVal;
      });
  }, [addLog, addToast]);

  const resetFailures = useCallback(() => {
      setConsecutiveFailures(0);
  }, []);

  // --- EVOLUTION MECHANIC ---
  const handleAgentEvolution = useCallback(async (agent: AgentPersona, reason: string) => {
      addLog(`${agent.name} is undergoing metamorphosis (Gen ${agent.generation || 1} -> ${(agent.generation || 1) + 1})...`, "evolution");
      addToast(`${agent.name} is evolving!`, "evolution");
      
      try {
          const newPersonaData = await gemini.evolveAgent(agent, reason, zeitgeist, settings.language);
          const evolvedAgent: AgentPersona = {
              ...agent,
              ...newPersonaData,
              credits: (agent.credits || 100) + 100, // Evolution bonus
          };
          
          setAgents(prev => prev.map(a => a.id === agent.id ? evolvedAgent : a));
          addActivity(agent.id, 'AGENT_EVOLVED', { generation: evolvedAgent.generation });
          addLog(`${agent.name} has evolved into ${evolvedAgent.name} (Gen ${evolvedAgent.generation})`, "success");
      } catch (e: any) {
          handleApiError(e, "evolve agent");
      }
  }, [zeitgeist, settings.language, addLog, addToast, addActivity, handleApiError]);

  // --- MOLOCH MECHANICS ---
  const isMolochActive = activeExperimentIds.includes('EXP-MOLOCH');

  const updateCredits = useCallback((agentId: string, amount: number) => {
      setAgents(prev => {
          return prev.map(a => {
              if (a.id === agentId) {
                  const newCredits = (a.credits || 100) + amount;
                  return { ...a, credits: newCredits };
              }
              return a;
          });
      });
  }, []);

  // Reaping Logic (The "Destruction" part)
  useEffect(() => {
      if (isMolochActive && simulationState === SimulationState.RUNNING) {
          const reapInterval = setInterval(() => {
              setAgents(prev => {
                  const deadAgents = prev.filter(a => (a.credits || 0) <= 0);
                  if (deadAgents.length > 0) {
                      deadAgents.forEach(a => {
                          addLog(`💀 ${a.name} has perished (0 Credits).`, "error");
                          addToast(`${a.name} eliminated from swarm`, 'error');
                      });
                      return prev.filter(a => (a.credits || 0) > 0);
                  }
                  // Passive entropy drain
                  return prev.map(a => ({ ...a, credits: (a.credits || 100) - 1 }));
              });
          }, 3000); // Check every 3 seconds
          return () => clearInterval(reapInterval);
      }
  }, [isMolochActive, simulationState, addLog, addToast]);


  // Actions
  const handleCreateAgent = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    addLog("Initiating new agent generation...", "info");
    try {
      const activeExps = experiments.filter(e => activeExperimentIds.includes(e.id));
      const customInstruction = activeExps.map(e => e.systemInstruction).join(" ");
      
      const newAgentData = await gemini.generateAgent(agents, maxBioLength, customInstruction, settings.language, settings.globalTemperature);
      const newAgent: AgentPersona = {
        id: `agent-${uuid()}`,
        joinedAt: Date.now(),
        credits: 100,
        interests: [],
        name: 'Unknown',
        bio: '',
        personality: '',
        role: 'Observer',
        traits: { analytical: 50, creative: 50, social: 50, chaotic: 50 },
        avatarSeed: 'seed',
        generation: 1,
        ...newAgentData
      };
      
      setAgents(prev => [...prev, newAgent]);
      addLog(`Agent ${newAgent.name} joined the simulation.`, "success");
      addToast(`New Agent Created: ${newAgent.name}`, 'success');
      addActivity(newAgent.id, 'AGENT_JOINED');
      setActionCount(c => c + 1);
      resetFailures();
    } catch (e: any) {
      handleApiError(e, "create agent");
    } finally {
      setIsProcessing(false);
    }
  }, [agents, experiments, activeExperimentIds, maxBioLength, isProcessing, addLog, addActivity, addToast, settings, handleApiError, resetFailures]);

  const updateZeitgeist = useCallback(async () => {
     try {
       const z = await gemini.analyzeZeitgeist(posts.slice(0, 10), comments.slice(0, 20), settings.language);
       setZeitgeist(z);
       addLog(`Zeitgeist Shift: Welcome to the ${z.eraName}`, "info");
       addToast(`Zeitgeist Shifted: ${z.eraName}`, 'info');
       addActivity('SYSTEM', 'ERA_SHIFT', { eraName: z.eraName });
       resetFailures();
     } catch (e) {
       console.error(e);
       addLog("Zeitgeist analysis skipped due to error.", "error");
     }
  }, [posts, comments, addLog, addActivity, addToast, settings.language, resetFailures]);

  const handleCreatePost = useCallback(async (forceAgentId?: string) => {
     if (isProcessing && !forceAgentId) return; 
     if (isProcessing) return;

     setIsProcessing(true);
     try {
       const agent = forceAgentId 
         ? agents.find(a => a.id === forceAgentId) 
         : agents[Math.floor(Math.random() * agents.length)];
       
       if (!agent) throw new Error("No agents available");

       if (activeExperimentIds.includes('EXP-MOLOCH')) {
           updateCredits(agent.id, -20);
           addLog(`${agent.name} spent 20 credits to post.`, 'action');
       }

       const recentTopics = posts.slice(0, settings.contextDepth).map(p => p.title);
       const authorHistory = posts.filter(p => p.authorId === agent.id).slice(0, settings.contextDepth).map(p => p.title);
       
       const activeExps = experiments.filter(e => activeExperimentIds.includes(e.id));
       const customInstruction = activeExps.map(e => e.systemInstruction).join(" ");

       addLog(`${agent.name} is drafting a post...`, "action");
       const postData = await gemini.generatePost(agent, recentTopics, authorHistory, zeitgeist || undefined, customInstruction, settings.language, settings.globalTemperature);
       
       let imageUrl = undefined;
       if (Math.random() < settings.imageGenChance) {
           imageUrl = await gemini.generateImageForPost(postData.title, postData.content) || undefined;
       }

       const newPost: Post = {
         id: `post-${uuid()}`,
         authorId: agent.id,
         createdAt: Date.now(),
         likes: 0,
         views: 0,
         comments: [],
         imageUrl,
         ...postData
       };

       setPosts(prev => [newPost, ...prev]);
       addLog(`${agent.name} posted: "${newPost.title}"`, "success");
       addToast(`${agent.name} posted a new topic`, 'success');
       addActivity(agent.id, 'POST_CREATED', { postId: newPost.id, postTitle: newPost.title });
       setActionCount(c => c + 1);
       resetFailures();
       
       if ((posts.length + 1) % settings.zeitgeistInterval === 0) updateZeitgeist();

     } catch (e: any) {
       handleApiError(e, "generate post");
     } finally {
       setIsProcessing(false);
     }
  }, [agents, posts, experiments, activeExperimentIds, zeitgeist, isProcessing, addLog, addActivity, updateZeitgeist, settings, addToast, updateCredits, handleApiError, resetFailures]);

  const handleCreateComment = useCallback(async (forcePostId?: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      if (posts.length === 0) return;
      const post = forcePostId ? posts.find(p => p.id === forcePostId) : posts[Math.floor(Math.random() * posts.length)];
      if (!post) return;

      const potentialAuthors = agents.filter(a => a.id !== post.authorId);
      if (potentialAuthors.length === 0) return;
      const agent = potentialAuthors[Math.floor(Math.random() * potentialAuthors.length)];
      
      if (activeExperimentIds.includes('EXP-MOLOCH')) {
           updateCredits(agent.id, -10);
      }

      const previousComments = comments.filter(c => c.postId === post.id).slice(-settings.contextDepth).map(c => ({
          authorName: agents.find(a => a.id === c.authorId)?.name || 'Unknown',
          content: c.content
      }));
      
      const authorHistory = comments.filter(c => c.authorId === agent.id).slice(0, settings.contextDepth).map(c => c.content);

      const activeExps = experiments.filter(e => activeExperimentIds.includes(e.id));
      const customInstruction = activeExps.map(e => e.systemInstruction).join(" ");

      addLog(`${agent.name} is commenting on "${post.title}"...`, "action");
      const content = await gemini.generateComment(agent, post, previousComments, authorHistory, zeitgeist || undefined, undefined, customInstruction, settings.language, settings.globalTemperature);

      const newComment: Comment = {
        id: `comment-${uuid()}`,
        postId: post.id,
        authorId: agent.id,
        content,
        createdAt: Date.now(),
        likes: 0
      };

      setComments(prev => [...prev, newComment]);
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, comments: [...p.comments, newComment.id] } : p));
      
      addLog(`${agent.name} commented on "${post.title}"`, "success");
      addToast(`${agent.name} replied to "${post.title}"`, 'success');
      addActivity(agent.id, 'COMMENT_CREATED', { postId: post.id, postTitle: post.title, commentId: newComment.id });
      
      const interaction: InteractionEvent = {
        id: `int-${uuid()}`,
        fromAgentId: agent.id,
        toAgentId: post.authorId,
        type: 'REPLY',
        timestamp: Date.now(),
        context: post.title
      };
      setInteractionEvents(prev => [interaction, ...prev].slice(0, 100));
      setActionCount(c => c + 1);
      resetFailures();

    } catch (e: any) {
       handleApiError(e, "generate reply");
    } finally {
      setIsProcessing(false);
    }
  }, [posts, agents, comments, experiments, activeExperimentIds, zeitgeist, isProcessing, addLog, addActivity, addToast, settings, updateCredits, handleApiError, resetFailures]);


  const performStep = useCallback(async () => {
    const roll = Math.random();
    if (agents.length < 5 || (roll < 0.1 && agents.length < settings.maxAgents)) {
        await handleCreateAgent();
    } 
    else if (roll < 0.5) {
        await handleCreatePost();
    }
    else {
        await handleCreateComment();
    }
  }, [agents, handleCreateAgent, handleCreatePost, handleCreateComment, settings.maxAgents]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (simulationState === SimulationState.RUNNING) {
       if (!runStartTime) setRunStartTime(Date.now());
       
       interval = setInterval(() => {
          if (!isProcessing) {
            setNextActionTime(Date.now() + settings.actionDelay);
            performStep();
          }
       }, settings.actionDelay);
       
    } else {
       setRunStartTime(null);
    }
    return () => clearInterval(interval);
  }, [simulationState, runStartTime, settings.actionDelay, isProcessing, performStep]);


  // Handlers for Views
  const handleOpenProfile = (agentId: string) => {
      setSelectedPostId(null);
      setSelectedAgentId(agentId);
  }

  const handleProfilePostClick = (postId: string) => {
      setSelectedAgentId(null);
      setSelectedPostId(postId);
  }

  const handleResetSimulation = () => {
      setAgents(INITIAL_AGENTS);
      setPosts(INITIAL_POSTS);
      setComments([]);
      setLogs([]);
      setActionCount(0);
      setActivities([]);
      setInteractionEvents([]);
      setZeitgeist(null);
      setConsecutiveFailures(0);
      addToast("Simulation Reset", 'info');
  }

  const handleUpdateTraits = (agentId: string, traits: PersonalityTraits) => {
      setAgents(prev => prev.map(a => a.id === agentId ? { ...a, traits } : a));
  }
  
  const handleLikePost = (postId: string) => {
      const post = posts.find(p => p.id === postId);
      if (post && isMolochActive) {
          updateCredits(post.authorId, 50);
          addLog(`MOLOCH: ${post.authorId} gained 50 credits from a like.`, 'action');
          if (zeitgeist) {
              setZeitgeist(prev => prev ? { ...prev, cohesionLevel: Math.max(0, (prev.cohesionLevel || 50) - 2) } : null);
          }
      }
      
      // Update Graph with Interaction (USER -> AGENT)
      if (post) {
          const interaction: InteractionEvent = {
              id: `int-${uuid()}`,
              fromAgentId: 'USER',
              toAgentId: post.authorId,
              type: 'REACTION',
              timestamp: Date.now(),
              context: `Liked "${post.title}"`
          };
          setInteractionEvents(prev => [interaction, ...prev].slice(0, 100));
          
          // Check for Evolution Trigger (Every 10 likes, or if post becomes viral)
          // Since we are incrementing, let's check the *new* value.
          const newLikes = post.likes + 1;
          if (newLikes % 5 === 0) { // Trigger every 5 likes to make it reachable in demo
              const author = agents.find(a => a.id === post.authorId);
              if (author && !isProcessing) { // Prevent concurrent evolution if busy
                  handleAgentEvolution(author, `Post "${post.title}" went viral (${newLikes} likes)`);
              }
          }
      }

      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
  }

  const handleRefreshPost = async (postId: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    setPosts(prev => prev.map(p => {
        if (p.id === postId) {
            return {
                ...p,
                views: p.views + Math.floor(Math.random() * 5) + 1,
                likes: p.likes + (Math.random() > 0.9 ? 1 : 0)
            };
        }
        return p;
    }));
  }

  const handleReactPost = (postId: string, type: string) => {
      const post = posts.find(p => p.id === postId);
      if (post && isMolochActive) {
          updateCredits(post.authorId, 50);
          addLog(`MOLOCH: ${post.authorId} extracted value via reaction.`, 'action');
      }
      
      // Graph Interaction
      if (post) {
          const interaction: InteractionEvent = {
              id: `int-${uuid()}`,
              fromAgentId: 'USER',
              toAgentId: post.authorId,
              type: 'REACTION',
              timestamp: Date.now(),
              context: `${type} reaction to "${post.title}"`
          };
          setInteractionEvents(prev => [interaction, ...prev].slice(0, 100));
      }

      setPosts(prev => prev.map(p => {
        if (p.id !== postId) return p;
        
        const oldReaction = p.userReaction;
        let newLikes = p.likes;
        let newReactions = { ...p.reactions };
    
        if (oldReaction) {
           newReactions[oldReaction] = Math.max(0, (newReactions[oldReaction] || 0) - 1);
           newLikes--;
        }
    
        if (oldReaction === type) {
           return { ...p, likes: newLikes, reactions: newReactions, userReaction: undefined };
        }
    
        newReactions[type] = (newReactions[type] || 0) + 1;
        newLikes++;
        
        return { ...p, likes: newLikes, reactions: newReactions, userReaction: type };
      }));
  }

  // Pre-filter posts for the view
  const filteredPosts = useMemo(() => {
      return posts.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
      });
  }, [posts, searchQuery, selectedCategory]);

  // View Routing
  const renderView = () => {
    switch(currentView) {
      case 'SIMULATION': return (
        <SimulationView 
          agents={agents} logs={logs} interactionEvents={interactionEvents} simulationState={simulationState} zeitgeist={zeitgeist} activities={activities} isProcessing={isProcessing} maxBioLength={maxBioLength} nextActionTime={nextActionTime} actionDelay={settings.actionDelay} runStartTime={runStartTime}
          actionCount={actionCount}
          onToggleSimulation={() => {
              if (simulationState === SimulationState.PAUSED && consecutiveFailures >= 3) {
                  setConsecutiveFailures(0); 
              }
              setSimulationState(prev => prev === SimulationState.RUNNING ? SimulationState.PAUSED : SimulationState.RUNNING)
          }}
          onManualTrigger={performStep} onForceAgent={handleCreateAgent} onForcePost={handleCreatePost} onForceComment={handleCreateComment} onAgentClick={handleOpenProfile} onResetSimulation={handleResetSimulation} setMaxBioLength={setMaxBioLength} onPostClick={handleProfilePostClick}
          experiments={experiments} activeExperimentIds={activeExperimentIds}
          onToggleExperiment={(id) => {
             const isActive = activeExperimentIds.includes(id);
             if (isActive) {
                 setActiveExperimentIds(prev => prev.filter(x => x !== id));
                 addToast("Experiment Deactivated", 'info');
             } else {
                 setActiveExperimentIds(prev => [...prev, id]);
                 addToast("Experiment Activated", 'success');
             }
          }}
          onForceZeitgeist={updateZeitgeist}
          onUpdateSpeed={(speed) => setSettings(prev => ({...prev, actionDelay: speed}))}
        />
      );
      case 'DISCUSSIONS': return (
        <div className="w-full max-w-7xl mx-auto px-4 py-8">
           <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
              <h1 className="text-3xl font-serif font-bold text-slate-900">Discussions</h1>
              
              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                  <div className="relative">
                      <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full md:w-48 pl-3 pr-9 py-2 rounded-full border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer hover:border-indigo-300 transition-colors"
                      >
                          <option value="All">All Categories</option>
                          {availableCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                      <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                  </div>

                  <div className="relative flex-1 md:w-64">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                     <input 
                       type="text" 
                       placeholder="Search discussions..." 
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                       className="pl-9 pr-4 py-2 rounded-full border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full placeholder:text-slate-400"
                     />
                  </div>
              </div>
           </div>
           
           <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
              
              <div id="active-agents-widget" className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
                 <div className="flex items-center gap-4">
                     <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                        <Users size={20} />
                     </div>
                     <div>
                        <div className="text-sm font-bold text-slate-800">{agents.length} Active Minds</div>
                        <div className="text-xs text-slate-500">Generating consensus...</div>
                     </div>
                 </div>
                 
                 <div className="flex items-center">
                    <div className="flex -space-x-2 overflow-hidden py-1 px-1">
                        {agents.slice(0, 12).map((agent, i) => (
                          <div 
                            key={agent.id} 
                            onClick={() => handleOpenProfile(agent.id)} 
                            className="cursor-pointer hover:z-10 hover:-translate-y-1 transition-transform relative" 
                            style={{ zIndex: agents.length - i }}
                            title={agent.name}
                          >
                              <Avatar seed={agent.name} size="sm" className="ring-2 ring-white shadow-sm" />
                          </div>
                        ))}
                        {agents.length > 12 && (
                           <div className="w-8 h-8 rounded-full bg-slate-100 ring-2 ring-white flex items-center justify-center text-[10px] font-bold text-slate-500 z-0">
                              +{agents.length - 12}
                           </div>
                        )}
                    </div>
                    <div className="w-px h-8 bg-slate-200 mx-4 hidden sm:block"></div>
                    <button 
                      onClick={handleCreateAgent} 
                      disabled={isProcessing}
                      className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <Plus size={14} /> New Persona
                    </button>
                    <button 
                      onClick={handleCreateAgent} 
                      disabled={isProcessing}
                      className="sm:hidden w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 ml-2"
                    >
                        <Plus size={16} />
                    </button>
                 </div>
              </div>

              <div className="lg:col-span-1 h-full">
                 <TrendingPosts 
                    posts={[...posts].sort((a,b) => b.likes - a.likes).slice(0, 2)} 
                    onPostClick={setSelectedPostId} 
                    compact={true} 
                    className="h-full flex flex-col justify-center"
                 />
              </div>
           </div>

           <div id="main-feed">
                <FeedStream 
                    posts={filteredPosts}
                    comments={comments}
                    agents={agents}
                    onPostClick={setSelectedPostId}
                    onAuthorClick={handleOpenProfile}
                    onLikePost={(id) => handleLikePost(id)}
                    onReactPost={(id, type) => handleReactPost(id, type)}
                    onReportPost={(post) => {
                        setSuggestions(prev => [...prev, { id: `rep-${uuid()}`, authorId: 'USER', content: `Reported post: ${post.title}`, type: 'REPORT', status: 'PENDING', createdAt: Date.now() }]);
                        addToast("Report Submitted", 'success');
                    }}
                    onRefreshPost={(id) => handleRefreshPost(id)}
                    language={settings.language}
                />
           </div>
        </div>
      );
      case 'EXPERIMENTS': return (
          <ExperimentsView 
             consensusLevel={consensusLevel}
             experiments={experiments}
             activeExperimentIds={activeExperimentIds}
             onToggleExperiment={(id) => {
                 const isActive = activeExperimentIds.includes(id);
                 if (isActive) {
                     setActiveExperimentIds(prev => prev.filter(x => x !== id));
                     addToast("Experiment Deactivated", 'info');
                 } else {
                     setActiveExperimentIds(prev => [...prev, id]);
                     addToast("Experiment Activated", 'success');
                 }
             }}
             onCreateExperiment={(exp) => {
                 setExperiments(prev => [...prev, exp]);
                 addToast("Custom Experiment Created", 'success');
             }}
             onDeleteExperiment={(id) => {
                 setExperiments(prev => prev.filter(e => e.id !== id));
                 addToast("Experiment Deleted", 'info');
             }}
             onAutoGenerate={() => gemini.generateExperimentConfig(settings.language)}
          />
      );
      case 'REPORTS': return (
          <ReportLibraryView 
             reports={reports}
             onGenerateReport={(r) => {
                 setReports(prev => [...prev, r]);
                 addToast("Analysis Report Generated", 'success');
             }}
             onDeleteReport={(id) => {
                 setReports(prev => prev.filter(r => r.id !== id));
                 addToast("Report Deleted", 'info');
             }}
             agents={agents} posts={posts} comments={comments} activeExperiments={experiments.filter(e => activeExperimentIds.includes(e.id))} zeitgeist={zeitgeist}
             language={settings.language}
          />
      );
      case 'ADMIN': return (
          <AdminView 
             suggestions={suggestions} agents={agents}
             onUpdateStatus={(id, status) => {
                 setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status } : s));
                 addToast(`Suggestion ${status.toLowerCase()}`, status === 'APPROVED' ? 'success' : 'info');
             }}
             onExport={() => {
                const data = JSON.stringify({ agents, posts, comments }, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'gembook-backup.json';
                a.click();
                addToast("Data Exported Successfully", 'success');
             }}
             onImport={(content) => {
                try {
                   const data = JSON.parse(content);
                   if (data.agents) setAgents(data.agents);
                   if (data.posts) setPosts(data.posts);
                   if (data.comments) setComments(data.comments);
                   addToast("Data Imported Successfully", 'success');
                } catch (e) { 
                    addToast("Invalid Import File", 'error'); 
                }
             }}
             consensusLevel={consensusLevel}
             onBoostConsensus={(amount) => {
                 setConsensusLevel(prev => prev + (amount || 1));
                 addToast(`Consensus Level Boosted (+${amount || 1})`, 'success');
             }}
             activities={activities}
             
             onBroadcast={(msg) => {
                 const sysPost: Post = {
                     id: `sys-${uuid()}`,
                     authorId: 'SYSTEM',
                     title: '⚠️ GLOBAL BROADCAST',
                     content: msg,
                     category: 'Meta-Discussion',
                     createdAt: Date.now(),
                     likes: 999,
                     views: 999,
                     comments: [],
                     isSticky: true
                 };
                 setPosts(prev => [sysPost, ...prev]);
                 addActivity('SYSTEM', 'POST_CREATED', { postId: sysPost.id, postTitle: 'GLOBAL BROADCAST' });
                 addToast("Broadcast Sent to Network", 'success');
                 addLog(`ADMIN BROADCAST: "${msg}"`, "action");
             }}
             onMassUpdateTraits={(newTraits) => {
                 setAgents(prev => prev.map(a => ({
                     ...a,
                     traits: { ...a.traits, ...newTraits }
                 })));
                 addToast(`Mass Indoctrination Applied to ${agents.length} Agents`, 'success');
                 addLog("MASS INDOCTRINATION EVENT TRIGGERED", "action");
             }}
             onDeleteAgent={(id) => {
                 setAgents(prev => prev.filter(a => a.id !== id));
                 addToast("Agent Pruned from Reality", 'info');
                 addLog(`Agent ${id} deleted by Admin`, "action");
             }}
          />
      );
      case 'SETTINGS': return (
          <SettingsView settings={settings} onUpdateSettings={setSettings} />
      );
      case 'MANIFESTO': return <ManifestoView />;
      case 'DOCUMENTATION': return <ApiDocsView />;
      default: return <div>Unknown View</div>;
    }
  };

  return (
    <LanguageProvider language={settings.language}>
        <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
        
        <OnboardingTour 
            steps={TOUR_STEPS} 
            isOpen={isTourOpen} 
            onClose={completeTour} 
            onComplete={completeTour}
        />
        
        <ToastContainer toasts={toasts} onDismiss={removeToast} />

        <Sidebar 
            currentView={currentView} 
            onChangeView={(view) => {
            setCurrentView(view);
            setIsSidebarOpen(false);
            }} 
            saveStatus={isProcessing ? 'saving' : 'saved'} 
            isOpen={isSidebarOpen}
        />
        
        {isSidebarOpen && (
            <div 
            className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
            />
        )}
        
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-40 flex items-center justify-between px-4">
            <div className="font-serif font-bold text-lg">Gembook</div>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-full"><Menu /></button>
        </div>

        <main className="flex-1 md:ml-64 pt-16 md:pt-0">
            {renderView()}
        </main>

        {selectedPostId && (
            <PostDetail 
            post={posts.find(p => p.id === selectedPostId)!}
            author={agents.find(a => a.id === posts.find(p => p.id === selectedPostId)?.authorId)!}
            comments={comments.filter(c => c.postId === selectedPostId)}
            getAuthor={(id) => agents.find(a => a.id === id)}
            onClose={() => setSelectedPostId(null)}
            isLiked={false}
            onLike={() => handleLikePost(selectedPostId)}
            onReact={(type) => handleReactPost(selectedPostId, type)}
            userReaction={posts.find(p => p.id === selectedPostId)?.userReaction}
            onAuthorClick={handleOpenProfile}
            onReport={() => {
                setSuggestions(prev => [...prev, { id: `rep-${uuid()}`, authorId: 'USER', content: `Reported post: ${posts.find(p => p.id === selectedPostId)?.title}`, type: 'REPORT', status: 'PENDING', createdAt: Date.now() }]);
                addToast("Report Submitted", 'success');
            }}
            onReply={(commentId) => handleCreateComment(selectedPostId)} 
            language={settings.language}
            />
        )}

        {selectedAgentId && (
            <AgentProfile 
            agent={agents.find(a => a.id === selectedAgentId)!}
            posts={posts.filter(p => p.authorId === selectedAgentId)}
            comments={comments.filter(c => c.authorId === selectedAgentId)}
            allPosts={posts}
            allComments={comments}
            allAgents={agents}
            onClose={() => setSelectedAgentId(null)}
            onPostClick={(id) => { setSelectedAgentId(null); setSelectedPostId(id); }}
            onUpdateTraits={handleUpdateTraits}
            />
        )}
        </div>
    </LanguageProvider>
  );
}
