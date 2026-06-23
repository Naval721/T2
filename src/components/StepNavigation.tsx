import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface Step {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

interface StepNavigationProps {
  steps: Step[];
  currentStep: number;
  onStepChange: (step: number) => void;
  canGoToStep: (step: number) => boolean;
}

export const StepNavigation = ({ steps, currentStep, onStepChange, canGoToStep }: StepNavigationProps) => {
  const handleStepClick = (stepId: number) => {
    if (canGoToStep(stepId)) {
      onStepChange(stepId);
    }
  };

  return (
    <div className="flex items-center justify-center gap-4 mb-8">
      {steps.map((step, index) => {
        const isClickable = canGoToStep(step.id);

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <button
                onClick={() => handleStepClick(step.id)}
                disabled={!isClickable}
                className={`
                w-12 h-12 border-2 flex items-center justify-center font-bold
                transition-all duration-200 text-sm
                ${step.id === currentStep
                    ? "bg-black text-white border-black scale-110 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
                    : step.completed
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-400 border-gray-300"
                  }
                ${isClickable ? "cursor-pointer hover:scale-105" : "cursor-not-allowed opacity-40"}
              `}
                aria-label={`Step ${step.id}: ${step.title}`}
                title={isClickable ? `Go to ${step.title}` : `Complete previous steps to unlock`}
              >
                {step.completed ? <Check className="w-5 h-5" /> : step.id}
              </button>
              <div className="mt-2 text-center max-w-[120px]">
                <p className={`text-xs font-bold uppercase tracking-wider ${step.id === currentStep ? "text-black" : "text-gray-400"}`}>
                  {step.title}
                </p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-16 h-0.5 mx-2 ${step.completed ? "bg-black" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};
