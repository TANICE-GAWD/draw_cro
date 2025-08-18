import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Pen, Eraser, Undo2, Redo2, Trash2, Palette, Sparkles, CheckCircle, ChevronLeft, ChevronRight, Leaf } from 'lucide-react';
import './Whiteboard.css';

const drawingChallenges = [
  { url: 'Star.png', prompt: 'Draw a star' },
  { url: 'Apple.png', prompt: 'Draw the Apple logo' },
  { url: 'Nike.png', prompt: 'Draw the Nike logo' },
  { url: 'Cracked_Heart.png', prompt: 'Draw the Cracked Heart Emoji' },
];


const feedbackQuotes = [
    { threshold: 20, quote: "what is ts, twn?" },
    { threshold: 40, quote: "mujhse aur code nhi ho rha (-by developer)" },
    { threshold: 50, quote: "mujhe ladai nhi karni core ke group mein" },
    { threshold: 70, quote: "sometimes i still miss 'her'" },
    { threshold: 80, quote: "saiyarra tu toh badla nhi hain...." },
    { threshold: 90, quote: "i did not expect anyone to reach till this accuracy" },
];


const vibeGradients = [
  'linear-gradient(270deg, #1a1a2e, #16213e, #0f3460)', 
  'linear-gradient(270deg, #ff7e5f, #feb47b)',         
  'linear-gradient(270deg, #6a11cb, #2575fc)',         
];


const hexToRgba = (hex) => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex[1] + hex[2], 16);
        g = parseInt(hex[3] + hex[4], 16);
        b = parseInt(hex[5] + hex[6], 16);
    }
    return [r, g, b, 255];
};


const getBoundingBox = (imageData) => {
    const { data, width, height } = imageData;
    let minX = width, minY = height, maxX = 0, maxY = 0;
    let hasDrawing = false;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const alpha = data[(y * width + x) * 4 + 3]; 
            if (alpha > 0) {
                hasDrawing = true;
                minX = Math.min(x, minX);
                maxX = Math.max(x, maxX);
                minY = Math.min(y, minY);
                maxY = Math.max(y, maxY);
            }
        }
    }
    if (!hasDrawing) return null;
    return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
};

