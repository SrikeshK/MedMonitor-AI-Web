import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  MessageSquarePlus,
  MessageCircle,
  Heart,
  Clock,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Trash2,
} from 'lucide-react';
import { useCommunity } from '../../hooks/useCommunity';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';
import { PostCardSkeleton } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import GlowButton from '../../components/GlowButton';
import CreatePostModal from '../../components/community/CreatePostModal';
import DiscussionModal from '../../components/community/DiscussionModal';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Formats a Firestore serverTimestamp (or JS Date) into a human-readable
 * relative string such as "2 hours ago" or an absolute date for older posts.
 */
const formatTimestamp = (ts) => {
  if (!ts) return '';
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ─── Sentiment Badge Config ───────────────────────────────────────────────────

const SENTIMENT_CONFIG = {
  POSITIVE: {
    label: 'Positive',
    className: 'bg-success/10 text-success border-success/20',
    icon: TrendingUp,
  },
  NEGATIVE: {
    label: 'Negative',
    className: 'bg-error/10 text-error border-error/20',
    icon: TrendingDown,
  },
  NEUTRAL: {
    label: 'Neutral',
    className: 'bg-primary-cyan/10 text-primary-cyan border-primary-cyan/20',
    icon: Minus,
  },
};

/**
 * SentimentBadge — small inline pill showing NLP-derived post sentiment.
 * Only rendered when `sentiment` field is present on the post document.
 */
const SentimentBadge = ({ sentiment }) => {
  const config = SENTIMENT_CONFIG[sentiment];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <span
      className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg border ${config.className}`}
    >
      <Icon size={10} />
      {config.label}
    </span>
  );
};

// ─── PostCard ─────────────────────────────────────────────────────────────────

const PostCard = ({ post, index, onViewDiscussion, onDeletePost }) => {
  const { currentUser } = useAuth();
  const avatarSeed = post.authorId || 'default';
  const isAuthor = currentUser && post.authorId === currentUser.uid;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      data-testid="post-card"
      className="glass-card p-5 group hover:border-primary-cyan/20 hover:bg-white/[0.05] transition-all duration-500 relative overflow-hidden"
    >
      {/* Subtle hover glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-cyan/5 to-primary-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="relative z-10 space-y-4">

        {/* ── Author Row ── */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
            <img
              src={
                post.authorPhotoURL ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}&backgroundColor=0B1120`
              }
              alt={post.authorName || 'Author avatar'}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white truncate">
              {post.authorName || 'Anonymous'}
            </p>
            <div className="flex items-center gap-1.5 text-slate-500">
              <Clock size={10} />
              <span className="text-[10px] font-medium">
                {formatTimestamp(post.createdAt)}
              </span>
            </div>
          </div>

          {/* Moderation badge — only when flagged */}
          {post.moderationStatus === 'FLAGGED' && (
            <span className="flex-shrink-0 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg bg-warning/10 text-warning border border-warning/20">
              Under Review
            </span>
          )}
        </div>

        {/* ── Title ── */}
        {post.title && (
          <h3 className="text-base font-bold text-white leading-snug group-hover:text-primary-cyan transition-colors duration-300 line-clamp-2">
            {post.title}
          </h3>
        )}

        {/* ── Content Preview ── */}
        {post.content && (
          <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">
            {post.content}
          </p>
        )}

        {/* ── Tags ── */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg bg-primary-cyan/5 text-primary-cyan/70 border border-primary-cyan/10"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* ── Footer: counters + sentiment badge ── */}
        <div className="flex items-center gap-4 pt-3 border-t border-white/5 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
            <MessageSquare size={13} />
            <span>{post.repliesCount ?? 0}</span>
          </div>

          <button
            onClick={() => onViewDiscussion?.(post)}
            data-testid="open-discussion-button"
            className="flex items-center gap-1.5 text-primary-cyan/80 hover:text-primary-cyan text-xs font-semibold ml-2 transition-colors cursor-pointer"
          >
            <MessageCircle size={13} />
            <span>View Discussion</span>
          </button>

          {isAuthor && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm("Are you sure you want to delete this discussion post?")) {
                  onDeletePost?.(post.id);
                }
              }}
              data-testid="delete-post-button"
              className="flex items-center gap-1.5 text-error/80 hover:text-error text-xs font-semibold ml-2 transition-colors cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Delete</span>
            </button>
          )}

          {/* Sentiment badge — right-aligned */}
          {post.sentiment && (
            <div className="ml-auto">
              <SentimentBadge sentiment={post.sentiment} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ─── Community Page ───────────────────────────────────────────────────────────

const Community = () => {
  const { posts, loading, error, createPost, removePost } = useCommunity();
  const { addToast } = useUI();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDiscussionOpen, setIsDiscussionOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  const handleViewDiscussion = (post) => {
    setSelectedPost(post);
    setIsDiscussionOpen(true);
  };

  const handlePostSuccess = () => {
    // The realtime onSnapshot listener in useCommunity updates `posts`
    // automatically — no manual refresh needed.
    addToast({ message: 'Discussion posted successfully!', type: 'success' });
  };

  const handleDeletePost = async (postId) => {
    try {
      await removePost(postId);
      addToast({ message: 'Discussion post deleted successfully!', type: 'success' });
    } catch (err) {
      console.error('[Community] Error deleting post:', err);
      addToast({ message: 'Failed to delete discussion post. Please try again.', type: 'error' });
    }
  };

  // ── Loading State ──
  if (loading) {
    return (
      <div className="space-y-8" data-testid="community-page">
        <div className="h-10 w-72 bg-white/5 animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // ── Error State ──
  if (error) {
    return (
      <div className="space-y-8" data-testid="community-page">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 flex flex-col items-center justify-center gap-4 text-center"
        >
          <div className="p-4 rounded-2xl bg-error/10 border border-error/20">
            <AlertCircle size={32} className="text-error" />
          </div>
          <h3 className="text-xl font-bold text-white">Failed to load Community</h3>
          <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
            We couldn't connect to the Community Hub. Please check your connection
            and refresh the page.
          </p>
        </motion.div>
      </div>
    );
  }

  // ── Main Render ──
  return (
    <div className="space-y-10 pb-20" data-testid="community-page">

      {/* Ambient background glows — matches PatientLayout pattern */}
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 w-[35%] h-[35%] bg-primary-cyan/[0.04] blur-[120px] rounded-full pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="fixed bottom-0 right-0 w-[35%] h-[35%] bg-primary-purple/[0.04] blur-[120px] rounded-full pointer-events-none"
      />

      {/* ── HEADER ── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2 text-primary-cyan mb-2"
          >
            <Heart className="w-4 h-4" />
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase">
              Patient Network
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="text-4xl font-bold font-display text-white tracking-tight"
          >
            Community{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-cyan to-primary-purple">
              Hub
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-slate-400 mt-1 font-medium"
          >
            Ask questions, share experiences, and support other patients.
          </motion.p>
        </div>

        {/* Create Post CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <GlowButton
            onClick={() => setIsCreateOpen(true)}
            data-testid="create-post-button"
            className="w-auto px-6 flex items-center gap-2"
          >
            <MessageSquarePlus size={18} />
            Create Post
          </GlowButton>
        </motion.div>
      </header>

      {/* ── STATS STRIP ── */}
      {posts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex items-center gap-4 flex-wrap"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-cyan/5 border border-primary-cyan/10">
            <MessageSquare size={14} className="text-primary-cyan" />
            <span className="text-xs font-bold text-primary-cyan">
              {posts.length} Discussion{posts.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10">
            <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Live
            </span>
          </div>
        </motion.div>
      )}

      {/* ── FEED ── */}
      {posts.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No discussions yet"
          description="Be the first member to start a discussion with the community."
          actionLabel="Create First Post"
          onAction={() => setIsCreateOpen(true)}
          data-testid="community-empty-state"
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {posts.map((post, i) => (
            <PostCard
              key={post.id}
              post={post}
              index={i}
              onViewDiscussion={handleViewDiscussion}
              onDeletePost={handleDeletePost}
            />
          ))}
        </motion.div>
      )}

      {/* ── CREATE POST MODAL ── */}
      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handlePostSuccess}
        createPost={createPost}
      />

      {/* ── DISCUSSION DETAIL MODAL ── */}
      <DiscussionModal
        isOpen={isDiscussionOpen}
        onClose={() => {
          setIsDiscussionOpen(false);
          setSelectedPost(null);
        }}
        post={selectedPost}
      />
    </div>
  );
};

export default Community;
