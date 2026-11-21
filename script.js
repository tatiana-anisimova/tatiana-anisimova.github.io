/* ==========================================================================
   Татьяна Анисимова — portfolio interactions
   ========================================================================== */

(() => {
  'use strict';

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const isEnglish = document.documentElement.lang === 'en';

  const ui = {
    openMenu: isEnglish ? 'Open menu' : 'Открыть меню',
    closeMenu: isEnglish ? 'Close menu' : 'Закрыть меню',
    video: isEnglish ? 'Video' : 'Видео',
    play: isEnglish ? 'Play' : 'Воспроизвести',
    watchVimeo: isEnglish ? 'Watch on Vimeo' : 'Смотреть на Vimeo',
    watch: isEnglish ? 'Watch' : 'Смотреть',
    open: isEnglish ? 'Open' : 'Открыть'
  };

  const body = document.body;
  const header = $('#site-header');
  const scrollProgress = $('#scroll-progress');
  const mobileMenu = $('#mobile-menu');
  const burger = $('#burger');
  let navLinks = [];
  let navSections = [];

  /* ------------------------------------------------------------------------
     Utilities
     ------------------------------------------------------------------------ */

  const lockScroll = () => {
    const hasOverlay = $('.modal.is-open') || $('.lightbox.is-open') || mobileMenu.classList.contains('is-open');
    body.classList.toggle('modal-open', Boolean(hasOverlay));
  };

  const setAriaHidden = (element, hidden) => {
    if (element) element.setAttribute('aria-hidden', hidden ? 'true' : 'false');
  };

  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'iframe',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  const trapFocus = (container, event) => {
    if (event.key !== 'Tab' || !container) return;
    const focusable = $$(focusableSelector, container).filter((el) => {
      return el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement;
    });
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  /* ------------------------------------------------------------------------
     Year + header scroll + progress
     ------------------------------------------------------------------------ */

  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  let scrollTicking = false;

  const updateOnScroll = () => {
    const y = window.scrollY || document.documentElement.scrollTop;

    if (header) header.classList.toggle('is-scrolled', y > 18);

    if (scrollProgress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      scrollProgress.style.transform = `scaleX(${progress})`;
    }

    updateActiveNav(y);
    scrollTicking = false;
  };

  const requestScrollUpdate = () => {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(updateOnScroll);
    }
  };

  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', requestScrollUpdate, { passive: true });

  /* ------------------------------------------------------------------------
     Mobile menu
     ------------------------------------------------------------------------ */

  let menuOpen = false;
  let menuReturnFocus = null;

  const openMenu = () => {
    menuOpen = true;
    menuReturnFocus = document.activeElement;
    mobileMenu.classList.add('is-open');
    setAriaHidden(mobileMenu, false);
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', ui.closeMenu);
    body.classList.add('menu-open');
    window.setTimeout(() => {
      const firstLink = $('.mobile-link', mobileMenu);
      if (firstLink) firstLink.focus({ preventScroll: true });
    }, 320);
  };

  const closeMenu = (restoreFocus = true) => {
    menuOpen = false;
    mobileMenu.classList.remove('is-open');
    setAriaHidden(mobileMenu, true);
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', ui.openMenu);
    body.classList.remove('menu-open');
    if (restoreFocus && menuReturnFocus instanceof HTMLElement) {
      menuReturnFocus.focus({ preventScroll: true });
      menuReturnFocus = null;
    }
  };

  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      if (menuOpen) closeMenu();
      else openMenu();
    });

    $$('.mobile-link, .mobile-menu a', mobileMenu).forEach((link) => {
      link.addEventListener('click', () => closeMenu(false));
    });

    mobileMenu.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
      } else {
        trapFocus(mobileMenu, event);
      }
    });
  }

  /* ------------------------------------------------------------------------
     Active navigation
     ------------------------------------------------------------------------ */

  navLinks = $$('.nav-link');
  navSections = ['video', 'photo', 'events', 'contact']
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  function updateActiveNav(y) {
    let currentId = '';
    const marker = y + Math.min(220, window.innerHeight * 0.3);

    navSections.forEach((section) => {
      if (section.offsetTop <= marker) currentId = section.id;
    });

    navLinks.forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('href') === `#${currentId}`);
    });
  }

  updateOnScroll();

  /* ------------------------------------------------------------------------
     Scroll reveal
     ------------------------------------------------------------------------ */

  $$('.stagger').forEach((parent) => {
    $$('.reveal', parent).forEach((el, index) => {
      el.style.setProperty('--delay', `${Math.min(index * 70, 420)}ms`);
    });
  });

  const revealEls = $$('.reveal');

  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.01, rootMargin: '0px 0px 10% 0px' });

    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* ------------------------------------------------------------------------
     Stats counters
     ------------------------------------------------------------------------ */

  const counters = $$('[data-count]');

  const animateCounter = (el) => {
    const target = Number(el.dataset.count || 0);
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = `${Math.round(target * eased)}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    };

    if (prefersReducedMotion) {
      el.textContent = `${target}${suffix}`;
    } else {
      requestAnimationFrame(tick);
    }
  };

  if (counters.length) {
    if ('IntersectionObserver' in window) {
      const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.6 });

      counters.forEach((counter) => counterObserver.observe(counter));
    } else {
      counters.forEach((counter) => {
        counter.textContent = `${counter.dataset.count || 0}${counter.dataset.suffix || ''}`;
      });
    }
  }

  /* ------------------------------------------------------------------------
     Video modal / Vimeo
     ------------------------------------------------------------------------ */

  const videoModal = $('#video-modal');
  const videoEmbed = $('#video-embed');
  const videoTitle = $('#video-modal-title');
  const videoMeta = $('#video-modal-meta');
  let videoReturnFocus = null;

  const vimeoIframe = (id, title) => `
    <iframe
      src="https://player.vimeo.com/video/${encodeURIComponent(id)}?autoplay=1&title=0&byline=0&portrait=0&dnt=1&color=B84A2A"
      title="${title.replace(/"/g, '&quot;')} — Vimeo"
      allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
      allowfullscreen
      loading="eager"></iframe>`;

  const openVideo = (button) => {
    const id = button.dataset.videoId;
    if (!id || !videoModal || !videoEmbed) return;

    const title = button.dataset.videoTitle || ui.video;
    const cover = button.querySelector('img')?.getAttribute('src') || '';

    videoReturnFocus = document.activeElement;
    if (videoTitle) videoTitle.textContent = title;
    if (videoMeta) videoMeta.textContent = button.dataset.videoMeta || '';

    const modalLink = $('#video-modal-link');
    if (modalLink) modalLink.href = `https://vimeo.com/${encodeURIComponent(id)}`;

    // Keep the Vimeo cover visible until the user explicitly starts playback.
    videoEmbed.innerHTML = `
      <button class="video-facade" type="button" aria-label="${ui.play}: ${title.replace(/"/g, '&quot;')}">
        <img src="${cover.replace(/"/g, '&quot;')}" alt="" loading="eager" decoding="async">
        <span class="video-facade-play" aria-hidden="true">
          <span><svg width="22" height="22" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg></span>
        </span>
        <span class="video-facade-label">${ui.watchVimeo}</span>
      </button>`;

    $('.video-facade', videoEmbed)?.addEventListener('click', () => {
      videoEmbed.innerHTML = vimeoIframe(id, title);
    }, { once: true });

    videoModal.classList.add('is-open');
    setAriaHidden(videoModal, false);
    body.classList.add('modal-open');

    window.setTimeout(() => {
      const close = $('.modal-close', videoModal);
      if (close) close.focus({ preventScroll: true });
    }, 80);
  };

  const closeVideo = () => {
    if (!videoModal || !videoModal.classList.contains('is-open')) return;
    videoModal.classList.remove('is-open');
    setAriaHidden(videoModal, true);
    videoEmbed.innerHTML = '';
    lockScroll();
    if (videoReturnFocus instanceof HTMLElement) {
      videoReturnFocus.focus({ preventScroll: true });
      videoReturnFocus = null;
    }
  };

  $$('[data-video-id]').forEach((button) => {
    button.addEventListener('click', () => openVideo(button));
  });

  $$('[data-close-video]').forEach((el) => {
    el.addEventListener('click', closeVideo);
  });

  videoModal?.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeVideo();
    } else {
      trapFocus(videoModal, event);
    }
  });

  /* ------------------------------------------------------------------------
     Photo filters
     ------------------------------------------------------------------------ */

  const filterButtons = $$('.filter-btn');
  const photoItems = $$('.photo-item');
  const photoGrid = $('#photo-grid');

  const countFor = (filter) => {
    if (filter === 'all') return photoItems.length;
    return photoItems.filter((item) => item.dataset.category === filter).length;
  };

  filterButtons.forEach((button) => {
    const filter = button.dataset.filter || 'all';
    const countEl = $('.filter-count', button);
    if (countEl) countEl.textContent = String(countFor(filter));
  });

  const applyFilter = (filter) => {
    filterButtons.forEach((button) => {
      const active = button.dataset.filter === filter;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    photoItems.forEach((item) => {
      const show = filter === 'all' || item.dataset.category === filter;
      item.classList.toggle('is-hidden', !show);
      if (show && !prefersReducedMotion) {
        item.style.animation = 'none';
        // Force a reflow so the entrance animation can replay.
        void item.offsetWidth;
        item.style.animation = '';
        item.classList.add('is-shown');
      }
    });
  };

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      applyFilter(button.dataset.filter || 'all');
    });
  });

  if (photoGrid && 'MutationObserver' in window) {
    // Keep the grid consistent when it changes visibility.
    const gridObserver = new MutationObserver(() => {
      photoGrid.classList.toggle('is-filtered', Boolean($('.photo-item.is-hidden', photoGrid)));
    });
    gridObserver.observe(photoGrid, { attributes: true, subtree: true, attributeFilter: ['class'] });
  }

  /* ------------------------------------------------------------------------
     Lightbox
     ------------------------------------------------------------------------ */

  const lightbox = $('#lightbox');
  const lightboxImg = $('#lightbox-img');
  const lightboxTitle = $('#lightbox-title');
  const lightboxSub = $('#lightbox-sub');
  const lightboxCount = $('#lightbox-count');
  let lightboxItems = [];
  let lightboxIndex = 0;
  let lightboxReturnFocus = null;
  let touchStartX = 0;
  let touchStartY = 0;

  const getVisiblePhotoButtons = () => {
    return $$('.photo-item:not(.is-hidden) .photo-btn');
  };

  const preloadPhoto = (index) => {
    const item = lightboxItems[index];
    if (!item) return;
    const img = new Image();
    img.src = item.full;
  };

  const renderLightbox = () => {
    const item = lightboxItems[lightboxIndex];
    if (!item) return;

    lightboxImg.classList.remove('is-loaded');
    lightboxImg.src = item.full;
    lightboxImg.alt = item.alt;

    const markLoaded = () => {
      lightboxImg.classList.add('is-loaded');
    };

    if (lightboxImg.complete) {
      markLoaded();
    } else {
      lightboxImg.onload = markLoaded;
    }

    if (lightboxTitle) lightboxTitle.textContent = item.title;
    if (lightboxSub) lightboxSub.textContent = item.subtitle;
    if (lightboxCount) {
      lightboxCount.textContent = `${String(lightboxIndex + 1).padStart(2, '0')} / ${String(lightboxItems.length).padStart(2, '0')}`;
    }

    preloadPhoto((lightboxIndex + 1) % lightboxItems.length);
    preloadPhoto((lightboxIndex - 1 + lightboxItems.length) % lightboxItems.length);
  };

  const openLightbox = (button) => {
    if (!lightbox) return;

    lightboxItems = getVisiblePhotoButtons().map((btn) => ({
      full: btn.dataset.full,
      title: btn.dataset.title || '',
      subtitle: btn.dataset.subtitle || '',
      alt: btn.dataset.alt || btn.dataset.title || ''
    }));

    lightboxIndex = lightboxItems.findIndex((item) => item.full === button.dataset.full);
    if (lightboxIndex < 0) lightboxIndex = 0;

    lightboxReturnFocus = document.activeElement;
    renderLightbox();
    lightbox.classList.add('is-open');
    setAriaHidden(lightbox, false);
    body.classList.add('modal-open');

    window.setTimeout(() => {
      const close = $('#lightbox-close');
      if (close) close.focus({ preventScroll: true });
    }, 80);
  };

  const closeLightbox = () => {
    if (!lightbox || !lightbox.classList.contains('is-open')) return;
    lightbox.classList.remove('is-open');
    setAriaHidden(lightbox, true);
    lockScroll();
    if (lightboxReturnFocus instanceof HTMLElement) {
      lightboxReturnFocus.focus({ preventScroll: true });
      lightboxReturnFocus = null;
    }
  };

  const moveLightbox = (direction) => {
    if (!lightboxItems.length) return;
    lightboxIndex = (lightboxIndex + direction + lightboxItems.length) % lightboxItems.length;
    renderLightbox();
  };

  $$('.photo-btn').forEach((button) => {
    button.addEventListener('click', () => openLightbox(button));
  });

  $('#lightbox-close')?.addEventListener('click', closeLightbox);
  $('#lb-prev')?.addEventListener('click', () => moveLightbox(-1));
  $('#lb-next')?.addEventListener('click', () => moveLightbox(1));

  lightbox?.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  lightbox?.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeLightbox();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveLightbox(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveLightbox(1);
    } else {
      trapFocus(lightbox, event);
    }
  });

  lightbox?.addEventListener('touchstart', (event) => {
    const touch = event.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }, { passive: true });

  lightbox?.addEventListener('touchend', (event) => {
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) {
      moveLightbox(dx < 0 ? 1 : -1);
    }
  }, { passive: true });

  /* ------------------------------------------------------------------------
     Event explorer
     ------------------------------------------------------------------------ */

  const eventRows = $$('.event-row');
  const eventViewer = $('.event-viewer');
  const eventImage = $('#event-image');
  const eventImgWrap = eventImage?.closest('.event-img-wrap');
  const eventCaption = $('#event-caption');
  const eventCount = $('#event-count');
  const eventPrev = $('#event-prev');
  const eventNext = $('#event-next');
  const eventPhotoCount = $('#event-photo-count');
  const eventViewerHome = eventViewer?.parentElement;
  const eventViewerAnchor = eventViewer?.nextElementSibling;
  const mobileEventsQuery = window.matchMedia('(max-width: 1024px)');
  let eventAlbum = [];
  let eventPhotoIndex = 0;

  const splitAttr = (value) => (value ? value.split('|') : []);

  const readAlbum = (row) => {
    const images = splitAttr(row.dataset.images);
    if (!images.length && row.dataset.image) images.push(row.dataset.image);
    const alts = splitAttr(row.dataset.alts);
    const fits = splitAttr(row.dataset.fits);
    const themes = splitAttr(row.dataset.themes);
    const captions = splitAttr(row.dataset.captions);

    return images.map((src, index) => ({
      src,
      alt: alts[index] || row.dataset.alt || '',
      fit: fits[index] || 'cover',
      theme: themes[index] || 'light',
      caption: captions[index] || row.dataset.caption || ''
    }));
  };

  const imagePreloads = new Map();
  let eventRenderToken = 0;

  const preloadEventImage = (src) => {
    if (!src) return Promise.resolve();
    if (imagePreloads.has(src)) return imagePreloads.get(src);

    const promise = new Promise((resolve) => {
      const preload = new Image();
      const done = () => {
        if (typeof preload.decode === 'function') {
          preload.decode().then(resolve, resolve);
        } else {
          resolve();
        }
      };
      preload.onload = done;
      preload.onerror = resolve;
      preload.src = src;
    });

    imagePreloads.set(src, promise);
    return promise;
  };

  const renderEventPhoto = () => {
    const item = eventAlbum[eventPhotoIndex];
    if (!item || !eventImage) return;
    const token = ++eventRenderToken;

    if (eventPhotoCount) eventPhotoCount.textContent = `${eventPhotoIndex + 1} / ${eventAlbum.length}`;
    if (eventCaption) eventCaption.textContent = item.caption;

    preloadEventImage(item.src).then(() => {
      if (token !== eventRenderToken) return;
      if (eventImgWrap) {
        eventImgWrap.classList.toggle('is-dark', item.theme === 'dark');
        eventImgWrap.classList.toggle('is-white', item.theme === 'white');
      }
      eventImage.classList.toggle('is-contain', item.fit === 'contain');
      eventImage.src = item.src;
      eventImage.alt = item.alt;
    });
  };

  const placeEventViewer = (index) => {
    if (!eventViewer || !eventViewerHome || !eventViewerAnchor) return;

    if (mobileEventsQuery.matches) {
      const row = eventRows[index];
      const details = row?.querySelector('.event-details');
      if (details && eventViewer.previousElementSibling !== details) {
        details.after(eventViewer);
      }
      return;
    }

    if (eventViewer.parentElement !== eventViewerHome) {
      eventViewerHome.insertBefore(eventViewer, eventViewerAnchor);
    }
  };

  const setEvent = (index) => {
    const row = eventRows[index];
    if (!row || !eventImage) return;

    eventRows.forEach((item, itemIndex) => {
      const active = itemIndex === index;
      item.classList.toggle('is-active', active);
      const toggle = $('.event-toggle', item);
      if (toggle) toggle.setAttribute('aria-expanded', active ? 'true' : 'false');
    });

    eventAlbum = readAlbum(row);
    eventPhotoIndex = 0;
    eventAlbum.forEach((item) => preloadEventImage(item.src));
    if (eventViewer) eventViewer.classList.toggle('has-album', eventAlbum.length > 1);
    if (eventCount) {
      eventCount.textContent = `${String(index + 1).padStart(2, '0')} / ${String(eventRows.length).padStart(2, '0')}`;
    }
    placeEventViewer(index);
    renderEventPhoto();
  };

  mobileEventsQuery.addEventListener('change', () => placeEventViewer(eventRows.findIndex((row) => row.classList.contains('is-active'))));

  const moveEventPhoto = (delta) => {
    if (eventAlbum.length < 2) return;
    eventPhotoIndex = (eventPhotoIndex + delta + eventAlbum.length) % eventAlbum.length;
    renderEventPhoto();
  };

  eventRows.forEach((row, index) => {
    const toggle = $('.event-toggle', row);
    toggle?.addEventListener('click', () => setEvent(index));
  });

  eventPrev?.addEventListener('click', () => moveEventPhoto(-1));
  eventNext?.addEventListener('click', () => moveEventPhoto(1));

  /* ------------------------------------------------------------------------
     Custom cursor
     ------------------------------------------------------------------------ */

  if (finePointer && !prefersReducedMotion) {
    const cursor = $('#cursor');
    const badge = $('#cursor-badge');

    if (cursor && badge) {
      document.documentElement.classList.add('cursor-ready');
      let x = window.innerWidth / 2;
      let y = window.innerHeight / 2;
      let targetX = x;
      let targetY = y;
      let visible = false;

      const renderCursor = () => {
        x += (targetX - x) * 0.18;
        y += (targetY - y) * 0.18;
        cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        requestAnimationFrame(renderCursor);
      };

      document.addEventListener('pointermove', (event) => {
        targetX = event.clientX;
        targetY = event.clientY;
        if (!visible) {
          x = targetX;
          y = targetY;
          visible = true;
          cursor.classList.add('is-visible');
        }
      }, { passive: true });

      document.addEventListener('pointerover', (event) => {
        const target = event.target.closest('[data-cursor]');
        if (target) {
          badge.textContent = target.dataset.cursor === 'play' ? ui.watch : ui.open;
          cursor.classList.add('is-active');
        } else {
          cursor.classList.remove('is-active');
        }
      });

      document.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
      document.addEventListener('pointerup', () => cursor.classList.remove('is-down'));
      document.addEventListener('mouseleave', () => cursor.classList.remove('is-visible'));
      document.addEventListener('mouseenter', () => cursor.classList.add('is-visible'));

      requestAnimationFrame(renderCursor);
    }
  }

  /* ------------------------------------------------------------------------
     Global keyboard + overlay behaviour
     ------------------------------------------------------------------------ */

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;

    if (menuOpen) {
      closeMenu();
      return;
    }

    if (lightbox?.classList.contains('is-open')) {
      closeLightbox();
      return;
    }

    if (videoModal?.classList.contains('is-open')) {
      closeVideo();
      return;
    }
  });

  // Close the video overlay when clicking the dimmed backdrop.
  videoModal?.addEventListener('click', (event) => {
    if (event.target === videoModal) closeVideo();
  });

  // Refresh the lock state after any overlay transition.
  const overlayObserver = new MutationObserver(lockScroll);
  [videoModal, lightbox, mobileMenu].forEach((el) => {
    if (el) overlayObserver.observe(el, { attributes: true, attributeFilter: ['class'] });
  });

  // The first event panel is open in the markup; make sure the image matches.
  if (eventRows.length) setEvent(0);

  // Keep the initial filter state consistent.
  applyFilter('all');
})();

