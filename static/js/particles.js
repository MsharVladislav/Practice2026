class ParticleSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.resize();

        window.addEventListener('resize', () => this.resize());

        this.particleCount = 70;
        this.connectionDistance = 150;
        this.color = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    init() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                radius: Math.random() * 2 + 1
            });
        }
    }

    update() {
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > this.canvas.width) p.vx = -p.vx;
            if (p.y < 0 || p.y > this.canvas.height) p.vy = -p.vy;
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = this.color;
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = 0.5;

        for (let i = 0; i < this.particles.length; i++) {
            const p1 = this.particles[i];
            
            this.ctx.beginPath();
            this.ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
            this.ctx.fill();

            for (let j = i + 1; j < this.particles.length; j++) {
                const p2 = this.particles[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.connectionDistance) {
                    this.ctx.globalAlpha = 1 - (distance / this.connectionDistance); // Прозрачность зависит от расстояния
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                }
            }
        }
        this.ctx.globalAlpha = 1;
    }

    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const system = new ParticleSystem('bgCanvas');
    system.init();
    system.animate();
});