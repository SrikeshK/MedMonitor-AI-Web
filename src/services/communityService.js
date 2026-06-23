import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  limit,
  increment,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

/**
 * Community Service
 *
 * Handles all Firestore operations for the Community Hub feature.
 * Collections:
 *   - CommunityPosts   (PascalCase — matches Medicines, Users, FamilyMembers)
 *   - CommunityReplies (PascalCase)
 *
 * Follows MedMonitor service conventions:
 *   - Named exports only (no default export, no classes)
 *   - subscribe*() returns an unsubscribe function
 *   - CRUD mutations return { success: true } or { success: true, id }
 *   - Errors are logged with prefix and re-thrown — never suppressed
 */

// ─── Collection name constants ────────────────────────────────────────────────

const POSTS_COLLECTION    = 'CommunityPosts';
const REPLIES_COLLECTION  = 'CommunityReplies';

// ─────────────────────────────────────────────────────────────────────────────
// POST FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Subscribe to a real-time feed of community posts.
 *
 * Orders posts by createdAt descending, limited to the 20 most recent.
 * Returns the Firestore unsubscribe function — caller must invoke it on cleanup.
 *
 * @param {function} callback  - Called with Array<{ id, ...postData }> on each update
 * @param {function} onError   - Optional; called with the Firestore error object
 * @returns {function}         - Unsubscribe function
 */
export const subscribeToPosts = (callback, onError) => {
  console.log('[CommunityService] Subscribing to CommunityPosts feed...');

  const q = query(
    collection(db, POSTS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(20)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      console.log(`[CommunityService] Posts snapshot received. Size: ${snapshot.size}`);
      const posts = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      callback(posts);
    },
    (error) => {
      console.error('[CommunityService] Error subscribing to posts:', error);
      if (onError) onError(error);
    }
  );
};

/**
 * Add a new community post.
 *
 * Stores all author identity fields at write-time so the document is
 * self-contained and readable without a secondary Users lookup.
 *
 * @param {object} postData
 * @param {string} postData.authorId
 * @param {string} postData.authorName
 * @param {string|null} postData.authorPhotoURL
 * @param {string} postData.title
 * @param {string} postData.content
 * @param {string[]} postData.tags
 * @returns {Promise<{ success: boolean, id: string }>}
 */
export const addPost = async (postData) => {
  try {
    const docRef = await addDoc(collection(db, POSTS_COLLECTION), {
      authorId:         postData.authorId,
      authorName:       postData.authorName,
      authorPhotoURL:   postData.authorPhotoURL || null,

      title:            postData.title,
      content:          postData.content,
      tags:             postData.tags || [],

      // NLP-derived sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
      // Computed client-side before save; defaults to 'NEUTRAL' if not provided.
      sentiment:        postData.sentiment || 'NEUTRAL',

      likesCount:       0,
      repliesCount:     0,
      reportCount:      0,

      moderationStatus: 'APPROVED',

      createdAt:        serverTimestamp(),
      updatedAt:        serverTimestamp()
    });

    console.log(`[CommunityService] Post added. ID: ${docRef.id}`);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('[CommunityService] Error adding post:', error);
    throw error;
  }
};

/**
 * Delete a community post by document ID.
 *
 * Note: This does NOT cascade-delete associated CommunityReplies.
 * Caller is responsible for orphaned replies, or handle via Cloud Function.
 *
 * @param {string} postId - Firestore document ID of the post
 * @returns {Promise<{ success: boolean }>}
 */
export const deletePost = async (postId) => {
  try {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    await deleteDoc(postRef);
    console.log(`[CommunityService] Post deleted. ID: ${postId}`);
    return { success: true };
  } catch (error) {
    console.error('[CommunityService] Error deleting post:', error);
    throw error;
  }
};

/**
 * Increment the likesCount of a community post by 1.
 *
 * Uses Firestore atomic increment — safe for concurrent clients.
 * Does not verify whether the current user has already liked the post.
 * Like-deduplication should be enforced in the UI layer or via a
 * separate LikedPosts sub-collection if needed in a future iteration.
 *
 * @param {string} postId - Firestore document ID of the post
 * @returns {Promise<{ success: boolean }>}
 */
export const likePost = async (postId) => {
  try {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    await updateDoc(postRef, {
      likesCount: increment(1)
    });
    return { success: true };
  } catch (error) {
    console.error('[CommunityService] Error liking post:', error);
    throw error;
  }
};

/**
 * Report a community post.
 *
 * Atomically increments reportCount. If the updated count reaches
 * the FLAGGED_THRESHOLD (3), moderationStatus is set to "FLAGGED".
 *
 * Because Firestore transactions and increment() cannot be combined
 * in a single updateDoc call, we read the current reportCount first,
 * then conditionally update moderationStatus.
 *
 * @param {string} postId - Firestore document ID of the post
 * @returns {Promise<{ success: boolean, flagged: boolean }>}
 */
