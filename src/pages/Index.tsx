import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { StepNavigation } from "@/components/StepNavigation";
import { Step1Upload } from "@/pages/steps/Step1Upload";
import { Step2Canvas } from "@/pages/steps/Step2Canvas";
import { Step3Customize } from "@/pages/steps/Step3Customize";
import { Step4Export } from "@/pages/steps/Step4Export";
import { HomePage } from "@/pages/HomePage";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import heroImage from "@/assets/hero-jersey-designer.jpg";
import { Canvas as FabricCanvas } from "fabric";
import { toast } from "sonner";
import { Save, AlertCircle, RotateCcw, ImageIcon, Users, Paintbrush, Package } from "lucide-react";
import {
  saveState,
  loadState,
  clearState,
  hasSavedSession,
  formatLastSaveTime,
} from "@/lib/statePersistence";

export interface JerseyImages {
  front?: string;
  back?: string;
  leftSleeve?: string;
  rightSleeve?: string;
  collar?: string;
}

export interface PlayerData {
  playerName: string;
  jerseyNumber: string;
  size: string;
  position: string;
  teamName: string;
  customTag: string;
}

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [jerseyImages, setJerseyImages] = useState<JerseyImages>({});
  const [playerData, setPlayerData] = useState<PlayerData[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerData | null>(null);
  const [canvasRef, setCanvasRef] = useState<FabricCanvas | null>(null);
  const [defaultFont, setDefaultFont] = useState<string>('Anton'); // Default font for all players
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<string>('Never');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Check for saved session on mount
  useEffect(() => {
    if (hasSavedSession()) {
      setShowRestoreDialog(true);
    }
    setLastSaveTime(formatLastSaveTime());
  }, []);

  // Protect route
  useEffect(() => {
    if (user === null) {
      navigate('/onboarding');
    }
  }, [user, navigate]);

  // Auto-save state when it changes
  useEffect(() => {
    if (autoSaveEnabled && (Object.keys(jerseyImages).length > 0 || playerData.length > 0)) {
      const selectedIndex = selectedPlayer
        ? playerData.findIndex(p => p === selectedPlayer)
        : 0;

      const saved = saveState(jerseyImages, playerData, currentStep, selectedIndex);
      if (saved) {
        setLastSaveTime(formatLastSaveTime());
      }
    }
  }, [jerseyImages, playerData, currentStep, selectedPlayer, autoSaveEnabled]);

  // Sync selectedPlayer when playerData changes
  useEffect(() => {
    if (playerData.length > 0 && !selectedPlayer) {
      setSelectedPlayer(playerData[0]);
    }
  }, [playerData, selectedPlayer]);

  const hasRequiredData = Object.keys(jerseyImages).length > 0 && playerData.length > 0;

  const steps = [
    {
      id: 1,
      title: "Upload Assets",
      description: "Jersey images & player data",
      completed: hasRequiredData,
    },
    {
      id: 2,
      title: "Preview Canvas",
      description: "Review imported data",
      completed: currentStep > 2,
    },
    {
      id: 3,
      title: "Customize Design",
      description: "Add logos & text",
      completed: currentStep > 3,
    },
    {
      id: 4,
      title: "Export & Download",
      description: "Final production files",
      completed: currentStep > 4,
    },
  ];

  const canGoToStep = (step: number): boolean => {
    if (step === 1) return true;
    if (step === 2) return hasRequiredData;
    if (step === 3) return hasRequiredData;
    if (step === 4) return hasRequiredData;
    return false;
  };

  const handleStepChange = (step: number) => {
    if (!canGoToStep(step)) {
      toast.error("Please complete previous steps first");
      return;
    }
    setCurrentStep(step);
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      const nextStep = currentStep + 1;
      if (canGoToStep(nextStep)) {
        setCurrentStep(nextStep);
      } else {
        toast.error("Please complete the current step first");
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setShowClearDialog(true);
  };

  const handleConfirmClear = () => {
    // Clear all state
    setCurrentStep(1);
    navigate("/");
    setJerseyImages({});
    setPlayerData([]);
    setSelectedPlayer(null);
    setCanvasRef(null);
    clearState();
    setLastSaveTime('Never');
    toast.success("Project cleared. Ready to start fresh!");
  };

  const handleRestoreSession = () => {
    const savedState = loadState();
    if (savedState) {
      if (savedState.jerseyImages) setJerseyImages(savedState.jerseyImages);
      if (savedState.playerData) {
        setPlayerData(savedState.playerData);
        if (
          savedState.selectedPlayerIndex !== undefined &&
          savedState.playerData[savedState.selectedPlayerIndex]
        ) {
          setSelectedPlayer(savedState.playerData[savedState.selectedPlayerIndex]);
        }
      }
      if (savedState.currentStep) setCurrentStep(savedState.currentStep);
      setLastSaveTime(formatLastSaveTime());
      toast.success("Previous session restored!");
    }
  };

  const handleStartFresh = () => {
    clearState();
    setLastSaveTime('Never');
    toast.info("Starting fresh project");
  };

  const handleStartDesigning = () => {
    setCurrentStep(1);
  };

  const handleImagesChange = (images: JerseyImages) => {
    setJerseyImages(images);
    if (Object.keys(images).length > 0 && playerData.length === 0) {
      toast.info("Great! Now upload your player data to continue");
    }
  };

  const handleDataChange = (data: PlayerData[]) => {
    setPlayerData(data);
    if (data.length > 0 && !selectedPlayer) {
      setSelectedPlayer(data[0]);
    }
    if (data.length > 0 && Object.keys(jerseyImages).length === 0) {
      toast.info("Great! Now upload your jersey images to continue");
    }
  };

  const renderCurrentStep = () => {
    try {
      switch (currentStep) {
        case 1:
          return (
            <Step1Upload
              jerseyImages={jerseyImages}
              playerData={playerData}
              onImagesChange={handleImagesChange}
              onDataChange={handleDataChange}
              onNext={handleNext}
            />
          );
        case 2:
          return (
            <Step2Canvas
              jerseyImages={jerseyImages}
              playerData={playerData}
              selectedPlayer={selectedPlayer}
              onPlayerSelect={setSelectedPlayer}
              onCanvasReady={setCanvasRef}
              defaultFont={defaultFont}
              onFontChange={setDefaultFont}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          );
        case 3:
          return (
            <Step3Customize
              jerseyImages={jerseyImages}
              playerData={playerData}
              selectedPlayer={selectedPlayer}
              onPlayerSelect={setSelectedPlayer}
              canvasRef={canvasRef}
              onCanvasReady={setCanvasRef}
              defaultFont={defaultFont}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          );
        case 4:
          return (
            <Step4Export
              canvasRef={canvasRef}
              selectedPlayer={selectedPlayer || (playerData.length > 0 ? playerData[0] : null)}
              playerData={playerData}
              onPrev={handlePrev}
              onComplete={handleComplete}
            />
          );
        default:
          return null;
      }
    } catch (error) {
      console.error("Error rendering step:", error);
      toast.error("Something went wrong. Please try again.");
      return (
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Oops! Something went wrong</h3>
          <p className="text-muted-foreground mb-4">
            An error occurred while loading this step.
          </p>
          <Button onClick={() => setCurrentStep(1)} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Return to Step 1
          </Button>
        </Card>
      );
    }
  };



  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto p-6">
        {/* Auto-save Indicator */}
        {hasRequiredData && (
          <div className="flex items-center justify-between mb-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Save className="w-4 h-4" />
              <span>Last saved: {lastSaveTime}</span>
              <Badge variant="outline" className="ml-2">Auto-save enabled</Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowClearDialog(true)}
              className="text-destructive hover:text-destructive"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear All Data
            </Button>
          </div>
        )}

        {hasRequiredData ? (
          <>
            <StepNavigation
              currentStep={currentStep}
              steps={steps}
              onStepChange={handleStepChange}
              canGoToStep={canGoToStep}
            />
            {renderCurrentStep()}
          </>
        ) : (
          <>
            {currentStep === 1 && renderCurrentStep()}
            {currentStep !== 1 && (
              <Card className="overflow-hidden border-2 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="relative border-b-2 border-black">
                  <div className="absolute inset-0 bg-black/60 mix-blend-multiply flex items-center justify-center z-10" />
                  <img
                    src={heroImage}
                    alt="GxStudio Interface"
                    className="w-full h-64 object-cover grayscale"
                  />
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="text-center text-white border-4 border-white p-6 bg-black/40 backdrop-blur-sm shadow-2xl">
                      <h2 className="text-4xl font-black uppercase tracking-widest mb-2">GxStudio</h2>
                      <p className="text-white/90 text-lg uppercase font-mono tracking-wider">
                        Professional Customization
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-10 text-center bg-white">
                  <p className="text-gray-600 mb-10 text-lg font-medium max-w-2xl mx-auto border-l-4 border-black pl-4 text-left">
                    Upload your jersey images and player data to start customizing professional
                    sports jerseys with our advanced design tools.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-gray-50 border-2 border-gray-200 hover:border-black transition-colors text-left group">
                      <div className="w-12 h-12 bg-black text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-lg mb-2 uppercase tracking-wide">Step 1: Upload Jersey Images</h4>
                      <p className="text-gray-500 font-mono text-sm leading-relaxed">
                        Add front, back, sleeves, and collar images in high resolution for the best results
                      </p>
                    </div>
                    <div className="p-6 bg-gray-50 border-2 border-gray-200 hover:border-black transition-colors text-left group">
                      <div className="w-12 h-12 bg-black text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Users className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-lg mb-2 uppercase tracking-wide">Step 2: Import Player Data</h4>
                      <p className="text-gray-500 font-mono text-sm leading-relaxed">
                        Upload Excel file with player information including names, numbers, and sizes
                      </p>
                    </div>
                    <div className="p-6 bg-gray-50 border-2 border-gray-200 hover:border-black transition-colors text-left group">
                      <div className="w-12 h-12 bg-black text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Paintbrush className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-lg mb-2 uppercase tracking-wide">Step 3: Design & Customize</h4>
                      <p className="text-gray-500 font-mono text-sm leading-relaxed">
                        Add logos, adjust text, and personalize each jersey with our intuitive tools
                      </p>
                    </div>
                    <div className="p-6 bg-gray-50 border-2 border-gray-200 hover:border-black transition-colors text-left group">
                      <div className="w-12 h-12 bg-black text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Package className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-lg mb-2 uppercase tracking-wide">Step 4: Export & Share</h4>
                      <p className="text-gray-500 font-mono text-sm leading-relaxed">
                        Download individual designs or export all jerseys as a ZIP file for production
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => setCurrentStep(1)}
                    size="lg"
                    className="mt-10 bg-black text-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all uppercase tracking-widest font-bold h-14 px-8"
                  >
                    Go to Upload Step
                  </Button>
                </div>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Clear Data Confirmation Dialog */}
      <ConfirmationDialog
        open={showClearDialog}
        onOpenChange={setShowClearDialog}
        onConfirm={handleConfirmClear}
        title="Clear All Data?"
        description="This will delete all your jersey images, player data, and customizations. This action cannot be undone."
        confirmText="Clear Everything"
        cancelText="Keep Working"
        destructive={true}
      />
      {/* Restore Session Dialog */}
      <ConfirmationDialog
        open={showRestoreDialog}
        onOpenChange={setShowRestoreDialog}
        onConfirm={handleRestoreSession}
        title="Restore Previous Session?"
        description={`You have unsaved work from ${formatLastSaveTime()}. Would you like to continue where you left off?`}
        confirmText="Restore Session"
        cancelText="Start Fresh"
        destructive={false}
      />
    </div>
  );
};

export default Index;