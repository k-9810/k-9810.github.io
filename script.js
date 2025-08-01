const canvas = document.getElementById("bgCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const shapeSize = 25;
let shapes = [];

function createShape(x, y, index) {
  return {
    x,
    y,
    dx: (Math.random() - 0.5) * 0.4,
    dy: (Math.random() - 0.5) * 0.4,
    phase: Math.random() * Math.PI * 2,
    sides: Math.floor(Math.random() * 4) + 3,
    targetSides: Math.floor(Math.random() * 4) + 3,
    morphProgress: Math.random(),
    delay: index * 5,
    visible: false,
    opacity: 0
  };
}

function generateShapes() {
  shapes = [];
  const spacing = shapeSize * 2.5;
  let index = 0;
  for (let y = 0; y < canvas.height + spacing; y += spacing) {
    for (let x = 0; x < canvas.width + spacing; x += spacing) {
      shapes.push(createShape(x, y, index));
      index++;
    }
  }
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  generateShapes();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function drawMorphingShape(shape, scrollFactor) {
  const { x, y, sides, targetSides, morphProgress, opacity } = shape;
  const interpolatedSides = sides + (targetSides - sides) * morphProgress;
  const angleStep = (2 * Math.PI) / interpolatedSides;

  ctx.beginPath();
  for (let i = 0; i < interpolatedSides; i++) {
    const angle = i * angleStep;
    const px = x + shapeSize * Math.cos(angle);
    const py = y + shapeSize * Math.sin(angle);
    ctx.lineTo(px, py);
  }
  ctx.closePath();

  // Get current accent color from CSS
  const accentColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--accent-color')
    .trim();

  // Convert hex to rgba with dynamic opacity
  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  const alpha = opacity * (0.2 + scrollFactor * 0.3);
  ctx.fillStyle = hexToRgba(accentColor, alpha);
  ctx.fill();
}


let frameCount = 0;

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  frameCount++;

  const scrollY = window.scrollY;
  const scrollFactor = Math.min(scrollY / window.innerHeight, 1); // 0 to 1

  for (let shape of shapes) {
    if (frameCount > shape.delay) {
      shape.visible = true;
    }

    if (!shape.visible) continue;

    shape.phase += 0.01 + scrollFactor * 0.05; // scroll speeds up phase
    shape.x += shape.dx * (1 + scrollFactor);
    shape.y += shape.dy * (1 + scrollFactor);

    // Fade in
    if (shape.opacity < 1) {
      shape.opacity += 0.01;
    }

    // Wrap around edges
    if (shape.x < -shapeSize) shape.x = canvas.width + shapeSize;
    if (shape.x > canvas.width + shapeSize) shape.x = -shapeSize;
    if (shape.y < -shapeSize) shape.y = canvas.height + shapeSize;
    if (shape.y > canvas.height + shapeSize) shape.y = -shapeSize;

    // Morphing logic
    shape.morphProgress += 0.005 + scrollFactor * 0.01;
    if (shape.morphProgress >= 1) {
      shape.sides = shape.targetSides;
      shape.targetSides = Math.floor(Math.random() * 4) + 3;
      shape.morphProgress = 0;
    }

    drawMorphingShape(shape, scrollFactor);
  }

  requestAnimationFrame(animate);
}

animate();

function getReadableTextColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 150 ? '#1a1a1a' : '#f0f0f0'; // dark text for bright colors, light text for dark
}
function softenColor(hex, factor = 0.5) {//text color
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Blend toward neutral gray (128,128,128)
  const sr = Math.floor(r + (128 - r) * factor);
  const sg = Math.floor(g + (128 - g) * factor);
  const sb = Math.floor(b + (128 - b) * factor);

  return `rgb(${sr}, ${sg}, ${sb})`;
}
function lightenColor(hex, factor = 0.2) {//buttoncolor
  const r = Math.min(255, Math.floor(parseInt(hex.slice(1, 3), 16) + 255 * factor));
  const g = Math.min(255, Math.floor(parseInt(hex.slice(3, 5), 16) + 255 * factor));
  const b = Math.min(255, Math.floor(parseInt(hex.slice(5, 7), 16) + 255 * factor));
  return `rgb(${r}, ${g}, ${b})`;
}



document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("themeToggle");

  const themes = [
    { accent: "#d94f4f", start: "#2f0a0a", end: "#4f1a1a" }, // Red
    { accent: "#e68a2e", start: "#2f1a0a", end: "#4f2f1a" }, // Orange
    { accent: "#e6d82e", start: "#2f2a0a", end: "#4f4f1a" }, // Yellow
    { accent: "#4fe66b", start: "#0a2f1a", end: "#1a4f2f" }, // Green
    { accent: "#2ee6d8", start: "#0a2f2f", end: "#1a4f4f" }, // Cyan
    { accent: "#3a8ddf", start: "#0a1a2f", end: "#1a2f4f" }, // Blue (default)
    { accent: "#a36be6", start: "#1a0a2f", end: "#2f1a4f" }  // Purple
  ];

  let currentTheme = Math.floor(Math.random() * themes.length); // Pick random theme

function applyTheme(index) {
  const theme = themes[index];
  document.documentElement.style.setProperty('--accent-color', theme.accent);
  document.documentElement.style.setProperty('--bg-gradient-start', theme.start);
  document.documentElement.style.setProperty('--bg-gradient-end', theme.end);

  // Helper: darken hex color by blending with black
  function darkenHex(hex, factor) {
    const r = Math.floor(parseInt(hex.slice(1, 3), 16) * (1 - factor));
    const g = Math.floor(parseInt(hex.slice(3, 5), 16) * (1 - factor));
    const b = Math.floor(parseInt(hex.slice(5, 7), 16) * (1 - factor));
    return `rgba(${r}, ${g}, ${b}, 0.85)`; // for header
  }

  function softenHex(hex, factor) {
    const r = Math.floor(parseInt(hex.slice(1, 3), 16) * (1 - factor) + 20);
    const g = Math.floor(parseInt(hex.slice(3, 5), 16) * (1 - factor) + 20);
    const b = Math.floor(parseInt(hex.slice(5, 7), 16) * (1 - factor) + 20);
    return `rgba(${r}, ${g}, ${b}, 0.2)`; // for content box
  }

  const headerBg = darkenHex(theme.accent, 0.4);
  const contentBg = softenHex(theme.accent, 0.3);
  const textColor = softenColor(theme.accent, 0.4); // adjust factor for softness
  const hoverColor = lightenColor(theme.accent, 0.2);
  
  document.documentElement.style.setProperty('--accent-hover', hoverColor);
  document.documentElement.style.setProperty('--text-color', textColor);
  document.documentElement.style.setProperty('--header-bg', headerBg);
  document.documentElement.style.setProperty('--content-bg', contentBg);
  
}



  themeToggle.addEventListener("click", () => {
    currentTheme = (currentTheme + 1) % themes.length;
    applyTheme(currentTheme);
  });

  applyTheme(currentTheme);
});
