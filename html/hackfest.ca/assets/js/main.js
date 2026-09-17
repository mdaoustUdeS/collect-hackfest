

'use strict';

var CONFIG = {

  counter: {
    duration: 2000,
    easing: 3
  },

  scroll: {
    triggerOffset: 50
  }
};

var SELECTORS = {

  statNumber: '.stat-number',

  scrollAnimate: '.scroll-animate:not(.animated)',
  featureCard: '.feature-card:not(.animated)',

  hamburger: '#hamburger',
  mainNav: '#mainNav',
  anchorLinks: 'a[href^="#"]'
};

var CLASSES = {
  animated: 'animated',
  active:   'active',
  open:     'open',
  isOpen:   'is-open'
};

function animateCounters() {
  var counters = document.querySelectorAll(SELECTORS.statNumber);

  counters.forEach(function(el) {

    if (el.dataset.animated) {
      return;
    }

    var rect = el.getBoundingClientRect();
    if (rect.top > window.innerHeight || rect.bottom < 0) {
      return;
    }

    el.dataset.animated = 'true';

    var target = parseInt(el.dataset.target, 10);
    var startTime = performance.now();

    function updateCounter(currentTime) {
      var elapsed = currentTime - startTime;
      var progress = Math.min(elapsed / CONFIG.counter.duration, 1);

      var easedProgress = 1 - Math.pow(1 - progress, CONFIG.counter.easing);

      el.textContent = Math.round(target * easedProgress);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    }

    requestAnimationFrame(updateCounter);
  });
}

function handleScrollAnimations() {

  var scrollElements = document.querySelectorAll(SELECTORS.scrollAnimate);
  scrollElements.forEach(function(el) {
    var rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - CONFIG.scroll.triggerOffset) {
      el.classList.add(CLASSES.animated);
    }
  });

  var featureCards = document.querySelectorAll(SELECTORS.featureCard);
  featureCards.forEach(function(el) {
    var rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - CONFIG.scroll.triggerOffset) {
      el.classList.add(CLASSES.animated);
    }
  });

  animateCounters();
}

window.addEventListener('scroll', handleScrollAnimations);
window.addEventListener('load', handleScrollAnimations);

(function initMobileNavigation() {
  var hamburger = document.getElementById('hamburger');
  var mainNav   = document.getElementById('mainNav');

  if (!hamburger || !mainNav) { return; }

  function openNav() {
    hamburger.classList.add(CLASSES.active);
    mainNav.classList.add(CLASSES.open);
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeNav() {
    hamburger.classList.remove(CLASSES.active);
    mainNav.classList.remove(CLASSES.open);
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';

    mainNav.querySelectorAll('.' + CLASSES.isOpen).forEach(function(el) {
      el.classList.remove(CLASSES.isOpen);
      var trigger = el.querySelector('.nav-btn, a');
      if (trigger) { trigger.setAttribute('aria-expanded', 'false'); }
    });
  }

  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.addEventListener('click', function() {
    if (mainNav.classList.contains(CLASSES.open)) {
      closeNav();
    } else {
      openNav();
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && mainNav.classList.contains(CLASSES.open)) {
      closeNav();
      hamburger.focus();
    }
  });

  mainNav.querySelectorAll('.has-dropdown > .nav-btn, .has-dropdown > a').forEach(function(trigger) {
    var parentItem = trigger.parentElement;

    trigger.setAttribute('aria-expanded', 'false');

    trigger.addEventListener('click', function(e) {

      if (getComputedStyle(hamburger).display === 'none') { return; }

      e.preventDefault();

      var isCurrentlyOpen = parentItem.classList.contains(CLASSES.isOpen);

      var siblings = parentItem.parentElement.querySelectorAll(':scope > .has-dropdown');
      siblings.forEach(function(sib) {
        if (sib !== parentItem) {
          sib.classList.remove(CLASSES.isOpen);
          var sibTrigger = sib.querySelector('.nav-btn, a');
          if (sibTrigger) { sibTrigger.setAttribute('aria-expanded', 'false'); }
        }
      });

      parentItem.classList.toggle(CLASSES.isOpen, !isCurrentlyOpen);
      trigger.setAttribute('aria-expanded', String(!isCurrentlyOpen));
    });
  });
})();

(function initDesktopDropdowns() {
  var hamburger = document.getElementById('hamburger');
  if (!hamburger) { return; }

  var CLOSE_DELAY = 700;
  var timers = new Map();

  function isDesktop() {
    return getComputedStyle(hamburger).display === 'none';
  }

  function showDropdown(item) {
    if (timers.has(item)) {
      clearTimeout(timers.get(item));
      timers.delete(item);
    }
    var dd = item.querySelector(':scope > .dropdown');
    if (dd) { dd.classList.add('dd-open'); }
  }

  function scheduleHide(item) {
    var dd = item.querySelector(':scope > .dropdown');
    if (!dd) { return; }
    var timer = setTimeout(function() {
      dd.classList.remove('dd-open');
      timers.delete(item);
    }, CLOSE_DELAY);
    timers.set(item, timer);
  }

  document.querySelectorAll('.has-dropdown').forEach(function(item) {
    item.addEventListener('mouseenter', function() {
      if (!isDesktop()) { return; }
      showDropdown(item);
    });

    item.addEventListener('mouseleave', function() {
      if (!isDesktop()) { return; }
      scheduleHide(item);
    });
  });
})();

(function initSmoothScroll() {
  var anchorLinks = document.querySelectorAll(SELECTORS.anchorLinks);

  anchorLinks.forEach(function(anchor) {
    anchor.addEventListener('click', function(event) {
      var targetId = this.getAttribute('href');
      var targetElement = document.querySelector(targetId);

      if (targetElement) {
        event.preventDefault();
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
})();

(function initExternalLinks() {
  var currentHost = window.location.host;
  var base = window.location.href;

  document.querySelectorAll('a[href]').forEach(function(link) {
    if (link.getAttribute('target')) return;

    var href = link.getAttribute('href');
    if (!href || href.charAt(0) === '#') return;

    var resolved;
    try {
      resolved = new URL(href, base);
    } catch (e) {
      return;
    }

    if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') return;
    if (resolved.host === currentHost) return;

    link.setAttribute('target', '_blank');

    var rel = link.getAttribute('rel') || '';
    var tokens = rel.split(/\s+/).filter(Boolean);
    if (tokens.indexOf('noopener') === -1) tokens.push('noopener');
    if (tokens.indexOf('noreferrer') === -1) tokens.push('noreferrer');
    link.setAttribute('rel', tokens.join(' '));
  });
})();
