import React, { useRef, useState } from 'react';
import './Whiteboard.css';

const Whiteboard = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPosition, setLastPosition] = useState(null);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [eraserSize, setEraserSize] = useState(20);
  const [isBrushActive, setIsBrushActive] = useState(true);
  const [isEraserActive, setIsEraserActive] = useState(false);
  const [selectedShape, setSelectedShape] = useState(null);
  const [shapeStartPosition, setShapeStartPosition] = useState(null);
  const [actionStack, setActionStack] = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [isTextActive, setIsTextActive] = useState(false); // For text tool
  const [textPosition, setTextPosition] = useState(null); // Position to add text
  const [textValue, setTextValue] = useState(''); // Current text being entered
  const [fontSize, setFontSize] = useState(16); // Text font size
  const [isDarkMode, setIsDarkMode] = useState(false); // Dark mode state

  // Function to toggle dark mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    // Optionally, save the dark mode state to localStorage for persistence
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('darkMode', 'enabled');
    } else {
        localStorage.setItem('darkMode', 'disabled');
    }
}

// Check if dark mode was previously enabled
if (localStorage.getItem('darkMode') === 'enabled') {
    document.body.classList.add('dark-mode');
} else {
    document.body.classList.remove('dark-mode');
}

  const saveCanvas = () => {
    const canvas = canvasRef.current;
    const imageData = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = imageData;
    link.download = 'whiteboard.png';
    link.click();
  };

  const selectTool = (tool) => {
    setSelectedShape(tool === 'brush' || tool === 'eraser' ? null : tool);
    setIsBrushActive(tool === 'brush');
    setIsEraserActive(tool === 'eraser');
    setIsTextActive(tool === 'text'); // Activate text tool
    setTextPosition(null); // Reset text position when switching tools
    setTextValue(''); // Reset text value on tool switch
  };

  const startDrawing = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    setIsDrawing(true);
    if (isTextActive) {
      setTextPosition({ x: offsetX, y: offsetY }); // Set position for text input
      setTextValue(''); // Clear any previous text
    } else {
      setLastPosition({ x: offsetX, y: offsetY });
    }

    if (selectedShape) {
      setShapeStartPosition({ x: offsetX, y: offsetY });
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const imageData = canvas.toDataURL();
    setActionStack((prev) => [...prev, imageData]);
    setUndoStack([]); // Clear undo stack after a new action
  };

  const draw = (e) => {
    if (!isDrawing || isTextActive) return;

    const ctx = canvasRef.current.getContext('2d');
    const { offsetX, offsetY } = e.nativeEvent;

    if (selectedShape) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      const img = new Image();
      img.src = actionStack[actionStack.length - 1];
      img.onload = () => {
        ctx.drawImage(img, 0, 0);

        const width = offsetX - shapeStartPosition.x;
        const height = offsetY - shapeStartPosition.y;

        ctx.lineWidth = brushSize;
        ctx.strokeStyle = color;

        if (selectedShape === 'rectangle') {
          ctx.strokeRect(shapeStartPosition.x, shapeStartPosition.y, width, height);
        } else if (selectedShape === 'circle') {
          const radius = Math.sqrt(width ** 2 + height ** 2);
          ctx.beginPath();
          ctx.arc(shapeStartPosition.x, shapeStartPosition.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
        } else if (selectedShape === 'line') {
          ctx.beginPath();
          ctx.moveTo(shapeStartPosition.x, shapeStartPosition.y);
          ctx.lineTo(offsetX, offsetY);
          ctx.stroke();
        }
      };
    } else {
      ctx.lineWidth = isEraserActive ? eraserSize : brushSize;
      ctx.lineCap = 'round';
      ctx.strokeStyle = isEraserActive ? '#FFFFFF' : color;

      ctx.beginPath();
      ctx.moveTo(lastPosition.x, lastPosition.y);
      ctx.lineTo(offsetX, offsetY);
      ctx.stroke();
      setLastPosition({ x: offsetX, y: offsetY });
    }
  };

  const addTextToCanvas = () => {
    if (!textPosition || !textValue.trim()) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = color;
    ctx.fillText(textValue, textPosition.x, textPosition.y);

    // Save action to stack
    const imageData = canvas.toDataURL();
    setActionStack((prev) => [...prev, imageData]);
    setUndoStack([]);

    // Reset text input state
    setTextValue('');
    setTextPosition(null);
  };

  const undo = () => {
    if (actionStack.length === 0) return;

    const lastAction = actionStack.pop();
    setUndoStack((prev) => [...prev, lastAction]);
    redrawCanvas(actionStack[actionStack.length - 1] || null);
  };

  const redo = () => {
    if (undoStack.length === 0) return;

    const lastUndo = undoStack.pop();
    setActionStack((prev) => [...prev, lastUndo]);
    redrawCanvas(lastUndo);
  };

  const redrawCanvas = (imageData) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (imageData) {
      const img = new Image();
      img.src = imageData;
      img.onload = () => ctx.drawImage(img, 0, 0);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setActionStack([]);
    setUndoStack([]);
  };

  return (
    <div className={`whiteboard-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <h2 className="whiteboard-title">Whiteboard</h2>
      <div className="controls">
        <div>
          <button onClick={() => selectTool('brush')}>Brush</button>
          <button onClick={() => selectTool('eraser')}>Eraser</button>
          <button onClick={() => selectTool('rectangle')}>Rectangle</button>
          <button onClick={() => selectTool('circle')}>Circle</button>
          <button onClick={() => selectTool('line')}>Line</button>
          <button onClick={() => selectTool('text')}>Text</button>
          <button onClick={toggleDarkMode}>Toggle Dark Mode</button>
        </div>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        <input
          type="number"
          value={brushSize}
          min="1"
          max="50"
          onChange={(e) => setBrushSize(Number(e.target.value))}
        />
        <input
          type="number"
          value={eraserSize}
          min="1"
          max="100"
          onChange={(e) => setEraserSize(Number(e.target.value))}
          placeholder="Eraser Size"
        />
        <input
          type="number"
          value={fontSize}
          min="8"
          max="72"
          onChange={(e) => setFontSize(Number(e.target.value))}
          placeholder="Font Size"
        />
        <button onClick={undo}>Undo</button>
        <button onClick={redo}>Redo</button>
        <button onClick={clearCanvas}>Clear</button>
        <button onClick={saveCanvas}>Save</button>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="whiteboard-canvas"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
      ></canvas>
      {isTextActive && textPosition && (
        <input
          type="text"
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          onBlur={addTextToCanvas}
          onKeyPress={(e) => e.key === 'Enter' && addTextToCanvas()}
          className="text-input-overlay"
          style={{
            position: 'absolute',
            top: textPosition.y,
            left: textPosition.x,
            fontSize: `${fontSize}px`,
            color,
          }}
          autoFocus
        />
      )}
    </div>
  );
};

export default Whiteboard;
