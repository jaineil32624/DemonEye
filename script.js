const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const bgMusic = document.getElementById('bgMusic');
let width = 0;
let height = 0;
let mouse = { x: 0, y: 0 };
let started = false;
let audioContext;
let musicNodes = [];
let stars = [];
let brightStars = [];
let planets = [];
let supernovas = [];
let gammaWaves = [];
let orbiters = [];
let shockwaves = [];
const center = { x: 0, y: 0 };
const eyeRadius = 148;
const pupilLimit = 44;
const starCount = 190;
const brightStarCount = 28;
const planetCount = 6;
const supernovaCount = 4;
const gammaCount = 5;
const orbitCount = 4;
function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * devicePixelRatio;
  canvas.height = height * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  center.x = width / 2;
  center.y = height / 2;
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function initStars() {
  stars = Array.from({ length: starCount }, () => ({
    x: randomBetween(0, width),
    y: randomBetween(0, height),
    radius: randomBetween(0.7, 3.1),
    alpha: randomBetween(0.1, 0.95),
    pulse: randomBetween(0.002, 0.012),
    speed: randomBetween(0.08, 0.24),
    color: `rgba(255, ${230 - Math.random() * 30}, ${180 - Math.random() * 40},`,
  }));

  brightStars = Array.from({ length: brightStarCount }, () => ({
    x: randomBetween(0, width),
    y: randomBetween(0, height),
    size: randomBetween(1.6, 3.8),
    alpha: randomBetween(0.65, 1),
    pulse: randomBetween(0.006, 0.016),
  }));
}

function initPlanets() {
  planets = Array.from({ length: planetCount }, (_, i) => ({
    x: randomBetween(width * 0.1, width * 0.9),
    y: randomBetween(height * 0.15, height * 0.75),
    radius: randomBetween(22, 45),
    speed: randomBetween(0.28, 0.65),
    drift: randomBetween(-0.14, 0.14),
    phase: Math.random() * Math.PI * 2,
    hue: randomBetween(10, 35),
    explosion: randomBetween(0, 1),
    explodeSpeed: randomBetween(0.003, 0.01),
  }));
}

function initSupernovas() {
  supernovas = Array.from({ length: supernovaCount }, () => ({
    x: randomBetween(width * 0.1, width * 0.9),
    y: randomBetween(height * 0.1, height * 0.8),
    radius: randomBetween(42, 72),
    phase: Math.random() * Math.PI * 2,
    glow: randomBetween(0.12, 0.2),
    pulseSpeed: randomBetween(1.6, 2.8),
  }));
}

function initGammaWaves() {
  gammaWaves = Array.from({ length: gammaCount }, (_, i) => ({
    angle: randomBetween(0, Math.PI * 2),
    offset: randomBetween(-height * 0.18, height * 0.18),
    speed: randomBetween(0.003, 0.009),
    strength: randomBetween(0.12, 0.22),
    hue: 50 + i * 8,
  }));
}

function initOrbiters() {
  orbiters = Array.from({ length: orbitCount }, (_, i) => ({
    radius: 220 + i * 65,
    speed: 0.0008 + i * 0.0004,
    size: 8 + i * 2,
    phase: Math.random() * Math.PI * 2,
    color: `hsla(${10 + i * 18}, 100%, ${65 - i * 8}%, 0.92)`,
    trail: []
  }));
}

