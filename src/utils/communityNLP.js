/**
 * communityNLP.js
 *
 * Lightweight NLP utilities for the Community Hub feature.
 * Uses two dependency-free packages — no external APIs, no paid services.
 *
 *   sentiment  — AFINN-based sentiment scoring
 *   bad-words  — Profanity/inappropriate content detection
 *
 * Both packages are loaded as module-level singletons to avoid re-instantiation
 * on every call.
 */

import Sentiment from 'sentiment';
import { Filter } from 'bad-words';

// ─── Singletons ──────────────────────────────────────────────────────────────

const sentimentAnalyzer = new Sentiment();

// bad-words Filter: initialised with default English profanity list.
// Additional words can be appended via filter.addWords('word1', 'word2') if needed.
const profanityFilter = new Filter();

// ─────────────────────────────────────────────────────────────────────────────
// analyzeSentiment
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Analyses the sentiment of a text string using AFINN lexicon scoring.
 *
 * Scoring thresholds (as specified):
 *   score > 1   → 'POSITIVE'
 *   score < -1  → 'NEGATIVE'
 *   otherwise   → 'NEUTRAL'
 *
 * @param {string} text - The text to analyse (post title + content recommended)
 * @returns {'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'}
 *
 * @example
 *   analyzeSentiment('I love this app, it really helped me!')  // 'POSITIVE'
 *   analyzeSentiment('This is terrible and awful')              // 'NEGATIVE'
 *   analyzeSentiment('I took my medicine today')                // 'NEUTRAL'
 */
export const analyzeSentiment = (text) => {
  if (!text || typeof text !== 'string') return 'NEUTRAL';

  try {
    const result = sentimentAnalyzer.analyze(text);
    if (result.score > 1) return 'POSITIVE';
    if (result.score < -1) return 'NEGATIVE';
    return 'NEUTRAL';
  } catch (err) {
    console.warn('[communityNLP] analyzeSentiment error — defaulting to NEUTRAL:', err);
    return 'NEUTRAL';
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// containsInappropriateContent
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Checks whether a text string contains profanity or inappropriate content.
 *
 * Used as a pre-save gate in CreatePostModal — if this returns true, the post
 * is NOT saved and the user sees the community guidelines toast.
 *
 * Safe fallback: if the filter throws an unexpected error (e.g. malformed input),
 * the function returns false to avoid blocking legitimate posts.
 *
 * @param {string} text - The text to check (title + content combined recommended)
 * @returns {boolean} - true if inappropriate content detected, false otherwise
 *
 * @example
 *   containsInappropriateContent('Hello, how are you?')  // false
 *   containsInappropriateContent('some bad word here')   // true (if matched)
 */
export const containsInappropriateContent = (text) => {
  if (!text || typeof text !== 'string') return false;

  try {
    return profanityFilter.isProfane(text);
  } catch (err) {
    // Never block a post due to a filter error — log and allow
    console.warn('[communityNLP] containsInappropriateContent error — allowing post:', err);
    return false;
  }
};
