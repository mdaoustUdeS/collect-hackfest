

(function() {
  'use strict';

  var lastFocusedInput = null;

  var activeModal = null;

  function init() {
    initForm();
    initBackdrop();
    initCloseButton();
    initKeyboardNavigation();
  }

  function initForm() {
    var form = document.querySelector('.newsletter-form');
    if (!form) return;

    form.addEventListener('submit', function(event) {
      event.preventDefault();

      var input = form.querySelector('input[type="email"]');
      var email = input ? input.value.trim() : '';

      if (!email) return;

      lastFocusedInput = input;
      openModal(email);
    });
  }

  function initBackdrop() {
    var backdrop = document.getElementById('newsletterModalBackdrop');
    if (!backdrop) return;

    backdrop.addEventListener('click', function() {
      closeModal();
    });
  }

  function initCloseButton() {
    var modal = document.getElementById('newsletterModal');
    if (!modal) return;

    var closeBtn = modal.querySelector('.newsletter-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        closeModal();
      });
    }
  }

  function openModal(email) {
    var backdrop = document.getElementById('newsletterModalBackdrop');
    var modal = document.getElementById('newsletterModal');
    var iframe = document.getElementById('newsletter-form-iframe');

    if (!backdrop || !modal || !iframe) return;

    activeModal = modal;

    var baseUrl = iframe.getAttribute('data-base-url') || '';
    var src = baseUrl;
    if (email) {
      var separator = baseUrl.indexOf('?') >= 0 ? '&' : '?';
      src = baseUrl + separator + 'email=' + encodeURIComponent(email);
    }
    iframe.setAttribute('src', src);

    backdrop.removeAttribute('hidden');
    backdrop.setAttribute('aria-hidden', 'false');
    modal.removeAttribute('hidden');

    requestAnimationFrame(function() {
      backdrop.classList.add('is-visible');
      modal.classList.add('is-visible');
    });

    document.body.style.overflow = 'hidden';

    var closeBtn = modal.querySelector('.newsletter-modal-close');
    if (closeBtn) {
      closeBtn.focus();
    }

    modal.addEventListener('keydown', trapFocus);
  }

  function closeModal() {
    var backdrop = document.getElementById('newsletterModalBackdrop');

    if (!activeModal || !backdrop) return;

    var closingModal = activeModal;
    activeModal = null;

    backdrop.classList.remove('is-visible');
    closingModal.classList.remove('is-visible');

    var transitionDuration = 250;
    setTimeout(function() {
      backdrop.setAttribute('hidden', '');
      backdrop.setAttribute('aria-hidden', 'true');
      closingModal.setAttribute('hidden', '');
    }, transitionDuration);

    document.body.style.overflow = '';

    if (lastFocusedInput) {
      lastFocusedInput.focus();
      lastFocusedInput = null;
    }

    closingModal.removeEventListener('keydown', trapFocus);
  }

  function initKeyboardNavigation() {
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape' && activeModal) {
        closeModal();
      }
    });
  }

  function trapFocus(event) {
    if (event.key !== 'Tab') return;

    var modal = activeModal;
    if (!modal) return;

    var focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    var focusable = Array.prototype.slice.call(
      modal.querySelectorAll(focusableSelectors)
    );

    if (focusable.length === 0) return;

    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