async function createAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  if (musicNodes.length) return;

  const master = audioContext.createGain();
  master.gain.value = 0.18;
  master.connect(audioContext.destination);

  const baseFreq = 52;
  const progression = [0, 4, 7, 10, 14];
  progression.forEach((step, index) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = index === 0 ? 'triangle' : index === 1 ? 'sine' : 'sawtooth';
    osc.frequency.value = baseFreq * Math.pow(2, step / 12);
    gain.gain.value = 0.02 + index * 0.01;
    gain.gain.setValueAtTime(gain.gain.value, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 18);
    osc.connect(gain);
    gain.connect(master);
    osc.start(audioContext.currentTime + index * 1.2);
    osc.stop(audioContext.currentTime + 18);
    musicNodes.push({ osc, gain });
  });

  const ambient = audioContext.createOscillator();
  const ambientGain = audioContext.createGain();
  ambient.type = 'triangle';
  ambient.frequency.value = 21;
  ambientGain.gain.value = 0.05;
  ambient.connect(ambientGain);
  ambientGain.connect(master);
  ambient.start();
  musicNodes.push({ osc: ambient, gain: ambientGain });

  const ambientLFO = audioContext.createOscillator();
  const ambientLFOGain = audioContext.createGain();
  ambientLFO.type = 'sine';
  ambientLFO.frequency.value = 0.12;
  ambientLFOGain.gain.value = 6;
  ambientLFO.connect(ambientLFOGain);
  ambientLFOGain.connect(ambient.frequency);
  ambientLFO.start();
  musicNodes.push({ osc: ambientLFO, gain: ambientLFOGain });
}

function playClickSound() {
  if (!audioContext) return;
  const now = audioContext.currentTime;
  const clickOsc = audioContext.createOscillator();
  const clickGain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();

  clickOsc.type = 'square';
  clickOsc.frequency.setValueAtTime(620, now);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1200, now);

  clickGain.gain.setValueAtTime(0.16, now);
  clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
  filter.connect(clickGain).connect(audioContext.destination);
  clickOsc.connect(filter);
  clickOsc.start(now);
  clickOsc.stop(now + 0.2);
}

function init() {
  resize();
  initStars();
  initPlanets();
  initSupernovas();
  initGammaWaves();
  initOrbiters();
  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
  });

  const playBackgroundMusic = async () => {
    if (!bgMusic) return false;

    try {
      await bgMusic.play();
      document.querySelector('.hint').textContent = 'Space-Ranger soundtrack activated.';
      return true;
    } catch (error) {
      console.warn('Autoplay prevented, click to start Space-Ranger soundtrack.', error);
      return false;
    }
  };

  const activateAudio = async () => {
    if (!started) {
      const played = await playBackgroundMusic();
      if (played) {
        started = true;
      }
    }
  };

  window.addEventListener('load', activateAudio);
  window.addEventListener('pointerdown', activateAudio);
  window.addEventListener('click', async () => {
    await activateAudio();
    playClickSound();
    shockwaves.push({
      radius: eyeRadius + 8,
      alpha: 0.9,
    });
  });

  requestAnimationFrame(draw);
}

