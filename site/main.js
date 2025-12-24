// Initialize AOS (Animate On Scroll)
AOS.init({
  duration: 800,
  easing: 'ease-out-cubic',
  once: true,
  offset: 100
});

// Smooth Scroll for valid links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
    });
  });
});

console.log('Ninja Meeting Site Loaded 🥷');
