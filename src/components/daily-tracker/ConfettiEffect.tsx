'use client';

import { useEffect, useRef } from 'react';

interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: 'rect' | 'circle';
}

const COLORS = ['#00b4d8', '#0096c7', '#48cae4', '#90e0ef', '#ade8f4', '#ffffff', '#caf0f8'];

export default function ConfettiEffect({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const piecesRef = useRef<ConfettiPiece[]>([]);

  useEffect(() => {
    if (!active || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    piecesRef.current = Array.from({ length: 80 }, () => ({
      x: Math.random() * width,
      y: -20 - Math.random() * 100,
      vx: (Math.random() - 0.5) * 6,
      vy: Math.random() * 3 + 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      opacity: 1,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    }));

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      let alive = false;

      for (const piece of piecesRef.current) {
        piece.x += piece.vx;
        piece.vy += 0.05;
        piece.y += piece.vy;
        piece.rotation += piece.rotationSpeed;
        piece.vx *= 0.99;

        if (piece.y > height * 0.7) {
          piece.opacity -= 0.02;
        }

        if (piece.opacity > 0) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = Math.max(0, piece.opacity);
          ctx.translate(piece.x, piece.y);
          ctx.rotate((piece.rotation * Math.PI) / 180);
          ctx.fillStyle = piece.color;

          if (piece.shape === 'rect') {
            ctx.fillRect(-piece.size / 2, -piece.size / 4, piece.size, piece.size / 2);
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, piece.size / 3, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        }
      }

      if (alive) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-50 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
