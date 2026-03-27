import React, { useRef, useEffect, useState } from 'react';
import { Eraser, Pencil, Trash2, Download } from 'lucide-react';

interface WhiteboardProps {
  classId: string;
  isLeader: boolean;
}

interface DrawData {
  x: number;
  y: number;
  lastX: number;
  lastY: number;
  color: string;
  width: number;
}

export default function Whiteboard({ classId, isLeader }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#4f46e5');
  const [width, setWidth] = useState(3);
  const [tool, setTool] = useState<'pencil' | 'eraser'>('pencil');
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const drawOnCanvas = (x1: number, y1: number, x2: number, y2: number, drawColor: string, drawWidth: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = drawWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.closePath();
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    lastPos.current = { x, y };
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    const drawColor = tool === 'eraser' ? '#ffffff' : color;
    const drawWidth = tool === 'eraser' ? width * 5 : width;

    drawOnCanvas(lastPos.current.x, lastPos.current.y, x, y, drawColor, drawWidth);

    // Socket emit disabled after move to Firebase

    lastPos.current = { x, y };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Socket emit disabled after move to Firebase
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `whiteboard-${classId}-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="relative w-full h-full bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="w-full h-full cursor-crosshair touch-none"
      />

      {/* Toolbar */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 p-2 bg-white/80 backdrop-blur-md rounded-xl border border-slate-200 shadow-lg">
        <button
          onClick={() => setTool('pencil')}
          className={`p-2 rounded-lg transition-colors ${tool === 'pencil' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          title="Pencil"
        >
          <Pencil size={20} />
        </button>
        <button
          onClick={() => setTool('eraser')}
          className={`p-2 rounded-lg transition-colors ${tool === 'eraser' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          title="Eraser"
        >
          <Eraser size={20} />
        </button>
        <div className="h-px bg-slate-200 mx-1 my-1" />
        <button
          onClick={clearCanvas}
          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
          title="Clear Whiteboard"
        >
          <Trash2 size={20} />
        </button>
        <button
          onClick={downloadCanvas}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          title="Download as Image"
        >
          <Download size={20} />
        </button>
      </div>

      {/* Color & Width Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 p-3 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 shadow-lg">
        <div className="flex items-center gap-2">
          {['#4f46e5', '#ef4444', '#10b981', '#f59e0b', '#000000'].map(c => (
            <button
              key={c}
              onClick={() => {
                setColor(c);
                setTool('pencil');
              }}
              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${color === c && tool === 'pencil' ? 'border-slate-400 scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <div className="h-6 w-px bg-slate-200" />
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Size</span>
          <input
            type="range"
            min="1"
            max="20"
            value={width}
            onChange={(e) => setWidth(parseInt(e.target.value))}
            className="w-24 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>
      </div>
    </div>
  );
}
