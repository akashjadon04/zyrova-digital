/**
 * ZYROVA DIGITAL | V6 "GOD MODE" ENGINE
 * --------------------------------------------------------------------------
 * CORE MODULES:
 * 1. MATH & VECTOR LIBRARY (Custom physics calculations)
 * 2. ANIMATION LOOP (RequestAnimationFrame abstraction)
 * 3. PARTICLE PHYSICS ENGINE (Background interactive mesh)
 * 4. MAGNETIC DOM ELEMENTS (Button attraction logic)
 * 5. SCROLL INERTIA SYSTEM (Smooth scrolling like Lenis)
 * 6. FORM PHYSICS (Input field interaction & validation)
 * 7. ROUTING & STATE MANAGEMENT (SPA-like feel)
 * 8. SPOTLIGHT & TILT SYSTEM (Card 3D effects)
 * 9. MOBILE NAVIGATION SYSTEM (Hamburger logic)
 * 10. DOM OBSERVATION (Scroll reveal & stagger)
 * --------------------------------------------------------------------------
 */

'use strict';

/* =========================================
   MODULE 1: MATH UTILITIES & VECTOR CLASS
   ========================================= */
const MathUtils = {
    lerp: (start, end, t) => start * (1 - t) + end * t,
    clamp: (val, min, max) => Math.min(Math.max(val, min), max),
    map: (val, start1, stop1, start2, stop2) => ((val - start1) / (stop1 - start1)) * (stop2 - start2) + start2,
    dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
    rand: (min, max) => Math.random() * (max - min) + min
};

class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    add(v) { this.x += v.x; this.y += v.y; return this; }
    sub(v) { this.x -= v.x; this.y -= v.y; return this; }
    mult(n) { this.x *= n; this.y *= n; return this; }
    div(n) { this.x /= n; this.y /= n; return this; }
    mag() { return Math.sqrt(this.x * this.x + this.y * this.y); }
    normalize() {
        let m = this.mag();
        if (m !== 0) this.div(m);
        return this;
    }
    limit(max) {
        if (this.mag() > max) {
            this.normalize();
            this.mult(max);
        }
        return this;
    }
    copy() { return new Vector2(this.x, this.y); }
    static sub(v1, v2) { return new Vector2(v1.x - v2.x, v1.y - v2.y); }
}

/* =========================================
   MODULE 2: PHYSICS PARTICLE SYSTEM (Background)
   ========================================= */
class Particle {
    constructor(canvasWidth, canvasHeight) {
        this.pos = new Vector2(Math.random() * canvasWidth, Math.random() * canvasHeight);
        this.vel = new Vector2(Math.random() * 2 - 1, Math.random() * 2 - 1);
        this.acc = new Vector2(0, 0);
        this.size = Math.random() * 3 + 1;
        this.maxSpeed = 2;
        this.maxForce = 0.05;
        this.baseColor = `rgba(14, 116, 144, ${Math.random() * 0.5 + 0.1})`; // Summit Teal
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update(width, height) {
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);
        this.acc.mult(0); // Reset accel

        // Edges wrap
        if (this.pos.x > width) this.pos.x = 0;
        if (this.pos.x < 0) this.pos.x = width;
        if (this.pos.y > height) this.pos.y = 0;
        if (this.pos.y < 0) this.pos.y = height;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.baseColor;
        ctx.fill();
    }

    // Interactive Repulsion from Mouse
    behaviors(mouse) {
        let arrive = this.arrive(mouse);
        arrive.mult(-5); // Repel
        this.applyForce(arrive);
    }

    arrive(target) {
        let desired = Vector2.sub(target, this.pos);
        let d = desired.mag();
        let speed = this.maxSpeed;
        if (d < 100) {
            speed = MathUtils.map(d, 0, 100, 0, this.maxSpeed);
        }
        desired.normalize();
        desired.mult(speed);
        let steer = Vector2.sub(desired, this.vel);
        steer.limit(this.maxForce);
        return steer;
    }
}

class PhysicsWorld {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'physics-bg';
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.zIndex = '-1';
        this.canvas.style.pointerEvents = 'none';
        document.body.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = new Vector2(-100, -100);
        
        // UPDATED: Increased particle count for PC to 130 for "Perfect" look
        this.particleCount = window.innerWidth < 768 ? 40 : 130;

