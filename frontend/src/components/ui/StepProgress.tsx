import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepProgressProps {
  steps: string[];
  currentStep: number;
  className?: string;
  showStepText?: boolean;
}

export function StepProgress({ steps, currentStep, className, showStepText = true }: StepProgressProps) {
  const progressPercent = Math.round(((currentStep - 1) / steps.length) * 100);
  
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          
          return (
            <div key={index} className="flex flex-col items-center flex-1 relative">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 font-semibold text-sm z-10 bg-background"
                style={{
                  borderColor: isCompleted ? 'hsl(var(--primary))' : isCurrent ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                  color: isCompleted || isCurrent ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                  backgroundColor: isCompleted ? 'hsl(var(--primary))' : isCurrent ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--background))',
                }}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  stepNumber
                )}
              </div>
              <span 
                className={cn(
                  "mt-2 text-xs font-medium whitespace-nowrap",
                  isCompleted || isCurrent ? "text-primary" : "text-muted-foreground"
                )}
              >
                {step}
              </span>
              
              {index < steps.length - 1 && (
                <div 
                  className="absolute top-5 left-1/2 w-full h-0.5 -translate-y-1/2"
                  style={{
                    backgroundColor: isCompleted ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      
      {showStepText && (
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Step {currentStep} of {steps.length}</span> — {steps[currentStep - 1]}
            <span className="mx-2">•</span>
            <span>{progressPercent}% complete</span>
          </p>
        </div>
      )}
    </div>
  );
}