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

const navbar = document.querySelector(".navbar");
const navLinks = document.querySelectorAll(".nav-links a");
const indicator = document.querySelector(".nav-indicator");

// --- Translation Logic ---
let currentLang = localStorage.getItem('ninja_lang') || 'pt-br';

function updateContent(lang) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      if (key === 'nav_home') return; 
      if (translations[lang][key]) {
        el.innerHTML = translations[lang][key];
      }
    }
  });
  
  document.title = translations[lang].title;
  
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });

  localStorage.setItem('ninja_lang', lang);
  AOS.refresh();
}

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const lang = btn.getAttribute('data-lang');
    if (lang !== currentLang) {
      currentLang = lang;
      updateContent(currentLang);
    }
  });
});

updateContent(currentLang);

// --- Ultra Elastic Logic ---

function moveIndicator(target) {
  if (!indicator) return;
  const rect = target.getBoundingClientRect();
  const parentRect = target.parentElement.getBoundingClientRect();
  
  gsap.to(indicator, {
    left: rect.left - parentRect.left,
    width: rect.width,
    duration: 0.8,
    ease: "elastic.out(1, 0.3)",
  });
}

lenis.on('scroll', (e) => {
  const scrollY = e.animatedScroll;
  if (scrollY > 50) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
  
  let current = "";
  document.querySelectorAll("section[id]").forEach((section) => {
    const sectionTop = section.offsetTop;
    if (scrollY >= sectionTop - 150) {
      current = section.getAttribute("id");
    }
  });

  navLinks.forEach((a) => {
    if (a.getAttribute("href") === `#${current}`) {
      if (!a.classList.contains("active")) {
        a.classList.add("active");
        moveIndicator(a);
      }
    } else {
      a.classList.remove("active");
    }
  });

  const velocity = e.velocity;
  const skew = velocity * 0.08;
  const scale = 1 + Math.abs(velocity) * 0.0001;

  gsap.to(".hero, .features-section, .comparison-section, .oss-section, .cta-section", {
    skewY: skew * -0.1,
    scaleY: scale,
    scaleX: 1, // Explicitly keep scaleX as 1
    duration: 0.4,
    ease: "power2.out",
    overwrite: true
  });
});

navLinks.forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const targetId = this.getAttribute("href");
    const targetElement = document.querySelector(targetId);
    
    if (targetElement) {
      moveIndicator(this);
      const targetScroll = targetElement.offsetTop - 80;
      const scrollProxy = { y: lenis.scroll };
      gsap.to(scrollProxy, {
        y: targetScroll,
        duration: 2,
        ease: "elastic.out(1, 0.5)",
        onUpdate: () => {
          lenis.scrollTo(scrollProxy.y, { immediate: true });
        }
      });
    }
  });
});

// --- Elastic Card Hover Logic (DIAGONAL FOCUS) ---
setTimeout(() => {
  const cards = document.querySelectorAll('.feature-card');
  
  cards.forEach(card => {
    card.style.transition = 'none';

    card.addEventListener('mouseenter', () => {
      gsap.killTweensOf(card);
      card.style.zIndex = "999";
      
      gsap.to(card, {
        scale: 1.1,
        duration: 0.5, // Faster entry
        ease: "back.out(2)", // Snappy entry
        overwrite: 'all'
      });
    });

    card.addEventListener('mouseleave', () => {
      gsap.killTweensOf(card);
      
      gsap.to(card, {
        scale: 1,
        duration: 1.5, // Faster total duration
        // Much stronger amplitude (2.5) and lower period (0.2) for rapid, strong vibration
        ease: "elastic.out(2.5, 0.2)",
        onComplete: () => {
          card.style.zIndex = "10";
        },
        overwrite: 'all'
      });
    });
  });
}, 500);

console.log("ninjalive Site: DIAGONAL ELASTIC MOD ACTIVATED 🥷🚀");
