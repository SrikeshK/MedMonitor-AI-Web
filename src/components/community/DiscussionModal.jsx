import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, AlertCircle, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import GlowButton from '../GlowButton';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';
import { subscribeToReplies, addReply } from '../../services/communityService';
import { analyzeSentiment, containsInappropriateContent } from '../../utils/communityNLP';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Formats timestamps for posts and replies.
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

// ─── Sentiment Badge Configuration ──────────────────────────────────────────

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

const SentimentBadge = ({ sentiment }) => {
  const config = SENTIMENT_CONFIG[sentiment];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg border ${config.className}`}
    >
      <Icon size={10} />
      {config.label}
    </span>
  );
};

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * DiscussionModal
 *
 * Implements a detail modal view for a community post containing:
 *   - The parent post content, author details, and sentiment.
 *   - A real-time reply list (subscribeToReplies).
 *   - A text area to write and post new replies (NLP audited).
 *
 * Props:
 *   isOpen     {boolean}  - Controls visibility state
 *   onClose    {function} - Callback when closing the modal
 *   post       {object}   - The parent post document object
 */
const DiscussionModal = ({ isOpen, onClose, post }) => {
  const { addToast } = useUI();
  const { currentUser } = useAuth();

  const [replies, setReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(true);
  const [errorReplies, setErrorReplies] = useState(null);

  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const repliesEndRef = useRef(null);

  // ─── ESC Key + popstate handling ──────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };

      const handlePopState = (e) => {
        if (isOpen) {
          e.preventDefault();
          onClose();
          window.history.pushState(null, null, window.location.pathname);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      window.history.pushState(null, null, window.location.pathname);
      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isOpen, onClose]);

  // ─── Realtime subscription for replies ────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !post?.id) {
      setReplies([]);
      setLoadingReplies(false);
      return;
    }

    setLoadingReplies(true);
    setErrorReplies(null);

    const unsubscribe = subscribeToReplies(
      post.id,
      (data) => {
        setReplies(data);
        setLoadingReplies(false);
      },
      (err) => {
        console.error('[DiscussionModal] Error loading replies:', err);
        setErrorReplies(err);
        setLoadingReplies(false);
        addToast({ message: 'Failed to sync replies.', type: 'error' });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isOpen, post?.id, addToast]);

  // ─── Auto Scroll to bottom on new replies ──────────────────────────────────
  useEffect(() => {
    if (replies.length > 0) {
      repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [replies.length]);

  // ─── Form Submission handler ──────────────────────────────────────────────
  const handleSendReply = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      addToast({ message: 'You must be signed in to reply.', type: 'warning' });
      return;
    }

    const trimmedContent = replyText.trim();

    // Field validation (5 - 500 characters)
    if (trimmedContent.length < 5) {
      addToast({ message: 'Reply must be at least 5 characters.', type: 'warning' });
      return;
    }

    if (trimmedContent.length > 500) {
      addToast({ message: 'Reply must be 500 characters or fewer.', type: 'warning' });
      return;
    }

    // NLP profanity validation
    if (containsInappropriateContent(trimmedContent)) {
      addToast({
        message: 'Your message violates community guidelines.',
        type: 'error'
      });
      return;
    }

    setSubmittingReply(true);

    try {
      // Analyze sentiment of the reply content
      const sentiment = analyzeSentiment(trimmedContent);

      // Save reply doc to Firestore
      await addReply({
        postId:         post.id,
        content:        trimmedContent,
        sentiment,
        authorId:       currentUser.uid,
        authorName:     currentUser.displayName || 'Anonymous',
        authorPhotoURL: currentUser.photoURL || null
      });

      // Clear the reply input text on success
      setReplyText('');
      addToast({ message: 'Reply posted!', type: 'success' });
    } catch (err) {
      console.error('[DiscussionModal] Error adding reply:', err);
      addToast({ message: 'Failed to send reply. Please try again.', type: 'error' });
    } finally {
      setSubmittingReply(false);
    }
  };

  if (!post) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
          data-testid="discussion-modal"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="glass-card w-full max-w-2xl relative border border-primary-cyan/20 flex flex-col max-h-[85vh] overflow-hidden"
          >
            {/* Ambient glow behind card */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-cyan/5 to-primary-purple/5 rounded-3xl pointer-events-none" />

            {/* ── Modal Header ── */}
            <div className="relative z-10 p-5 border-b border-white/5 flex items-start justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary-cyan/10 border border-primary-cyan/20 text-primary-cyan">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-display font-bold text-white leading-tight truncate max-w-md">
                    Discussion
                  </h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                    Community Hub
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* ── Modal Body Content (Scrollable Container) ── */}
            <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              
              {/* ── Parent Post Detail Card ── */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                    <img
                      src={
                        post.authorPhotoURL ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorId || 'default'}&backgroundColor=0B1120`
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
                  {post.sentiment && (
                    <SentimentBadge sentiment={post.sentiment} />
                  )}
                </div>

                <h3 className="text-base font-bold text-white leading-snug">
                  {post.title}
                </h3>

                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>
              </div>

              {/* ── Replies Section ── */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <span>Replies</span>
                  <span className="h-px bg-white/5 flex-grow" />
                  {replies.length > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-slate-400 font-bold">
                      {replies.length}
                    </span>
                  )}
                </h4>

                {loadingReplies ? (
                  <div className="space-y-3">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 animate-pulse space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-white/5" />
                          <div className="w-24 h-3 bg-white/5 rounded" />
                        </div>
                        <div className="w-full h-10 bg-white/5 rounded" />
                      </div>
                    ))}
                  </div>
                ) : errorReplies ? (
                  <div className="flex items-center gap-2 text-error text-xs p-4 rounded-xl bg-error/5 border border-error/10">
                    <AlertCircle size={14} />
                    <span>Failed to retrieve discussion thread.</span>
                  </div>
                ) : replies.length === 0 ? (
                  <div className="text-center py-6 px-4 border border-dashed border-white/10 rounded-2xl">
                    <p className="text-slate-400 text-sm font-semibold">No replies yet</p>
                    <p className="text-slate-600 text-xs mt-1">
                      Start the discussion by helping another member.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {replies.map((reply) => {
                      const replySeed = reply.authorId || 'default';
                      return (
                        <div
                          key={reply.id}
                          data-testid="reply-card"
                          className="bg-white/[0.01] border border-white/5 hover:border-white/10 rounded-2xl p-4 space-y-3 transition-colors relative"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                              <img
                                src={
                                  reply.authorPhotoURL ||
                                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${replySeed}&backgroundColor=0B1120`
                                }
                                alt={reply.authorName || 'Author avatar'}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline gap-2">
                                <p className="text-xs font-bold text-white truncate">
                                  {reply.authorName || 'Anonymous'}
                                </p>
                                <span className="text-[9px] text-slate-500">
                                  {formatTimestamp(reply.createdAt)}
                                </span>
                              </div>
                            </div>
                            {reply.sentiment && (
                              <SentimentBadge sentiment={reply.sentiment} />
                            )}
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                            {reply.content}
                          </p>
                        </div>
                      );
                    })}
                    <div ref={repliesEndRef} />
                  </div>
                )}
              </div>
            </div>

            {/* ── Reply Input Area (Footer) ── */}
            <div className="relative z-10 p-5 border-t border-white/5 bg-slate-950/60 backdrop-blur flex-shrink-0">
              <form onSubmit={handleSendReply} className="space-y-3">
                <div className="relative">
                  <textarea
                    data-testid="reply-input"
                    placeholder="Share your experience or answer..."
                    required
                    minLength={5}
                    maxLength={500}
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    disabled={submittingReply}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-primary-cyan/50 focus:bg-white/[0.05] focus:ring-2 focus:ring-primary-cyan/10 transition-all resize-none custom-scrollbar"
                  />
                  {/* Inline character indicator */}
                  <span className={`absolute bottom-2.5 right-3 text-[9px] font-bold ${
                    replyText.length > 450 ? 'text-warning' : 'text-slate-600'
                  }`}>
                    {replyText.length}/500
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-[9px] text-slate-500 leading-relaxed max-w-[70%]">
                    Be supportive. Replies are analyzed by automated NLP systems.
                  </p>
                  <GlowButton
                    type="submit"
                    loading={submittingReply}
                    data-testid="send-reply-button"
                    disabled={submittingReply || replyText.trim().length < 5}
                    className="w-auto px-6 py-2 h-9 text-xs"
                  >
                    Send Reply
                  </GlowButton>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DiscussionModal;
