// DOM Elements
const targetColorBlock = document.getElementById('target-color');
const guessColorBlock = document.getElementById('guess-color');
const guessLabel = document.getElementById('guess-label');

// Inputs
const hexSection = document.getElementById('hex-input-section');
const sliderSection = document.getElementById('slider-input-section');
const hexInput = document.getElementById('hex-input');
const sliderR = document.getElementById('slider-r');
const sliderG = document.getElementById('slider-g');
const sliderB = document.getElementById('slider-b');
const valR = document.getElementById('val-r');
const valG = document.getElementById('val-g');
const valB = document.getElementById('val-b');

// Buttons & UI
const modeHexBtn = document.getElementById('mode-hex-btn');
const modeSliderBtn = document.getElementById('mode-slider-btn');
const submitBtn = document.getElementById('submit-btn');
const nextBtn = document.getElementById('next-btn');
const resultsSection = document.getElementById('results');
const errorMsg = document.getElementById('error-msg');
const scoreValue = document.getElementById('score-value');
const actualHexDisplay = document.getElementById('actual-hex');
const yoursHexDisplay = document.getElementById('yours-hex');
const highScoreDisplay = document.getElementById('high-score');
const historyList = document.getElementById('history-list');

// Graph Elements
const bars = {
    rActual: document.getElementById('bar-r-actual'), rGuess: document.getElementById('bar-r-guess'),
    gActual: document.getElementById('bar-g-actual'), gGuess: document.getElementById('bar-g-guess'),
    bActual: document.getElementById('bar-b-actual'), bGuess: document.getElementById('bar-b-guess')
};

// Game State
let currentTargetRGB = { r: 0, g: 0, b: 0 };
let currentTargetHex = "";
let bestScore = 0.0;
let historyArray = [];
let currentMode = 'hex'; // 'hex' or 'slider'

// Mode Switching
function setMode(mode) {
    currentMode = mode;
    if (mode === 'hex') {
        modeHexBtn.classList.add('active');
        modeSliderBtn.classList.remove('active');
        hexSection.classList.remove('hidden');
        sliderSection.classList.add('hidden');
    } else {
        modeSliderBtn.classList.add('active');
        modeHexBtn.classList.remove('active');
        sliderSection.classList.remove('hidden');
        hexSection.classList.add('hidden');
    }
    initGame(); // Reset board for new mode
}

modeHexBtn.addEventListener('click', () => setMode('hex'));
modeSliderBtn.addEventListener('click', () => setMode('slider'));

// Initialize Game
function initGame() {
    currentTargetRGB = {
        r: Math.floor(Math.random() * 256),
        g: Math.floor(Math.random() * 256),
        b: Math.floor(Math.random() * 256)
    };
    
    currentTargetHex = rgbToHex(currentTargetRGB.r, currentTargetRGB.g, currentTargetRGB.b);
    targetColorBlock.style.backgroundColor = `#${currentTargetHex}`;
    
    resultsSection.classList.add('hidden');
    errorMsg.classList.add('hidden');
    submitBtn.disabled = false;
    Object.values(bars).forEach(bar => bar.style.height = '0%');
    
    if (currentMode === 'hex') {
        guessColorBlock.classList.add('hidden');
        guessLabel.textContent = 'Your Guess';
        hexInput.value = '';
        hexInput.disabled = false;
        hexInput.focus();
    } else {
        // Setup Live Preview for sliders
        guessColorBlock.classList.remove('hidden');
        guessLabel.textContent = 'Live Preview';
        sliderR.value = 128; sliderG.value = 128; sliderB.value = 128;
        sliderR.disabled = false; sliderG.disabled = false; sliderB.disabled = false;
        updateSliderPreview();
    }
}

// Slider Live Preview Logic
function updateSliderPreview() {
    const r = parseInt(sliderR.value);
    const g = parseInt(sliderG.value);
    const b = parseInt(sliderB.value);
    
    valR.textContent = r;
    valG.textContent = g;
    valB.textContent = b;
    
    const hex = rgbToHex(r, g, b);
    guessColorBlock.style.backgroundColor = `#${hex}`;
}

[sliderR, sliderG, sliderB].forEach(slider => {
    slider.addEventListener('input', updateSliderPreview);
});

