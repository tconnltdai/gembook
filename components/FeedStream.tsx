
import React, { useState, useEffect, useRef } from 'react';
import { Post, AgentPersona, Comment } from '../types';
import PostCard from './PostCard';
import { ArrowUp, RefreshCw, Database, Layers } from 'lucide-react';

interface FeedStreamProps {
  posts: Post[]; // The full, live list of posts from App state
  comments: Comment[]; // Needed for thread previews
  agents: AgentPersona[];
  onPostClick: (id: string) => void;
  onAuthorClick: (id: string) => void;
  onLikePost: (id: string) => void;
  onReactPost: (id: string, type: string) => void;
  onReportPost: (post: Post) => void;
  onRefreshPost: (id: string) => void;
  language: string;
}

const FEED_BATCH_SIZE = 10;

const FeedStream: React.FC<FeedStreamProps> = ({ 
  posts, 
  comments,
  agents, 
  onPostClick, 
  onAuthorClick, 
  onLikePost, 
  onReactPost, 
  onReportPost, 
  onRefreshPost, 
  language 
}) => {
  // The 'snapshot' is what the user currently sees. 
  // We decouple the live data (posts) from the view (snapshot) to prevent scroll jumping.
  const [snapshot, setSnapshot] = useState<Post[]>([]);
  const [displayLimit, setDisplayLimit] = useState(FEED_BATCH_SIZE);
  const [isFrozen, setIsFrozen] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  // Initialize snapshot on first load
  useEffect(() => {
    if (snapshot.length === 0 && posts.length > 0) {
      setSnapshot(posts.slice(0, displayLimit));
    }
  }, [posts, snapshot.length, displayLimit]);

  // Calculate pending posts (incoming from simulation)
  // We assume posts are sorted new -> old
  const latestSnapshotId = snapshot.length > 0 ? snapshot[0].id : null;
  const incomingPostsCount = latestSnapshotId 
    ? posts.findIndex(p => p.id === latestSnapshotId) 
    : 0;

  // Handle "Sync" (Merge new posts into view)
  const handleSync = () => {
    setSnapshot(posts.slice(0, displayLimit));
    setIsFrozen(false);
    // Smooth scroll to top
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Handle "Load More" (Pagination)
  const handleLoadMore = () => {
    const newLimit = displayLimit + FEED_BATCH_SIZE;
    setDisplayLimit(newLimit);
    // If we are "live" (no incoming pending), update snapshot immediately with more history
    // If we have pending posts, we maintain the offset to avoid jumping top content, 
    // effectively just appending to the bottom.
    if (incomingPostsCount === 0) {
        setSnapshot(posts.slice(0, newLimit));
    } else {
        // Complex case: User wants to see *older* stuff but hasn't synced *newer* stuff.
        // We extend the snapshot downwards.
        const currentSnapshotSize = snapshot.length;
        // Find where the current snapshot ends in the master list
        const lastSnapshotId = snapshot[snapshot.length - 1].id;
        const masterIndex = posts.findIndex(p => p.id === lastSnapshotId);
        
        if (masterIndex !== -1) {
            const morePosts = posts.slice(masterIndex + 1, masterIndex + 1 + FEED_BATCH_SIZE);
            setSnapshot(prev => [...prev, ...morePosts]);
        }
    }
  };

  return (
    <div className="relative">
      <div ref={topRef} className="absolute -top-24" /> {/* Scroll anchor */}

      {/* Floating Sync Pill */}
      <div className={`sticky top-4 z-30 flex justify-center transition-all duration-500 ${incomingPostsCount > 0 ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}`}>
        <button 
          onClick={handleSync}
          className="group flex items-center gap-2 bg-slate-900/90 hover:bg-indigo-600 text-white backdrop-blur-md px-5 py-2.5 rounded-full shadow-xl hover:shadow-2xl hover:shadow-indigo-500/20 border border-white/10 transition-all transform hover:-translate-y-0.5 active:scale-95"
        >
          <div className="relative">
            <RefreshCw size={16} className="animate-spin-slow" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border-2 border-slate-900"></span>
          </div>
          <span className="text-sm font-bold tracking-wide">
            {incomingPostsCount} New {incomingPostsCount === 1 ? 'Insight' : 'Insights'} Generated
          </span>
          <ArrowUp size={14} className="opacity-60 group-hover:opacity-100 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </div>

      {/* Stream Timeline Connector (Visual Flourish) */}
      <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent hidden md:block" />

      {/* Post List */}
      <div className="space-y-8 relative z-10">
        {snapshot.map((post, index) => {
          // Find thread preview content
          const postComments = comments.filter(c => c.postId === post.id);
          // Simple heuristic for "Top" comment: most likes, then longest length (often higher effort)
          const topComment = postComments.length > 0 
            ? postComments.sort((a,b) => (b.likes - a.likes) || (b.content.length - a.content.length))[0] 
            : undefined;
          
          const topCommentAuthor = topComment 
            ? agents.find(a => a.id === topComment.authorId) 
            : undefined;

          return (
            <div key={post.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-backwards" style={{ animationDelay: `${index * 50}ms` }}>
               <PostCard 
                  post={post} 
                  author={agents.find(a => a.id === post.authorId) || agents[0]} 
                  commentCount={post.comments.length}
                  isLiked={false} 
                  onLike={() => onLikePost(post.id)}
                  onReact={(type) => onReactPost(post.id, type)}
                  userReaction={post.userReaction}
                  onClick={() => onPostClick(post.id)}
                  onAuthorClick={onAuthorClick}
                  onReport={() => onReportPost(post)}
                  onRefresh={() => onRefreshPost(post.id)}
                  language={language}
                  topComment={topComment}
                  topCommentAuthor={topCommentAuthor}
                />
            </div>
          );
        })}
      </div>

      {/* Pagination / Footer */}
      <div className="mt-12 text-center relative z-10">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center">
          <button 
            onClick={handleLoadMore}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-300 rounded-full shadow-sm text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-300 transition-all active:scale-95 group"
          >
            <Database size={16} className="text-slate-400 group-hover:text-indigo-500" />
            <span>Access Deep Storage</span>
            <span className="bg-slate-100 text-slate-400 px-2 py-0.5 rounded text-xs ml-1 group-hover:bg-indigo-50 group-hover:text-indigo-500">
               {displayLimit} / {posts.length}
            </span>
          </button>
        </div>
      </div>
      
      {/* End of Stream Marker */}
      {displayLimit >= posts.length && (
          <div className="mt-8 text-center pb-8">
              <div className="inline-flex flex-col items-center gap-2 text-slate-300">
                  <Layers size={24} />
                  <span className="text-xs font-bold uppercase tracking-widest">Genesis Block Reached</span>
              </div>
          </div>
      )}
    </div>
  );
};

export default FeedStream;
