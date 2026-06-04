import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, X, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import imageCompression from 'browser-image-compression';
import type { JerseyImages } from "@/pages/Index";

interface JerseyUploadProps {
  jerseyImages: JerseyImages;
  onImagesChange: (images: JerseyImages) => void;
}

const jerseyParts = [
  { key: 'front' as keyof JerseyImages, label: 'Front', description: 'Main jersey front design' },
  { key: 'back' as keyof JerseyImages, label: 'Back', description: 'Jersey back with number area' },
  { key: 'leftSleeve' as keyof JerseyImages, label: 'Left Sleeve', description: 'Left sleeve design' },
  { key: 'rightSleeve' as keyof JerseyImages, label: 'Right Sleeve', description: 'Right sleeve design' },
  { key: 'collar' as keyof JerseyImages, label: 'Collar', description: 'Collar and neckline area' },
];

export const JerseyUpload = ({ jerseyImages, onImagesChange }: JerseyUploadProps) => {
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [uploadingPart, setUploadingPart] = useState<string | null>(null);

  const handleFileUpload = async (part: keyof JerseyImages, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload only image files (JPG, PNG, etc.)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error("Image size must be less than 10MB");
      return;
    }

    setUploadingPart(part);

    try {
      // Compress the image before storing to prevent memory leaks and UI lag on canvas
      const options = {
        maxSizeMB: 2,          // Max file size
        maxWidthOrHeight: 2048, // Good balance for 4K downscaling
        useWebWorker: true,
      };
      
      const compressedFile = await imageCompression(file, options);

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        onImagesChange({
          ...jerseyImages,
          [part]: imageUrl
        });
        toast.success(`${jerseyParts.find(p => p.key === part)?.label} uploaded successfully`);
        setUploadingPart(null);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      toast.error("Failed to upload image");
      setUploadingPart(null);
    }
  };

  const removeImage = (part: keyof JerseyImages) => {
    const newImages = { ...jerseyImages };
    delete newImages[part];
    onImagesChange(newImages);
    toast.success(`${jerseyParts.find(p => p.key === part)?.label} removed`);
  };

  const triggerFileInput = (part: string) => {
    fileInputRefs.current[part]?.click();
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <ImageIcon className="w-6 h-6 text-accent" />
        <div>
          <h2 className="text-xl font-semibold">Jersey Images</h2>
          <p className="text-muted-foreground text-sm">Upload individual jersey components</p>
        </div>
      </div>

      <div className="space-y-4">
        {jerseyParts.map((part) => (
          <div key={part.key} className="border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-medium">{part.label}</h3>
                <p className="text-sm text-muted-foreground">{part.description}</p>
              </div>
              {jerseyImages[part.key] && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeImage(part.key)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {jerseyImages[part.key] ? (
              <div className="flex items-center gap-4">
                <img
                  src={jerseyImages[part.key]}
                  alt={part.label}
                  className="w-20 h-20 object-cover rounded-lg border"
                />
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Uploaded</span>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => triggerFileInput(part.key)}
                disabled={uploadingPart === part.key}
                className="w-full h-20"
              >
                <div className="text-center">
                  <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm">
                    {uploadingPart === part.key ? 'Uploading...' : `Upload ${part.label}`}
                  </p>
                </div>
              </Button>
            )}

            <input
              type="file"
              ref={(el) => fileInputRefs.current[part.key] = el}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(part.key, file);
              }}
              accept="image/*"
              className="hidden"
            />
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <h4 className="font-medium mb-2">Upload Guidelines</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Supported formats: JPG, PNG, WEBP</li>
          <li>• Maximum file size: 10MB per image</li>
          <li>• Recommended dimensions: 1000x1000px or higher</li>
          <li>• Use high-resolution images for best quality</li>
        </ul>
      </div>
    </Card>
  );
};