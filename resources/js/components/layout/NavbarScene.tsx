import { useEffect, useRef } from 'react';

// ---------------------------------------------------------------------------
// Floating particles configuration
// ---------------------------------------------------------------------------

interface Particle {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    opacity: number;
    opacityDir: number;
}

function createParticles(width: number, height: number, count: number): Particle[] {
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 2 + 0.5,
            speedX: (Math.random() - 0.5) * 0.3,
            speedY: (Math.random() - 0.5) * 0.15,
            opacity: Math.random() * 0.15 + 0.03,
            opacityDir: Math.random() > 0.5 ? 0.001 : -0.001,
        });
    }
    return particles;
}

// ---------------------------------------------------------------------------
// Canvas-based animated scene — flowing waves + particles + shimmer
// More professional and fluid than static SVG silhouettes
// ---------------------------------------------------------------------------

export function NavbarScene() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animFrameRef = useRef<number>(0);
    const particlesRef = useRef<Particle[]>([]);
    const initializedRef = useRef(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Match canvas size to element size
        const resizeCanvas = () => {
            const rect = canvas.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);

            // Re-create particles if canvas was resized
            if (!initializedRef.current || particlesRef.current.length === 0) {
                particlesRef.current = createParticles(rect.width, rect.height, 18);
                initializedRef.current = true;
            }
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // --- Color palette (matching Tailwind primary blue) ---
        // primary-200: #bfdbfe → rgb(191, 219, 254)
        // primary-300: #93c5fd → rgb(147, 197, 253)
        // primary-400: #60a5fa → rgb(96, 165, 250)
        // primary-500: #3b82f6 → rgb(59, 130, 246)

        let time = 0;

        function drawWave(
            ctx: CanvasRenderingContext2D,
            w: number,
            h: number,
            amplitude: number,
            frequency: number,
            phase: number,
            yOffset: number,
            color: string,
        ) {
            ctx.beginPath();
            ctx.moveTo(0, h);

            for (let x = 0; x <= w; x += 2) {
                const y =
                    yOffset +
                    Math.sin(x * frequency + phase) * amplitude +
                    Math.sin(x * frequency * 1.8 + phase * 0.7) * (amplitude * 0.4);
                ctx.lineTo(x, y);
            }

            ctx.lineTo(w, h);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
        }

        function drawParticles(ctx: CanvasRenderingContext2D, w: number, h: number) {
            const particles = particlesRef.current;

            for (const p of particles) {
                // Update position
                p.x += p.speedX;
                p.y += p.speedY;

                // Oscillate opacity
                p.opacity += p.opacityDir;
                if (p.opacity > 0.18) p.opacityDir = -Math.abs(p.opacityDir);
                if (p.opacity < 0.02) p.opacityDir = Math.abs(p.opacityDir);

                // Wrap around edges
                if (p.x < -5) p.x = w + 5;
                if (p.x > w + 5) p.x = -5;
                if (p.y < -5) p.y = h + 5;
                if (p.y > h + 5) p.y = -5;

                // Draw particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(59, 130, 246, ${p.opacity})`;
                ctx.fill();
            }

            // Draw subtle connection lines between close particles
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 100) {
                        const lineOpacity = (1 - dist / 100) * 0.04;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(59, 130, 246, ${lineOpacity})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }
        }

        function drawShimmer(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
            // Traveling light shimmer effect
            const shimmerX = ((t * 40) % (w + 300)) - 150;
            const gradient = ctx.createLinearGradient(
                shimmerX - 80,
                0,
                shimmerX + 80,
                0,
            );
            gradient.addColorStop(0, 'rgba(59, 130, 246, 0)');
            gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.03)');
            gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(shimmerX - 80, 0, 160, h);
        }

        function animate() {
            const rect = canvas!.getBoundingClientRect();
            const w = rect.width;
            const h = rect.height;

            ctx!.clearRect(0, 0, w, h);

            time += 0.008;

            // Shimmer (traveling highlight)
            drawShimmer(ctx!, w, h, time);

            // Particles & connections
            drawParticles(ctx!, w, h);

            // Wave layers (bottom) — multiple overlapping sine waves
            // Back wave (lightest)
            drawWave(
                ctx!, w, h,
                3, 0.005, time * 0.6,
                h - 10,
                'rgba(191, 219, 254, 0.12)',
            );

            // Middle wave
            drawWave(
                ctx!, w, h,
                2.5, 0.008, time * 1.0 + 1.5,
                h - 7,
                'rgba(147, 197, 253, 0.10)',
            );

            // Front wave (most visible)
            drawWave(
                ctx!, w, h,
                2, 0.012, time * 1.4 + 3.0,
                h - 4,
                'rgba(96, 165, 250, 0.08)',
            );

            // Bottom accent line — subtle gradient
            const lineGrad = ctx!.createLinearGradient(0, h - 1.5, w, h - 1.5);
            lineGrad.addColorStop(0, 'rgba(59, 130, 246, 0.05)');
            lineGrad.addColorStop(0.3, 'rgba(59, 130, 246, 0.15)');
            lineGrad.addColorStop(0.7, 'rgba(59, 130, 246, 0.15)');
            lineGrad.addColorStop(1, 'rgba(59, 130, 246, 0.05)');
            ctx!.fillStyle = lineGrad;
            ctx!.fillRect(0, h - 1.5, w, 1.5);

            animFrameRef.current = requestAnimationFrame(animate);
        }

        animFrameRef.current = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animFrameRef.current);
            window.removeEventListener('resize', resizeCanvas);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 h-full w-full print:hidden"
            aria-hidden="true"
        />
    );
}
