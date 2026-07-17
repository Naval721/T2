import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { StepNavigation } from "@/components/StepNavigation";
import { Step1Upload } from "@/pages/steps/Step1Upload";
import { Step2Canvas } from "@/pages/steps/Step2Canvas";
import { Step3Customize } from "@/pages/steps/Step3Customize";
import { Step4Preview } from "@/pages/steps/Step4Preview";
import { Step5Export } from "@/pages/steps/Step5Export";
import { DesignCanvas } from "@/components/DesignCanvas";
import { HomePage } from "@/pages/HomePage";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-jersey-designer.jpg"; // file exists at src/assets/hero-jersey-designer.jpg
import { Canvas as FabricCanvas } from "fabric";
import { toast } from "sonner";
import { Save, AlertCircle, RotateCcw, ImageIcon, Users, Paintbrush, Package, Download, Loader2 } from "lucide-react";
import {
  saveState,
  loadState,
  clearState,
  hasSavedSession,
  formatLastSaveTime,
  isWarmReturn,
} from "@/lib/statePersistence";
import type { CanvasViewType } from "@/lib/statePersistence";

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
  const { user, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [jerseyImages, setJerseyImages] = useState<JerseyImages>({});
  const [playerData, setPlayerData] = useState<PlayerData[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerData | null>(null);
  const [canvasRef, setCanvasRef] = useState<FabricCanvas | null>(null);
  const [defaultFont, setDefaultFont] = useState<string>('Anton'); // Default font for all players
  const [defaultColor, setDefaultColor] = useState<string>('#000000'); // Default text colour for all players
  const [defaultStrokeColor, setDefaultStrokeColor] = useState<string>('#FFFFFF');
  const [defaultStrokeWidth, setDefaultStrokeWidth] = useState<number>(0);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<string>('Never');
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [fallbackTarget, setFallbackTarget] = useState<HTMLElement | null>(null);
  const [canvasView, setCanvasView] = useState<CanvasViewType>('front');
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [canvasCuttingOutline, setCanvasCuttingOutline] = useState(false);
  const selectedPlayerIndexRef = useRef(0);
  // Refs for unmount save (always current)
  const canvasViewRef = useRef<CanvasViewType>('front');
  const canvasZoomRef = useRef(1);
  const canvasCuttingOutlineRef = useRef(false);

  // An isolated, stable DOM container that React never destroys
  const persistentCanvasContainer = useMemo(() => {
    const el = document.createElement('div');
    el.id = 'truly-persistent-canvas-host';
    el.className = 'w-full h-full relative z-10';
    return el;
  }, []);

  // Manually move the stable container to the correct place in the DOM
  useEffect(() => {
    if (portalTarget) {
      portalTarget.appendChild(persistentCanvasContainer);
      // Force a full Fabric.js render/rebuild after DOM reparenting to guarantee graphics memory integrity
      setTimeout(() => {
        window.dispatchEvent(new Event('jerseyDesigner:forceReloadView'));
      }, 100);
    } else if (fallbackTarget) {
      fallbackTarget.appendChild(persistentCanvasContainer);
    }
  }, [portalTarget, fallbackTarget, persistentCanvasContainer]);

  // Stable canvas ref setter — must NOT change on every render or it destroys the canvas
  const stableSetCanvasRef = useCallback((canvas: FabricCanvas | null) => {
    setCanvasRef(canvas);
  }, []);

  // Re-check for portal target when step changes with resilient polling
  useEffect(() => {
    // Always clear the old target first so the canvas detaches cleanly
    setPortalTarget(null);

    if (currentStep >= 2 && currentStep <= 5) {
      let attempts = 0;
      let cancelled = false;
      const findTarget = () => {
        if (cancelled) return;
        const target = document.getElementById('canvas-portal-target');
        if (target) {
          setPortalTarget(target);
        } else if (attempts < 20) {
          attempts++;
          setTimeout(findTarget, 50); // poll up to 1000ms
        }
      };
      // Brief delay to allow the new step's DOM to mount
      setTimeout(findTarget, 30);
      return () => { cancelled = true; };
    }
  }, [currentStep]);

  // Check for saved session on mount
  useEffect(() => {
    const checkSession = async () => {
      const hasSession = await hasSavedSession();
      if (hasSession) {
        if (isWarmReturn()) {
          // Warm return — auto-restore silently without dialog
          await handleRestoreSession();
        } else {
          // Cold start — show the restore dialog
          setShowRestoreDialog(true);
        }
      }
      setLastSaveTime(await formatLastSaveTime());
    };
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Protect route — OnboardingPage lives at '/'
  // Wait until auth is done loading before deciding to redirect
  useEffect(() => {
    if (!authLoading && user === null) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  // Keep selected player index ref in sync with latest state
  useEffect(() => {
    if (selectedPlayer && playerData.length > 0) {
      const idx = playerData.findIndex(p => p.playerName === selectedPlayer.playerName && p.jerseyNumber === selectedPlayer.jerseyNumber);
      if (idx !== -1) {
        selectedPlayerIndexRef.current = idx;
      }
    } else {
      selectedPlayerIndexRef.current = 0;
    }
  }, [selectedPlayer, playerData]);

  // Auto-save state when it changes
  useEffect(() => {
    if (autoSaveEnabled && (Object.keys(jerseyImages).length > 0 || playerData.length > 0)) {
      const selectedIndex = selectedPlayerIndexRef.current;

      // Show saving indicator immediately when debounce starts
      setIsSaving(true);
      const timerId = setTimeout(() => {
        saveState(
          jerseyImages,
          playerData,
          currentStep,
          selectedIndex,
          defaultFont,
          defaultColor,
          defaultStrokeColor,
          defaultStrokeWidth,
          canvasViewRef.current,
          canvasZoomRef.current,
          canvasCuttingOutlineRef.current
        ).then(async (saved) => {
          if (saved) {
            setLastSaveTime(await formatLastSaveTime());
          }
        }).finally(() => {
          setIsSaving(false);
        });
      }, 1000); // Debounce by 1 second

      return () => {
        clearTimeout(timerId);
        setIsSaving(false);
      };
    }
  }, [jerseyImages, playerData, currentStep, selectedPlayer, defaultFont, defaultColor, defaultStrokeColor, defaultStrokeWidth, canvasView, canvasZoom, canvasCuttingOutline, autoSaveEnabled]);

  // Ref that always holds the latest saveable state for the unmount handler
  const latestStateRef = useRef({
    jerseyImages, playerData, currentStep,
    defaultFont, defaultColor, defaultStrokeColor, defaultStrokeWidth,
  });
  useEffect(() => {
    latestStateRef.current = {
      jerseyImages, playerData, currentStep,
      defaultFont, defaultColor, defaultStrokeColor, defaultStrokeWidth,
    };
  });

  // Save immediately on unmount (no debounce) so nothing is lost
  useEffect(() => {
    return () => {
      const s = latestStateRef.current;
      if (Object.keys(s.jerseyImages).length > 0 || s.playerData.length > 0) {
        saveState(
          s.jerseyImages,
          s.playerData,
          s.currentStep,
          selectedPlayerIndexRef.current,
          s.defaultFont,
          s.defaultColor,
          s.defaultStrokeColor,
          s.defaultStrokeWidth,
          canvasViewRef.current,
          canvasZoomRef.current,
          canvasCuttingOutlineRef.current
        );
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      title: "Preview Output",
      description: "Review all players",
      completed: currentStep > 4,
    },
    {
      id: 5,
      title: "Export & Download",
      description: "Final production files",
      completed: currentStep > 5,
    },
  ];

  const canGoToStep = (step: number): boolean => {
    if (step === 1) return true;
    if (step >= 2 && step <= 5) return hasRequiredData;
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

  const handleConfirmClear = async () => {
    // Clear all state
    setCurrentStep(1);
    setJerseyImages({});
    setPlayerData([]);
    setSelectedPlayer(null);
    setCanvasRef(null);
    await clearState();
    setLastSaveTime('Never');
    navigate("/");
    toast.success("Project cleared. Ready to start fresh!");
  };

  const handleRestoreSession = async () => {
    const savedState = await loadState();
    if (savedState) {
      if (savedState.jerseyImages) setJerseyImages(savedState.jerseyImages);
      if (savedState.defaultFont) setDefaultFont(savedState.defaultFont);
      if (savedState.defaultColor) setDefaultColor(savedState.defaultColor);
      if (savedState.defaultStrokeColor) setDefaultStrokeColor(savedState.defaultStrokeColor);
      if (savedState.defaultStrokeWidth !== undefined) setDefaultStrokeWidth(savedState.defaultStrokeWidth);
      if (savedState.currentView) {
        setCanvasView(savedState.currentView);
        canvasViewRef.current = savedState.currentView;
      }
      if (savedState.zoom) {
        setCanvasZoom(savedState.zoom);
        canvasZoomRef.current = savedState.zoom;
      }
      if (savedState.cuttingOutline !== undefined) {
        setCanvasCuttingOutline(savedState.cuttingOutline);
        canvasCuttingOutlineRef.current = savedState.cuttingOutline;
      }
      if (savedState.playerData) {
        setPlayerData(savedState.playerData);
        if (
          savedState.selectedPlayerIndex !== undefined &&
          savedState.playerData[savedState.selectedPlayerIndex]
        ) {
          setSelectedPlayer(savedState.playerData[savedState.selectedPlayerIndex]);
        } else if (savedState.playerData.length > 0) {
          setSelectedPlayer(savedState.playerData[0]);
        }
      }

      const isDataComplete = savedState.jerseyImages && Object.keys(savedState.jerseyImages).length > 0 &&
        savedState.playerData && savedState.playerData.length > 0;

      if (savedState.currentStep && isDataComplete) {
        setCurrentStep(savedState.currentStep);
      } else {
        setCurrentStep(1);
      }
      setLastSaveTime(await formatLastSaveTime());
      toast.success("Previous session restored!");
    }
  };

  const handleStartFresh = async () => {
    await clearState();
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
              defaultFont={defaultFont}
              onFontChange={setDefaultFont}
              defaultColor={defaultColor}
              onColorChange={setDefaultColor}
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
              onFontChange={setDefaultFont}
              defaultColor={defaultColor}
              onColorChange={setDefaultColor}
              defaultStrokeColor={defaultStrokeColor}
              onStrokeColorChange={setDefaultStrokeColor}
              defaultStrokeWidth={defaultStrokeWidth}
              onStrokeWidthChange={setDefaultStrokeWidth}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          );
        case 4:
          return (
            <Step4Preview
              playerData={playerData}
              jerseyImages={jerseyImages}
              onNext={handleNext}
              onPrev={handlePrev}
              defaultFont={defaultFont}
              defaultColor={defaultColor}
              defaultStrokeColor={defaultStrokeColor}
              defaultStrokeWidth={defaultStrokeWidth}
            />
          );
        case 5:
          return (
            <Step5Export
              canvasRef={canvasRef}
              selectedPlayer={selectedPlayer || (playerData.length > 0 ? playerData[0] : null)}
              playerData={playerData}
              jerseyImages={jerseyImages}
              onPrev={handlePrev}
              onComplete={handleComplete}
              onPlayerSelect={setSelectedPlayer}
              defaultFont={defaultFont}
              defaultColor={defaultColor}
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
          <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-mono">
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                  <span className="text-gray-500 uppercase tracking-wider text-xs">Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 text-xs uppercase tracking-wider">Saved {lastSaveTime}</span>
                </>
              )}
            </div>
            <button
              onClick={() => setShowClearDialog(true)}
              className="text-xs text-gray-400 hover:text-red-600 font-mono uppercase tracking-wider transition-colors"
              title="Clear all data and start fresh"
            >
              Clear data
            </button>
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

            {/* 
              PERSISTENT CANVAS HOST & PORTAL
              - We use a fallback target div that is always rendered but hidden.
              - We render DesignCanvas into a stable, in-memory container (persistentCanvasContainer).
              - Since the portal target NEVER changes identity, React never unmounts the canvas.
              - A useEffect manually moves persistentCanvasContainer between fallbackTarget and the active step's portalTarget.
            */}
            <div
              ref={setFallbackTarget}
              id="persistent-canvas-fallback"
              className={currentStep >= 4 ? "fixed -top-[9999px] -left-[9999px] opacity-0 pointer-events-none" : "hidden"}
            />

            {currentStep >= 2 && createPortal(
              <DesignCanvas
                jerseyImages={jerseyImages}
                playerData={playerData}
                selectedPlayer={selectedPlayer}
                onCanvasReady={stableSetCanvasRef}
                defaultFont={defaultFont}
                defaultColor={defaultColor}
                defaultStrokeColor={defaultStrokeColor}
                defaultStrokeWidth={defaultStrokeWidth}
                showTools={currentStep === 3}
                initialView={canvasView}
                initialZoom={canvasZoom}
                initialCuttingOutline={canvasCuttingOutline}
                onViewChange={(v) => { setCanvasView(v); canvasViewRef.current = v; }}
                onZoomChange={(z) => { setCanvasZoom(z); canvasZoomRef.current = z; }}
                onCuttingOutlineChange={(c) => { setCanvasCuttingOutline(c); canvasCuttingOutlineRef.current = c; }}
              />,
              persistentCanvasContainer
            )}

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
                    alt="GxDrip Interface"
                    className="w-full h-64 object-cover grayscale"
                  />
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="text-center text-white border-4 border-white p-6 bg-black/40 backdrop-blur-sm shadow-2xl">
                      <h2 className="text-4xl font-black uppercase tracking-widest mb-2">GxDrip</h2>
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
                      <h4 className="font-bold text-lg mb-2 uppercase tracking-wide">Step 4: Preview Output</h4>
                      <p className="text-gray-500 font-mono text-sm leading-relaxed">
                        Verify all players in a unified grid view before export
                      </p>
                    </div>
                    <div className="p-6 bg-gray-50 border-2 border-gray-200 hover:border-black transition-colors text-left group">
                      <div className="w-12 h-12 bg-black text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Download className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-lg mb-2 uppercase tracking-wide">Step 5: Export & Share</h4>
                      <p className="text-gray-500 font-mono text-sm leading-relaxed">
                        Download individual designs or export all jerseys as a ZIP file for production
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => setCurrentStep(1)}
                    size="lg"
                    className="mt-10 bg-black text-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 active:translate-y-0 active:shadow-none transition-all uppercase tracking-widest font-bold h-14 px-8"
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
        onCancel={handleStartFresh}
        onConfirm={handleRestoreSession}
        title="Restore Previous Session?"
        description={`You have unsaved work from ${lastSaveTime}. Would you like to continue where you left off?`}
        confirmText="Restore Session"
        cancelText="Start Fresh"
        destructive={false}
      />
      {currentStep === 1 && <Footer />}
    </div>
  );
};

export default Index;