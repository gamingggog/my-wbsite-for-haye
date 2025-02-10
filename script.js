document.addEventListener('DOMContentLoaded', () => {
  // GSAP animations for interactive elements
  gsap.to('.pulse', { duration: 2, scale: 1.2, repeat: -1, yoyo: true, transformOrigin: "50% 50%" });
  gsap.to('.rotate', { duration: 3, rotation: 360, repeat: -1, ease: "linear" });
  gsap.to('.bounce', { y: -20, duration: 0.75, repeat: -1, yoyo: true, ease: "power1.inOut" });
  gsap.to('.shake', {
    x: 5,
    duration: 0.1,
    repeat: -1,
    yoyo: true,
    ease: "power1.inOut"
  });
  gsap.to('.highlight', {
    stroke: "#ff69b4",
    duration: 2,
    yoyo: true,
    repeat: -1,
    ease: "power1.inOut"
  });

  // New GSAP animations
  gsap.to('.spin', { duration: 4, rotation: 360, repeat: -1, ease: "linear" });
  gsap.to('.pulse-large', { duration: 2.5, scale: 1.3, repeat: -1, yoyo: true, transformOrigin: "50% 50%" });
  gsap.to('.bounce-large', { y: -30, duration: 1, repeat: -1, yoyo: true, ease: "power2.inOut" });

  // ScrollMagic for reveal animations
  const controller = new ScrollMagic.Controller();

  document.querySelectorAll('section').forEach(section => {
    new ScrollMagic.Scene({
      triggerElement: section,
      triggerHook: 0.9,
      reverse: false
    })
    .setClassToggle(section, 'visible')
    .addTo(controller);
  });

  // Contact form submission
  const contactForm = document.getElementById('contact-form');
  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Thank you for your message! Haye will get back to you soon.');
    contactForm.reset();
  });
});