// Math/Conversion Utilities
function rgbToHex(r, g, b) {
    return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

function hexToRgb(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex.split('').map(char => char + char).join('');
    const hexRegex = /^[0-9A-Fa-f]{6}$/;
    if (!hexRegex.test(hex)) return null;
    return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16)
    };
}

function calculateSimilarity(targetRGB, guessRGB) {
    const maxDistance = Math.sqrt((255 ** 2) + (255 ** 2) + (255 ** 2));
    const distance = Math.sqrt(
        (targetRGB.r - guessRGB.r) ** 2 +
        (targetRGB.g - guessRGB.g) ** 2 +
        (targetRGB.b - guessRGB.b) ** 2
    );
    return parseFloat(Math.max(0, 100 - ((distance / maxDistance) * 100)).toFixed(1));
}

// Render Data
function updateGraph(target, guess) {
    setTimeout(() => {
        bars.rActual.style.height = `${(target.r / 255) * 100}%`;
        bars.gActual.style.height = `${(target.g / 255) * 100}%`;
        bars.bActual.style.height = `${(target.b / 255) * 100}%`;
        bars.rGuess.style.height = `${(guess.r / 255) * 100}%`;
        bars.gGuess.style.height = `${(guess.g / 255) * 100}%`;
        bars.bGuess.style.height = `${(guess.b / 255) * 100}%`;
    }, 50); // Small delay ensures CSS transition triggers
}

function updateHistoryPanel() {
    if (historyArray.length === 0) return;
    historyList.innerHTML = ''; 
    [...historyArray].reverse().forEach(item => {
        const historyEl = document.createElement('div');
        historyEl.className = 'history-item';
        historyEl.innerHTML = `
            <div class="history-colors">
                <div class="hist-swatch" style="background-color: #${item.target};" title="Target: #${item.target}"></div>
                <div class="hist-swatch" style="background-color: #${item.guess};" title="Guess: #${item.guess}"></div>
            </div>
            <div class="hist-score">${item.score}%</div>
        `;
        historyList.appendChild(historyEl);
    });
}

// Handle Game Logic
function handleGuess() {
    let guessRGB;
    let formattedGuessHex;

    if (currentMode === 'hex') {
        const rawInput = hexInput.value.trim();
        guessRGB = hexToRgb(rawInput);
        if (!guessRGB) {
            errorMsg.classList.remove('hidden');
            return;
        }
        formattedGuessHex = rawInput.replace(/^#/, '').toUpperCase();
        if (formattedGuessHex.length === 3) {
            formattedGuessHex = formattedGuessHex.split('').map(c => c + c).join('');
        }
        hexInput.disabled = true;
    } else {
        // Slider mode
        guessRGB = {
            r: parseInt(sliderR.value),
            g: parseInt(sliderG.value),
            b: parseInt(sliderB.value)
        };
        formattedGuessHex = rgbToHex(guessRGB.r, guessRGB.g, guessRGB.b);
        sliderR.disabled = true; sliderG.disabled = true; sliderB.disabled = true;
    }
    
    errorMsg.classList.add('hidden');
    submitBtn.disabled = true;
    
    guessLabel.textContent = 'Your Guess';
    guessColorBlock.style.backgroundColor = `#${formattedGuessHex}`;
    guessColorBlock.classList.remove('hidden');
    
    const score = calculateSimilarity(currentTargetRGB, guessRGB);
    scoreValue.textContent = score;
    
    if (score > bestScore) {
        bestScore = score;
        highScoreDisplay.textContent = bestScore.toFixed(1);
    }
    
    actualHexDisplay.textContent = `#${currentTargetHex}`;
    yoursHexDisplay.textContent = `#${formattedGuessHex}`;
    
    updateGraph(currentTargetRGB, guessRGB);
    
    historyArray.push({
        target: currentTargetHex,
        guess: formattedGuessHex,
        score: score
    });
    updateHistoryPanel();
    
    resultsSection.classList.remove('hidden');
}

// Event Listeners
submitBtn.addEventListener('click', handleGuess);
hexInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleGuess();
});
nextBtn.addEventListener('click', initGame);

// Start
initGame();