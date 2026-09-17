'use strict';

(function initNewsTicker() {
  var stage   = document.getElementById('newsTickerStage');
  var prevBtn = document.getElementById('newsTickerPrev');
  var nextBtn = document.getElementById('newsTickerNext');
  var counter = document.getElementById('newsTickerCounter');

  if (!stage) { return; }

  var raw = stage.getAttribute('data-items');
  if (!raw) { return; }

  var items;
  try {
    items = JSON.parse(raw);
  } catch (e) {
    return;
  }
  if (!items || !items.length) { return; }

  var current   = 0;
  var total     = items.length;
  var autoTimer = null;
  var INTERVAL  = 7000;

  function formatDate(iso) {
    if (!iso) { return ''; }
    var parts = iso.split('-');
    if (parts.length < 3) { return iso; }
    var months = ['Jan','Feb','Mar','Apr','May','Jun',
                  'Jul','Aug','Sep','Oct','Nov','Dec'];
    return parts[2] + ' ' + (months[+parts[1] - 1] || parts[1]) + ' ' + parts[0];
  }

  var lang = (document.documentElement.lang || 'en').split('-')[0];

  function isSafeHttpUrl(url) {
    if (!url || typeof url !== 'string') { return false; }
    var u = url.trim();
    return /^https?:\/\/[^\s]+$/i.test(u);
  }

  function appendText(parent, text) {
    if (!text) { return; }
    parent.appendChild(document.createTextNode(text));
  }

  function renderInlineMarkdown(parent, input) {
    parent.textContent = '';
    var text = (input == null ? '' : String(input));
    if (!text) { return; }

    var i = 0;
    while (i < text.length) {
      var rest = text.slice(i);

      var linkMatch = rest.match(/^\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        var label = linkMatch[1];
        var url = linkMatch[2];
        if (isSafeHttpUrl(url)) {
          var a = document.createElement('a');
          a.className = 'news-ticker-inline-link';
          a.href = url.trim();
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.textContent = label;
          parent.appendChild(a);
        } else {
          appendText(parent, linkMatch[0]);
        }
        i += linkMatch[0].length;
        continue;
      }

      var boldMatch = rest.match(/^\*\*([^*]+)\*\*/);
      if (boldMatch) {
        var strong = document.createElement('strong');
        strong.textContent = boldMatch[1];
        parent.appendChild(strong);
        i += boldMatch[0].length;
        continue;
      }

      var italicMatch = rest.match(/^\*([^*]+)\*/);
      if (italicMatch) {
        var em = document.createElement('em');
        em.textContent = italicMatch[1];
        parent.appendChild(em);
        i += italicMatch[0].length;
        continue;
      }

      var next = rest.search(/\[|\*\*/);
      var nextItalic = rest.search(/\*/);
      if (next === -1) { next = rest.length; }
      if (nextItalic !== -1 && nextItalic < next) { next = nextItalic; }
      appendText(parent, rest.slice(0, Math.max(1, next)));
      i += Math.max(1, next);
    }
  }

  function render(index) {
    var item     = items[index];
    var existing = stage.querySelector('.news-ticker-item');

    if (existing) {
      existing.classList.add('is-leaving');
    }

    setTimeout(function() {
      var div = document.createElement('div');
      div.className = 'news-ticker-item';

      var dateEl = document.createElement('span');
      dateEl.className   = 'news-ticker-date';
      dateEl.textContent = formatDate(item.date);

      var textEl = document.createElement('span');
      textEl.className   = 'news-ticker-text';
      renderInlineMarkdown(textEl, item.text || '');

      div.appendChild(dateEl);
      div.appendChild(textEl);

      var links = [];
      if (Array.isArray(item.links)) {
        links = item.links;
      } else if (item.url) {
        links = [{ url: item.url }];
      }

      if (links.length) {
        var linksWrap = document.createElement('span');
        linksWrap.className = 'news-ticker-links';

        for (var i = 0; i < links.length; i++) {
          var lnk = links[i] || {};
          if (!lnk.url) { continue; }

          var linkEl = document.createElement('a');
          linkEl.className = 'news-ticker-link';
          linkEl.href      = lnk.url;
          linkEl.target    = '_blank';
          linkEl.rel       = 'noopener noreferrer';

          var label = (lnk.label || '').trim();
          if (!label) {
            label = (lang === 'fr' ? 'cliquez ici' : 'click here');
          }
          linkEl.textContent = label + ' \u2197';

          linksWrap.appendChild(linkEl);
        }

        if (linksWrap.childNodes.length) {
          div.appendChild(linksWrap);
        }
      }

      stage.innerHTML = '';
      stage.appendChild(div);

      if (counter) {
        counter.textContent = (index + 1) + ' / ' + total;
      }
    }, 300);
  }

  function goTo(index) {
    current = (index + total) % total;
    render(current);
    resetTimer();
  }

  function startTimer() {
    autoTimer = setInterval(function() { goTo(current + 1); }, INTERVAL);
  }

  function resetTimer() {
    clearInterval(autoTimer);
    startTimer();
  }

  var ticker = stage.closest('.news-ticker');
  if (ticker) {
    ticker.addEventListener('mouseenter', function() { clearInterval(autoTimer); });
    ticker.addEventListener('mouseleave', startTimer);

    ticker.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowLeft')  { goTo(current - 1); }
      if (e.key === 'ArrowRight') { goTo(current + 1); }
    });
  }

  if (prevBtn) { prevBtn.addEventListener('click', function() { goTo(current - 1); }); }
  if (nextBtn) { nextBtn.addEventListener('click', function() { goTo(current + 1); }); }

  render(0);
  if (total > 1) { startTimer(); }
})();