        this.resize();
        this.initParticles();
        
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    initParticles() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(new Particle(this.width, this.height));
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Connect particles
        for (let i = 0; i < this.particles.length; i++) {
            let p1 = this.particles[i];
            p1.behaviors(this.mouse);
            p1.update(this.width, this.height);
            p1.draw(this.ctx);

            for (let j = i; j < this.particles.length; j++) {
                let p2 = this.particles[j];
                let d = MathUtils.dist(p1.pos.x, p1.pos.y, p2.pos.x, p2.pos.y);
                if (d < 150) {
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `rgba(14, 116, 144, ${1 - d/150})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.moveTo(p1.pos.x, p1.pos.y);
                    this.ctx.lineTo(p2.pos.x, p2.pos.y);
                    this.ctx.stroke();
                }
            }
        }
        requestAnimationFrame(() => this.render());
    }
}

/* =========================================
   MODULE 3: MAGNETIC BUTTON SYSTEM
   ========================================= */
class MagneticButton {
    constructor(el) {
        this.el = el;
        this.rect = this.el.getBoundingClientRect();
        this.text = this.el.innerText;
        this.centerX = this.rect.left + this.rect.width / 2;
        this.centerY = this.rect.top + this.rect.height / 2;
        
        this.mouse = { x: 0, y: 0 };
        this.pos = { x: 0, y: 0 };
        this.isHovering = false;
        
        this.init();
    }

    init() {
        this.el.addEventListener('mousemove', (e) => this.onMove(e));
        this.el.addEventListener('mouseleave', () => this.onLeave());
        window.addEventListener('scroll', () => this.updateRect()); // Recalc on scroll
        this.loop();
    }

    updateRect() {
        this.rect = this.el.getBoundingClientRect();
        this.centerX = this.rect.left + this.rect.width / 2;
        this.centerY = this.rect.top + this.rect.height / 2;
    }

    onMove(e) {
        this.isHovering = true;
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
    }

    onLeave() {
        this.isHovering = false;
    }

    loop() {
        let targetX = 0;
        let targetY = 0;

        if (this.isHovering) {
            // Calculate distance from center
            const dx = this.mouse.x - this.centerX;
            const dy = this.mouse.y - this.centerY;
            
            // Magnetic Strength
            targetX = dx * 0.4;
            targetY = dy * 0.4;
        }

        // Smooth Lerp
        this.pos.x = MathUtils.lerp(this.pos.x, targetX, 0.1);
        this.pos.y = MathUtils.lerp(this.pos.y, targetY, 0.1);

        // Apply Transform
        this.el.style.transform = `translate(${this.pos.x}px, ${this.pos.y}px)`;
        
        requestAnimationFrame(() => this.loop());
    }
}

/* =========================================
   MODULE 4: SCROLL INERTIA (Smooth Scroll)
   ========================================= */
class SmoothScroll {
    constructor() {
        this.target = 0;
        this.current = 0;
        this.ease = 0.08;
        this.windowHeight = window.innerHeight;
        
        // Check if user prefers reduced motion
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        if (!this.prefersReducedMotion) {
            document.body.style.height = `${document.documentElement.scrollHeight}px`;
            // Fixed container for smooth scrolling
            this.container = document.querySelector('main');
            if(this.container) {
                 this.container.style.position = 'fixed';
                 this.container.style.top = 0;
                 this.container.style.left = 0;
                 this.container.style.width = '100%';
                 this.loop();
            }
        }
        
        window.addEventListener('scroll', () => {
            this.target = window.scrollY;
        });
        
        window.addEventListener('resize', () => {
             document.body.style.height = `${document.documentElement.scrollHeight}px`;
        });
    }

    loop() {
        this.current = MathUtils.lerp(this.current, this.target, this.ease);
        
        // Apply transform to main container
        if(this.container) {
             this.container.style.transform = `translate3d(0, -${this.current}px, 0)`;
        }
        
        requestAnimationFrame(() => this.loop());
    }
}

/* =========================================
   MODULE 5: FREE AUDIT FORM PHYSICS
   ========================================= */
class AuditFormPhysics {
    constructor() {
        this.form = document.getElementById('audit-form');
        this.input = document.getElementById('audit-url');
        this.btn = document.getElementById('audit-submit');
        
        if (!this.form) return;

        this.init();
    }

    init() {
        // Shake effect on invalid
        this.btn.addEventListener('click', (e) => {
            if (!this.input.value.includes('.')) {
                e.preventDefault();
                this.shakeForm();
            } else {
                // If valid, let the form submit naturally to FormSubmit
                this.explodeSuccess(e);
            }
        });

        // Input Gravity (Fun Effect)
        this.input.addEventListener('focus', () => {
            this.form.style.transform = 'scale(1.02)';
            this.form.style.boxShadow = '0 20px 40px rgba(14, 116, 144, 0.2)';
        });
        
        this.input.addEventListener('blur', () => {
            this.form.style.transform = 'scale(1)';
            this.form.style.boxShadow = 'none';
        });
    }

    shakeForm() {
        const keyframes = [
            { transform: 'translateX(0)' },
            { transform: 'translateX(-10px)' },
            { transform: 'translateX(10px)' },
            { transform: 'translateX(-10px)' },
            { transform: 'translateX(0)' }
        ];
        this.form.animate(keyframes, { duration: 300 });
        this.input.style.borderColor = '#ef4444';
    }

    explodeSuccess(e) {
        // Create particles from button position
        const rect = this.btn.getBoundingClientRect();
        for(let i=0; i<30; i++) {
            this.createConfetti(rect.left + rect.width/2, rect.top + rect.height/2);
        }
    }

    createConfetti(x, y) {
        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.left = x + 'px';
        div.style.top = y + 'px';
        div.style.width = '8px';
        div.style.height = '8px';
        div.style.background = `hsl(${Math.random() * 360}, 100%, 50%)`;
        div.style.borderRadius = '50%';
        div.style.pointerEvents = 'none';
        div.style.zIndex = '9999';
        document.body.appendChild(div);

        const destX = (Math.random() - 0.5) * 300;
        const destY = (Math.random() - 0.5) * 300;

        const animation = div.animate([
            { transform: 'translate(0,0) scale(1)', opacity: 1 },
            { transform: `translate(${destX}px, ${destY}px) scale(0)`, opacity: 0 }
        ], {
            duration: 1000,
            easing: 'cubic-bezier(0, .9, .57, 1)'
        });

        animation.onfinish = () => div.remove();
    }
}

/* =========================================
   MODULE 6: 3D CARD TILT & SPOTLIGHT
   ========================================= */
class CardTilt {
    constructor(element) {
        this.el = element;
        this.el.addEventListener('mousemove', (e) => this.handleMove(e));
        this.el.addEventListener('mouseleave', () => this.handleLeave());
    }

    handleMove(e) {
        const height = this.el.clientHeight;
        const width = this.el.clientWidth;
        const rect = this.el.getBoundingClientRect();
        
        const xVal = e.layerX;
        const yVal = e.layerY;
        
        const yRotation = 20 * ((xVal - width / 2) / width);
        const xRotation = -20 * ((yVal - height / 2) / height);
        
        const transformString = `perspective(1000px) scale(1.05) rotateX(${xRotation}deg) rotateY(${yRotation}deg)`;
        this.el.style.transform = transformString;

        // Spotlight Update
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.el.style.setProperty('--mouse-x', `${x}px`);
        this.el.style.setProperty('--mouse-y', `${y}px`);
    }

    handleLeave() {
        this.el.style.transform = 'perspective(1000px) scale(1) rotateX(0) rotateY(0)';
    }
}

/* =========================================
   MODULE 7: PAGE LOADER & ROUTING
   ========================================= */
class PageLoader {
    constructor() {
        this.links = document.querySelectorAll('a');
        this.overlay = document.createElement('div');
        this.overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: #000; z-index: 99999; transform: scaleY(0);
            transform-origin: bottom; transition: transform 0.6s cubic-bezier(0.87, 0, 0.13, 1);
        `;
        document.body.appendChild(this.overlay);
        
        this.init();
    }

    init() {
        window.addEventListener('pageshow', () => {
             // Reveal animation on load
             this.overlay.style.transformOrigin = 'top';
             this.overlay.style.transform = 'scaleY(0)';
        });

        this.links.forEach(link => {
            if(link.hostname === window.location.hostname && link.getAttribute('href').indexOf('#') === -1) {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const href = link.getAttribute('href');
                    this.transitionTo(href);
                });
            }
        });
    }

