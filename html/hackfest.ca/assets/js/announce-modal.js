

(function () {
  'use strict';

  var STORAGE_PREFIX = 'hf-announce-';

  var modal = document.getElementById('announceModal');
  var backdrop = document.getElementById('announceBackdrop');
  if (!modal || !backdrop) return;

  var campaignId = modal.getAttribute('data-announce-id') || 'default';
  var untilDate = modal.getAttribute('data-announce-until') || '';
  var delay = parseInt(modal.getAttribute('data-announce-delay'), 10);
  if (isNaN(delay)) delay = 1200;

  var storageKey = STORAGE_PREFIX + campaignId;
  var lastFocused = null;

  function alreadyDismissed() {
    try {
      return window.localStorage.getItem(storageKey) === '1';
    } catch (e) {

      return false;
    }
  }

  function rememberDismissal() {
    try {
      window.localStorage.setItem(storageKey, '1');
    } catch (e) {

    }
  }

  function expired() {
    if (!untilDate) return false;
    var parts = untilDate.split('-');
    if (parts.length !== 3) return false;

    var end = new Date(
      parseInt(parts[0], 10),
      parseInt(parts[1], 10) - 1,
      parseInt(parts[2], 10),
      23, 59, 59, 999
    );
    if (isNaN(end.getTime())) return false;
    return Date.now() > end.getTime();
  }

  function open() {
    lastFocused = document.activeElement;

    backdrop.removeAttribute('hidden');
    backdrop.setAttribute('aria-hidden', 'false');
    modal.removeAttribute('hidden');

    requestAnimationFrame(function () {
      backdrop.classList.add('is-visible');
      modal.classList.add('is-visible');
    });

    document.body.style.overflow = 'hidden';

    var closeBtn = modal.querySelector('.announce-close');
    if (closeBtn) closeBtn.focus();

    modal.addEventListener('keydown', trapFocus);
  }

  function close() {
    rememberDismissal();

    backdrop.classList.remove('is-visible');
    modal.classList.remove('is-visible');

    setTimeout(function () {
      backdrop.setAttribute('hidden', '');
      backdrop.setAttribute('aria-hidden', 'true');
      modal.setAttribute('hidden', '');
    }, 250);

    document.body.style.overflow = '';
    modal.removeEventListener('keydown', trapFocus);

    if (lastFocused && lastFocused.focus) {
      lastFocused.focus();
      lastFocused = null;
    }
  }

  function trapFocus(event) {
    if (event.key !== 'Tab') return;

    var focusable = Array.prototype.slice.call(
      modal.querySelectorAll('a[href], button:not([disabled])')
    );
    if (!focusable.length) return;

    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    } else if (document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function init() {
    if (expired() || alreadyDismissed()) return;

    backdrop.addEventListener('click', close);

    var closers = modal.querySelectorAll('.announce-close, .announce-dismiss, .announce-cta');
    Array.prototype.forEach.call(closers, function (el) {
      el.addEventListener('click', close);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !modal.hasAttribute('hidden')) close();
    });

    setTimeout(open, delay);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
