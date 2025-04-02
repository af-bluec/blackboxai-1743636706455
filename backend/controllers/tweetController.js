const Tweet = require('../models/Tweet');
const User = require('../models/User');

// @desc    Create a new tweet
// @route   POST /api/tweets
// @access  Private
const createTweet = async (req, res, next) => {
  try {
    const { content, images = [], quoteTweet, inReplyTo } = req.body;

    // Create tweet
    const tweet = await Tweet.create({
      content,
      author: req.user._id,
      images,
      quoteTweet,
      inReplyTo
    });

    // If this is a reply, add it to the parent tweet's replies array
    if (inReplyTo) {
      await Tweet.findByIdAndUpdate(inReplyTo, {
        $push: { replies: tweet._id }
      });
    }

    // Populate author details
    await tweet.populate('author', 'username name profileImage');

    res.status(201).json({
      success: true,
      data: tweet
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get timeline tweets
// @route   GET /api/tweets/timeline
// @access  Private
const getTimeline = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get tweets from users that the current user follows and their own tweets
    const tweets = await Tweet.find({
      $or: [
        { author: { $in: [...req.user.following, req.user._id] } },
        { retweets: req.user._id }
      ]
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username name profileImage')
      .populate('quoteTweet')
      .populate('inReplyTo');

    const total = await Tweet.countDocuments({
      author: { $in: [...req.user.following, req.user._id] }
    });

    res.json({
      success: true,
      data: tweets,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tweet by ID
// @route   GET /api/tweets/:id
// @access  Public
const getTweetById = async (req, res, next) => {
  try {
    const tweet = await Tweet.findById(req.params.id)
      .populate('author', 'username name profileImage')
      .populate({
        path: 'replies',
        populate: {
          path: 'author',
          select: 'username name profileImage'
        }
      })
      .populate({
        path: 'quoteTweet',
        populate: {
          path: 'author',
          select: 'username name profileImage'
        }
      });

    if (tweet) {
      res.json({
        success: true,
        data: tweet
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Tweet not found'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Like/Unlike tweet
// @route   POST /api/tweets/:id/like
// @access  Private
const likeTweet = async (req, res, next) => {
  try {
    const tweet = await Tweet.findById(req.params.id);

    if (!tweet) {
      return res.status(404).json({
        success: false,
        message: 'Tweet not found'
      });
    }

    const isLiked = tweet.likes.includes(req.user._id);

    if (isLiked) {
      // Unlike
      tweet.likes = tweet.likes.filter(
        id => id.toString() !== req.user._id.toString()
      );
    } else {
      // Like
      tweet.likes.push(req.user._id);
    }

    await tweet.save();

    res.json({
      success: true,
      data: {
        liked: !isLiked,
        likesCount: tweet.likes.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Retweet/Unretweet tweet
// @route   POST /api/tweets/:id/retweet
// @access  Private
const retweetTweet = async (req, res, next) => {
  try {
    const tweet = await Tweet.findById(req.params.id);

    if (!tweet) {
      return res.status(404).json({
        success: false,
        message: 'Tweet not found'
      });
    }

    const isRetweeted = tweet.retweets.includes(req.user._id);

    if (isRetweeted) {
      // Unretweet
      tweet.retweets = tweet.retweets.filter(
        id => id.toString() !== req.user._id.toString()
      );
    } else {
      // Retweet
      tweet.retweets.push(req.user._id);
    }

    await tweet.save();

    res.json({
      success: true,
      data: {
        retweeted: !isRetweeted,
        retweetsCount: tweet.retweets.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete tweet
// @route   DELETE /api/tweets/:id
// @access  Private
const deleteTweet = async (req, res, next) => {
  try {
    const tweet = await Tweet.findById(req.params.id);

    if (!tweet) {
      return res.status(404).json({
        success: false,
        message: 'Tweet not found'
      });
    }

    // Check if user owns the tweet
    if (tweet.author.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this tweet'
      });
    }

    // Remove tweet from replies if it's a reply
    if (tweet.inReplyTo) {
      await Tweet.findByIdAndUpdate(tweet.inReplyTo, {
        $pull: { replies: tweet._id }
      });
    }

    await tweet.remove();

    res.json({
      success: true,
      message: 'Tweet deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user tweets
// @route   GET /api/tweets/user/:username
// @access  Public
const getUserTweets = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const tweets = await Tweet.find({
      $or: [
        { author: user._id },
        { retweets: user._id }
      ]
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username name profileImage')
      .populate('quoteTweet')
      .populate('inReplyTo');

    const total = await Tweet.countDocuments({ author: user._id });

    res.json({
      success: true,
      data: tweets,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTweet,
  getTimeline,
  getTweetById,
  likeTweet,
  retweetTweet,
  deleteTweet,
  getUserTweets
};