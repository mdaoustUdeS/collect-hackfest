

'use strict';

(function initTimeline() {

  var CONFIG = {

    tooltip: {
      hideDelay: 2000,
      cancelGracePeriod: 400
    },

    stacking: {
      verticalOffset: 72,
      labelProximityThreshold: 6
    },

    zoom: {
      minScale: 0.5,
      maxScale: 3,
      step: 0.1
    },

    mobile: {
      breakpoint: 767,
      eventSpacing: 120
    }
  };

  var SELECTORS = {
    section: '#timeline-section',
    track: '.timeline-track',
    tooltip: '#timeline-tooltip',
    tooltipImageWrap: '#timeline-tooltip-image-wrap',
    tooltipImage: '#timeline-tooltip-image',
    closeBtn: '#timeline-fullscreen-close',
    eventsData: '#timeline-events-data',
    today: '.timeline-today',
    event: '.timeline-event',
    zoomWrap: '.timeline-zoom-wrap'
  };

  var CLASSES = {
    fullscreen: 'fullscreen',
    stacked: 'timeline-event--stacked',
    stackedSecondary: 'timeline-event--stacked-secondary',
    labelAbove: 'timeline-event--label-above'
  };

  var section = document.getElementById('timeline-section');

  if (!section) {
    return;
  }

  var track = section.querySelector(SELECTORS.track);
  var tooltip = document.getElementById('timeline-tooltip');
  var tooltipImageWrap = document.getElementById('timeline-tooltip-image-wrap');
  var tooltipImage = document.getElementById('timeline-tooltip-image');
  var tooltipDate = tooltip ? tooltip.querySelector('.timeline-tooltip-date') : null;
  var tooltipTitle = tooltip ? tooltip.querySelector('.timeline-tooltip-title') : null;
  var tooltipDesc = tooltip ? tooltip.querySelector('.timeline-tooltip-desc') : null;
  var tooltipLink = tooltip ? tooltip.querySelector('.timeline-tooltip-link') : null;
  var closeBtn = document.getElementById('timeline-fullscreen-close');

  function parseDate(str) {
    if (!str) {
      return null;
    }

    var parts = str.split('-').map(Number);
    if (parts.length !== 3) {
      return null;
    }

    var date = new Date(parts[0], parts[1] - 1, parts[2]);
    return isNaN(date.getTime()) ? null : date;
  }

  function dateToYMD(date) {
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  function getFourthThursdays(fromDate, endDate) {
    var results = [];
    var currentDate = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
    var end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    while (currentDate <= end) {
      var thursdayCount = 0;
      var monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      var cursor = new Date(monthStart);

      while (cursor.getMonth() === monthStart.getMonth()) {
        if (cursor.getDay() === 4) {
          thursdayCount++;
          if (thursdayCount === 4) {
            var thursday = new Date(cursor);
            if (thursday >= fromDate && thursday <= end) {
              results.push(thursday);
            }
            break;
          }
        }
        cursor.setDate(cursor.getDate() + 1);
      }

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return results;
  }

  function resolveImageUrl(imagePath) {
    if (!imagePath) {
      return '';
    }

    if (imagePath.indexOf('/') === 0 || imagePath.indexOf('http') === 0) {
      return imagePath;
    }

    var base = section.getAttribute('data-images-base') || '/assets/images/';
    if (base.slice(-1) !== '/') {
      base += '/';
    }

    return base + imagePath;
  }

  var scriptData = document.getElementById('timeline-events-data');

  if (!scriptData || !track) {
    return;
  }

  var rawEvents = [];
  try {
    rawEvents = JSON.parse(scriptData.textContent);
  } catch (e) {
    console.error('Timeline: Failed to parse event data', e);
    return;
  }

  function expandEvents(events) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var result = [];

    events.forEach(function(event) {

      if (event.recurrence &&
          event.recurrence.rule === '4th_thursday_monthly' &&
          event.recurrence.end_date) {

        var endDate = parseDate(event.recurrence.end_date);
        if (!endDate) {
          return;
        }

        var excludeDates = new Set();
        if (Array.isArray(event.recurrence.exclude_dates)) {
          event.recurrence.exclude_dates.forEach(function(d) {
            if (typeof d === 'string' && d) {
              excludeDates.add(d);
            }
          });
        }

        var dates = getFourthThursdays(today, endDate);

        dates.forEach(function(date) {
          var ymd = dateToYMD(date);
          if (excludeDates.has(ymd)) {
            return;
          }

          result.push({
            id: event.id,
            title: event.title,
            description: event.description,
            date: ymd,
            dateObj: date,
            url: event.url || '',
            image: event.image || ''
          });
        });

      } else if (event.date) {

        var date = parseDate(event.date);

        if (date && date >= today) {
          result.push({
            id: event.id,
            title: event.title,
            description: event.description,
            date: event.date,
            dateObj: date,
            url: event.url || '',
            image: event.image || ''
          });
        }
      }
    });

    return result;
  }

  var flatEvents = expandEvents(rawEvents);
  flatEvents.sort(function(a, b) {
    return a.dateObj - b.dateObj;
  });

  var dateGroups = {};

  flatEvents.forEach(function(event) {
    if (!dateGroups[event.date]) {
      dateGroups[event.date] = [];
    }
    dateGroups[event.date].push(event);
  });

  Object.keys(dateGroups).forEach(function(date) {
    var group = dateGroups[date];
    group.forEach(function(event, index) {
      event.stackIndex = index;
      event.stackTotal = group.length;
    });
  });

  var today = new Date();
  today.setHours(0, 0, 0, 0);

  var lastEventDate = flatEvents.length ? flatEvents[flatEvents.length - 1].dateObj : today;
  var totalTimeSpan = lastEventDate - today;

  if (totalTimeSpan <= 0) {
    totalTimeSpan = 1;
  }

  function calculatePositionPercent(dateObj) {
    var milliseconds = dateObj - today;
    return Math.min(100, Math.max(0, (milliseconds / totalTimeSpan) * 100));
  }

  var positions = flatEvents.map(function(event) {
    return calculatePositionPercent(event.dateObj);
  });

  var labelAbove = false;

  flatEvents.forEach(function(event, index) {
    var previousPosition = index > 0 ? positions[index - 1] : -100;

    if (positions[index] - previousPosition < CONFIG.stacking.labelProximityThreshold) {
      labelAbove = !labelAbove;
    } else {
      labelAbove = false;
    }

    event.labelAbove = labelAbove;
  });

  (function assignProximityStacking() {

    var sectionW = section.getBoundingClientRect().width ||
                   section.offsetWidth ||
                   window.innerWidth ||
                   900;
    var trackW = Math.max(sectionW - 70, 200);

    var PROXIMITY_PX = 48;

    var slots = [];
    flatEvents.forEach(function(ev, idx) {
      if (slots.length === 0 || slots[slots.length - 1].date !== ev.date) {
        slots.push({ date: ev.date, n: 1, position: positions[idx] });
      } else {
        slots[slots.length - 1].n++;
      }
    });

    var i = 0;
    while (i < slots.length) {
      var groupStart = i;
      while (
        i + 1 < slots.length &&
        (slots[i + 1].position - slots[groupStart].position) / 100 * trackW < PROXIMITY_PX
      ) {
        i++;
      }

      var groupEnd = i;
      if (groupEnd > groupStart) {

        var centers = [];
        var cursor = 0;
        for (var s = groupStart; s <= groupEnd; s++) {
          var n = slots[s].n;
          var above = Math.ceil((n - 1) / 2);
          var below = Math.floor((n - 1) / 2);
          var center = (s === groupStart) ? 0 : cursor + above + 1;
          centers.push(center);
          cursor = center + below;
        }

        var topExtent    = centers[0]                   - Math.ceil((slots[groupStart].n - 1) / 2);
        var bottomExtent = centers[centers.length - 1]  + Math.floor((slots[groupEnd].n  - 1) / 2);
        var shift        = (topExtent + bottomExtent) / 2;

        for (var s2 = groupStart; s2 <= groupEnd; s2++) {
          var proximityCenter = centers[s2 - groupStart] - shift;
          var slotDate = slots[s2].date;
          flatEvents.forEach(function(ev) {
            if (ev.date === slotDate) {
              ev.proximityOffset = proximityCenter;
              if (proximityCenter < 0) {
                ev.labelAbove = true;
              } else if (proximityCenter > 0) {
                ev.labelAbove = false;
              }
            }
          });
        }
      }

      i++;
    }
  })();

  var isMobile = window.innerWidth <= CONFIG.mobile.breakpoint;

  var zoomWrap = document.createElement('div');
  zoomWrap.className = 'timeline-zoom-wrap';
  zoomWrap.style.position = 'relative';
  zoomWrap.style.width = '100%';
  zoomWrap.style.height = '100%';

  while (track.firstChild) {
    zoomWrap.appendChild(track.firstChild);
  }
  track.appendChild(zoomWrap);

  flatEvents.forEach(function(event, index) {

    var item = document.createElement('div');
    item.className = 'timeline-event';

    if (event.labelAbove) {
      item.className += ' ' + CLASSES.labelAbove;
    }

    item.setAttribute('role', 'listitem');

    if (isMobile) {

      item.style.left = (index * CONFIG.mobile.eventSpacing
                         + CONFIG.mobile.eventSpacing / 2) + 'px';
    } else {
      var positionPercent = calculatePositionPercent(event.dateObj);
      item.style.left = positionPercent + '%';

      var sameDateOffset = 0;
      if (event.stackTotal > 1) {
        if (event.stackIndex === 0) {
          sameDateOffset = 0;
        } else if (event.stackIndex % 2 === 1) {

          sameDateOffset = -Math.ceil(event.stackIndex / 2);
        } else {

          sameDateOffset = event.stackIndex / 2;
        }

        if (event.stackIndex > 0) {
          item.classList.add(CLASSES.stackedSecondary);
        }
      }

      var totalOffset = sameDateOffset + (event.proximityOffset || 0);
      if (event.stackTotal > 1 || event.proximityOffset !== undefined) {
        item.style.setProperty('--stack-offset', totalOffset);
        item.classList.add(CLASSES.stacked);
      }
    }

    item.setAttribute('data-event-id', event.id);
    item.setAttribute('data-date', event.date);
    item.setAttribute('data-title', event.title);
    item.setAttribute('data-description', event.description);
    item.setAttribute('data-url', event.url);

    if (event.image) {
      item.setAttribute('data-image', event.image);
    }

    item.tabIndex = 0;

    var dot = document.createElement('span');
    dot.className = 'timeline-event-dot';
    dot.setAttribute('aria-hidden', 'true');

    if (event.image) {
      dot.style.backgroundImage = "url('" + resolveImageUrl(event.image) + "')";
    }

    item.appendChild(dot);

    var dateLabel = document.createElement('span');
    dateLabel.className = 'timeline-event-date';
    dateLabel.textContent = event.date;
    item.appendChild(dateLabel);

    zoomWrap.appendChild(item);
  });

  if (isMobile) {
    var mobileInnerWidth = (flatEvents.length + 1) * CONFIG.mobile.eventSpacing
                           + 60;
    var timelineInner = section.querySelector('.timeline-inner');
    if (timelineInner) {
      timelineInner.style.minWidth = mobileInnerWidth + 'px';
    }
  }

  if (isMobile && !sessionStorage.getItem('timeline-swiped')) {
    var hint = document.createElement('div');
    hint.className = 'timeline-swipe-hint';
    hint.setAttribute('aria-hidden', 'true');

    for (var h = 0; h < 3; h++) {
      hint.appendChild(document.createElement('span'));
    }

    section.appendChild(hint);

    section.addEventListener('scroll', function dismissSwipeHint() {
      hint.classList.add('is-dismissed');
      sessionStorage.setItem('timeline-swiped', '1');
      section.removeEventListener('scroll', dismissSwipeHint);
      setTimeout(function() {
        if (hint.parentNode) {
          hint.parentNode.removeChild(hint);
        }
      }, 350);
    });
  }

  var hideTooltipTimeout = null;
  var tooltipShownAt = 0;

  function showTodayTooltip() {
    if (!tooltip) {
      return;
    }

    var todayEl = section.querySelector(SELECTORS.today);
    if (!todayEl) {
      return;
    }

    var title = todayEl.getAttribute('data-tooltip-title');
    var description = todayEl.getAttribute('data-tooltip-description') || '';
    var url = todayEl.getAttribute('data-tooltip-url') || '';

    if (!title) {
      var labelEl = todayEl.querySelector('.timeline-today-label');
      title = labelEl ? labelEl.textContent.trim() : 'Today';
    }

    var lang = (document.documentElement.lang || 'en').split('-')[0];
    var locale = lang === 'fr' ? 'fr-CA' : 'en-CA';
    var dateStr = new Date().toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    if (tooltipDate) {
      tooltipDate.textContent = dateStr;
    }
    tooltipTitle.textContent = title;
    tooltipDesc.textContent = description;

    if (url) {
      tooltipLink.href = url;
      tooltipLink.textContent = url;
      tooltipLink.hidden = false;
    } else {
      tooltipLink.href = '#';
      tooltipLink.textContent = '';
      tooltipLink.hidden = true;
    }

    if (tooltipImageWrap) {
      tooltipImageWrap.hidden = true;
      if (tooltipImage) {
        tooltipImage.removeAttribute('src');
      }
    }

    tooltip.setAttribute('aria-hidden', 'false');
    tooltip.hidden = false;
    positionTooltip(todayEl);

    tooltipShownAt = Date.now();
    scheduleHideTooltip();
  }

  function showTooltip(element) {
    if (!tooltip || !element) {
      return;
    }

    var title = element.getAttribute('data-title') || '';
    var desc = element.getAttribute('data-description') || '';
    var url = element.getAttribute('data-url') || '';
    var imagePath = element.getAttribute('data-image') || '';
    var date = element.getAttribute('data-date') || '';

    if (tooltipDate) {
      tooltipDate.textContent = date;
    }
    tooltipTitle.textContent = title;
    tooltipDesc.textContent = desc;

    if (url) {
      tooltipLink.href = url;
      tooltipLink.textContent = url;
      tooltipLink.hidden = false;
    } else {
      tooltipLink.href = '#';
      tooltipLink.textContent = '';
      tooltipLink.hidden = true;
    }

    if (imagePath && tooltipImageWrap && tooltipImage) {
      tooltipImage.src = resolveImageUrl(imagePath);
      tooltipImage.alt = title;
      tooltipImageWrap.hidden = false;
    } else if (tooltipImageWrap) {
      tooltipImageWrap.hidden = true;
      if (tooltipImage) {
        tooltipImage.removeAttribute('src');
      }
    }

    tooltip.setAttribute('aria-hidden', 'false');
    tooltip.hidden = false;
    positionTooltip(element);

    tooltipShownAt = Date.now();
    scheduleHideTooltip();
  }

  function positionTooltip(element) {
    var elementRect = element.getBoundingClientRect();
    var tooltipRect = tooltip.getBoundingClientRect();

    var x = elementRect.left + elementRect.width / 2 - tooltipRect.width / 2;
    if (x < 10) { x = 10; }
    if (x + tooltipRect.width > window.innerWidth - 10) {
      x = window.innerWidth - tooltipRect.width - 10;
    }

    var trackRect    = track.getBoundingClientRect();
    var trackCenterY = trackRect.top + trackRect.height / 2;
    var dotCenterY   = elementRect.top + elementRect.height / 2;
    var THRESHOLD    = 8;

    var y;
    if (dotCenterY < trackCenterY - THRESHOLD) {

      y = elementRect.top - tooltipRect.height - 12;
    } else if (dotCenterY > trackCenterY + THRESHOLD) {

      y = elementRect.bottom + 12;
    } else {

      y = elementRect.top - tooltipRect.height - 12;
      if (y < 10) { y = elementRect.bottom + 12; }
    }

    tooltip.style.left = x + 'px';
    tooltip.style.top  = y + 'px';
  }

  function hideTooltip() {
    cancelHideTooltip();
    tooltipShownAt = 0;

    if (tooltip) {
      tooltip.setAttribute('aria-hidden', 'true');
      tooltip.hidden = true;
    }
  }

  function scheduleHideTooltip() {
    if (hideTooltipTimeout) {
      clearTimeout(hideTooltipTimeout);
    }

    hideTooltipTimeout = setTimeout(function() {
      hideTooltipTimeout = null;
      hideTooltip();
    }, CONFIG.tooltip.hideDelay);
  }

  function cancelHideTooltip() {
    if (hideTooltipTimeout) {
      clearTimeout(hideTooltipTimeout);
      hideTooltipTimeout = null;
    }
  }

  var zoomScale = 1;

  function exitFullscreen() {
    section.classList.remove(CLASSES.fullscreen);
    document.body.style.overflow = '';

    if (closeBtn) {
      closeBtn.hidden = true;
    }

    resetZoom();
    hideTooltip();
  }

  function resetZoom() {
    zoomScale = 1;
    zoomWrap.style.transform = 'scale(1)';
    zoomWrap.style.transformOrigin = '50% 50%';
  }

  function setZoom(scale) {
    zoomScale = Math.min(CONFIG.zoom.maxScale, Math.max(CONFIG.zoom.minScale, scale));
    zoomWrap.style.transform = 'scale(' + zoomScale + ')';
  }

  track.querySelectorAll(SELECTORS.event).forEach(function(element) {

    element.addEventListener('mouseenter', function() {
      cancelHideTooltip();
      showTooltip(element);
    });

    element.addEventListener('mouseleave', function() {
      scheduleHideTooltip();
    });

    element.addEventListener('focus', function() {
      cancelHideTooltip();
      showTooltip(element);
    });

    element.addEventListener('blur', function() {
      scheduleHideTooltip();
    });
  });

  if (tooltip) {
    tooltip.addEventListener('mouseenter', function() {

      cancelHideTooltip();
    });

    tooltip.addEventListener('mouseleave', function() {

      scheduleHideTooltip();
    });
  }

  window.addEventListener('blur', scheduleHideTooltip);

  section.addEventListener('mouseleave', function() {
    var focusedEvent = document.querySelector(SELECTORS.event + ':focus');
    var todayFocused = section.querySelector(SELECTORS.today + ':focus');

    if (!focusedEvent && !todayFocused) {
      scheduleHideTooltip();
    }
  });

  document.addEventListener('click', function(event) {
    if (!tooltip || tooltip.hidden) {
      return;
    }

    if (tooltip.contains(event.target)) {
      return;
    }

    if (Date.now() - tooltipShownAt < CONFIG.tooltip.cancelGracePeriod) {
      return;
    }

    hideTooltip();
  });

  var todayEl = section.querySelector(SELECTORS.today);

  if (todayEl) {
    todayEl.addEventListener('mouseenter', function() {
      cancelHideTooltip();
      showTodayTooltip();
    });

    todayEl.addEventListener('mouseleave', scheduleHideTooltip);

    todayEl.addEventListener('focus', function() {
      cancelHideTooltip();
      showTodayTooltip();
    });

    todayEl.addEventListener('blur', scheduleHideTooltip);
  }

  window.addEventListener('scroll', function() {
    if (tooltip && !tooltip.hidden) {
      var focusedEvent = document.querySelector(SELECTORS.event + ':focus');
      var todayFocused = section.querySelector(SELECTORS.today + ':focus');

      if (focusedEvent) {
        positionTooltip(focusedEvent);
      } else if (todayFocused) {
        positionTooltip(todayFocused);
      } else {

        var sectionRect = section.getBoundingClientRect();
        var inView = sectionRect.top < window.innerHeight && sectionRect.bottom > 0;

        if (!inView) {
          hideTooltip();
        } else {
          scheduleHideTooltip();
        }
      }
    }
  }, true);

  section.addEventListener('click', function(event) {

    if (isMobile) {
      return;
    }

    if (event.target.closest('.timeline-event a') ||
        event.target.closest('.timeline-fullscreen-close') ||
        event.target.closest(SELECTORS.event) ||
        event.target.closest(SELECTORS.tooltip)) {
      return;
    }

    section.classList.add(CLASSES.fullscreen);
    document.body.style.overflow = 'hidden';

    if (closeBtn) {
      closeBtn.hidden = false;
      closeBtn.focus();
    }

    scheduleHideTooltip();
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', exitFullscreen);
  }

  section.addEventListener('wheel', function(event) {
    if (!section.classList.contains(CLASSES.fullscreen)) {
      return;
    }

    event.preventDefault();

    var rect = zoomWrap.getBoundingClientRect();
    var originX = event.clientX - rect.left;
    var originY = event.clientY - rect.top;
    zoomWrap.style.transformOrigin = originX + 'px ' + originY + 'px';

    var delta = event.deltaY > 0 ? -CONFIG.zoom.step : CONFIG.zoom.step;
    setZoom(zoomScale + delta);
  }, { passive: false });

  section.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && section.classList.contains(CLASSES.fullscreen)) {
      exitFullscreen();
    }
  });
})();