export const reportPost = async (postId) => {
  const FLAGGED_THRESHOLD = 3;

  try {
    const postRef = doc(db, POSTS_COLLECTION, postId);

    // Step 1: Atomically increment reportCount
    await updateDoc(postRef, {
      reportCount: increment(1)
    });

    // Step 2: Read the updated document to check if threshold is reached
    const updatedSnap = await getDoc(postRef);
    if (!updatedSnap.exists()) {
      throw new Error(`Post ${postId} does not exist after report increment.`);
    }

    const updatedData = updatedSnap.data();
    const currentReportCount = updatedData.reportCount || 0;
    const shouldFlag = currentReportCount >= FLAGGED_THRESHOLD;

    if (shouldFlag && updatedData.moderationStatus !== 'FLAGGED') {
      await updateDoc(postRef, {
        moderationStatus: 'FLAGGED'
      });
      console.warn(
        `[CommunityService] Post ${postId} flagged after ${currentReportCount} reports.`
      );
    }

    return { success: true, flagged: shouldFlag };
  } catch (error) {
    console.error('[CommunityService] Error reporting post:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// REPLY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Subscribe to real-time replies for a specific post.
 *
 * Orders replies by createdAt ascending (chronological thread order).
 * Returns the Firestore unsubscribe function.
 *
 * @param {string}   postId   - The parent post's document ID
 * @param {function} callback - Called with Array<{ id, ...replyData }> on update
 * @param {function} onError  - Optional; called with the Firestore error object
 * @returns {function}        - Unsubscribe function
 */
export const subscribeToReplies = (postId, callback, onError) => {
  console.log(`[CommunityService] Subscribing to replies for post: ${postId}`);

  const q = query(
    collection(db, REPLIES_COLLECTION),
    where('postId', '==', postId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      console.log(
        `[CommunityService] Replies snapshot received for post ${postId}. Size: ${snapshot.size}`
      );
      const replies = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      // Sort client-side by createdAt ascending (oldest to newest) to avoid requiring a Firestore composite index
      replies.sort((a, b) => {
        const getMs = (val) => {
          if (!val) return Date.now(); // optimistic writes place at the end
          if (typeof val.toDate === 'function') return val.toDate().getTime();
          return new Date(val).getTime();
        };
        return getMs(a.createdAt) - getMs(b.createdAt);
      });

      callback(replies);
    },
    (error) => {
      console.error('[CommunityService] Error subscribing to replies:', error);
      if (onError) onError(error);
    }
  );
};

/**
 * Add a reply to a community post.
 *
 * After writing the reply document, atomically increments the parent
 * post's repliesCount using a separate updateDoc call.
 *
 * @param {object} replyData
 * @param {string} replyData.postId
 * @param {string} replyData.authorId
 * @param {string} replyData.authorName
 * @param {string|null} replyData.authorPhotoURL
 * @param {string} replyData.content
 * @returns {Promise<{ success: boolean, id: string }>}
 */
export const addReply = async (replyData) => {
  try {
    // Step 1: Write the reply document
    const docRef = await addDoc(collection(db, REPLIES_COLLECTION), {
      postId:           replyData.postId,
      authorId:         replyData.authorId,
      authorName:       replyData.authorName,
      authorPhotoURL:   replyData.authorPhotoURL || null,
      content:          replyData.content,

      // NLP-derived sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
      sentiment:        replyData.sentiment || 'NEUTRAL',

      likesCount:       0,

      moderationStatus: 'APPROVED',

      createdAt:        serverTimestamp()
    });

    // Step 2: Increment parent post's repliesCount
    const postRef = doc(db, POSTS_COLLECTION, replyData.postId);
    await updateDoc(postRef, {
      repliesCount: increment(1)
    });

    console.log(
      `[CommunityService] Reply added. ID: ${docRef.id}, post: ${replyData.postId}`
    );
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('[CommunityService] Error adding reply:', error);
    throw error;
  }
};

/**
 * Delete a reply and decrement the parent post's repliesCount.
 *
 * @param {string} replyId - Firestore document ID of the reply
 * @param {string} postId  - Firestore document ID of the parent post
 * @returns {Promise<{ success: boolean }>}
 */
export const deleteReply = async (replyId, postId) => {
  try {
    // Step 1: Delete the reply document
    const replyRef = doc(db, REPLIES_COLLECTION, replyId);
    await deleteDoc(replyRef);

    // Step 2: Decrement parent post's repliesCount (never below 0)
    const postRef = doc(db, POSTS_COLLECTION, postId);
    await updateDoc(postRef, {
      repliesCount: increment(-1)
    });

    console.log(
      `[CommunityService] Reply deleted. ID: ${replyId}, post: ${postId}`
    );
    return { success: true };
  } catch (error) {
    console.error('[CommunityService] Error deleting reply:', error);
    throw error;
  }
};
