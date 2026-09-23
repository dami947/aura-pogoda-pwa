import { useEffect, useRef } from "react";

// Dynamiczne tło - animowane cząsteczki (deszcz, śnieg, gwiazdy, słońce) na canvasie
export const WeatherCanvasBackground = ({ particle = "clear_day", accent = "#FFC107" }) => {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w, h;

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    let particles = [];
    const count = particle === "stars" ? 140 : particle === "snow" ? 90 : particle === "rain" || particle === "storm" ? 220 : 40;

    const init = () => {
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          len: 8 + Math.random() * 18,
          speed: 2 + Math.random() * 6,
          r: Math.random() * 2 + 0.4,
          drift: Math.random() * 1 - 0.5,
          tw: Math.random() * Math.PI * 2,
        });
      }
    };
    init();

    let flash = 0;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      if (particle === "rain" || particle === "storm") {
        ctx.strokeStyle = "rgba(180, 210, 240, 0.45)";
        ctx.lineWidth = 1.1;
        particles.forEach((p) => {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.drift * 2, p.y + p.len);
          ctx.stroke();
          p.y += p.speed * 2.2;
          p.x += p.drift;
          if (p.y > h) { p.y = -p.len; p.x = Math.random() * w; }
        });
        if (particle === "storm") {
          if (Math.random() > 0.985) flash = 1;
          if (flash > 0) {
            ctx.fillStyle = `rgba(255,255,255,${flash * 0.35})`;
            ctx.fillRect(0, 0, w, h);
            flash -= 0.06;
          }
        }
      } else if (particle === "snow") {
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        particles.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r + 1, 0, Math.PI * 2);
          ctx.fill();
          p.y += p.speed * 0.5;
          p.x += Math.sin(p.y / 40) * 0.6;
          if (p.y > h) { p.y = -5; p.x = Math.random() * w; }
        });
      } else if (particle === "stars") {
        particles.forEach((p) => {
          p.tw += 0.04;
          const alpha = 0.35 + Math.abs(Math.sin(p.tw)) * 0.55;
          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (particle === "sun") {
        // delikatne dryfujące cząsteczki światła
        particles.forEach((p) => {
          p.tw += 0.02;
          const alpha = 0.15 + Math.abs(Math.sin(p.tw)) * 0.25;
          ctx.fillStyle = `rgba(255, 235, 180, ${alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r + 1.5, 0, Math.PI * 2);
          ctx.fill();
          p.y -= 0.2;
          if (p.y < 0) p.y = h;
        });
      } else {
        // clouds / fog - subtelna mgła
        particles.forEach((p) => {
          ctx.fillStyle = "rgba(255,255,255,0.06)";
          ctx.beginPath();
          ctx.arc(p.x, p.y, 40 + p.len * 3, 0, Math.PI * 2);
          ctx.fill();
          p.x += 0.2;
          if (p.x > w + 120) p.x = -120;
        });
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [particle]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      data-testid="weather-canvas-background"
    />
  );
};
