import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FontSelector } from "@/components/FontSelector";
import { Slider } from "@/components/ui/slider";
import { Upload, Type } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

interface CustomizationToolsProps {
  onAddText?: (text: string, fontFamily: string, fontSize: number, fill: string, stroke: string, strokeWidth: number) => void;
  onAddLogo?: (logoUrl: string) => void;
}

export const CustomizationTools = ({ onAddText, onAddLogo }: CustomizationToolsProps) => {
  const [customText, setCustomText] = useState("");
  const [selectedFont, setSelectedFont] = useState("Anton");
  const [fontSize, setFontSize] = useState(60);
  const [textColor, setTextColor] = useState("#ffffff");
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const logoInputRef = useRef<HTMLInputElement>(null);

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

    const reader = new FileReader();
    reader.onload = (event) => {
      const logoUrl = event.target?.result as string;
      onAddLogo?.(logoUrl);
      toast.success("Logo added to canvas");
    };
    reader.readAsDataURL(file);
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
            onKeyPress={(e) => e.key === "Enter" && handleAddText()}
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
        onChange={setSelectedFont}
        label="Font Style"
        showPreview={true}
      />

      {/* Font Size */}
      <div>
        <Label className="mb-2 block uppercase text-xs font-bold tracking-widest text-gray-500">Font Size: {fontSize}px</Label>
        <Slider
          value={[fontSize]}
          onValueChange={(value) => setFontSize(value[0])}
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
              onChange={(e) => setTextColor(e.target.value)}
              className="w-16 h-10 p-0 rounded-none border-2 border-black cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
            <Input
              type="text"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="flex-1 rounded-none border-2 border-black focus-visible:ring-0 focus-visible:border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase font-mono text-sm uppercase"
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
              onChange={(e) => setStrokeColor(e.target.value)}
              className="w-16 h-10 p-0 rounded-none border-2 border-black cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
            <Input
              type="text"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
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
          onValueChange={(value) => setStrokeWidth(value[0])}
          min={0}
          max={10}
          step={0.5}
          className="w-full"
        />
      </div>

      {/* Logo Upload */}
      <div className="pt-2">
        <Label className="mb-2 block uppercase text-xs font-bold tracking-widest text-gray-500">Custom Logo</Label>
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          onChange={handleAddLogo}
          className="hidden"
        />
        <Button
          onClick={() => logoInputRef.current?.click()}
          variant="outline"
          className="w-full h-12 uppercase font-bold tracking-widest rounded-none border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Logo
        </Button>
      </div>
    </div>
  );
};
