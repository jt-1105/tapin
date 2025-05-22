// generate-posts.js
// Run: node generate-posts.js
// Produces: posts.json with dummy posts

const fs = require('fs');

// ←– CHANGE THIS number to generate more or fewer posts:
const POST_COUNT = 30;

// Helper to pick one image (and sometimes a video)
function pickMedia(i) {
  const items = [];
  if (i % 5 === 0) {
    items.push({
      type: 'video',
      url: 'https://www.w3schools.com/html/mov_bbb.mp4'
    });
  }
  items.push({
    type: 'image',
    url: `https://via.placeholder.com/600x400?text=Post+${i}`
  });
  return items;
}

// Helper to make a comment object
function makeComment(postId, idx) {
  const when = Date.now() - postId*3600*1000 - idx*30000;
  return {
    id: idx + 1,
    author: `User${(idx % 5) + 1}`,
    content: `This is comment #${idx+1} on post #${postId}`,
    timestamp: new Date(when).toISOString()
  };
}

// Build the array of posts
const posts = Array.from({ length: POST_COUNT }, (_, i) => {
  const id = i + 1;
  const now = Date.now() - id*3600*1000;
  return {
    id,
    author: 'Admin',
    content: `✨ Here’s your dummy content for post #${id}! ✨`,
    timestamp: new Date(now).toISOString(),
    media: pickMedia(id),
    comments: Array.from({ length: 2 }, (_, j) => makeComment(id, j))
  };
});

// Write it out!
fs.writeFileSync('posts.json', JSON.stringify(posts, null, 2));
console.log(`✅ Generated posts.json with ${POST_COUNT} posts`);

