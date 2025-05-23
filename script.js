// Wait until DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // ──────────────────────────────────────────
  // 1) Offcanvas toggle – guarded against missing elements
  // ──────────────────────────────────────────
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

  // ──────────────────────────────────────────
  // 2) Advice overlay setup (Gode Råd)
  // ──────────────────────────────────────────
  const overlay     = document.getElementById('overlay');
  const overlayContent = document.getElementById('overlayContent');
  const closeBtn    = document.getElementById('closeBtn');

  // Click on backdrop closes it
  if (overlay) {
    overlay.addEventListener('click', off);
  }
  // Prevent click on content from bubbling up
  if (overlayContent) {
    overlayContent.addEventListener('click', e => e.stopPropagation());
  }
  // Close button
  if (closeBtn) {
    closeBtn.addEventListener('click', off);
  }

  // ──────────────────────────────────────────
  // 3) Fetch & render posts feed
  // ──────────────────────────────────────────
  fetch('posts.json')
    .then(res => res.json())
    .then(posts => {
      window._posts = posts;    // stash globally for later
      renderFeed(posts);
    })
    .catch(err => console.error('Failed to load posts:', err));

  // Turn each post into a card in #feed
  function renderFeed(posts) {
    const feed = document.getElementById('feed');
    if (!feed) return;
    feed.innerHTML = '';

    posts.forEach(post => {
      const card = document.createElement('div');
      card.className = 'card mb-4';

      // Media thumbnails (images/videos)
      const mediaHtml = (post.media || []).map(m => {
        if (m.type === 'image') {
          return `<img src="${m.url}" class="media-thumb mb-2" alt="Post ${post.id}">`;
        } else {
          return `<video src="${m.url}" class="media-thumb mb-2" muted></video>`;
        }
      }).join('');

      // Comments section HTML
      const commentsHtml = `
        <button class="btn btn-link px-0" 
                data-bs-toggle="collapse" 
                data-bs-target="#comments-${post.id}">
          Comments (${(post.comments || []).length})
        </button>
        <div class="collapse mt-2" id="comments-${post.id}">
          <ul class="list-group list-group-flush" id="comments-list-${post.id}">
            ${(post.comments || []).map(c => `
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


      // Assemble card inner HTML
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

  // ──────────────────────────────────────────
  // 4) Handle new comments
  // ──────────────────────────────────────────
  function attachCommentHandler(postId) {
    const form = document.getElementById(`comment-form-${postId}`);
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const textarea = form.querySelector('textarea');
      const text = textarea.value.trim();
      if (!text) return;
      addCommentToPost(postId, text);
      textarea.value = '';
    });
  }

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
    const li   = document.createElement('li');
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
    if (btn) btn.textContent = `Comments (${post.comments.length})`;
  }

  // ──────────────────────────────────────────
  // 5) Lightbox for full-size media
  // ──────────────────────────────────────────
  document.addEventListener('click', e => {
    const thumb = e.target.closest('.media-thumb');
    if (!thumb) return;

    const modalEl = document.getElementById('mediaModal');
    const imgEl   = document.getElementById('modalImg');
    const vidEl   = document.getElementById('modalVid');
    if (!modalEl || !imgEl || !vidEl) return;

    if (thumb.tagName === 'VIDEO') {
      imgEl.classList.add('d-none');
      vidEl.src = thumb.src;
      vidEl.classList.remove('d-none');
    } else {
      vidEl.classList.add('d-none');
      imgEl.src = thumb.src;
      imgEl.classList.remove('d-none');
    }

    new bootstrap.Modal(modalEl).show();
  });

  // ──────────────────────────────────────────
  // 6) Advice overlay functions
  // ──────────────────────────────────────────
  window.on = function(title, message) {
    const titleEl = document.getElementById('title');
    const textEl  = document.getElementById('text');
    if (titleEl) titleEl.textContent = title;
    if (textEl)  textEl.textContent = message;
    if (overlay) overlay.style.display = 'block';
  };

  function off() {
    if (overlay) overlay.style.display = 'none';
  }

  // ──────────────────────────────────────────
  // 7) Carousel code goes here…
  // ──────────────────────────────────────────
  
 // Expose moveCarousel and off globally
window.moveCarousel = function(delta) {
  const carousel = document.getElementById('carousel');
  if (!carousel) return;
  let pos = parseInt(getComputedStyle(carousel).getPropertyValue('--position'), 10);
  const itemCount = parseInt(getComputedStyle(carousel).getPropertyValue('--items'), 10);
  pos += delta;
  if (pos < 1) pos = itemCount;
  if (pos > itemCount) pos = 1;
  carousel.style.setProperty('--position', pos);
};

window.off = function() {
  const overlay = document.getElementById('overlay');
  if (overlay) overlay.style.display = 'none';
};

// Simple touch‐swipe detection for the 3D carousel
;(function() {
  let startX = 0;
  const wrapper = document.querySelector('.carousel-wrapper');
  if (!wrapper) return;
  
  wrapper.addEventListener('touchstart', e => {
    startX = e.changedTouches[0].clientX;
  }, { passive: true });

  wrapper.addEventListener('touchend', e => {
    const endX = e.changedTouches[0].clientX;
    const dx = endX - startX;
    if (Math.abs(dx) > 40) {
      if (dx > 0) window.moveCarousel(-1);
      else       window.moveCarousel( 1);
    }
  });
})();
// ──────────────────────────────────────────
  // 7) Toast init + click handler
  // ──────────────────────────────────────────
  
const toastEl = document.getElementById('downloadToast');
const downloadToast = toastEl ? new bootstrap.Toast(toastEl) : null;
document.querySelectorAll('button.btn-primary').forEach(btn => {
  btn.addEventListener('click', () => {
    if (downloadToast) downloadToast.show();
  });
});

});
