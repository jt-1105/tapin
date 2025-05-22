// 1) Offcanvas toggle – guarded against missing elements
const menuToggle  = document.getElementById('menuToggle');
const sideMenu    = document.getElementById('sideMenu');
const menuOverlay = document.getElementById('menuOverlay');

if (menuToggle && sideMenu && menuOverlay) {
  menuToggle.addEventListener('click', () => {
    sideMenu.classList.toggle('open');
    menuOverlay.classList.toggle('show');
  });
  menuOverlay.addEventListener('click', () => {
    sideMenu.classList.remove('open');
    menuOverlay.classList.remove('show');
  });
}

// 2) Load the posts.json file and stash globally
fetch('posts.json')
  .then(res => res.json())
  .then(posts => {
    window._posts = posts;    // keep for later when adding comments
    renderFeed(posts);
  })
  .catch(err => console.error('Failed to load posts:', err));

// 3) Turn each post into a card
function renderFeed(posts) {
  const feed = document.getElementById('feed');
  feed.innerHTML = '';  // clear any existing content

  posts.forEach(post => {
    const card = document.createElement('div');
    card.className = 'card mb-4';

    // 3a) Thumbnails
    const mediaHtml = (post.media || []).map(m => {
      if (m.type === 'image') {
        return `<img src="${m.url}" class="media-thumb mb-2" alt="Post ${post.id}">`;
      } else {
        return `<video src="${m.url}" class="media-thumb mb-2" muted></video>`;
      }
    }).join('');

    // 3b) Comments toggle + list + form
    const commentsHtml = `
      <button class="btn btn-link px-0" 
              data-bs-toggle="collapse" 
              data-bs-target="#comments-${post.id}">
        Comments (${post.comments.length})
      </button>
      <div class="collapse mt-2" id="comments-${post.id}">
        <ul class="list-group list-group-flush" id="comments-list-${post.id}">
          ${post.comments.map(c => `
            <li class="list-group-item">
              <strong>${c.author}</strong>
              <small class="text-muted ms-2">
                ${new Date(c.timestamp).toLocaleTimeString([], {
                  hour:   '2-digit',
                  minute: '2-digit'
                })}
              </small>
              <p class="mb-0 mt-1">${c.content}</p>
            </li>
          `).join('')}
        </ul>
        <form id="comment-form-${post.id}" class="mt-3">
          <textarea class="form-control mb-2" rows="2" placeholder="Write a comment…" required></textarea>
          <button type="submit" class="btn btn-primary btn-sm">Post Comment</button>
        </form>
      </div>
    `;

    // 3c) Assemble card-inner
    card.innerHTML = `
      <div class="card-body">
        <h5 class="card-title d-flex justify-content-between align-items-center mb-3">
          <span>${post.author}</span>
          <small class="text-muted">
            ${new Date(post.timestamp).toLocaleTimeString([], {
              hour:   '2-digit',
              minute: '2-digit'
            })}
          </small>
        </h5>
        <p class="card-text mb-3">${post.content}</p>
        <div class="post-media-grid mb-3">${mediaHtml}</div>
        ${commentsHtml}
      </div>
    `;

    feed.appendChild(card);
    attachCommentHandler(post.id);
  });
}

// 4) Comment form handler
function attachCommentHandler(postId) {
  const form = document.getElementById(`comment-form-${postId}`);
  if (!form) return;
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const textarea = form.querySelector('textarea');
    const text = textarea.value.trim();
    if (!text) return;
    addCommentToPost(postId, text);
    textarea.value = '';
  });
}

// 5) Add a new comment
function addCommentToPost(postId, content) {
  const comment = {
    id: Date.now(),
    author: 'You',
    content,
    timestamp: new Date().toISOString()
  };

  const post = window._posts.find(p => p.id === postId);
  post.comments.push(comment);

  const list = document.getElementById(`comments-list-${postId}`);
  const li = document.createElement('li');
  li.className = 'list-group-item';
  li.innerHTML = `
    <strong>${comment.author}</strong>
    <small class="text-muted ms-2">
      ${new Date(comment.timestamp).toLocaleTimeString([], {
        hour:   '2-digit',
        minute: '2-digit'
      })}
    </small>
    <p class="mb-0 mt-1">${comment.content}</p>
  `;
  list.appendChild(li);

  const btn = document.querySelector(`[data-bs-target="#comments-${postId}"]`);
  btn.textContent = `Comments (${post.comments.length})`;
}

// 6) Lightbox handler for full-size media
document.addEventListener('click', e => {
  const thumb = e.target.closest('.media-thumb');
  if (!thumb) return;

  const modalEl = document.getElementById('mediaModal');
  const imgEl   = document.getElementById('modalImg');
  const vidEl   = document.getElementById('modalVid');
  const isVid   = thumb.tagName === 'VIDEO';

  if (isVid) {
    imgEl .classList.add('d-none');
    vidEl .src = thumb.src;
    vidEl .classList.remove('d-none');
  } else {
    vidEl .classList.add('d-none');
    imgEl .src = thumb.src;
    imgEl .classList.remove('d-none');
  }

  new bootstrap.Modal(modalEl).show();
});
