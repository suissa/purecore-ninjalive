/**
 * Elastic Hover Effect using GSAP
 * @param {string} selector - CSS selector for the elements to apply the effect to
 * @param {object} options - Configuration for the animations
 */
export function initElasticHover(selector = '.feature-card', options = {}) {
  const {
    hoverScale = 1.1,
    hoverDuration = 0.5,
    hoverEase = "back.out(2)",
    leaveDuration = 1.5,
    leaveEase = "elastic.out(2.5, 0.2)",
    activeZIndex = "40",
    defaultZIndex = "10"
  } = options;

  // Function to initialize logic
  const init = () => {
    const elements = document.querySelectorAll(selector);
    
    elements.forEach(el => {
      // Remove any CSS transition that might conflict with GSAP transform
      el.style.transition = 'border-color 0.3s, background 0.3s, box-shadow 0.3s';
      
      el.addEventListener('mouseenter', () => {
        gsap.to(el, { 
          scale: hoverScale, 
          duration: hoverDuration, 
          ease: hoverEase, 
          overwrite: 'all' 
        });
        el.style.zIndex = activeZIndex;
      });

      el.addEventListener('mouseleave', () => {
        gsap.to(el, { 
          scale: 1, 
          duration: leaveDuration, 
          ease: leaveEase, 
          overwrite: 'all' 
        });
        
        setTimeout(() => {
          if (!el.matches(':hover')) {
            el.style.zIndex = defaultZIndex;
          }
        }, 500);
      });
    });
  };

  // Wait for GSAP to be available and DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Small delay to ensure other scripts (like GSAP CDN) are fully parsed
    setTimeout(init, 500);
  }
}
