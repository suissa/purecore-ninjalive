import { translations } from './translations.js';

// --- Lenis Smooth Scroll Setup ---
const lenis = new Lenis({
  duration: 1.5,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
  direction: 'vertical',
  gestureDirection: 'vertical',
  smoothHover: true,
  wheelMultiplier: 1.1,
  touchMultiplier: 2,
  infinite: false,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// --- GSAP & AOS Initialization ---
AOS.init({
  duration: 800,
  easing: "ease-out-cubic",
  once: true,
  offset: 100,
});

gsap.registerPlugin(ScrollToPlugin);

// --- State Management ---
let currentLang = localStorage.getItem('ninja_lang') || 'pt-br';
let isMobileMenuOpen = false;

// --- Translation Logic ---
function updateContent(lang) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      el.innerHTML = translations[lang][key];
    }
  });
  
  document.title = translations[lang].title;
  
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });

  localStorage.setItem('ninja_lang', lang);
  AOS.refresh();
}

// lang-switcher logic
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('lang-btn')) {
    const lang = e.target.getAttribute('data-lang');
    if (lang !== currentLang) {
      currentLang = lang;
      updateContent(currentLang);
    }
  }
});

updateContent(currentLang);

// --- Navigation Logic ---
const mainNav = document.getElementById("main-nav");
const mobileMenuTrigger = document.getElementById("mobile-menu-trigger");
const mobileMenuContainer = document.getElementById("mobile-menu-container");
const mobileOverlay = document.getElementById("mobile-overlay");
const menuIconSvg = document.getElementById("menu-icon-svg");
const dockLinks = document.querySelectorAll(".nav-dock-link");
const mobileLinks = document.querySelectorAll(".nav-mobile-link");
const sections = ["home", "features", "security", "comparison", "oss"];

function toggleMobileMenu(open) {
  isMobileMenuOpen = open;
  if (open) {
    mobileMenuContainer.classList.remove("pointer-events-none");
    mobileOverlay.classList.remove("pointer-events-none");
    
    gsap.to(mobileOverlay, { opacity: 1, duration: 0.5 });
    gsap.fromTo(mobileMenuContainer, 
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "elastic.out(1, 0.6)" }
    );
    // Switch to X icon
    menuIconSvg.innerHTML = '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>';
  } else {
    gsap.to(mobileOverlay, { opacity: 0, duration: 0.3 });
    gsap.to(mobileMenuContainer, {
      y: 20,
      opacity: 0,
      duration: 0.4,
      ease: "power2.in",
      onComplete: () => {
        mobileMenuContainer.classList.add("pointer-events-none");
        mobileOverlay.classList.add("pointer-events-none");
      }
    });
    // Switch back to Hamburger icon
    menuIconSvg.innerHTML = '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>';
  }
}

if (mobileMenuTrigger) {
  mobileMenuTrigger.addEventListener("click", () => toggleMobileMenu(!isMobileMenuOpen));
}
if (mobileOverlay) {
  mobileOverlay.addEventListener("click", () => toggleMobileMenu(false));
}

// Back to top button in mobile menu
const backToTopBtn = document.getElementById("mobile-back-to-top");
if (backToTopBtn) {
  backToTopBtn.addEventListener("click", () => {
    lenis.scrollTo(0);
    toggleMobileMenu(false);
  });
}

// Home button in dock
const homeBtn = document.getElementById("dock-home-btn");
if (homeBtn) {
  homeBtn.addEventListener("click", () => lenis.scrollTo(0));
}

// Handle clicks for all navigation links
[...dockLinks, ...mobileLinks].forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const targetId = link.getAttribute("href");
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      lenis.scrollTo(targetElement, { offset: -20 });
    }
    if (isMobileMenuOpen) toggleMobileMenu(false);
  });
});

// --- Scroll/Active Section Logic ---
lenis.on('scroll', (e) => {
  const scrollY = e.animatedScroll;
  
  // Highlight active link
  let current = "";
  sections.forEach((id) => {
    const section = document.getElementById(id);
    if (section) {
      const sectionTop = section.offsetTop;
      if (scrollY >= sectionTop - 150) {
        current = id;
      }
    }
  });

  dockLinks.forEach((a) => {
    const isActive = a.getAttribute("href") === `#${current}`;
    a.classList.toggle("text-primary", isActive);
    a.classList.toggle("font-bold", isActive);
    a.classList.toggle("text-white/60", !isActive);
  });

  // Skew effect on scroll
  const velocity = e.velocity;
  const skew = velocity * 0.08;
  const scale = 1 + Math.abs(velocity) * 0.0001;

  gsap.to(".hero, .features-section, .comparison-section, .oss-section, .cta-section", {
    skewY: skew * -0.1,
    scaleY: scale,
    scaleX: 1,
    duration: 0.4,
    ease: "power2.out",
    overwrite: true
  });
});

// --- Elastic Card Hover Logic ---
setTimeout(() => {
  const cards = document.querySelectorAll('.feature-card');
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      gsap.to(card, { scale: 1.1, duration: 0.5, ease: "back.out(2)", overwrite: 'all' });
      card.style.zIndex = "40";
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { scale: 1, duration: 1.5, ease: "elastic.out(2.5, 0.2)", overwrite: 'all' });
      card.style.zIndex = "10";
    });
  });
}, 500);

console.log("Segurança ninja Site: DOCK MENU ACTIVATED 🥷⚓");
