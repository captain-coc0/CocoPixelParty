import { useEffect, useRef } from "react";

const SIZE = 64;
const CELL_SIZE = 10;

export default function PixelCanvas({ pixels, onPaint }) {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef(null);

  useEffect(() => {
    let animationId;

    function draw() {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const flicker = 0.9 + Math.random() * 0.1;

      for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
          const color = pixels[y][x];

          if (
            color === "transparent" ||
            color === "black" ||
            color === "#000000"
          ) {
            continue;
          }

          const flickeredColor = applyFlicker(color, flicker);

          ctx.shadowColor = flickeredColor;
          ctx.shadowBlur = 8;
          ctx.fillStyle = flickeredColor;

          ctx.fillRect(
            x * CELL_SIZE,
            y * CELL_SIZE,
            CELL_SIZE,
            CELL_SIZE
          );

          ctx.shadowBlur = 0;
        }
      }

      drawScanlines(ctx, canvas);

      animationId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [pixels]);

  function getCanvasPoint(event) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const clientX = event.clientX;
    const clientY = event.clientY;

    const x = Math.floor((clientX - rect.left) / (rect.width / SIZE));
    const y = Math.floor((clientY - rect.top) / (rect.height / SIZE));

    if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) {
      return null;
    }

    return { x, y };
  }

  function paintAtEvent(event) {
    const point = getCanvasPoint(event);
    if (!point) return;

    const lastPoint = lastPointRef.current;

    if (lastPoint) {
      paintLine(lastPoint, point);
    } else {
      onPaint(point.x, point.y);
    }

    lastPointRef.current = point;
  }

  function paintLine(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));

    for (let i = 0; i <= steps; i++) {
      const x = Math.round(from.x + (dx * i) / steps);
      const y = Math.round(from.y + (dy * i) / steps);

      if (x >= 0 && x < SIZE && y >= 0 && y < SIZE) {
        onPaint(x, y);
      }
    }
  }

  function handlePointerDown(event) {
    event.preventDefault();

    isDrawingRef.current = true;
    canvasRef.current.setPointerCapture(event.pointerId);

    paintAtEvent(event);
  }

  function handlePointerMove(event) {
    if (!isDrawingRef.current) return;

    event.preventDefault();
    paintAtEvent(event);
  }

  function stopDrawing(event) {
    isDrawingRef.current = false;
    lastPointRef.current = null;

    if (event?.pointerId && canvasRef.current?.hasPointerCapture(event.pointerId)) {
      canvasRef.current.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <canvas
      ref={canvasRef}
      width={SIZE * CELL_SIZE}
      height={SIZE * CELL_SIZE}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDrawing}
      onPointerCancel={stopDrawing}
      onPointerLeave={stopDrawing}
      style={{
        width: "min(90vw, 640px)",
        height: "min(90vw, 640px)",
        touchAction: "none",
        background: "black",
        imageRendering: "pixelated",
        cursor: "crosshair",
      }}
    />
  );
}

function applyFlicker(color, flicker) {
  if (!color.startsWith("#")) {
    return color;
  }

  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);

  const newR = Math.min(255, Math.floor(r * flicker));
  const newG = Math.min(255, Math.floor(g * flicker));
  const newB = Math.min(255, Math.floor(b * flicker));

  return `rgb(${newR}, ${newG}, ${newB})`;
}

function drawScanlines(ctx, canvas) {
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "rgba(0, 0, 0, 0.15)";

  for (let y = 0; y < canvas.height; y += 4) {
    ctx.fillRect(0, y, canvas.width, 1);
  }
}