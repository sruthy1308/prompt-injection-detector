import { useEffect, useRef } from "react";

export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    type Particle = {
      x: number; y: number;
      vy: number; vx: number;
      size: number; alpha: number;
      pulse: number; pulseSpeed: number;
      color: number; // hue
    };

    const spawn = (randomY = false): Particle => ({
      x: Math.random() * canvas.width,
      y: randomY ? Math.random() * canvas.height : Math.random() * -canvas.height * 0.5,
      vy: Math.random() * 0.9 + 0.25,
      vx: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 1.8 + 0.3,
      alpha: Math.random() * 0.4 + 0.1,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.025 + 0.008,
      color: Math.random() > 0.85 ? 195 : 162, // mostly green, some cyan
    });

    // Layer 1 — slow deep background particles
    const bgParticles: Particle[] = Array.from({ length: 220 }, () => ({
      ...spawn(true), vy: Math.random() * 0.35 + 0.08, size: Math.random() * 1.0 + 0.2, alpha: Math.random() * 0.12 + 0.04,
    }));

    // Layer 2 — mid particles
    const midParticles: Particle[] = Array.from({ length: 180 }, () => ({
      ...spawn(true), vy: Math.random() * 0.7 + 0.2, size: Math.random() * 1.5 + 0.3, alpha: Math.random() * 0.25 + 0.08,
    }));

    // Layer 3 — fast foreground particles
    const fgParticles: Particle[] = Array.from({ length: 80 }, () => ({
      ...spawn(true), vy: Math.random() * 1.4 + 0.6, size: Math.random() * 2.2 + 0.5, alpha: Math.random() * 0.35 + 0.12,
    }));

    // Shooting streaks
    type Streak = { x: number; y: number; vy: number; len: number; alpha: number; active: boolean };
    const streaks: Streak[] = Array.from({ length: 12 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vy: Math.random() * 4 + 3,
      len: Math.random() * 40 + 20,
      alpha: 0,
      active: false,
    }));

    let animId: number;
    let frame = 0;

    const drawLayer = (pts: Particle[]) => {
      const H = canvas.height;
      const W = canvas.width;
      pts.forEach((p) => {
        p.y += p.vy;
        p.x += p.vx;
        p.pulse += p.pulseSpeed;
        if (p.y > H + 10) Object.assign(p, spawn(false));
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;

        const a = p.alpha * (0.55 + 0.45 * Math.sin(p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.color}, 100%, 60%, ${a})`;
        ctx.fill();
      });
    };

    // Connection lines between nearby mid particles
    const drawConnections = () => {
      for (let i = 0; i < midParticles.length; i++) {
        for (let j = i + 1; j < midParticles.length; j++) {
          const dx = midParticles[i].x - midParticles[j].x;
          const dy = midParticles[i].y - midParticles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 90) {
            ctx.beginPath();
            ctx.moveTo(midParticles[i].x, midParticles[i].y);
            ctx.lineTo(midParticles[j].x, midParticles[j].y);
            ctx.strokeStyle = `hsla(162, 100%, 42%, ${0.07 * (1 - dist / 90)})`;
            ctx.lineWidth = 0.4;
            ctx.stroke();
          }
        }
      }
    };

    const drawStreaks = () => {
      const W = canvas.width;
      const H = canvas.height;
      streaks.forEach((s) => {
        // Randomly activate
        if (!s.active && Math.random() > 0.997) {
          s.active = true;
          s.x = Math.random() * W;
          s.y = -s.len;
          s.alpha = Math.random() * 0.25 + 0.1;
          s.vy = Math.random() * 5 + 4;
          s.len = Math.random() * 50 + 25;
        }
        if (!s.active) return;

        s.y += s.vy;
        if (s.y > H + s.len) { s.active = false; return; }

        const grad = ctx.createLinearGradient(s.x, s.y - s.len, s.x, s.y);
        grad.addColorStop(0, `hsla(162, 100%, 70%, 0)`);
        grad.addColorStop(0.6, `hsla(162, 100%, 60%, ${s.alpha})`);
        grad.addColorStop(1, `hsla(162, 100%, 80%, ${s.alpha * 1.5})`);
        ctx.beginPath();
        ctx.moveTo(s.x, s.y - s.len);
        ctx.lineTo(s.x, s.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Tip glow
        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(162, 100%, 85%, ${s.alpha * 2})`;
        ctx.fill();
      });
    };

    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawLayer(bgParticles);
      drawConnections();
      drawLayer(midParticles);
      drawStreaks();
      drawLayer(fgParticles);

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
}
