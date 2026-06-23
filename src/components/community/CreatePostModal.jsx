import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquarePlus, AlertCircle, CheckCircle } from 'lucide-react';
import GlowButton from '../GlowButton';
import { useUI } from '../../context/UIContext';
import { analyzeSentiment, containsInappropriateContent } from '../../utils/communityNLP';

/**
 * CreatePostModal
 *
 * Follows AddMedicineModal architecture exactly:
 *   - isOpen prop + AnimatePresence
 *   - Fixed overlay z-50 with backdrop blur
 *   - motion.div scale + opacity entry animation
 *   - glass-card container
 *   - ESC key handler + browser back-button interception (history.pushState)
 *   - GlowButton for submit
 *   - useUI toast for feedback
 *
 * NLP pipeline (runs before every save):
 *   1. containsInappropriateContent(title + content) → blocks if true
 *   2. analyzeSentiment(title + content) → stored on post document
 *
 * Props:
 *   isOpen     {boolean}  - controls visibility
 *   onClose    {function} - called to close modal
 *   onSuccess  {function} - called after successful post creation
 *   createPost {function} - from useCommunity hook
 */
const CreatePostModal = ({ isOpen, onClose, onSuccess, createPost }) => {
  const { addToast } = useUI();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title:   '',
    content: ''
  });

  // Derived character counts for inline feedback
  const titleLength   = formData.title.length;
  const contentLength = formData.content.length;

  // ─── ESC key + browser back-button handling ───────────────────────────────
  // Mirrors AddMedicineModal's exact pattern
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

  // ─── Form reset on close ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setFormData({ title: '', content: '' });
      setLoading(false);
    }
  }, [isOpen]);

  // ─── Change handlers ──────────────────────────────────────────────────────
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ─── Submission + validation ──────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    const title   = formData.title.trim();
    const content = formData.content.trim();

    // ── 1. Required field check ──
    if (!title) {
      addToast({ message: 'Please enter a post title.', type: 'warning' });
      return;
    }

    // ── 2. Minimum content length ──
    if (content.length < 20) {
      addToast({
        message: 'Discussion must be at least 20 characters.',
        type: 'warning'
      });
      return;
    }

    // ── 3. NLP profanity gate ──
    // Checks the combined title + content string for inappropriate words.
    if (containsInappropriateContent(`${title} ${content}`)) {
      addToast({
        message: 'Your message violates community guidelines.',
        type: 'error'
      });
      return;
    }

    setLoading(true);

    try {
      // ── 4. NLP sentiment analysis ──
      // Analysed on the combined text; stored as a field on the post document.
      const sentiment = analyzeSentiment(`${title} ${content}`);

      // ── 5. Persist to Firestore via hook ──
      await createPost({
        title,
        content,
        tags: [],      // Tag input deferred to a future iteration
        sentiment
      });

      addToast({
        message: 'Your post has been shared with the community!',
        type: 'success'
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('[CreatePostModal] Error creating post:', err);
      addToast({
        message: 'Failed to share post. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // ─── Sentiment preview (shown while typing — encourages positive tone) ────
  const sentimentPreview = formData.content.length >= 10
    ? analyzeSentiment(`${formData.title} ${formData.content}`)
    : null;

  const sentimentConfig = {
    POSITIVE: { label: 'Positive tone', color: 'text-success', bg: 'bg-success/10 border-success/20', icon: <CheckCircle size={11} /> },
    NEGATIVE: { label: 'Negative tone', color: 'text-error',   bg: 'bg-error/10 border-error/20',     icon: <AlertCircle size={11} /> },
    NEUTRAL:  { label: 'Neutral tone',  color: 'text-primary-cyan', bg: 'bg-primary-cyan/10 border-primary-cyan/20', icon: null },
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
          data-testid="create-post-modal"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="glass-card w-full max-w-lg relative border border-primary-cyan/20"
          >
            {/* Ambient glow behind card */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-cyan/5 to-primary-purple/5 rounded-3xl pointer-events-none" />

            <div className="relative z-10 p-6 space-y-6">
              {/* ── Modal Header ── */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary-cyan/10 border border-primary-cyan/20">
                    <MessageSquarePlus size={20} className="text-primary-cyan" />
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-bold text-white leading-none">
                      New Discussion
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

              {/* ── Form ── */}
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Title field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="community-post-title"
                      className="text-sm font-semibold text-slate-300"
                    >
                      Title <span className="text-error">*</span>
                    </label>
                    <span className={`text-[10px] font-medium transition-colors ${
                      titleLength > 90 ? 'text-warning' : 'text-slate-600'
                    }`}>
                      {titleLength}/100
                    </span>
                  </div>
                  <input
                    id="community-post-title"
                    type="text"
                    required
                    maxLength={100}
                    autoComplete="off"
                    data-testid="post-title-input"
                    placeholder="What would you like to discuss?"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-primary-cyan/50 focus:bg-white/[0.05] focus:ring-2 focus:ring-primary-cyan/10 transition-all"
                  />
                </div>

                {/* Discussion / Content field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="community-post-content"
                      className="text-sm font-semibold text-slate-300"
                    >
                      Discussion <span className="text-error">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      {/* Live sentiment preview */}
                      {sentimentPreview && (
                        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border ${sentimentConfig[sentimentPreview].bg} ${sentimentConfig[sentimentPreview].color}`}>
                          {sentimentConfig[sentimentPreview].icon}
                          {sentimentConfig[sentimentPreview].label}
                        </span>
                      )}
                      <span className={`text-[10px] font-medium transition-colors ${
                        contentLength > 900
                          ? 'text-error'
                          : contentLength > 750
                          ? 'text-warning'
                          : 'text-slate-600'
                      }`}>
                        {contentLength}/1000
                      </span>
                    </div>
                  </div>
                  <textarea
                    id="community-post-content"
                    required
                    minLength={20}
                    maxLength={1000}
                    rows={5}
                    data-testid="post-content-input"
                    placeholder="Share your experience, question, or advice with the community... (min. 20 characters)"
                    value={formData.content}
                    onChange={(e) => handleChange('content', e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-primary-cyan/50 focus:bg-white/[0.05] focus:ring-2 focus:ring-primary-cyan/10 transition-all resize-none custom-scrollbar"
                  />
                  {/* Minimum length indicator */}
                  {contentLength > 0 && contentLength < 20 && (
                    <p className="text-[10px] text-warning flex items-center gap-1.5 font-medium">
                      <AlertCircle size={10} />
                      {20 - contentLength} more characters needed
                    </p>
                  )}
                </div>

                {/* Community guidelines reminder */}
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <CheckCircle size={14} className="text-success flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Be respectful and supportive. Posts are reviewed by our NLP moderation system
                    and community guidelines are enforced automatically.
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <GlowButton
                    type="submit"
                    loading={loading}
                    data-testid="submit-post-button"
                    className="w-auto px-8"
                    disabled={loading || titleLength === 0 || contentLength < 20}
                  >
                    <MessageSquarePlus size={16} />
                    Post to Community
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

export default CreatePostModal;
