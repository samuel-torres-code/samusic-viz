const presets = {
    'spectrum-bars': {
        name: 'Spectrum Bars',
        keywords: ['bars', 'spectrum', 'frequency', 'vertical', 'columns'],
        draw: function(analyser, canvas, ctx, dataArray, bufferLength) {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const value = dataArray[i];
                const barHeight = (value / 255) * canvas.height;

                ctx.fillStyle = `rgb(${value + 100}, 50, 150)`;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }
        }
    },

    'oscilloscope': {
        name: 'Oscilloscope',
        keywords: ['wave', 'waveform', 'oscilloscope', 'line', 'wavy'],
        draw: function(analyser, canvas, ctx, dataArray, bufferLength) {
            analyser.getByteTimeDomainData(dataArray);

            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.lineWidth = 2;
            ctx.strokeStyle = '#00ff00';
            ctx.beginPath();

            const sliceWidth = canvas.width / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * canvas.height / 2;

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }

                x += sliceWidth;
            }

            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.stroke();
        }
    },

    'circular-spectrum': {
        name: 'Circular Spectrum',
        keywords: ['circular', 'circle', 'radial', 'round', 'spiral'],
        draw: function(analyser, canvas, ctx, dataArray, bufferLength) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = 80;

            for (let i = 0; i < bufferLength; i++) {
                const value = dataArray[i];
                const barHeight = (value / 255) * 100;
                
                const angle = (i / bufferLength) * Math.PI * 2;
                const x1 = centerX + Math.cos(angle) * radius;
                const y1 = centerY + Math.sin(angle) * radius;
                const x2 = centerX + Math.cos(angle) * (radius + barHeight);
                const y2 = centerY + Math.sin(angle) * (radius + barHeight);

                ctx.strokeStyle = `hsl(${(i / bufferLength) * 360}, 100%, 50%)`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        }
    },

    'chunky-bass': {
        name: 'Chunky Bass',
        keywords: ['chunky', 'thick', 'bass', 'heavy', 'thonky', 'fat', 'bold'],
        draw: function(analyser, canvas, ctx, dataArray, bufferLength) {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const displayBars = 64;
            const barWidth = canvas.width / displayBars;

            for (let i = 0; i < displayBars; i++) {
                let sum = 0;
                const samplesPerBar = Math.floor(bufferLength / displayBars);
                
                for (let j = 0; j < samplesPerBar; j++) {
                    sum += dataArray[i * samplesPerBar + j];
                }
                
                const value = sum / samplesPerBar;
                
                // Emphasize bass (first 20%)
                const bassBoost = i < displayBars * 0.2 ? 1.5 : 1.0;
                const barHeight = (value / 255) * canvas.height * bassBoost;

                const hue = i < displayBars * 0.2 ? 0 : 200; // Red for bass, blue for treble
                ctx.fillStyle = `hsl(${hue}, 100%, ${50 + value / 5}%)`;
                ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 2, barHeight);
            }
        }
    },

    'particles': {
        name: 'Particles',
        keywords: ['particles', 'dots', 'points', 'scatter', 'sparkle'],
        particles: [],
        init: function(canvas) {
            this.particles = [];
            for (let i = 0; i < 100; i++) {
                this.particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    size: Math.random() * 3 + 1
                });
            }
        },
        draw: function(analyser, canvas, ctx, dataArray, bufferLength) {
            if (this.particles.length === 0) {
                this.init(canvas);
            }

            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const avgValue = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
            const bassValue = dataArray.slice(0, bufferLength * 0.1).reduce((a, b) => a + b, 0) / (bufferLength * 0.1);

            this.particles.forEach((p, i) => {
                const freqIndex = Math.floor((i / this.particles.length) * bufferLength);
                const intensity = dataArray[freqIndex] / 255;

                p.x += p.vx * (1 + intensity);
                p.y += p.vy * (1 + intensity);

                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

                p.x = Math.max(0, Math.min(canvas.width, p.x));
                p.y = Math.max(0, Math.min(canvas.height, p.y));

                ctx.fillStyle = `hsl(${(i / this.particles.length) * 360}, 100%, ${50 + intensity * 50}%)`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * (1 + intensity), 0, Math.PI * 2);
                ctx.fill();
            });
        }
    }
};

function matchPreset(input) {
    const lowerInput = input.toLowerCase();
    
    for (const [key, preset] of Object.entries(presets)) {
        for (const keyword of preset.keywords) {
            if (lowerInput.includes(keyword)) {
                return key;
            }
        }
    }
    
    return 'spectrum-bars'; // default
}