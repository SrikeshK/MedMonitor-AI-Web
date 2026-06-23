import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeToPosts,
  addPost,
  deletePost,
  likePost,
  reportPost
} from '../services/communityService';

/**
 * useCommunity Hook
 *
 * Manages the real-time state of the Community Hub post feed.
 * Follows the exact patterns established in useAnalytics.js and useMedicines.js:
 *
 *   - Reads currentUser from useAuth()
 *   - Guards on !currentUser → early return, loading = false
 *   - Subscribes in useEffect([currentUser])
 *   - Returns unsubscribe as cleanup function
 *   - All mutation actions wrapped in useCallback
 *
 * State exposed:
 *   posts   — Array of community post objects (real-time, ordered desc by createdAt)
 *   loading — true until first snapshot is received
 *   error   — Firestore error object (or null)
 *
 * Actions exposed:
 *   createPost  — Adds a new post authored by currentUser
 *   removePost  — Deletes a post by postId
 *   toggleLike  — Increments likesCount on a post
 *   reportPost  — Increments reportCount; flags post if >= 3 reports
 */
export const useCommunity = () => {
  const { currentUser } = useAuth();

  // ─── State ───────────────────────────────────────────────────────────────
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─── Realtime subscription ────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) {
      // Not authenticated — reset to idle state, do not subscribe
      setLoading(false);
      return;
    }

    console.log('[useCommunity] Initializing subscription...');
    setLoading(true);

    const unsubscribe = subscribeToPosts(
      (data) => {
        console.log('[useCommunity] Received posts, count:', data.length);
        setPosts(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('[useCommunity] Subscription error:', err);
        setError(err);
        setLoading(false);
      }
    );

    // Cleanup: unsubscribe from Firestore listener on unmount or user change
    return () => {
      console.log('[useCommunity] Cleaning up subscription');
      unsubscribe();
    };
  }, [currentUser]);

  // ─── Actions ─────────────────────────────────────────────────────────────

  /**
   * Create a new community post authored by the currently authenticated user.
   *
   * Automatically injects authorId, authorName, and authorPhotoURL
   * from currentUser — callers only need to provide content fields.
   *
   * @param {object} params
   * @param {string} params.title
   * @param {string} params.content
   * @param {string[]} [params.tags]
   * @returns {Promise<{ success: boolean, id: string }>}
   */
  const createPost = useCallback(
    async ({ title, content, tags = [], sentiment = 'NEUTRAL' }) => {
      return addPost({
        authorId:       currentUser.uid,
        authorName:     currentUser.displayName || 'Anonymous',
        authorPhotoURL: currentUser.photoURL || null,
        title,
        content,
        tags,
        sentiment
      });
    },
    [currentUser]
  );

  /**
   * Delete a community post by its document ID.
   *
   * @param {string} postId - Firestore document ID
   * @returns {Promise<{ success: boolean }>}
   */
  const removePost = useCallback(
    async (postId) => {
      return deletePost(postId);
    },
    []
  );

  /**
   * Increment the like count of a post.
   *
   * @param {string} postId - Firestore document ID
   * @returns {Promise<{ success: boolean }>}
   */
  const toggleLike = useCallback(
    async (postId) => {
      return likePost(postId);
    },
    []
  );

  /**
   * Report a post for moderation review.
   * Automatically flags the post if reportCount reaches threshold (3).
   *
   * @param {string} postId - Firestore document ID
   * @returns {Promise<{ success: boolean, flagged: boolean }>}
   */
  const handleReportPost = useCallback(
    async (postId) => {
      return reportPost(postId);
    },
    []
  );

  // ─── Return ───────────────────────────────────────────────────────────────
  return {
    // State
    posts,
    loading,
    error,

    // Actions
    createPost,
    removePost,
    toggleLike,
    reportPost: handleReportPost
  };
};
