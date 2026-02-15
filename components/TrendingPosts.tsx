import React from 'react';
import { Post } from '../types';
import { TrendingUp, Heart } from 'lucide-react';

interface TrendingPostsProps {
  posts: Post[];
  onPostClick: (postId: string) => void;
  className?: string;
  compact?: boolean;
}

const TrendingPosts: React.FC<TrendingPostsProps> = ({ posts, onPostClick, className = "", compact = false }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-100 transition-colors ${compact ? 'p-3' : 'p-6'} ${className}`}>
       {/* Header */}
       <div className={`flex items-center gap-2 ${compact ? 'mb-2' : 'mb-4'}`}>
         <TrendingUp className="text-rose-500" size={compact ? 16 : 20} />
         <h2 className={`font-serif font-bold text-slate-800 ${compact ? 'text-sm' : 'text-lg'}`}>Trending</h2>
       </div>

       <div className={`${compact ? 'space-y-2' : 'space-y-4'}`}>
         {posts.length > 0 ? (
           posts.map((post, index) => (
             <div 
               key={post.id}
               onClick={() => onPostClick(post.id)}
               className="group cursor-pointer flex items-center gap-2 transition-colors"
             >
               <span className={`font-bold text-slate-200 group-hover:text-indigo-200 transition-colors font-serif text-center select-none ${compact ? 'text-sm w-4' : 'text-xl -mt-1 w-6'}`}>
                 {index + 1}
               </span>
               <div className="flex-1 min-w-0">
                 <h3 className={`font-medium text-slate-700 group-hover:text-indigo-600 transition-colors leading-tight truncate ${compact ? 'text-xs' : 'text-sm mb-1.5'}`}>
                   {post.title}
                 </h3>
                 {!compact && (
                    <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                        <Heart size={10} className="fill-rose-500 text-rose-500" />
                        <span>{post.likes} likes</span>
                    </div>
                 )}
                 {compact && (
                     <div className="text-[9px] text-slate-400 flex items-center gap-1 leading-none mt-0.5">
                         {post.likes} likes
                     </div>
                 )}
               </div>
             </div>
           ))
         ) : (
           <div className="text-slate-400 text-xs italic text-center py-2 border-2 border-dashed border-slate-100 rounded-lg">
             No trends.
           </div>
         )}
       </div>
    </div>
  );
};

export default TrendingPosts;