// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';
let currentUser = null;
let authToken = localStorage.getItem('token');

// DOM Elements
const tweetForm = document.querySelector('.tweet-composer textarea');
const tweetButton = document.querySelector('.tweet-composer button');
const tweetsFeed = document.querySelector('.tweets-feed');

// Utility Functions
const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = (now - date) / 1000; // difference in seconds

    if (diff < 60) return `${Math.floor(diff)}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return date.toLocaleDateString();
};

// API Calls
const api = {
    async request(endpoint, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(authToken && { Authorization: `Bearer ${authToken}` })
            }
        };

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...defaultOptions,
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Auth
    async login(email, password) {
        const data = await this.request('/users/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        if (data.success) {
            authToken = data.data.token;
            localStorage.setItem('token', authToken);
            currentUser = data.data;
        }
        
        return data;
    },

    async register(userData) {
        return await this.request('/users/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },

    // Tweets
    async getTweets() {
        return await this.request('/tweets/timeline');
    },

    async createTweet(content) {
        return await this.request('/tweets', {
            method: 'POST',
            body: JSON.stringify({ content })
        });
    },

    async likeTweet(tweetId) {
        return await this.request(`/tweets/${tweetId}/like`, {
            method: 'POST'
        });
    },

    async retweet(tweetId) {
        return await this.request(`/tweets/${tweetId}/retweet`, {
            method: 'POST'
        });
    }
};

// UI Functions
function createTweetElement(tweet) {
    const tweetElement = document.createElement('div');
    tweetElement.className = 'p-4 hover:bg-gray-900/50 transition cursor-pointer';
    tweetElement.innerHTML = `
        <div class="flex space-x-4">
            <img src="${tweet.author.profileImage || 'https://via.placeholder.com/48'}" 
                 alt="Profile" 
                 class="w-12 h-12 rounded-full">
            <div class="flex-1">
                <div class="flex items-center space-x-2">
                    <span class="font-bold">${tweet.author.name}</span>
                    <span class="text-gray-500">@${tweet.author.username}</span>
                    <span class="text-gray-500">·</span>
                    <span class="text-gray-500">${formatDate(tweet.createdAt)}</span>
                </div>
                <p class="mt-2">${tweet.content}</p>
                <div class="flex justify-between mt-4 text-gray-500 w-4/5">
                    <button class="hover:text-twitter-blue hover:bg-blue-900/30 p-2 rounded-full" 
                            onclick="handleReply('${tweet._id}')">
                        <i class="far fa-comment"></i>
                        <span class="ml-2">${tweet.repliesCount || 0}</span>
                    </button>
                    <button class="hover:text-green-500 hover:bg-green-900/30 p-2 rounded-full" 
                            onclick="handleRetweet('${tweet._id}')">
                        <i class="fas fa-retweet"></i>
                        <span class="ml-2">${tweet.retweetsCount || 0}</span>
                    </button>
                    <button class="hover:text-red-500 hover:bg-red-900/30 p-2 rounded-full" 
                            onclick="handleLike('${tweet._id}')">
                        <i class="far fa-heart"></i>
                        <span class="ml-2">${tweet.likesCount || 0}</span>
                    </button>
                    <button class="hover:text-twitter-blue hover:bg-blue-900/30 p-2 rounded-full">
                        <i class="far fa-share-square"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    return tweetElement;
}

async function loadTweets() {
    try {
        const response = await api.getTweets();
        const tweetsFeed = document.querySelector('.tweets-feed');
        tweetsFeed.innerHTML = '';
        
        response.data.forEach(tweet => {
            const tweetElement = createTweetElement(tweet);
            tweetsFeed.appendChild(tweetElement);
        });
    } catch (error) {
        console.error('Error loading tweets:', error);
    }
}

// Event Handlers
async function handleTweetSubmit() {
    const content = tweetForm.value.trim();
    if (!content) return;

    try {
        await api.createTweet(content);
        tweetForm.value = '';
        await loadTweets();
    } catch (error) {
        console.error('Error creating tweet:', error);
    }
}

async function handleLike(tweetId) {
    try {
        await api.likeTweet(tweetId);
        await loadTweets(); // Refresh tweets to show updated like count
    } catch (error) {
        console.error('Error liking tweet:', error);
    }
}

async function handleRetweet(tweetId) {
    try {
        await api.retweet(tweetId);
        await loadTweets(); // Refresh tweets to show updated retweet count
    } catch (error) {
        console.error('Error retweeting:', error);
    }
}

async function handleReply(tweetId) {
    // TODO: Implement reply functionality
    console.log('Reply to tweet:', tweetId);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Load initial tweets
    if (authToken) {
        loadTweets();
    }

    // Tweet button click handler
    const tweetButton = document.querySelector('.tweet-composer button');
    if (tweetButton) {
        tweetButton.addEventListener('click', handleTweetSubmit);
    }

    // Tweet textarea enter key handler
    const tweetTextarea = document.querySelector('.tweet-composer textarea');
    if (tweetTextarea) {
        tweetTextarea.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleTweetSubmit();
            }
        });
    }
});