    transitionTo(href) {
        this.overlay.style.transformOrigin = 'bottom';
        this.overlay.style.transform = 'scaleY(1)';
        
        setTimeout(() => {
            window.location.href = href;
        }, 600);
    }
}

/* =========================================
   MAIN INITIALIZATION (With Mobile Menu Fix)
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Start Physics World
    const physics = new PhysicsWorld();
    physics.render();

    // 2. Initialize Magnetic Buttons
    document.querySelectorAll('.btn').forEach(btn => new MagneticButton(btn));

    // 3. Initialize Card Tilt
    document.querySelectorAll('.card, .glass-card').forEach(card => new CardTilt(card));

    // 4. Initialize Audit Form Physics
    const auditPhysics = new AuditFormPhysics();

    // 5. Initialize Page Loader
    const pageLoader = new PageLoader();

    // 6. Smooth Scroll (Desktop Only)
    if(window.innerWidth > 1024) {
        // Uncomment to enable heavy smooth scroll
        // const scroll = new SmoothScroll();
    }

    // 7. Scroll Reveal Observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                
                // Stagger children if any
                const children = entry.target.querySelectorAll('.stagger-child');
                children.forEach((child, i) => {
                    setTimeout(() => {
                        child.classList.add('visible');
                    }, i * 100);
                });
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // ===========================================
    // MODULE 9: MOBILE MENU NAVIGATION LOGIC
    // ===========================================
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            // Toggle active classes
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
            
            // Switch Icon (Optional: Simple text switch for now)
            if (navMenu.classList.contains('active')) {
                navToggle.innerHTML = '✕'; // Close Icon
            } else {
                navToggle.innerHTML = '☰'; // Menu Icon
            }
        });

        // Close menu when a link is clicked
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                navToggle.innerHTML = '☰';
            });
        });
    }

    console.log('SUMMITFORGE V6: GOD MODE ENGINE ACTIVE');
});