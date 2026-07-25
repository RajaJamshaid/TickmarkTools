// Dark mode toggle (session-only, no storage APIs)
(function(){
  const toggle = document.getElementById('theme-toggle');
  const icon = document.getElementById('theme-icon');
  const html = document.documentElement;
  let isDark = false;
  if(toggle){
    toggle.addEventListener('click', () => {
      isDark = !isDark;
      html.setAttribute('data-theme', isDark ? 'dark' : 'light');
      icon.innerHTML = isDark
        ? '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>'
        : '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>';
    });
  }
})();

// FAQ accordion
document.querySelectorAll('.faq-item .faq-q').forEach(q => {
  q.addEventListener('click', () => {
    q.parentElement.classList.toggle('open');
  });
});

// AI Assistant demo panel (pre-written answers; a real deployment would call an API)
document.querySelectorAll('.ai-q').forEach(q => {
  q.addEventListener('click', () => {
    const answer = q.nextElementSibling;
    answer.classList.toggle('show');
  });
});

// Generic toolbar actions — every tool page includes Reset / Copy / Share buttons.
// Individual tool scripts may override window.resetTool with tool-specific logic.
window.resetTool = function(){
  document.querySelectorAll('.tool-panel input, .tool-panel textarea').forEach(el => {
    if(el.type === 'checkbox' || el.type === 'range') return;
    el.value = '';
  });
  document.querySelectorAll('.result-box').forEach(r => r.classList.remove('show'));
  document.querySelectorAll('.file-list').forEach(f => f.innerHTML = '');
};

window.copyResult = function(){
  const box = document.querySelector('.result-box.show');
  const btn = document.getElementById('copyResultBtn');
  if(!box){
    alert('Nothing to copy yet — calculate a result first.');
    return;
  }
  const text = box.innerText.trim();
  navigator.clipboard.writeText(text).then(() => {
    if(btn){ const old = btn.textContent; btn.textContent = '✓ Copied!'; setTimeout(() => btn.textContent = old, 1500); }
  });
};

window.shareTool = function(){
  const shareData = { title: document.title, text: 'Check out this free tool on TickmarkTools', url: window.location.href };
  if(navigator.share){
    navigator.share(shareData).catch(() => {});
  } else {
    navigator.clipboard.writeText(window.location.href).then(() => alert('Link copied to clipboard!'));
  }
};

// YouTube video embed — shows a placeholder until a real video ID is supplied
document.querySelectorAll('.video-embed[data-video-id]').forEach(el => {
  const id = el.getAttribute('data-video-id');
  if(id && id.trim() !== ''){
    el.innerHTML = `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${id}" title="How-to video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy" style="border-radius:14px;"></iframe>`;
  }
});
