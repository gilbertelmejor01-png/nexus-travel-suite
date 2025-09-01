import React, { useState, useEffect } from 'react';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Palette,
  Type,
  Layout,
  Image as ImageIcon,
  Move,
  RotateCw,
  Download,
  Upload,
  Undo,
  Redo,
  Eye,
  ChevronLeft,
  ChevronRight,
  Settings,
  Shapes,
  Filter,
  Layers
} from 'lucide-react';

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

interface DesignMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onDesignChange: (design: DesignState) => void;
}

const googleFonts = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Source Sans Pro',
  'Oswald', 'Raleway', 'PT Sans', 'Ubuntu', 'Playfair Display', 'Merriweather'
];

const initialDesignState: DesignState = {
  colors: {
    background: '#ffffff',
    primary: '#3b82f6',
    secondary: '#6366f1',
    text: '#1f2937'
  },
  typography: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 1.5
  },
  layout: {
    spacing: 16,
    borderRadius: 8,
    shadows: true
  },
  shapes: [],
  images: []
};

export const DesignMenu: React.FC<DesignMenuProps> = ({ isOpen, onToggle, onDesignChange }) => {
  const { currentUser } = useAuth();
  const [designState, setDesignState] = useState<DesignState>(initialDesignState);
  const [history, setHistory] = useState<DesignState[]>([initialDesignState]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('colors');
  const [draggedShape, setDraggedShape] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Cargar diseño desde Firebase
  useEffect(() => {
    if (!currentUser) return;

    const userDocRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        if (userData.designState) {
          setDesignState(userData.designState);
          onDesignChange(userData.designState);
        }
      }
    });

    return () => unsubscribe();
  }, [currentUser, onDesignChange]);

  // Guardar diseño en Firebase
  const saveDesign = async (newDesignState: DesignState) => {
    if (!currentUser) return;

    setSaving(true);
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        designState: newDesignState,
        updatedAt: new Date()
      });
      toast.success('Diseño guardado automáticamente');
    } catch (error) {
      console.error('Error saving design:', error);
      toast.error('Error al guardar el diseño');
    } finally {
      setSaving(false);
    }
  };

  // Actualizar estado de diseño con historial
  const updateDesignState = (newState: DesignState) => {
    setDesignState(newState);
    onDesignChange(newState);
    
    // Actualizar historial
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    // Guardar automáticamente
    saveDesign(newState);
  };

  // Deshacer cambios
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const previousState = history[newIndex];
      setDesignState(previousState);
      onDesignChange(previousState);
      saveDesign(previousState);
    }
  };

  // Rehacer cambios
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const nextState = history[newIndex];
      setDesignState(nextState);
      onDesignChange(nextState);
      saveDesign(nextState);
    }
  };

  // Agregar nueva forma
  const addShape = (type: 'circle' | 'rectangle' | 'diamond') => {
    const newShape = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: Math.random() * 300,
      y: Math.random() * 300,
      width: 100,
      height: 100,
      color: designState.colors.primary,
      opacity: 0.7,
      rotation: 0
    };

    updateDesignState({
      ...designState,
      shapes: [...designState.shapes, newShape]
    });
  };

  // Agregar imagen desde URL
  const addImageFromUrl = (url: string) => {
    const newImage = {
      id: Math.random().toString(36).substr(2, 9),
      url,
      x: Math.random() * 300,
      y: Math.random() * 300,
      width: 200,
      height: 150,
      rotation: 0,
      filters: {
        sepia: 0,
        grayscale: 0,
        brightness: 100,
        contrast: 100
      }
    };

    updateDesignState({
      ...designState,
      images: [...designState.images, newImage]
    });
  };

  // Cargar fuente de Google Fonts
  const loadGoogleFont = (fontName: string) => {
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(' ', '+')}:wght@300;400;500;600;700&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  };

  return (
    <>
      {/* Overlay para cerrar el menú en móviles */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Botón flotante para abrir/cerrar */}
      <Button
        onClick={onToggle}
        className="fixed top-4 right-4 z-50 lg:hidden"
        size="sm"
        variant="secondary"
      >
        <Settings className="h-4 w-4" />
      </Button>

      {/* Panel lateral */}
      <div className={`
        fixed top-0 right-0 h-full w-80 bg-white border-l shadow-lg z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        lg:relative lg:translate-x-0 lg:w-96
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Editor de Diseño</h2>
          <div className="flex gap-2">
            <Button
              onClick={undo}
              disabled={historyIndex <= 0}
              size="sm"
              variant="outline"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              size="sm"
              variant="outline"
            >
              <Redo className="h-4 w-4" />
            </Button>
            <Button
              onClick={onToggle}
              size="sm"
              variant="ghost"
              className="lg:hidden"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Estado de guardado */}
        {saving && (
          <div className="px-4 py-2 bg-blue-50 text-blue-700 text-sm">
            💾 Guardando cambios...
          </div>
        )}

        {/* Contenido scrolleable */}
        <div className="h-full overflow-y-auto pb-20">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="p-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="colors">
                <Palette className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="typography">
                <Type className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="shapes">
                <Shapes className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="images">
                <ImageIcon className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>

            {/* Pestaña de Colores */}
            <TabsContent value="colors" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Paleta de Colores</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Color Primario</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={designState.colors.primary}
                        onChange={(e) => updateDesignState({
                          ...designState,
                          colors: { ...designState.colors, primary: e.target.value }
                        })}
                        className="w-12 h-10"
                      />
                      <Input
                        value={designState.colors.primary}
                        onChange={(e) => updateDesignState({
                          ...designState,
                          colors: { ...designState.colors, primary: e.target.value }
                        })}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Color Secundario</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={designState.colors.secondary}
                        onChange={(e) => updateDesignState({
                          ...designState,
                          colors: { ...designState.colors, secondary: e.target.value }
                        })}
                        className="w-12 h-10"
                      />
                      <Input
                        value={designState.colors.secondary}
                        onChange={(e) => updateDesignState({
                          ...designState,
                          colors: { ...designState.colors, secondary: e.target.value }
                        })}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Color de Fondo</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={designState.colors.background}
                        onChange={(e) => updateDesignState({
                          ...designState,
                          colors: { ...designState.colors, background: e.target.value }
                        })}
                        className="w-12 h-10"
                      />
                      <Input
                        value={designState.colors.background}
                        onChange={(e) => updateDesignState({
                          ...designState,
                          colors: { ...designState.colors, background: e.target.value }
                        })}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Color de Texto</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={designState.colors.text}
                        onChange={(e) => updateDesignState({
                          ...designState,
                          colors: { ...designState.colors, text: e.target.value }
                        })}
                        className="w-12 h-10"
                      />
                      <Input
                        value={designState.colors.text}
                        onChange={(e) => updateDesignState({
                          ...designState,
                          colors: { ...designState.colors, text: e.target.value }
                        })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pestaña de Tipografía */}
            <TabsContent value="typography" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Tipografía</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Fuente</Label>
                    <Select
                      value={designState.typography.fontFamily}
                      onValueChange={(value) => {
                        loadGoogleFont(value);
                        updateDesignState({
                          ...designState,
                          typography: { ...designState.typography, fontFamily: value }
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {googleFonts.map((font) => (
                          <SelectItem key={font} value={font}>
                            {font}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Tamaño de Fuente: {designState.typography.fontSize}px</Label>
                    <Slider
                      value={[designState.typography.fontSize]}
                      onValueChange={([value]) => updateDesignState({
                        ...designState,
                        typography: { ...designState.typography, fontSize: value }
                      })}
                      min={12}
                      max={72}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Peso de Fuente</Label>
                    <Select
                      value={designState.typography.fontWeight}
                      onValueChange={(value) => updateDesignState({
                        ...designState,
                        typography: { ...designState.typography, fontWeight: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="300">Light</SelectItem>
                        <SelectItem value="400">Regular</SelectItem>
                        <SelectItem value="500">Medium</SelectItem>
                        <SelectItem value="600">Semi Bold</SelectItem>
                        <SelectItem value="700">Bold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Altura de Línea: {designState.typography.lineHeight}</Label>
                    <Slider
                      value={[designState.typography.lineHeight]}
                      onValueChange={([value]) => updateDesignState({
                        ...designState,
                        typography: { ...designState.typography, lineHeight: value }
                      })}
                      min={1}
                      max={3}
                      step={0.1}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pestaña de Formas */}
            <TabsContent value="shapes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Formas Geométricas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      onClick={() => addShape('circle')}
                      variant="outline"
                      className="h-16 flex flex-col items-center justify-center"
                    >
                      <div className="w-6 h-6 bg-primary rounded-full mb-1" />
                      <span className="text-xs">Círculo</span>
                    </Button>
                    <Button
                      onClick={() => addShape('rectangle')}
                      variant="outline"
                      className="h-16 flex flex-col items-center justify-center"
                    >
                      <div className="w-6 h-4 bg-primary mb-1" />
                      <span className="text-xs">Rectángulo</span>
                    </Button>
                    <Button
                      onClick={() => addShape('diamond')}
                      variant="outline"
                      className="h-16 flex flex-col items-center justify-center"
                    >
                      <div className="w-6 h-6 bg-primary transform rotate-45 mb-1" />
                      <span className="text-xs">Rombo</span>
                    </Button>
                  </div>

                  {designState.shapes.length > 0 && (
                    <div>
                      <Label>Formas Agregadas</Label>
                      <div className="space-y-2 mt-2">
                        {designState.shapes.map((shape, index) => (
                          <div key={shape.id} className="p-2 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm capitalize">{shape.type}</span>
                              <Button
                                onClick={() => updateDesignState({
                                  ...designState,
                                  shapes: designState.shapes.filter(s => s.id !== shape.id)
                                })}
                                size="sm"
                                variant="destructive"
                              >
                                Eliminar
                              </Button>
                            </div>
                            <div className="space-y-2">
                              <Label>Opacidad: {Math.round(shape.opacity * 100)}%</Label>
                              <Slider
                                value={[shape.opacity]}
                                onValueChange={([value]) => {
                                  const updatedShapes = [...designState.shapes];
                                  updatedShapes[index] = { ...shape, opacity: value };
                                  updateDesignState({
                                    ...designState,
                                    shapes: updatedShapes
                                  });
                                }}
                                min={0}
                                max={1}
                                step={0.1}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pestaña de Imágenes */}
            <TabsContent value="images" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Gestión de Imágenes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Agregar imagen desde URL</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="https://ejemplo.com/imagen.jpg"
                        id="imageUrl"
                      />
                      <Button
                        onClick={() => {
                          const input = document.getElementById('imageUrl') as HTMLInputElement;
                          if (input?.value) {
                            addImageFromUrl(input.value);
                            input.value = '';
                          }
                        }}
                        size="sm"
                      >
                        Agregar
                      </Button>
                    </div>
                  </div>

                  {designState.images.length > 0 && (
                    <div>
                      <Label>Imágenes Agregadas</Label>
                      <div className="space-y-2 mt-2">
                        {designState.images.map((image, index) => (
                          <div key={image.id} className="p-2 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <img
                                src={image.url}
                                alt="Miniatura"
                                className="w-12 h-12 object-cover rounded"
                              />
                              <Button
                                onClick={() => updateDesignState({
                                  ...designState,
                                  images: designState.images.filter(img => img.id !== image.id)
                                })}
                                size="sm"
                                variant="destructive"
                              >
                                Eliminar
                              </Button>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <Label>Filtro Sepia: {image.filters.sepia}%</Label>
                                <Slider
                                  value={[image.filters.sepia]}
                                  onValueChange={([value]) => {
                                    const updatedImages = [...designState.images];
                                    updatedImages[index] = {
                                      ...image,
                                      filters: { ...image.filters, sepia: value }
                                    };
                                    updateDesignState({
                                      ...designState,
                                      images: updatedImages
                                    });
                                  }}
                                  min={0}
                                  max={100}
                                  step={1}
                                />
                              </div>
                              <div>
                                <Label>Escala de Grises: {image.filters.grayscale}%</Label>
                                <Slider
                                  value={[image.filters.grayscale]}
                                  onValueChange={([value]) => {
                                    const updatedImages = [...designState.images];
                                    updatedImages[index] = {
                                      ...image,
                                      filters: { ...image.filters, grayscale: value }
                                    };
                                    updateDesignState({
                                      ...designState,
                                      images: updatedImages
                                    });
                                  }}
                                  min={0}
                                  max={100}
                                  step={1}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};