function draw() {
  const time = performance.now() * 0.001;
  ctx.clearRect(0, 0, width, height);

  // Background gradient and subtle noise
  const bg = ctx.createRadialGradient(center.x, center.y - 80, 0, center.x, center.y, Math.max(width, height) * 0.75);
  bg.addColorStop(0, '#1e0910');
  bg.addColorStop(0.45, '#120512');
  bg.addColorStop(1, '#020107');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  stars.forEach((star) => {
    star.alpha += star.pulse;
    if (star.alpha > 1 || star.alpha < 0.15) star.pulse *= -1;
    star.y += star.speed;
    star.x += Math.sin(time * 0.3 + star.x * 0.02) * 0.12;
    if (star.y > height + 20) star.y = -20;
    if (star.x > width + 20) star.x = -20;
    if (star.x < -20) star.x = width + 20;

    ctx.fillStyle = `${star.color} ${star.alpha})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  // Soft nebula glow waves
  for (let i = 0; i < 4; i++) {
    const wave = ctx.createRadialGradient(
      center.x + Math.cos(time * (0.5 + i * 0.12)) * 120,
      center.y + Math.sin(time * (0.4 + i * 0.14)) * 60,
      0,
      center.x,
      center.y,
      width * 0.6
    );
    wave.addColorStop(0, `rgba(255, 100, 80, ${0.08 - i * 0.015})`);
    wave.addColorStop(0.45, `rgba(160, 40, 35, ${0.018 + i * 0.01})`);
    wave.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = wave;
    ctx.fillRect(0, 0, width, height);
  }

  // Light band shimmer
  for (let i = 0; i < 3; i++) {
    const offset = Math.sin(time * (1.1 + i * 0.5) + i * 1.3) * 18;
    const band = ctx.createLinearGradient(0, center.y + offset, width, center.y + offset + 40);
    band.addColorStop(0, 'rgba(255, 210, 155, 0)');
    band.addColorStop(0.32, 'rgba(255, 210, 155, 0.07)');
    band.addColorStop(0.5, 'rgba(255, 180, 115, 0.14)');
    band.addColorStop(0.68, 'rgba(255, 210, 155, 0.07)');
    band.addColorStop(1, 'rgba(255, 210, 155, 0)');
    ctx.fillStyle = band;
    ctx.fillRect(0, center.y + offset - 20, width, 40);
  }

  ctx.restore();

  // Orbit rings and orbiters
  orbiters.forEach((orbiter) => {
    orbiter.phase += orbiter.speed;
    const angle = orbiter.phase;
    const x = center.x + Math.cos(angle) * orbiter.radius;
    const y = center.y + Math.sin(angle) * orbiter.radius * 0.8;

    orbiter.trail.unshift({ x, y, alpha: 1 });
    if (orbiter.trail.length > 50) orbiter.trail.pop();
    orbiter.trail.forEach((trail, index) => {
      ctx.fillStyle = `rgba(255, 150, 110, ${0.08 * (1 - index / orbiter.trail.length)})`;
      ctx.beginPath();
      ctx.arc(trail.x, trail.y, orbiter.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    });

    const ringPulse = 1 + Math.sin(time * 1.3 + orbiter.phase * 0.7) * 0.04;
    ctx.strokeStyle = 'rgba(255, 120, 90, 0.2)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(center.x, center.y, orbiter.radius * ringPulse, orbiter.radius * 0.8 * ringPulse, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = orbiter.color;
    ctx.shadowColor = orbiter.color;
    ctx.shadowBlur = 22;
    ctx.beginPath();
    ctx.arc(x, y, orbiter.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  const dx = mouse.x - center.x;
  const dy = mouse.y - center.y;
  const angle = Math.atan2(dy, dx);
  const dist = Math.min(Math.hypot(dx, dy), pupilLimit);
  const pupilX = center.x + Math.cos(angle) * dist;
  const pupilY = center.y + Math.sin(angle) * dist;

  // Shockwave effect on click
  shockwaves = shockwaves.filter((wave) => wave.alpha > 0.01);
  shockwaves.forEach((wave) => {
    ctx.strokeStyle = `rgba(255, 235, 160, ${wave.alpha})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(center.x, center.y, wave.radius, 0, Math.PI * 2);
    ctx.stroke();
    wave.radius += 16;
    wave.alpha *= 0.86;
  });

  // Eye glow
  const glow = ctx.createRadialGradient(center.x, center.y, eyeRadius * 0.3, center.x, center.y, eyeRadius * 1.6);
  glow.addColorStop(0, 'rgba(255, 180, 142, 0.3)');
  glow.addColorStop(0.4, 'rgba(235, 90, 50, 0.14)');
  glow.addColorStop(1, 'rgba(8, 4, 3, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(center.x, center.y, eyeRadius * 1.7, 0, Math.PI * 2);
  ctx.fill();

  // Bright star cluster highlights
  brightStars.forEach((star) => {
    star.alpha += star.pulse * (Math.sin(time * 1.3 + star.x * 0.02) + 1) * 0.2;
    if (star.alpha > 1) star.alpha = 1;
    if (star.alpha < 0.5) star.alpha = 0.5;
    star.x += Math.cos(time * 0.15 + star.y * 0.01) * 0.04;
    star.y += Math.sin(time * 0.12 + star.x * 0.01) * 0.06;
    if (star.x > width) star.x = 0;
    if (star.x < 0) star.x = width;
    if (star.y > height) star.y = 0;
    if (star.y < 0) star.y = height;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(255, 240, 190, ${star.alpha})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size * 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Gamma wave ribbons
  gammaWaves.forEach((ray, index) => {
    ray.angle += ray.speed;
    const xOffset = Math.cos(ray.angle) * width * 0.55;
    const yOffset = Math.sin(ray.angle) * height * 0.18;
    const gradient = ctx.createLinearGradient(
      center.x - xOffset,
      center.y - yOffset + ray.offset,
      center.x + xOffset,
      center.y + yOffset + ray.offset
    );
    gradient.addColorStop(0, 'rgba(255,180,120,0)');
    gradient.addColorStop(0.35, `hsla(${ray.hue}, 100%, 75%, 0.08)`);
    gradient.addColorStop(0.5, `hsla(${ray.hue}, 100%, 85%, 0.12)`);
    gradient.addColorStop(0.65, `hsla(${ray.hue}, 100%, 75%, 0.08)`);
    gradient.addColorStop(1, 'rgba(255,180,120,0)');
    ctx.strokeStyle = gradient;
    ctx.lineWidth = ray.strength * 24;
    ctx.beginPath();
    ctx.moveTo(center.x - xOffset, center.y - yOffset + ray.offset);
    ctx.lineTo(center.x + xOffset, center.y + yOffset + ray.offset);
    ctx.stroke();
  });

  // Supernova bursts
  supernovas.forEach((nova) => {
    const pulse = Math.sin(time * nova.pulseSpeed + nova.phase) * 0.5 + 0.8;
    const radius = nova.radius * pulse;
    const glowFill = ctx.createRadialGradient(nova.x, nova.y, 0, nova.x, nova.y, radius * 1.2);
    glowFill.addColorStop(0, `rgba(255, 255, 210, ${nova.glow * 0.9})`);
    glowFill.addColorStop(0.3, `rgba(255, 145, 90, ${nova.glow * 0.26})`);
    glowFill.addColorStop(0.6, 'rgba(255, 90, 35, 0.04)');
    glowFill.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glowFill;
    ctx.beginPath();
    ctx.arc(nova.x, nova.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(255, 190, 130, ${0.16 * pulse})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(nova.x, nova.y, radius * 0.6, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Exploding planets and cosmic debris
  planets.forEach((planet) => {
    planet.x += Math.cos(planet.phase) * planet.speed * 0.5;
    planet.y += planet.drift;
    planet.phase += 0.0012;
    if (planet.x < -80) planet.x = width + 80;
    if (planet.x > width + 80) planet.x = -80;
    if (planet.y < -80) planet.y = height + 80;
    if (planet.y > height + 80) planet.y = -80;

    const explosion = Math.sin(time * planet.explodeSpeed + planet.phase) * 0.45 + 0.55;
    const baseRadius = planet.radius * (0.85 + explosion * 0.25);
    const debrisRadius = baseRadius * 1.2;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const planetGradient = ctx.createRadialGradient(planet.x, planet.y, 0, planet.x, planet.y, baseRadius);
    planetGradient.addColorStop(0, `rgba(255, 220, 170, 0.92)`);
    planetGradient.addColorStop(0.28, `rgba(255, ${160 - planet.radius * 0.8}, 120, 0.75)`);
    planetGradient.addColorStop(0.62, `rgba(140, 40, 25, 0.34)`);
    planetGradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = planetGradient;
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, baseRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(255, 170, 110, ${0.22 + explosion * 0.12})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, baseRadius * 0.92, 0, Math.PI * 2);
    ctx.stroke();

    for (let n = 0; n < 5; n++) {
      const debrisAngle = time * 1.4 + n * 1.2 + planet.phase;
      const debrisDist = debrisRadius + Math.sin(time * 2.4 + n) * 9;
      ctx.fillStyle = `rgba(255, 215, 170, ${0.18 - n * 0.02})`;
      ctx.beginPath();
      ctx.arc(
        planet.x + Math.cos(debrisAngle) * debrisDist,
        planet.y + Math.sin(debrisAngle) * debrisDist,
        4 - n * 0.5,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.restore();
  });

  // Eye outer ring
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = 'rgba(255, 120, 90, 0.88)';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.arc(center.x, center.y, eyeRadius + 6, 0, Math.PI * 2);
  ctx.stroke();

  // Flowing halo rings
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = `rgba(255, 186, 124, ${0.14 - i * 0.02})`;
    ctx.lineWidth = 5 - i * 1;
    ctx.beginPath();
    ctx.ellipse(
      center.x,
      center.y,
      eyeRadius * 1.05 + i * 13 + Math.sin(time * (1.5 - i * 0.09) + i * 1.8) * 10,
      eyeRadius * 0.95 + i * 11 + Math.cos(time * (1.2 + i * 0.07) + i * 1.4) * 10,
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }

  // Sclera
  const sclera = ctx.createRadialGradient(center.x, center.y, 20, center.x, center.y, eyeRadius);
  sclera.addColorStop(0, '#ffe6cc');
  sclera.addColorStop(0.2, '#ffad7e');
  sclera.addColorStop(0.55, '#af2c21');
  sclera.addColorStop(1, '#210606');
  ctx.fillStyle = sclera;
  ctx.beginPath();
  ctx.arc(center.x, center.y, eyeRadius, 0, Math.PI * 2);
  ctx.fill();

  // Iris pattern
  for (let i = 0; i < 42; i++) {
    const t = i / 42;
    const r1 = eyeRadius * (0.52 + Math.sin(time * 0.002 + t * 3.1) * 0.008);
    const r2 = eyeRadius * (0.7 + Math.sin((t + performance.now() * 0.0009) * 7) * 0.05);
    const a = t * Math.PI * 2;
    ctx.strokeStyle = `rgba(255, ${120 + t * 80}, ${70 + t * 50}, ${0.18 + t * 0.18})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(center.x + Math.cos(a) * r1, center.y + Math.sin(a) * r1);
    ctx.lineTo(center.x + Math.cos(a) * r2, center.y + Math.sin(a) * r2);
    ctx.stroke();
  }

  const iris = ctx.createRadialGradient(center.x, center.y, 4, center.x, center.y, eyeRadius * 0.78);
  iris.addColorStop(0, '#ffd8b6');
  iris.addColorStop(0.2, '#ff7a5c');
  iris.addColorStop(0.5, '#a92b1f');
  iris.addColorStop(0.85, '#26080b');
  ctx.fillStyle = iris;
  ctx.beginPath();
  ctx.arc(center.x, center.y, eyeRadius * 0.78, 0, Math.PI * 2);
  ctx.fill();

  // Pupil
  const pupilGradient = ctx.createRadialGradient(pupilX, pupilY, 4, pupilX, pupilY, pupilLimit * 0.8);
  pupilGradient.addColorStop(0, '#000');
  pupilGradient.addColorStop(1, '#020815');
  ctx.fillStyle = pupilGradient;
  ctx.beginPath();
  ctx.arc(pupilX, pupilY, 34, 0, Math.PI * 2);
  ctx.fill();

  // Pupil specular highlight
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.beginPath();
  ctx.arc(pupilX - 12, pupilY - 12, 8, 0, Math.PI * 2);
  ctx.fill();

  // Eye detail rings
  ctx.strokeStyle = 'rgba(189, 232, 255, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(center.x, center.y, eyeRadius * 0.38, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(center.x, center.y, eyeRadius * 0.22, 0, Math.PI * 2);
  ctx.stroke();

  requestAnimationFrame(draw);
}

init();
