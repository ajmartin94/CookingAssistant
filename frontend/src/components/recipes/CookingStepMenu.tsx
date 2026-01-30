import type { Instruction } from '../../types';

interface CookingStepMenuProps {
  instructions: Instruction[];
  currentStep: number;
  onStepSelect: (index: number) => void;
  onClose: () => void;
}

export function CookingStepMenu({
  instructions,
  currentStep,
  onStepSelect,
  onClose,
}: CookingStepMenuProps) {
  return (
    <div className="flex flex-col gap-2 p-4">
      <ul aria-label="Steps" className="flex flex-col gap-2">
        {instructions.map((_inst, index) => (
          <li key={index}>
            <button
              onClick={() => onStepSelect(index)}
              className={`w-full text-left p-3 rounded-lg ${index === currentStep ? 'bg-accent-subtle active' : 'bg-card'} text-text-primary`}
            >
              Step {index + 1}
            </button>
          </li>
        ))}
      </ul>
      <div className="flex justify-end mt-4">
        <button onClick={onClose} className="px-3 py-1 text-text-secondary hover:text-text-primary">
          Close
        </button>
      </div>
    </div>
  );
}
