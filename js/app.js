(() => {
  const menuButton = document.querySelector('.menu-btn');
  const menu = document.querySelector('.nav-links');
  if (menuButton && menu) {
    menuButton.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('is-open');
      menuButton.setAttribute('aria-expanded', String(isOpen));
      menuButton.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
    });

    menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
      menu.classList.remove('is-open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Open navigation');
    }));
  }

  const revealItems = document.querySelectorAll('.reveal');
  revealItems.forEach((item) => {
    item.style.setProperty('--reveal-delay', `${item.dataset.revealDelay || 0}ms`);
  });

  const revealAll = () => revealItems.forEach((item) => item.classList.add('is-visible'));

  if ('IntersectionObserver' in window && revealItems.length) {
    try {
      document.documentElement.classList.add('reveal-enabled');
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.12 });
      revealItems.forEach((item) => revealObserver.observe(item));
    } catch (error) {
      document.documentElement.classList.remove('reveal-enabled');
      revealAll();
    }
  } else {
    revealAll();
  }

  document.querySelectorAll('[data-dish]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelector('#model-viewer')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
})();
