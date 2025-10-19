const streamUrlInput = document.getElementById('streamUrl');
const audioForm = document.getElementById('audioForm');
const stopBtn = document.getElementById('stopBtn');
const statusDiv = document.getElementById('status');
const styleForm = document.getElementById('styleForm');
const styleInput = document.getElementById('styleInput');
const presetNameSpan = document.getElementById('presetName');
const avgFreqSpan = document.getElementById('avgFreq');
const peakFreqSpan = document.getElementById('peakFreq');
const bassLevelSpan = document.getElementById('bassLevel');
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');

let audioContext;
let analyser;
let dataArray;
let bufferLength;
let source;
let animationId;
let audioElement;
let currentPresetKey = 'spectrum-bars';

function setStatus(message) {
    statusDiv.textContent = message;
}

function startVisualization(e) {
    e.preventDefault();
    
    const url = streamUrlInput.value.trim();
    
    if (!url) {
        setStatus('Please enter a valid URL');
        return;
    }

    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        audioElement = new Audio();
        audioElement.crossOrigin = "anonymous";
        audioElement.src = url;
        
        source = audioContext.createMediaElementSource(audioElement);
        source.connect(analyser);
        analyser.connect(audioContext.destination);

        audioElement.play().then(() => {
            setStatus('Playing...');
            draw();
        }).catch(err => {
            setStatus(`Error: ${err.message}`);
            cleanup();
        });

    } catch (err) {
        setStatus(`Error: ${err.message}`);
        cleanup();
    }
}

function stopVisualization() {
    cleanup();
    setStatus('Stopped');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function cleanup() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    if (audioElement) {
        audioElement.pause();
        audioElement = null;
    }
    if (source) {
        source.disconnect();
        source = null;
    }
    if (analyser) {
        analyser.disconnect();
        analyser = null;
    }
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
}

function changePreset(e) {
    e.preventDefault();
    
    const input = styleInput.value.trim();
    
    if (!input) {
        setStatus('Please describe a visualizer style');
        return;
    }
    
    const matchedPreset = matchPreset(input);
    currentPresetKey = matchedPreset;
    presetNameSpan.textContent = presets[currentPresetKey].name;
    setStatus(`Applied preset: ${presets[currentPresetKey].name}`);
    styleInput.value = '';
}

function draw() {
    animationId = requestAnimationFrame(draw);

    analyser.getByteFrequencyData(dataArray);

    const preset = presets[currentPresetKey];
    preset.draw(analyser, canvas, ctx, dataArray, bufferLength);

    // Update stats
    let sum = 0;
    let peak = 0;
    let bassSum = 0;
    const bassRange = Math.floor(bufferLength * 0.1);

    for (let i = 0; i < bufferLength; i++) {
        const value = dataArray[i];
        sum += value;
        if (value > peak) peak = value;
        if (i < bassRange) bassSum += value;
    }

    const avg = Math.round(sum / bufferLength);
    const bass = Math.round(bassSum / bassRange);
    avgFreqSpan.textContent = avg;
    peakFreqSpan.textContent = peak;
    bassLevelSpan.textContent = bass;
}

audioForm.addEventListener('submit', startVisualization);
stopBtn.addEventListener('click', stopVisualization);
styleForm.addEventListener('submit', changePreset);