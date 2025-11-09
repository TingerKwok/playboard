// FIX: Import `React` to make the `React` namespace available for types like `React.RefObject`.
import React, { useState, useEffect, useRef, useCallback } from 'react';

const useCanvasDrawing = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#1a1a1a'); // Default to black
  const [penWidth] = useState(3); // Pen width
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    const newWidth = canvas.clientWidth;
    const newHeight = canvas.clientHeight;
    
    // Only resize if dimensions have actually changed to avoid unnecessary redraws
    if (canvas.width !== newWidth || canvas.height !== newHeight) {
      // Set the canvas resolution to match its display size
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // Re-apply context settings as they are reset on resize
      context.lineCap = 'round';
      context.strokeStyle = penColor;
      context.lineWidth = penWidth;
    }
  }, [canvasRef, penColor, penWidth]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;
    
    contextRef.current = context;

    // Use a ResizeObserver to handle canvas sizing. This is more robust
    // than listening to window resize events, as it correctly handles
    // initial layout, CSS-driven size changes, and flexbox adjustments,
    // solving the issue where the canvas size was 0 on load.
    const observer = new ResizeObserver(() => {
      resizeCanvas();
    });
    observer.observe(canvas);

    return () => {
      observer.disconnect();
    };
  }, [canvasRef, resizeCanvas]);

  useEffect(() => {
    if (contextRef.current) {
        contextRef.current.strokeStyle = penColor;
    }
  }, [penColor]);
  
  const getCoords = useCallback((event: MouseEvent | TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (event instanceof MouseEvent) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else { // TouchEvent
      if (event.touches.length === 0) return null;
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    }
    
    return { 
      x: clientX - rect.left, 
      y: clientY - rect.top 
    };
  }, [canvasRef]);

  const startDrawing = useCallback((event: MouseEvent | TouchEvent) => {
    event.preventDefault(); // Prevent page scroll on touch
    const context = contextRef.current;
    const coords = getCoords(event);
    if (!context || !coords) return;
    
    const { x, y } = coords;
    context.beginPath();
    context.moveTo(x, y);
    setIsDrawing(true);
  }, [getCoords]);

  const draw = useCallback((event: MouseEvent | TouchEvent) => {
    event.preventDefault(); // Prevent page scroll on touch
    if (!isDrawing) return;
    const context = contextRef.current;
    const coords = getCoords(event);
    if (!context || !coords) return;
    
    const { x, y } = coords;
    context.lineTo(x, y);
    context.stroke();
  }, [isDrawing, getCoords]);

  const stopDrawing = useCallback(() => {
    const context = contextRef.current;
    if (!context) return;
    context.closePath();
    setIsDrawing(false);
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [canvasRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use { passive: false } to allow preventDefault() in touch event listeners
    const options = { passive: false };

    // Mouse events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    // Touch events
    canvas.addEventListener('touchstart', startDrawing, options);
    canvas.addEventListener('touchmove', draw, options);
    canvas.addEventListener('touchend', stopDrawing, options);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseleave', stopDrawing);
      
      canvas.removeEventListener('touchstart', startDrawing, options);
      canvas.removeEventListener('touchmove', draw, options);
      canvas.removeEventListener('touchend', stopDrawing, options);
    };
  }, [startDrawing, draw, stopDrawing]);

  return { penColor, setPenColor, clearCanvas };
};

export default useCanvasDrawing;