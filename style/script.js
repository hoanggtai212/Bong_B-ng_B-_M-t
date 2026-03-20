const bgMusic = document.getElementById('bgMusic');
const startOverlay = document.getElementById('startOverlay');
const startButton = document.getElementById('startButton');
bgMusic.loop = true;
bgMusic.volume = 0.5;

let firstBubblePopped = false;
let isGameStarted = false;

function playPopSound() {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

  gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.1);
}

const isMobile = window.innerWidth <= 768;
const maxBubbles = isMobile ? 12 : 18;
let messages = [];
let customMessages = [];

fetch('./style/letter.txt')
  .then(response => response.text())
  .then(data => {
    messages = data.split('\n').filter(line => line.trim() !== "");
    if (messages.length === 0) {
      messages = ["Em là lý do khiến anh mỉm cười mỗi ngày ✨"];
    }
    
    customMessages = [...messages];

    const saved = localStorage.getItem('balloonMessages');
    if (saved) {
      customMessages = JSON.parse(saved);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const sharedMsgs = urlParams.get('m') || urlParams.get('msg');
    if (sharedMsgs) {
      try {
        let base64 = sharedMsgs.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) base64 += '=';
        
        const decoded = decodeURIComponent(escape(atob(base64)));
        
        if (decoded.startsWith('[') && decoded.endsWith(']')) {
          customMessages = JSON.parse(decoded);
        } else {
          customMessages = decoded.split('|');
        }
        
        localStorage.setItem('balloonMessages', JSON.stringify(customMessages));
      } catch (e) {
        console.error("Lỗi giải mã tin nhắn chia sẻ:", e);
      }
    }
  });

const colors = [
  'rgba(255, 99, 132, 0.4)',
  'rgba(54, 162, 235, 0.4)',
  'rgba(75, 192, 192, 0.4)',
  'rgba(255, 206, 86, 0.4)',
  'rgba(255, 159, 64, 0.4)',
  'rgba(153, 102, 255, 0.4)',
  'rgba(255, 192, 203, 0.4)',
  'rgba(144, 238, 144, 0.4)',
  'rgba(0, 191, 255, 0.4)',
  'rgba(255, 105, 180, 0.4)',
  'rgba(255, 140, 0, 0.4)',
  'rgba(0, 255, 127, 0.4)',
  'rgba(186, 85, 211, 0.4)'
];

let bubbles = [];

class Bubble {
  constructor() {
    this.element = document.createElement('div');
    this.element.className = 'bubble';

    this.size = Math.random() * (isMobile ? 80 : 120) + (isMobile ? 80 : 100);
    this.element.style.width = this.size + 'px';
    this.element.style.height = this.size + 'px';

    this.resetPosition();

    const speedScale = isMobile ? 1.5 : 2;
    this.vx = (Math.random() - 0.5) * speedScale;
    this.vy = (Math.random() - 0.5) * speedScale;
    const colorIndex = Math.floor(Math.random() * colors.length);
    this.color = colors[colorIndex];
    this.element.style.backgroundColor = this.color;

    this.messageIndex = Math.floor(Math.random() * customMessages.length);
    this.mass = this.size / 100;
    this.clicked = false;

    this.updateElementPosition();

    this.element.addEventListener('click', (e) => this.pop(e));

    document.querySelector('.container').appendChild(this.element);
  }

  resetPosition() {
    this.x = Math.random() * (window.innerWidth - this.size);
    this.y = Math.random() * (window.innerHeight - this.size);
  }

  updateElementPosition() {
    this.element.style.transform = `translate3d(${this.x}px, ${this.y}px, 0)`;
  }

  move() {
    if (this.clicked) return;

    this.x += this.vx;
    this.y += this.vy;

    if (this.x <= 0) {
      this.x = 0;
      this.vx *= -1;
    } else if (this.x + this.size >= window.innerWidth) {
      this.x = window.innerWidth - this.size;
      this.vx *= -1;
    }

    if (this.y <= 0) {
      this.y = 0;
      this.vy *= -1;
    } else if (this.y + this.size >= window.innerHeight) {
      this.y = window.innerHeight - this.size;
      this.vy *= -1;
    }

    this.updateElementPosition();
  }

  pop(e) {
    if (this.clicked) return;
    this.clicked = true;

    playPopSound();
    this.createRipple();
    this.createParticles();
    this.showFloatingMessage();

    this.element.style.transform += ' scale(1.5)';
    this.element.style.opacity = '0';

    setTimeout(() => {
      this.destroy();
      if (isGameStarted) {
        setTimeout(createBubble, 1500);
      }
    }, 300);
  }

