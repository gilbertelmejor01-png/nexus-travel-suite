import React, { useState, useRef, useEffect } from 'react';
import Previa, { VoyageData } from './Previa';
import { DesignMenu } from './DesingnMenu';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';

interface DesignState {
  colors: {
    background: string;
    primary: string;
    secondary: string;
    text: string;
  };
  typography: {
    fontFamily: string;
    fontSize: number;
    fontWeight: string;
    lineHeight: number;
  };
  layout: {
    spacing: number;
    borderRadius: number;
    shadows: boolean;
  };
  shapes: Array<{
    id: string;
    type: 'circle' | 'rectangle' | 'diamond';
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    opacity: number;
    rotation: number;
  }>;
  images: Array<{
    id: string;
    url: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    filters: {
      sepia: number;
      grayscale: number;
      brightness: number;
      contrast: number;
    };
  }>;
}

interface PreviaEnhancedProps {
  data: VoyageData | null;
  loading: boolean;
  error: string | null;
}

export const PreviaEnhanced: React.FC<PreviaEnhancedProps> = ({ data, loading, error }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [designState, setDesignState] = useState<DesignState | null>(null);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleDesignChange = (newDesign: DesignState) => {
    setDesignState(newDesign);
    applyDesignToPrevia(newDesign);
  };

  const applyDesignToPrevia = (design: DesignState) => {
    if (!canvasRef.current) return;

    // Aplicar variables CSS personalizadas
    const root = canvasRef.current;
    root.style.setProperty('--design-primary', design.colors.primary);
    root.style.setProperty('--design-secondary', design.colors.secondary);
    root.style.setProperty('--design-background', design.colors.background);
    root.style.setProperty('--design-text', design.colors.text);
    root.style.setProperty('--design-font-family', design.typography.fontFamily);
    root.style.setProperty('--design-font-size', `${design.typography.fontSize}px`);
    root.style.setProperty('--design-font-weight', design.typography.fontWeight);
    root.style.setProperty('--design-line-height', design.typography.lineHeight.toString());
    root.style.setProperty('--design-spacing', `${design.layout.spacing}px`);
    root.style.setProperty('--design-border-radius', `${design.layout.borderRadius}px`);
  };

  const handleMouseDown = (e: React.MouseEvent, elementId: string, elementType: 'shape' | 'image') => {
    e.preventDefault();
    setDraggedElement(`${elementType}-${elementId}`);
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedElement || !designState) return;

    const [elementType, elementId] = draggedElement.split('-');
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const newX = e.clientX - canvasRect.left - dragOffset.x;
    const newY = e.clientY - canvasRect.top - dragOffset.y;

    if (elementType === 'shape') {
      const updatedShapes = designState.shapes.map(shape =>
        shape.id === elementId ? { ...shape, x: newX, y: newY } : shape
      );
      
      setDesignState({
        ...designState,
        shapes: updatedShapes
      });
    } else if (elementType === 'image') {
      const updatedImages = designState.images.map(image =>
        image.id === elementId ? { ...image, x: newX, y: newY } : image
      );
      
      setDesignState({
        ...designState,
        images: updatedImages
      });
    }
  };

  const handleMouseUp = () => {
    setDraggedElement(null);
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (draggedElement) {
        handleMouseMove(e as any);
      }
    };

    const handleGlobalMouseUp = () => {
      handleMouseUp();
    };

    if (draggedElement) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [draggedElement]);

  const renderShape = (shape: any) => {
    const shapeStyle = {
      position: 'absolute' as const,
      left: shape.x,
      top: shape.y,
      width: shape.width,
      height: shape.height,
      backgroundColor: shape.color,
      opacity: shape.opacity,
      transform: `rotate(${shape.rotation}deg)`,
      cursor: 'move',
      zIndex: 10,
      pointerEvents: 'auto' as const
    };

    const commonProps = {
      style: shapeStyle,
      onMouseDown: (e: React.MouseEvent) => handleMouseDown(e, shape.id, 'shape'),
      className: 'design-shape transition-transform hover:scale-105'
    };

    switch (shape.type) {
      case 'circle':
        return <div key={shape.id} {...commonProps} style={{...shapeStyle, borderRadius: '50%'}} />;
      case 'rectangle':
        return <div key={shape.id} {...commonProps} />;
      case 'diamond':
        return <div key={shape.id} {...commonProps} style={{...shapeStyle, transform: `rotate(${45 + shape.rotation}deg)`}} />;
      default:
        return null;
    }
  };

  const renderImage = (image: any) => {
    const imageStyle = {
      position: 'absolute' as const,
      left: image.x,
      top: image.y,
      width: image.width,
      height: image.height,
      transform: `rotate(${image.rotation}deg)`,
      cursor: 'move',
      zIndex: 10,
      filter: `sepia(${image.filters.sepia}%) grayscale(${image.filters.grayscale}%) brightness(${image.filters.brightness}%) contrast(${image.filters.contrast}%)`,
      pointerEvents: 'auto' as const
    };

    return (
      <img
        key={image.id}
        src={image.url}
        alt="Design element"
        style={imageStyle}
        onMouseDown={(e) => handleMouseDown(e, image.id, 'image')}
        className="design-image transition-transform hover:scale-105 object-cover"
        draggable={false}
      />
    );
  };

  return (
    <div className="relative flex w-full min-h-screen">
      {/* Contenedor principal de Previa con overlay de diseño */}
      <div className="flex-1 relative">
        <div 
          ref={canvasRef}
          className="relative w-full min-h-screen design-canvas"
          style={{
            fontFamily: designState?.typography.fontFamily || 'inherit',
            fontSize: designState?.typography.fontSize || 'inherit',
            fontWeight: designState?.typography.fontWeight || 'inherit',
            lineHeight: designState?.typography.lineHeight || 'inherit',
            backgroundColor: designState?.colors.background || 'transparent',
            color: designState?.colors.text || 'inherit'
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Componente Previa original */}
          <div className="design-previa-wrapper">
            <Previa data={data} loading={loading} error={error} />
          </div>

          {/* Overlay con formas y elementos de diseño */}
          <div className="absolute inset-0 pointer-events-none">
            {designState?.shapes.map(renderShape)}
            {designState?.images.map(renderImage)}
          </div>
        </div>
      </div>

      {/* Menú de diseño */}
      <DesignMenu
        isOpen={isMenuOpen}
        onToggle={() => setIsMenuOpen(!isMenuOpen)}
        onDesignChange={handleDesignChange}
      />

      {/* Botón flotante para dispositivos de escritorio */}
      <Button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="fixed bottom-6 right-6 z-50 hidden lg:flex rounded-full w-14 h-14 shadow-lg"
        size="icon"
      >
        {isMenuOpen ? (
          <ChevronRight className="h-6 w-6" />
        ) : (
          <Settings className="h-6 w-6" />
        )}
      </Button>

      {/* Estilos CSS para las variables de diseño */}
      <style>{`
        .design-canvas {
          --design-primary: #3b82f6;
          --design-secondary: #6366f1;
          --design-background: #ffffff;
          --design-text: #1f2937;
          --design-spacing: 16px;
          --design-border-radius: 8px;
        }

        .design-previa-wrapper .header-box {
          background-color: var(--design-primary) !important;
          color: white !important;
        }

        .design-previa-wrapper h1,
        .design-previa-wrapper h2,
        .design-previa-wrapper h3 {
          color: var(--design-text) !important;
          font-family: var(--design-font-family) !important;
        }

        .design-previa-wrapper .card {
          border-radius: var(--design-border-radius) !important;
          background-color: var(--design-background) !important;
        }

        .design-previa-wrapper .btn-primary {
          background-color: var(--design-primary) !important;
          border-color: var(--design-primary) !important;
        }

        .design-previa-wrapper .btn-secondary {
          background-color: var(--design-secondary) !important;
          border-color: var(--design-secondary) !important;
        }

        .design-shape:hover,
        .design-image:hover {
          box-shadow: 0 0 0 2px var(--design-primary);
        }

        .design-canvas * {
          font-family: var(--design-font-family, inherit) !important;
        }
      `}</style>
    </div>
  );
};

export default PreviaEnhanced;