
const canvas = document.getElementById('glcanvas');
const gl = canvas.getContext('webgl');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Vertex shader
const vertexShaderSource = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// Fragment shader
const fragmentShaderSource = `
  precision highp float;
  uniform vec2 iResolution;
  uniform float pixelation;
  uniform vec3 color1;
  uniform vec3 color2;
  uniform float scale;
  uniform float speed;
  uniform float TIME;

  float hash1(float n) { return fract(sin(n) * 43758.5453); }
  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
  }

  vec4 voronoi(in vec2 x, float w) {
    vec2 n = floor(x);
    vec2 f = fract(x);
    vec4 m = vec4(8.0, 0.0, 0.0, 0.0);
    for (int j = -2; j <= 2; j++)
      for (int i = -2; i <= 2; i++) {
        vec2 g = vec2(float(i), float(j));
        vec2 o = hash2(n + g);
        o = 0.5 + 0.5 * sin(TIME * speed + 6.2831 * o);
        float d = length(g - f + o);
        vec3 col = mix(color1, color2, hash1(dot(n + g, vec2(7.0, 113.0))) * 0.5 + 0.5);
        col = col * col;
        if (d < m.x) {
          m.x = d;
          m.yzw = col;
        }
      }
    return m;
  }

  void main() {
    vec2 p = gl_FragCoord.xy / iResolution.y;
    p *= scale;
    p = floor(p * iResolution.y / pixelation) / (iResolution.y / pixelation);
    vec4 v = voronoi(6.0 * p, 0.001);
    vec3 col = sqrt(v.yzw);
    col = mix(vec3(1.0), col, 1.0);
    gl_FragColor = vec4(col, 1.0);
  }
`;

// Compile shader
function compileShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

// Create program
const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);

// Fullscreen quad
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  -1, -1, 1, -1, -1, 1,
  -1, 1, 1, -1, 1, 1
]), gl.STATIC_DRAW);

const positionLocation = gl.getAttribLocation(program, 'a_position');
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

// Uniforms
const iResolution = gl.getUniformLocation(program, 'iResolution');
const pixelation = gl.getUniformLocation(program, 'pixelation');
const color1 = gl.getUniformLocation(program, 'color1');
const color2 = gl.getUniformLocation(program, 'color2');
const scale = gl.getUniformLocation(program, 'scale');
const speed = gl.getUniformLocation(program, 'speed');
const TIME = gl.getUniformLocation(program, 'TIME');

// Initial values
gl.uniform2f(iResolution, canvas.width, canvas.height);
gl.uniform1f(pixelation, 0.1);
gl.uniform3f(color1, 0.0, 0.0, 0.0);
gl.uniform1f(scale, -0.44);
gl.uniform1f(speed, 0.1);

// Theme colors
const themes = [
  "#d94f4f", "#e68a2e", "#e6d82e", "#4fe66b", "#2ee6d8", "#3a8ddf", "#a36be6" , "#2a2a2a", "#a67c52"
];
let currentTheme = Math.floor(Math.random() * themes.length);

// Convert hex to RGB
function hexToRGB(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}
function lightenHex(hex, amount) {
  return adjustHex(hex, amount);
}

function darkenHex(hex, amount) {
  return adjustHex(hex, -amount);
}

function adjustHex(hex, amount) {
  const clamp = (val) => Math.max(0, Math.min(255, val));
  const r = clamp(parseInt(hex.slice(1, 3), 16) + 255 * amount);
  const g = clamp(parseInt(hex.slice(3, 5), 16) + 255 * amount);
  const b = clamp(parseInt(hex.slice(5, 7), 16) + 255 * amount);
  return `#${[r, g, b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('')}`;
}

function applyThemeCSS(index) {
  const hex = themes[index];
  const rgb = hexToRGB(hex);
  const [r, g, b] = rgb.map(v => Math.round(v * 255));

  // Update CSS variables
  document.documentElement.style.setProperty('--accent-color', hex);
  document.documentElement.style.setProperty('--accent-hover', lightenHex(hex, 0.2));
  document.documentElement.style.setProperty('--accent-dark', darkenHex(hex, 0.2));
  document.documentElement.style.setProperty('--header-bg', `rgba(${r}, ${g}, ${b}, 0.8)`);
  document.documentElement.style.setProperty('--content-bg', `rgba(${r}, ${g}, ${b}, 0.2)`);
  document.documentElement.style.setProperty('--content-shadow', hex);
  document.documentElement.style.setProperty('--button-shadow', darkenHex(hex, 0.4));

  // Text color based on accent brightness
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  const textColor = brightness > 128 ? darkenHex(hex, 0.6) : lightenHex(hex, 0.6);
  document.documentElement.style.setProperty('--text-color', textColor);
}



// Apply theme color to shader
function applyTheme(index) {
  const rgb = hexToRGB(themes[index]);
  gl.uniform3f(color2, rgb[0], rgb[1], rgb[2]);
}
applyTheme(currentTheme);
applyThemeCSS(currentTheme);

// Theme toggle button
document.getElementById("themeToggle").addEventListener("click", () => {
  currentTheme = (currentTheme + 1) % themes.length;
  applyTheme(currentTheme);
  applyThemeCSS(currentTheme);
});

// FPS counter
const fpsDisplay = document.getElementById('fps');
let lastTime = performance.now();
let frames = 0;

function render(time) {
  gl.uniform1f(TIME, time * 0.001);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  frames++;
  const delta = time - lastTime;
  if (delta >= 1000) {
    const fps = Math.round((frames * 1000) / delta);
    fpsDisplay.textContent = `FPS: ${fps}`;
    frames = 0;
    lastTime = time;
  }

  requestAnimationFrame(render);
}
requestAnimationFrame(render);
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.uniform2f(iResolution, canvas.width, canvas.height);
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);
resizeCanvas(); // Initial call


// Resize handling
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.uniform2f(iResolution, canvas.width, canvas.height);
});
gl.viewport(0, 0, canvas.width, canvas.height);
