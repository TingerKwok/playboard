// FIX: Import `React` to make the `React` namespace available for types like `React.RefObject`.
import React, { useState, useEffect, useRef, useCallback } from 'react';

const useCanvasDrawing = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#1a1a1a'); // Default to black
  const [penWidth] = useState(3); // Pen width
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  // This useEffect handles the canvas setup and resizing logic.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;
    
    contextRef.current = context;

    // This function synchronizes the canvas's drawing buffer size with its element size on the page.
    const handleResize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        // Get the real, displayed size of the container.
        const newWidth = parent.clientWidth;
        const newHeight = parent.clientHeight;
        
        // Update the canvas resolution only if it has changed.
        if (canvas.width !== newWidth || canvas.height !== newHeight) {
          canvas.width = newWidth;
          canvas.height = newHeight;
          
          // Re-apply context settings as they are reset when the canvas size is changed.
          context.lineCap = 'round';
          context.strokeStyle = penColor;
          context.lineWidth = penWidth;
        }
      }
    };
    
    // Call resize once initially to set the size correctly.
    // A small delay ensures that the browser has completed its layout calculations,
    // so we get the correct final size of the container.
    const resizeTimeout = setTimeout(handleResize, 50);

    // Also, resize the canvas whenever the window is resized.
    window.addEventListener('resize', handleResize);

    // Cleanup function to remove the listener and timeout when the component unmounts.
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, [canvasRef, penColor, penWidth]); // Dependencies ensure settings are reapplied if they change.

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