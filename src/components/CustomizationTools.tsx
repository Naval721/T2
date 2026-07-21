import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FontSelector } from "@/components/FontSelector";
import { Slider } from "@/components/ui/slider";
import { Upload, Type } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Canvas as FabricCanvas, IText as FabricText } from "fabric";

interface CustomizationToolsProps {
  onAddText?: (text: string, fontFamily: string, fontSize: number, fill: string, stroke: string, strokeWidth: number) => void;
  onAddLogo?: (logoUrl: string, logoType: 'custom' | 'front1' | 'front2' | 'front3') => void;
  canvasRef?: FabricCanvas | null;
}

export const CustomizationTools = ({ onAddText, onAddLogo, canvasRef }: CustomizationToolsProps) => {
  const [customText, setCustomText] = useState("");
  const [selectedFont, setSelectedFont] = useState("Anton");
  const [fontSize, setFontSize] = useState(60);
  const [textColor, setTextColor] = useState("#ffffff");
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [activeLogoType, setActiveLogoType] = useState<'custom' | 'front1' | 'front2' | 'front3'>('custom');
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!canvasRef) return;

    const handleSelection = () => {
      const activeObject = canvasRef.getActiveObject();
      if (activeObject && activeObject instanceof FabricText) {
        const textObj = activeObject as FabricText;
        if (textObj.fontSize) {
          const effectiveSize = Math.round(textObj.fontSize * (textObj.scaleY || 1));
          setFontSize(effectiveSize);
        }
        if (textObj.fontFamily) setSelectedFont(textObj.fontFamily);
        if (textObj.fill) setTextColor(textObj.fill as string);
        if (textObj.stroke) setStrokeColor(textObj.stroke as string);
        if (textObj.strokeWidth !== undefined) setStrokeWidth(textObj.strokeWidth);
      }
    };

    canvasRef.on('selection:created', handleSelection);
    canvasRef.on('selection:updated', handleSelection);
    
    return () => {
      canvasRef.off('selection:created', handleSelection);
      canvasRef.off('selection:updated', handleSelection);
    };
  }, [canvasRef]);

  const updateActiveText = (key: string, value: string | number) => {
    if (!canvasRef) return;
    const activeObject = canvasRef.getActiveObject();
    if (activeObject && activeObject instanceof FabricText) {
      if (key === 'fontSize') {
        activeObject.set({ fontSize: value as number, scaleX: 1, scaleY: 1 });
      } else {
        activeObject.set(key as keyof FabricText, value as never);
      }
      canvasRef.requestRenderAll();
      canvasRef.fire('object:modified', { target: activeObject });
    }
  };

  const handleAddText = () => {
    if (!customText.trim()) {
      toast.error("Please enter some text");
      return;
    }
    onAddText?.(customText, selectedFont, fontSize, textColor, strokeColor, strokeWidth);
    setCustomText("");
    toast.success("Text added to canvas");
  };

  const handleAddLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image is too large (max 10 MB). Please resize it first.");
      if (logoInputRef.current) logoInputRef.current.value = '';
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX_DIM = 1500;
      let { width, height } = img;
      
      if (width > MAX_DIM || height > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/png');
        onAddLogo?.(dataUrl, activeLogoType);
        toast.success("Logo added to canvas");
      } else {
        toast.error("Failed to process image");
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      toast.error("Invalid image file");
    };
    
    img.src = objectUrl;

    // Reset so the same file can be re-uploaded
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Text Input */}
      <div>
        <Label className="mb-2 block uppercase text-xs font-bold tracking-widest text-gray-500">Custom Text</Label>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter text..."
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddText()}
            className="rounded-none border-2 border-black focus-visible:ring-0 focus-visible:border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          />
          <Button onClick={handleAddText} size="icon" className="rounded-none border-2 border-black bg-black text-white hover:bg-gray-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
            <Type className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Font Selector */}
      <FontSelector
        value={selectedFont}
        onChange={(val) => {
          setSelectedFont(val);
          updateActiveText('fontFamily', val);
        }}
        label="Font Style"
        showPreview={true}
      />

      {/* Font Size */}
      <div>
        <Label className="mb-2 block uppercase text-xs font-bold tracking-widest text-gray-500">Font Size: {fontSize}px</Label>
        <Slider
          value={[fontSize]}
          onValueChange={(value) => {
            setFontSize(value[0]);
            updateActiveText('fontSize', value[0]);
          }}
          min={20}
          max={200}
          step={5}
          className="w-full"
        />
      </div>

      {/* Text Color */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="mb-2 block uppercase text-xs font-bold tracking-widest text-gray-500">Text Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={textColor}
              onChange={(e) => {
                setTextColor(e.target.value);
                updateActiveText('fill', e.target.value);
              }}
              className="w-16 h-10 p-0 rounded-none border-2 border-black cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
            <Input
              type="text"
              value={textColor}
              onChange={(e) => {
                setTextColor(e.target.value);
                updateActiveText('fill', e.target.value);
              }}
              className="flex-1 rounded-none border-2 border-black focus-visible:ring-0 focus-visible:border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-mono text-sm uppercase"
              placeholder="#ffffff"
            />
          </div>
        </div>

        {/* Stroke Color */}
        <div>
          <Label className="mb-2 block uppercase text-xs font-bold tracking-widest text-gray-500">Stroke Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={strokeColor}
              onChange={(e) => {
                setStrokeColor(e.target.value);
                updateActiveText('stroke', e.target.value);
                // Ensure strokeWidth is > 0 if color is set
                if (strokeWidth === 0) {
                  setStrokeWidth(1);
                  updateActiveText('strokeWidth', 1);
                }
              }}
              className="w-16 h-10 p-0 rounded-none border-2 border-black cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
            <Input
              type="text"
              value={strokeColor}
              onChange={(e) => {
                setStrokeColor(e.target.value);
                updateActiveText('stroke', e.target.value);
              }}
              className="flex-1 rounded-none border-2 border-black focus-visible:ring-0 focus-visible:border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase font-mono text-sm"
              placeholder="#000000"
            />
          </div>
        </div>
      </div>

      {/* Stroke Width */}
      <div>
        <Label className="mb-2 block uppercase text-xs font-bold tracking-widest text-gray-500">Stroke Width: {strokeWidth}px</Label>
        <Slider
          value={[strokeWidth]}
          onValueChange={(value) => {
            setStrokeWidth(value[0]);
            updateActiveText('strokeWidth', value[0]);
          }}
          min={0}
          max={10}
          step={0.5}
          className="w-full"
        />
      </div>

      {/* Logo Upload */}
      <div className="pt-2 space-y-2">
        <Label className="mb-2 block uppercase text-xs font-bold tracking-widest text-gray-500">Logos</Label>
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          onChange={handleAddLogo}
          className="hidden"
        />
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => { setActiveLogoType('front1'); logoInputRef.current?.click(); }}
            variant="outline"
            className="w-full h-10 uppercase text-xs font-bold tracking-widest rounded-none border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
          >
            <Upload className="w-3 h-3 mr-1" />
            Front Logo 1
          </Button>
          <Button
            onClick={() => { setActiveLogoType('front2'); logoInputRef.current?.click(); }}
            variant="outline"
            className="w-full h-10 uppercase text-xs font-bold tracking-widest rounded-none border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
          >
            <Upload className="w-3 h-3 mr-1" />
            Front Logo 2
          </Button>
          <Button
            onClick={() => { setActiveLogoType('front3'); logoInputRef.current?.click(); }}
            variant="outline"
            className="w-full h-10 uppercase text-xs font-bold tracking-widest rounded-none border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
          >
            <Upload className="w-3 h-3 mr-1" />
            Front Logo 3
          </Button>
          <Button
            onClick={() => { setActiveLogoType('custom'); logoInputRef.current?.click(); }}
            variant="outline"
            className="w-full h-10 uppercase text-xs font-bold tracking-widest rounded-none border-2 border-black bg-black text-white hover:bg-gray-800 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
          >
            <Upload className="w-3 h-3 mr-1" />
            Custom Logo
          </Button>
        </div>
      </div>
    </div>
  );
};
