const mongoose = require('mongoose');

const tweetSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Tweet content is required'],
    maxlength: [280, 'Tweet cannot exceed 280 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  images: [{
    type: String,
    validate: {
      validator: function(v) {
        // Allow up to 4 images per tweet
        return this.images.length <= 4;
      },
      message: 'A tweet can have a maximum of 4 images'
    }
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  retweets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // For quote tweets
  quoteTweet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tweet'
  },
  // For replies
  inReplyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tweet'
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tweet'
  }],
  hashtags: [{
    type: String,
    trim: true
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
tweetSchema.index({ author: 1, createdAt: -1 });
tweetSchema.index({ hashtags: 1 });

// Virtual field for likes count
tweetSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

// Virtual field for retweets count
tweetSchema.virtual('retweetsCount').get(function() {
  return this.retweets.length;
});

// Virtual field for replies count
tweetSchema.virtual('repliesCount').get(function() {
  return this.replies.length;
});

// Enable virtuals in JSON
tweetSchema.set('toJSON', { virtuals: true });
tweetSchema.set('toObject', { virtuals: true });

// Method to check if a user has liked this tweet
tweetSchema.methods.isLikedBy = function(userId) {
  return this.likes.includes(userId);
};

// Method to check if a user has retweeted this tweet
tweetSchema.methods.isRetweetedBy = function(userId) {
  return this.retweets.includes(userId);
};

// Pre-save middleware to extract hashtags and mentions
tweetSchema.pre('save', function(next) {
  // Extract hashtags
  const hashtagRegex = /#(\w+)/g;
  this.hashtags = [];
  let match;
  while ((match = hashtagRegex.exec(this.content)) !== null) {
    this.hashtags.push(match[1].toLowerCase());
  }

  next();
});

const Tweet = mongoose.model('Tweet', tweetSchema);

module.exports = Tweet;