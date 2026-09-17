

'use strict';

var HERO_SLIDER_CONFIG = {
  videoInterval: 30000,
  imageInterval: 5000
};

var HERO_SLIDER_SELECTORS = {
  heroSlider: '.hero-slider',
  polarHero: '.polar-hero',
  heroSlide: '.hero-slider-slide',
  polarSlide: '.polar-hero-slide',
  heroDot: '.hero-slider-dot',
  polarDot: '.polar-dot',
  slideContent: '.hero-slide-content'
};

var HERO_SLIDER_CLASS = 'active';

function initHeroSlider(hero) {
  var isHomeSlider = hero.classList.contains('hero-slider');
  var slideSel = isHomeSlider ? HERO_SLIDER_SELECTORS.heroSlide : HERO_SLIDER_SELECTORS.polarSlide;
  var dotSel = isHomeSlider ? HERO_SLIDER_SELECTORS.heroDot : HERO_SLIDER_SELECTORS.polarDot;

  var slides = hero.querySelectorAll(slideSel);
  var dots = hero.querySelectorAll(dotSel);
  var contentPanels = isHomeSlider ? hero.querySelectorAll(HERO_SLIDER_SELECTORS.slideContent) : [];

  if (!slides.length || !dots.length) {
    return;
  }

  var currentIndex = 0;
  var autoplayTimer = null;
  var dataInterval = parseInt(hero.getAttribute('data-interval'), 10);

  function getSlideInterval(index) {
    if (dataInterval > 0) {
      return dataInterval;
    }
    var slide = slides[index];
    var isVideo = slide && slide.dataset.type === 'video';
    return isVideo ? HERO_SLIDER_CONFIG.videoInterval : HERO_SLIDER_CONFIG.imageInterval;
  }

  function goToSlide(index) {
    slides.forEach(function(s) {
      s.classList.remove(HERO_SLIDER_CLASS);
    });
    dots.forEach(function(d) {
      d.classList.remove(HERO_SLIDER_CLASS);
    });
    if (contentPanels.length) {
      contentPanels.forEach(function(p) {
        p.classList.remove(HERO_SLIDER_CLASS);
      });
    }

    currentIndex = index;
    slides[currentIndex].classList.add(HERO_SLIDER_CLASS);
    dots[currentIndex].classList.add(HERO_SLIDER_CLASS);
    if (contentPanels.length && contentPanels[currentIndex]) {
      contentPanels[currentIndex].classList.add(HERO_SLIDER_CLASS);
    }
  }

  function nextSlide() {
    var nextIndex = (currentIndex + 1) % slides.length;
    goToSlide(nextIndex);
    scheduleNextSlide();
  }

  function scheduleNextSlide() {
    if (autoplayTimer) {
      clearTimeout(autoplayTimer);
    }
    var interval = getSlideInterval(currentIndex);
    autoplayTimer = setTimeout(nextSlide, interval);
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearTimeout(autoplayTimer);
      autoplayTimer = null;
    }
  }

  dots.forEach(function(dot) {
    dot.addEventListener('click', function() {
      var index = parseInt(this.dataset.index, 10);
      if (!isNaN(index)) {
        goToSlide(index);
        scheduleNextSlide();
      }
    });
  });

  hero.addEventListener('mouseenter', stopAutoplay);
  hero.addEventListener('mouseleave', scheduleNextSlide);

  scheduleNextSlide();
}

(function initHeroSliders() {
  var homeHero = document.querySelector(HERO_SLIDER_SELECTORS.heroSlider);
  var polarHero = document.querySelector(HERO_SLIDER_SELECTORS.polarHero);

  if (homeHero) {
    initHeroSlider(homeHero);
  }
  if (polarHero) {
    initHeroSlider(polarHero);
  }
})();