  createRipple() {
    const ripple = document.createElement('div');
    ripple.className = 'ripple-effect';
    ripple.style.width = this.size + 'px';
    ripple.style.height = this.size + 'px';
    ripple.style.left = this.x + 'px';
    ripple.style.top = this.y + 'px';
    document.querySelector('.container').appendChild(ripple);
    setTimeout(() => ripple.remove(), 800);
  }

  createParticles() {
    const centerX = this.x + this.size / 2;
    const centerY = this.y + this.size / 2;
    const particleCount = 15;

    for (let i = 0; i < particleCount; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const pSize = Math.random() * 8 + 4;
      p.style.width = pSize + 'px';
      p.style.height = pSize + 'px';
      p.style.backgroundColor = this.color.replace('0.4', '0.8');
      p.style.left = centerX + 'px';
      p.style.top = centerY + 'px';
      document.querySelector('.container').appendChild(p);

      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() * 0.5);
      const velocity = Math.random() * 200 + 100;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity;

      let posX = 0, posY = 0, opacity = 1;
      const startTime = Date.now();

      const animateP = () => {
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed > 1) {
          p.remove();
          return;
        }

        posX = vx * elapsed;
        posY = vy * elapsed + (0.5 * 500 * elapsed * elapsed);
        opacity = 1 - elapsed;

        p.style.transform = `translate3d(${posX}px, ${posY}px, 0)`;
        p.style.opacity = opacity;
        requestAnimationFrame(animateP);
      };
      requestAnimationFrame(animateP);
    }
  }

  showFloatingMessage() {
    const msg = customMessages[this.messageIndex % customMessages.length];
    const m = document.createElement('div');
    m.className = 'floating-message';
    m.innerHTML = msg;

    m.style.left = (this.x + this.size / 2) + 'px';
    m.style.top = (this.y + this.size / 2) + 'px';

    document.querySelector('.container').appendChild(m);
    setTimeout(() => m.remove(), 4000);
  }

  destroy() {
    this.element.remove();
    const index = bubbles.indexOf(this);
    if (index > -1) bubbles.splice(index, 1);
  }
}

function handlePhysics() {
  for (let i = 0; i < bubbles.length; i++) {
    const b1 = bubbles[i];
    b1.move();

    for (let j = i + 1; j < bubbles.length; j++) {
      const b2 = bubbles[j];
      checkCollision(b1, b2);
    }
  }
  requestAnimationFrame(handlePhysics);
}

function checkCollision(b1, b2) {
  if (b1.clicked || b2.clicked) return;

  const dx = (b2.x + b2.size / 2) - (b1.x + b1.size / 2);
  const dy = (b2.y + b2.size / 2) - (b1.y + b1.size / 2);
  const distance = Math.sqrt(dx * dx + dy * dy);
  const minDistance = (b1.size + b2.size) / 2;

  if (distance < minDistance) {
    const overlap = minDistance - distance;
    const nx = dx / distance;
    const ny = dy / distance;

    const moveX = nx * overlap / 2;
    const moveY = ny * overlap / 2;

    b1.x -= moveX;
    b1.y -= moveY;
    b2.x += moveX;
    b2.y += moveY;

    const dvx = b2.vx - b1.vx;
    const dvy = b2.vy - b1.vy;
    const dot = dvx * nx + dvy * ny;

    if (dot < 0) {
      const impulse = (2 * dot) / (b1.mass + b2.mass);
      b1.vx += impulse * b2.mass * nx;
      b1.vy += impulse * b2.mass * ny;
      b2.vx -= impulse * b1.mass * nx;
      b2.vy -= impulse * b1.mass * ny;
    }
  }
}

function createBubble() {
  if (bubbles.length >= maxBubbles || !isGameStarted) return;
  bubbles.push(new Bubble());
}

function startGame() {
  isGameStarted = true;
  startOverlay.classList.add('hidden');
  bgMusic.play().catch(err => console.log("Audio play failed:", err));

  for (let i = 0; i < maxBubbles; i++) {
    setTimeout(createBubble, i * 200);
  }
}

startButton.addEventListener('click', startGame);

// Removing menu and modal event listeners

handlePhysics();

window.addEventListener('resize', () => {
  bubbles.forEach(b => b.resetPosition());
});
