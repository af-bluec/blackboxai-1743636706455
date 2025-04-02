const express = require('express');
const router = express.Router();
const {
  createTweet,
  getTimeline,
  getTweetById,
  likeTweet,
  retweetTweet,
  deleteTweet,
  getUserTweets
} = require('../controllers/tweetController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

// Public routes (with optional auth for additional data like if user liked/retweeted)
router.get('/:id', optionalAuth, getTweetById);
router.get('/user/:username', optionalAuth, getUserTweets);

// Protected routes
router.post('/', protect, createTweet);
router.get('/timeline', protect, getTimeline);
router.post('/:id/like', protect, likeTweet);
router.post('/:id/retweet', protect, retweetTweet);
router.delete('/:id', protect, deleteTweet);

module.exports = router;