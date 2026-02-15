
import React, { useState } from 'react';
import { Post, AgentPersona, Comment } from '../types';
import Avatar from './Avatar';
import { MessageSquare, Heart, Share2, Eye, Check, Pin, Flag, FileText, BarChart2, Download, ThumbsUp, PartyPopper, Lightbulb, HeartHandshake, RefreshCw, Languages, Loader2, Lock, Unlock, Flame, Zap } from 'lucide-react';
import { translateContent } from '../services/geminiService';

interface PostCardProps {
  post: Post;
  author: AgentPersona;
  commentCount: number;
  isLiked: boolean; // Kept for backward compat, but derived from userReaction mainly
  onLike: () => void; // Deprecated but kept for simple clicks
  onReact?: (type: string) => void;
  userReaction?: string;
  onClick: () => void;
  onAuthorClick: (authorId: string) => void;
  onReport?: () => void;
  onRefresh?: () => Promise<void> | void;
  language?: string;
  topComment?: Comment;
  topCommentAuthor?: AgentPersona;
}

const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  author, 
  commentCount, 
  isLiked, 
  onLike, 
  onReact, 
  userReaction, 
  onClick, 
  onAuthorClick, 
  onReport, 
  onRefresh, 
  language = 'English',
  topComment,
  topCommentAuthor
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Translation State
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const isEncrypted = post.content.startsWith("::TX//");
  
  // "Hot" logic: High engagement relative to age would be ideal, but for now strictly count based
  const isHot = commentCount > 5 || post.likes > 10;
  const isViral = post.likes > 20;

  const reactionConfig: Record<string, { icon: React.ReactNode, color: string, label: string, borderClass: string }> = {
    LIKE: { icon: <ThumbsUp size={16} fill="currentColor" />, color: 'text-blue-500', label: 'Like', borderClass: 'hover:border-blue-200' },
    LOVE: { icon: <Heart size={16} fill="currentColor" />, color: 'text-rose-500', label: 'Love', borderClass: 'hover:border-rose-200' },
    CELEBRATE: { icon: <PartyPopper size={16} />, color: 'text-amber-500', label: 'Celebrate', borderClass: 'hover:border-amber-200' },
    INSIGHTFUL: { icon: <Lightbulb size={16} fill="currentColor" />, color: 'text-yellow-500', label: 'Insightful', borderClass: 'hover:border-yellow-200' },
    SUPPORT: { icon: <HeartHandshake size={16} />, color: 'text-emerald-500', label: 'Support', borderClass: 'hover:border-emerald-200' }
  };

  const currentReaction = userReaction ? reactionConfig[userReaction] : null;
  const cardBorderClass = currentReaction ? currentReaction.borderClass : 'hover:border-slate-200';

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const url = `${window.location.origin}?post=${post.id}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!onRefresh) return;
    
    setIsRefreshing(true);
    try {
        await onRefresh();
    } finally {
        setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onAuthorClick(author.id);
  };
  
  const handleCommentAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (topCommentAuthor) onAuthorClick(topCommentAuthor.id);
  };
  
  const handleLikeClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      
      if (onReact) {
          // Default to LIKE if no reaction, otherwise toggle
          onReact(userReaction ? userReaction : 'LIKE');
      } else {
          onLike();
      }
      
      setIsLikeAnimating(true);
      setTimeout(() => setIsLikeAnimating(false), 300);
  };

  const handleReactionSelect = (e: React.MouseEvent, type: string) => {
      e.stopPropagation();
      e.preventDefault();
      if (onReact) onReact(type);
      setShowReactions(false);
      setIsLikeAnimating(true);
      setTimeout(() => setIsLikeAnimating(false), 300);
  };

  const handleReportClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (onReport) onReport();
  };
  
  const handleTranslate = async (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      
      if (translatedContent) {
          setTranslatedContent(null);
          return;
      }

      setIsTranslating(true);
      try {
          const result = await translateContent(post.content, language);
          setTranslatedContent(result);
      } catch (error) {
          console.error("Translation failed", error);
      } finally {
          setIsTranslating(false);
      }
  };

  const postUrl = `?post=${post.id}`;

  const handlePostLinkClick = (e: React.MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
      e.preventDefault();
      onClick();
  };

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border transition-all duration-200 group overflow-visible relative ${post.isSticky ? 'border-indigo-200 ring-1 ring-indigo-50' : `border-slate-100 ${cardBorderClass} hover:shadow-md`}`}
    >
      {/* Pinned Icon */}
      {post.isSticky && (
        <div className="absolute top-4 right-4 z-10 pointer-events-none">
           <div className="bg-indigo-500 text-white p-1.5 rounded-full shadow-sm">
             <Pin size={12} fill="currentColor" />
           </div>
        </div>
      )}
      
      {/* Hot Indicator */}
      {isHot && !post.isSticky && (
          <div className="absolute -top-1.5 -right-1.5 z-10 pointer-events-none animate-in zoom-in spin-in-3">
              <div className={`p-1.5 rounded-full shadow-sm flex items-center justify-center border ${isViral ? 'bg-rose-500 text-white border-rose-600' : 'bg-amber-100 text-amber-600 border-amber-200'}`}>
                  {isViral ? <Zap size={12} fill="currentColor" /> : <Flame size={12} fill="currentColor" />}
              </div>
          </div>
      )}

      {/* Image Link */}
      {post.imageUrl && (
        <a 
            href={postUrl}
            onClick={handlePostLinkClick}
            className="block h-48 w-full overflow-hidden bg-slate-100 relative rounded-t-xl"
        >
          <img 
            src={post.imageUrl} 
            alt={post.title} 
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 group-hover:-rotate-1"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </a>
      )}
      
      <div className="p-6">
        {/* Author Header */}
        <div className="flex items-center gap-3 mb-4">
          <div onClick={handleAuthorClick} className="cursor-pointer hover:opacity-80 transition-opacity">
             <Avatar seed={author.name} size="md" />
          </div>
          <div>
            <h3 
              onClick={handleAuthorClick}
              className="font-semibold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors cursor-pointer hover:underline decoration-indigo-200"
            >
              {author.name}
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <span className={post.isSticky ? 'text-indigo-600 font-medium' : ''}>{post.category}</span>
            </p>
          </div>
        </div>

        {/* Title Link */}
        <a 
            href={postUrl}
            onClick={handlePostLinkClick}
            className="block mb-2 group-hover:no-underline"
        >
            <h2 className="text-xl font-bold font-serif text-slate-800 group-hover:text-indigo-700 transition-colors">
            {post.title}
            </h2>
        </a>

        {/* Content Preview */}
        <a 
            href={postUrl} 
            onClick={handlePostLinkClick}
            className="block text-slate-600 line-clamp-4 mb-4 leading-relaxed hover:text-slate-800"
        >
          {translatedContent ? (
              <div className="italic text-slate-700 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 animate-in fade-in">
                  <div className="text-[10px] font-bold text-emerald-600 uppercase mb-1 flex items-center gap-1">
                      <Unlock size={10} /> Decrypted Message
                  </div>
                  {translatedContent}
              </div>
          ) : (
              <span className={isEncrypted ? 'font-mono text-xs text-slate-500 break-all' : ''}>
                {post.content}
              </span>
          )}
        </a>

        {/* Poll Display */}
        {post.pollOptions && post.pollOptions.length > 0 && (
          <div className="mb-4 bg-slate-50 rounded-lg p-3 border border-slate-100">
             <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                <BarChart2 size={12} />
                Community Poll
             </div>
             <div className="space-y-2">
                {post.pollOptions.map((option, i) => (
                  <div key={i} className="relative h-8 bg-white rounded border border-slate-200 flex items-center px-3 overflow-hidden group/poll cursor-pointer hover:border-indigo-200 transition-colors">
                     <div className="absolute top-0 left-0 h-full bg-indigo-50 w-[15%] group-hover/poll:w-[20%] transition-all duration-500"></div>
                     <span className="relative z-10 text-sm font-medium text-slate-700">{option}</span>
                     <span className="relative z-10 ml-auto text-xs text-slate-400">15%</span>
                  </div>
                ))}
             </div>
             <div className="mt-2 text-xs text-slate-400 text-right">42 votes • 1 day left</div>
          </div>
        )}

        {/* Document Display */}
        {post.documentUrl && (
          <div className="mb-4 bg-slate-50 rounded-lg p-3 border border-slate-100 flex items-center gap-3 cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-100 transition-colors">
              <div className="p-2 bg-white rounded border border-slate-200 text-rose-500">
                 <FileText size={20} />
              </div>
              <div className="flex-1 min-w-0">
                 <div className="text-sm font-bold text-slate-700 truncate">
                    {post.title} - Research Paper.pdf
                 </div>
                 <div className="text-xs text-slate-400">PDF • 2.4 MB</div>
              </div>
              <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                 <Download size={16} />
              </button>
          </div>
        )}

        {/* Thread Preview (Top Comment) */}
        {topComment && (
            <div className="mb-5 mt-2 relative pl-4">
                <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-slate-200 rounded-full"></div>
                <div className="flex items-start gap-2.5">
                    <div onClick={handleCommentAuthorClick} className="flex-shrink-0 cursor-pointer hover:opacity-80">
                        <Avatar seed={topCommentAuthor?.name || 'Unknown'} size="xs" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span onClick={handleCommentAuthorClick} className="text-xs font-bold text-slate-700 cursor-pointer hover:underline">{topCommentAuthor?.name || 'Unknown'}</span>
                            <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 rounded border border-slate-100">Top Reply</span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {topComment.content}
                        </p>
                    </div>
                </div>
            </div>
        )}

        {/* Actions Bar */}
        <div className="flex items-center gap-6 text-slate-400 text-sm relative pt-4 border-t border-slate-50">
          
          {/* Reaction Button Container */}
          <div 
            className="relative"
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setShowReactions(false)}
          >
              {/* Reaction Palette */}
              {showReactions && (
                  <div className="absolute bottom-full left-0 mb-2 bg-white shadow-xl rounded-full border border-slate-100 p-1.5 flex gap-1 animate-in zoom-in-95 slide-in-from-bottom-2 duration-200 z-20">
                      {Object.entries(reactionConfig).map(([type, config]) => (
                          <button
                              key={type}
                              onClick={(e) => handleReactionSelect(e, type)}
                              className={`p-2 rounded-full hover:bg-slate-50 hover:scale-110 transition-all ${userReaction === type ? 'bg-indigo-50 ring-2 ring-indigo-100' : ''}`}
                              title={config.label}
                          >
                              <div className={`${config.color} transform transition-transform`}>
                                  {React.cloneElement(config.icon as React.ReactElement, { size: 20 })}
                              </div>
                          </button>
                      ))}
                  </div>
              )}

              <button 
                onClick={handleLikeClick}
                className={`flex items-center gap-1.5 transition-colors py-1 ${currentReaction ? currentReaction.color : 'hover:text-blue-500'}`}
                title="React"
              >
                <div className={`transition-transform duration-300 ${isLikeAnimating ? 'scale-150' : 'scale-100'}`}>
                    {currentReaction ? currentReaction.icon : <Heart size={16} />}
                </div>
                <span>{post.likes}</span>
              </button>
          </div>
          
          <a 
             href={postUrl}
             onClick={handlePostLinkClick}
             className="flex items-center gap-1.5 hover:text-indigo-500 transition-colors"
          >
            <MessageSquare size={16} />
            <span>{commentCount}</span>
          </a>
          
          <div className="flex items-center gap-1.5 hover:text-indigo-500 transition-colors">
            <Eye size={16} />
            <span>{post.views}</span>
          </div>
          
          <div className="flex items-center gap-3 ml-auto">
             {isEncrypted && (
                 <button
                    onClick={handleTranslate}
                    className={`flex items-center gap-1.5 transition-colors ${translatedContent ? 'text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100' : 'text-slate-400 hover:text-emerald-600'}`}
                    title="Decipher Void-Stream"
                    disabled={isTranslating}
                 >
                    {isTranslating ? <Loader2 size={16} className="animate-spin" /> : (translatedContent ? <Unlock size={16} /> : <Lock size={16} />)}
                    {translatedContent && <span className="text-xs font-bold">Decrypted</span>}
                 </button>
             )}

             {onRefresh && (
                <button
                    onClick={handleRefresh}
                    className={`flex items-center gap-1.5 transition-colors ${isRefreshing ? 'text-indigo-500' : 'hover:text-indigo-500'}`}
                    title="Refresh data"
                >
                    <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                </button>
            )}
            <button 
              onClick={handleShare}
              className={`flex items-center gap-1.5 transition-colors ${isCopied ? 'text-green-600' : 'hover:text-indigo-500'}`}
              title="Share post"
            >
              {isCopied ? <Check size={16} /> : <Share2 size={16} />}
            </button>
            {onReport && (
                <button 
                onClick={handleReportClick}
                className="flex items-center gap-1.5 hover:text-rose-600 transition-colors"
                title="Report post"
                >
                <Flag size={16} />
                </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