export default function App() {
  const canvasRef = useRef(null);
  const targetCanvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState('#FFFFFF');
  const [brushSize, setBrushSize] = useState(10);
  const [activeTool, setActiveTool] = useState('brush');
  const [lastPosition, setLastPosition] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [backgroundVibe, setBackgroundVibe] = useState(vibeGradients[0]);

  
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const { url: targetImageUrl, prompt: promptText } = drawingChallenges[currentChallengeIndex];
  const [similarityScore, setSimilarityScore] = useState(null);
  const [isComparing, setIsComparing] = useState(false);
  const [isGuideVisible, setIsGuideVisible] = useState(false);
  const [feedbackQuote, setFeedbackQuote] = useState(null);

  const colorPalette = ['#FFFFFF', '#FF3B30', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA', '#AF52DE'];

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (history.length > 0 && historyIndex >= 0 && history[historyIndex]) {
      const img = new Image();
      img.src = history[historyIndex];
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
    }
  }, [history, historyIndex]);

  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(canvas.toDataURL());
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const resizeCanvas = () => {
      const parent = document.querySelector('.canvas-container');
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        redrawCanvas();
      }
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    if (history.length === 0) {
        setTimeout(() => {
          if (canvas.width > 0 && canvas.height > 0) {
            const initialHistory = [canvas.toDataURL()];
            setHistory(initialHistory);
            setHistoryIndex(0);
          }
        }, 100);
    }
    
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [redrawCanvas, history.length]);
  
  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
      return { offsetX: e.touches[0].clientX - rect.left, offsetY: e.touches[0].clientY - rect.top };
    }
    return { offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
  };

  const handleMouseDown = (e) => {
    const { offsetX, offsetY } = getCanvasCoordinates(e);
    setDrawing(true);
    setLastPosition({ x: offsetX, y: offsetY });
  };

  const handleMouseMove = (e) => {
    if (!drawing) return;
    const { offsetX, offsetY } = getCanvasCoordinates(e);
    draw(offsetX, offsetY);
  };

  const handleMouseUp = () => {
    if (drawing) {
      saveHistory();
      setDrawing(false);
    }
  };
  
  const draw = (x, y) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
    ctx.beginPath();
    ctx.moveTo(lastPosition.x, lastPosition.y);
    ctx.lineTo(x, y);

    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else if (activeTool === 'glow') {
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
    } else {
      ctx.strokeStyle = color;
    }
    
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    setLastPosition({ x, y });
  };
  
  const handleUndo = () => { if (historyIndex > 0) setHistoryIndex(historyIndex - 1); };
  const handleRedo = () => { if (historyIndex < history.length - 1) setHistoryIndex(historyIndex + 1); };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const blankHistory = [canvas.toDataURL()];
    setHistory(blankHistory);
    setHistoryIndex(0);
    setIsGuideVisible(false);
    setSimilarityScore(null);
    setFeedbackQuote(null);
  };
  
  const handleCompare = () => {
    setIsGuideVisible(true);
    setIsComparing(true);
    setSimilarityScore(null);
    setFeedbackQuote(null);
    
    const userCanvas = canvasRef.current;
    const targetCanvas = targetCanvasRef.current;
    const { width, height } = userCanvas;
    
    const targetImg = new Image();
    targetImg.crossOrigin = "Anonymous";
    targetImg.src = targetImageUrl;
    targetImg.onload = () => {
      targetCanvas.width = width;
      targetCanvas.height = height;
      const targetCtx = targetCanvas.getContext('2d', { willReadFrequently: true });
      targetCtx.drawImage(targetImg, 0, 0, width, height);

      const userCtx = userCanvas.getContext('2d', { willReadFrequently: true });
      
      const userData = userCtx.getImageData(0, 0, width, height);
      const targetData = targetCtx.getImageData(0, 0, width, height);
      const userBounds = getBoundingBox(userData);
      const targetBounds = getBoundingBox(targetData);

      if (!userBounds && !targetBounds) {
          setSimilarityScore('100.00');
          setIsComparing(false);
          return;
      }
      if (!userBounds || !targetBounds) {
          setSimilarityScore('0.00');
          setFeedbackQuote(feedbackQuotes[0].quote);
          setIsComparing(false);
          return;
      }

      const NORM_SIZE = 100;
      const normUserCanvas = document.createElement('canvas');
      normUserCanvas.width = NORM_SIZE;
      normUserCanvas.height = NORM_SIZE;
      const normUserCtx = normUserCanvas.getContext('2d', { willReadFrequently: true });
      normUserCtx.drawImage(userCanvas, userBounds.x, userBounds.y, userBounds.width, userBounds.height, 0, 0, NORM_SIZE, NORM_SIZE);
      const normUserData = normUserCtx.getImageData(0, 0, NORM_SIZE, NORM_SIZE);

      const normTargetCanvas = document.createElement('canvas');
      normTargetCanvas.width = NORM_SIZE;
      normTargetCanvas.height = NORM_SIZE;
      const normTargetCtx = normTargetCanvas.getContext('2d', { willReadFrequently: true });
      normTargetCtx.drawImage(targetCanvas, targetBounds.x, targetBounds.y, targetBounds.width, targetBounds.height, 0, 0, NORM_SIZE, NORM_SIZE);
      const normTargetData = normTargetCtx.getImageData(0, 0, NORM_SIZE, NORM_SIZE);
      
      let truePositives = 0, falsePositives = 0, falseNegatives = 0;

      for (let i = 0; i < normUserData.data.length; i += 4) {
          const isUserPixelDrawn = normUserData.data[i + 3] > 128;
          const isTargetPixelDrawn = normTargetData.data[i + 3] > 128;
          if (isUserPixelDrawn && isTargetPixelDrawn) truePositives++;
          else if (isUserPixelDrawn && !isTargetPixelDrawn) falsePositives++;
          else if (!isUserPixelDrawn && isTargetPixelDrawn) falseNegatives++;
      }

      const union = truePositives + falsePositives + falseNegatives;
      let finalScore = 0;

      if (union === 0) {
          finalScore = (userBounds && targetBounds) ? 100 : 0;
      } else {
          const iou = truePositives / union;
          finalScore = iou * 100;
      }
      setSimilarityScore(finalScore.toFixed(2));

      let quoteToShow = null;
      for (const item of feedbackQuotes) {
          if (finalScore < item.threshold) {
              quoteToShow = item.quote;
              break;
          }
      }
      setFeedbackQuote(quoteToShow);
      setIsComparing(false);
    };
  };

 const handleChallengeChange = (direction) => {
    handleClear(); 
    if (direction === 'next') {
        setCurrentChallengeIndex((prevIndex) => (prevIndex + 1) % drawingChallenges.length);
    } else {
        setCurrentChallengeIndex((prevIndex) => (prevIndex - 1 + drawingChallenges.length) % drawingChallenges.length);
    }
 }

  useEffect(redrawCanvas, [historyIndex, redrawCanvas]);
  useEffect(() => { document.body.className = `cursor-${activeTool}`; }, [activeTool]);

  useEffect(() => {
    if (feedbackQuote) {
        const timer = setTimeout(() => {
            setFeedbackQuote(null);
        }, 2000);
        return () => clearTimeout(timer);
    }
  }, [feedbackQuote]);

  const ToolButton = ({ icon, toolName, label }) => (
    <button title={label} className={`tool-button ${activeTool === toolName ? 'active' : ''}`} onClick={() => setActiveTool(toolName)}>
      {icon}
    </button>
  );

  return (
    <div className="app-container" data-theme={'dark'} style={{'--bg-vibe': backgroundVibe}}>
        <div className="header-info">
            <h1>Draw-cro-twn ✌️💔🥀</h1>
        </div>

        <div className="canvas-container">
            {!isGuideVisible && <div className="drawing-prompt">{promptText}</div>}
            <img
                src={targetImageUrl}
                className={`guide-image ${isGuideVisible ? 'revealed' : ''}`}
                alt="Drawing guide"
            />
            <canvas
                ref={canvasRef}
                className="whiteboard-canvas"
                onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp} onTouchStart={handleMouseDown} onTouchMove={handleMouseMove}
                onTouchEnd={handleMouseUp}
            />
            {feedbackQuote && (
                <div className="feedback-quote-overlay">
                    <p>{feedbackQuote}</p>
                </div>
            )}
        </div>

        <canvas ref={targetCanvasRef} style={{ display: 'none' }} />

        <div className="main-toolbar">
            <div className="toolbar-group">
                <ToolButton icon={<Pen size={20} />} toolName="brush" label="Brush" />
                <ToolButton icon={<Sparkles size={20} />} toolName="glow" label="Glow Brush" />
                <ToolButton icon={<Eraser size={20} />} toolName="eraser" label="Eraser" />
            </div>
             <div className="toolbar-separator" />
            <div className="toolbar-group color-controls">
                <Palette size={20} />
                {colorPalette.map(c => ( <button key={c} onClick={() => setColor(c)} className="color-swatch" style={{ backgroundColor: c, '--swatch-border': color === c ? 'var(--text-primary)' : 'transparent' }} /> ))}
                <input type="color" value={color} onChange={e => setColor(e.target.value)} className="color-picker" title="Custom Color" />
            </div>
             <div className="toolbar-separator" />
            <div className="toolbar-group brush-controls">
                <span className="brush-size-indicator" style={{'--size': `${brushSize}px`, background: color}}></span>
                <input type="range" min="1" max="80" value={brushSize} onChange={e => setBrushSize(e.target.value)} className="size-slider" />
            </div>
            <div className="toolbar-separator" />
             <div className="toolbar-group">
                <button onClick={handleUndo} className="tool-button" title="Undo"><Undo2 size={20} /></button>
                <button onClick={handleRedo} className="tool-button" title="Redo"><Redo2 size={20} /></button>
                <button onClick={handleClear} className="tool-button" title="Clear Canvas"><Trash2 size={20} /></button>
            </div>
            <div className="toolbar-separator" />
            <div className="toolbar-group results-group">
                <button onClick={handleCompare} disabled={isComparing} className="tool-button check-button" title="Check Match">
                    <CheckCircle size={20} />
                </button>
                 {isComparing && <span className="score-display">Checking...</span>}
                 {similarityScore !== null && <span className="score-display">Match: {similarityScore}%</span>}
            </div>
            <div className="toolbar-separator" />
             <div className="toolbar-group">
                <button onClick={() => handleChallengeChange('prev')} className="tool-button" title="Previous Challenge">
                    <ChevronLeft size={20} />
                </button>
                <span className="challenge-counter">{currentChallengeIndex + 1} / {drawingChallenges.length}</span>
                <button onClick={() => handleChallengeChange('next')} className="tool-button" title="Next Challenge">
                    <ChevronRight size={20} />
                </button>
             </div>
        </div>
    </div>
  );
}