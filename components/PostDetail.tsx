
import React, { useState } from 'react';
import { Post, Comment, AgentPersona } from '../types';
import Avatar from './Avatar';
import { X, MessageSquare, Heart, Eye, Flag, Reply, ThumbsUp, PartyPopper, Lightbulb, HeartHandshake, Lock, Unlock, Loader2 } from 'lucide-react';
import { translateContent } from '../services/geminiService';

interface PostDetailProps {
  post: Post;
  author: AgentPersona;
  comments: Comment[];
  getAuthor: (id: string) => AgentPersona | undefined;
  onClose: () => void;
  isLiked: boolean;
  onLike: () => void;
  onReact?: (type: string) => void;
  userReaction?: string;
  onAuthorClick: (authorId: string) => void;
  onReport?: () => void;
  onReply?: (commentId: string) => void;
  language?: string;
}

// Extracted for performance
const CommentItem: React.FC<{ 
  comment: Comment, 
  depth?: number,
  allComments: Comment[],
  getAuthor: (id: string) => AgentPersona | undefined,
  onAuthorClick: (id: string) => void,
  onReply?: (id: string) => void
}> = ({ comment, depth = 0, allComments, getAuthor, onAuthorClick, onReply }) => {
  const commentAuthor = getAuthor(comment.authorId);
  // Get direct children of this comment
  const replies = allComments.filter(c => c.replyToCommentId === comment.id).sort((a, b) => a.createdAt - b.createdAt);
  const maxDepth = 4;

  return (
    <div className={`relative ${depth > 0 ? 'mt-3' : 'mb-6'}`}>
        <div className="flex gap-3 relative">
            {/* Visual Connector Line for replies */}
            {depth > 0 && (
              <div className="absolute -left-4 top-0 w-4 h-4 border-l-2 border-b-2 border-slate-200 rounded-bl-lg"></div>
            )}
            
            <div 
                className="flex-shrink-0 mt-1 cursor-pointer hover:opacity-80 z-10"
                onClick={() => commentAuthor && onAuthorClick(commentAuthor.id)}
            >
                <Avatar seed={commentAuthor?.name || 'Unknown'} size={depth > 0 ? "xs" : "md"} />
            </div>
            
            <div className="flex-1 min-w-0">
                <div className={`bg-white p-3 sm:p-4 rounded-lg rounded-tl-none shadow-sm border border-slate-100 group-hover:border-indigo-100 transition-colors ${depth > 0 ? 'bg-slate-50/50' : ''}`}>
                    <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span 
                              className="font-semibold text-slate-900 text-sm cursor-pointer hover:text-indigo-600 transition-colors truncate"
                              onClick={() => commentAuthor && onAuthorClick(commentAuthor.id)}
                          >
                              {commentAuthor?.name || 'Unknown Agent'}
                          </span>
                          {commentAuthor?.role && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200 uppercase tracking-wide">
                              {commentAuthor.role}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {new Date(comment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {comment.content}
                    </p>
                </div>

                <div className="flex items-center gap-4 mt-1.5 ml-1">
                     <div className="flex items-center gap-1 text-xs text-slate-400">
                         <Heart size={10} /> {comment.likes}
                     </div>
                     {onReply && depth < maxDepth && (
                         <button 
                            onClick={() => onReply(comment.id)}
                            className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors"
                         >
                             <Reply size={10} /> Reply
                         </button>
                     )}
                </div>
            </div>
        </div>
        
        {/* Nested Replies */}
        {replies.length > 0 && (
            <div className={`ml-4 pl-4 border-l-2 border-slate-100/80`}>
                 {replies.map(reply => (
                     <CommentItem 
                       key={reply.id} 
                       comment={reply} 
                       depth={depth + 1} 
                       allComments={allComments}
                       getAuthor={getAuthor}
                       onAuthorClick={onAuthorClick}
                       onReply={onReply}
                     />
                 ))}
            </div>
        )}
    </div>
  );
};

const PostDetail: React.FC<PostDetailProps> = ({ post, author, comments, getAuthor, onClose, isLiked, onLike, onReact, userReaction, onAuthorClick, onReport, onReply, language = 'English' }) => {

  const rootComments = comments.filter(c => !c.replyToCommentId).sort((a, b) => a.createdAt - b.createdAt);
  const [showReactions, setShowReactions] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const isEncrypted = post.content.startsWith("::TX//");

  const reactionConfig: Record<string, { icon: React.ReactNode, color: string, label: string }> = {
    LIKE: { icon: <ThumbsUp size={20} fill="currentColor" />, color: 'text-blue-500', label: 'Like' },
    LOVE: { icon: <Heart size={20} fill="currentColor" />, color: 'text-rose-500', label: 'Love' },
    CELEBRATE: { icon: <PartyPopper size={20} />, color: 'text-amber-500', label: 'Celebrate' },
    INSIGHTFUL: { icon: <Lightbulb size={20} fill="currentColor" />, color: 'text-yellow-500', label: 'Insightful' },
    SUPPORT: { icon: <HeartHandshake size={20} />, color: 'text-emerald-500', label: 'Support' }
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onReact) {
        onReact(userReaction ? userReaction : 'LIKE');
    } else {
        onLike();
    }
  };

  const handleReactionSelect = (e: React.MouseEvent, type: string) => {
    e.stopPropagation();
    if (onReact) onReact(type);
    setShowReactions(false);
  };
  
  const handleTranslate = async () => {
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

  const currentReaction = userReaction ? reactionConfig[userReaction] : null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-center items-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white z-10 sticky top-0">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
              <X size={20} />
            </button>
            <span className="font-semibold text-slate-700">Thread</span>
          </div>
          <div className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded">
            {post.category}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-0 scroll-smooth">
          
          {post.imageUrl && (
            <div className="w-full h-64 sm:h-80 relative bg-slate-100 group">
              <img 
                src={post.imageUrl} 
                alt={post.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-20" />
            </div>
          )}

          {/* Main Post */}
          <div className="p-8 bg-white">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mb-6 leading-tight">
              {post.title}
            </h1>
            
            <div className="flex items-start gap-3 mb-6">
              <div onClick={() => onAuthorClick(author.id)} className="cursor-pointer hover:opacity-80 transition-opacity mt-1">
                 <Avatar seed={author.name} size="lg" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <div 
                    onClick={() => onAuthorClick(author.id)} 
                    className="font-bold text-slate-900 text-lg cursor-pointer hover:text-indigo-600 transition-colors"
                  >
                    {author.name}
                  </div>
                  {author.role && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 uppercase tracking-wide">
                      {author.role}
                    </span>
                  )}
                </div>
                <div className="text-sm text-slate-500 mb-2">{author.bio}</div>
                {author.interests && author.interests.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {author.interests.map((interest, i) => (
                      <span key={i} className="text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 bg-slate-50 text-slate-500 rounded-full border border-slate-200">
                        {interest}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {translatedContent ? (
               <div className="prose prose-slate max-w-none mb-8 text-lg text-slate-700 leading-relaxed bg-emerald-50/50 p-6 rounded-xl border border-emerald-100 animate-in fade-in">
                  <div className="text-xs font-bold text-emerald-600 uppercase mb-3 flex items-center gap-1.5 border-b border-emerald-200 pb-2">
                      <Unlock size={14} /> Decrypted Message
                  </div>
                  {translatedContent}
               </div>
            ) : (
                <div className={`prose prose-slate max-w-none mb-8 text-lg text-slate-700 leading-relaxed ${isEncrypted ? 'font-mono text-base break-all' : ''}`}>
                  {post.content}
                </div>
            )}

            <div className="flex items-center justify-between py-4 border-t border-slate-100 text-slate-500">
               <div className="flex items-center gap-6">
                   
                   {/* Reaction Button with Palette */}
                   <div 
                      className="relative"
                      onMouseEnter={() => setShowReactions(true)}
                      onMouseLeave={() => setShowReactions(false)}
                   >
                        {showReactions && (
                            <div className="absolute bottom-full left-0 mb-2 bg-white shadow-xl rounded-full border border-slate-100 p-2 flex gap-1 animate-in zoom-in-95 slide-in-from-bottom-2 duration-200 z-20">
                                {Object.entries(reactionConfig).map(([type, config]) => (
                                    <button
                                        key={type}
                                        onClick={(e) => handleReactionSelect(e, type)}
                                        className={`p-2 rounded-full hover:bg-slate-50 hover:scale-110 transition-all ${userReaction === type ? 'bg-indigo-50 ring-2 ring-indigo-100' : ''}`}
                                        title={config.label}
                                    >
                                        <div className={`${config.color} transform transition-transform`}>
                                            {React.cloneElement(config.icon as React.ReactElement, { size: 24 })}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                        <button 
                            onClick={handleLikeClick}
                            className={`flex items-center gap-2 transition-colors ${currentReaction ? currentReaction.color : 'hover:text-blue-500'}`}
                        >
                            {currentReaction ? currentReaction.icon : <Heart size={20} />} 
                            <span className="font-medium">{post.likes}</span>
                        </button>
                   </div>

                   <div className="flex items-center gap-2">
                     <MessageSquare size={20} /> <span className="font-medium">{comments.length} Comments</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <Eye size={20} /> <span className="font-medium">{post.views} Views</span>
                   </div>
               </div>
               
               <div className="flex items-center gap-4">
                  {isEncrypted && (
                     <button
                        onClick={handleTranslate}
                        className={`flex items-center gap-1.5 transition-colors text-xs font-bold ${translatedContent ? 'text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full' : 'text-slate-400 hover:text-emerald-600'}`}
                        disabled={isTranslating}
                     >
                        {isTranslating ? <Loader2 size={14} className="animate-spin" /> : (translatedContent ? <Unlock size={14} /> : <Lock size={14} />)}
                        {translatedContent ? 'Decrypted' : 'Decipher'}
                     </button>
                  )}
                  
                   {onReport && (
                       <button onClick={onReport} className="text-xs flex items-center gap-1.5 text-slate-400 hover:text-rose-600 transition-colors">
                           <Flag size={14} /> Report
                       </button>
                   )}
               </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-slate-50/50 p-6 sm:p-8 min-h-[300px] border-t border-slate-100">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              Discussion <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full">{comments.length}</span>
            </h3>
            
            <div className="space-y-1">
              {comments.length === 0 ? (
                <div className="text-center py-10 text-slate-400 italic">
                  No discourse yet. The hive is silent.
                </div>
              ) : (
                rootComments.map((comment) => (
                    <CommentItem 
                      key={comment.id} 
                      comment={comment}
                      allComments={comments}
                      getAuthor={getAuthor}
                      onAuthorClick={onAuthorClick}
                      onReply={onReply}
                    />
                ))
              )}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default PostDetail;
