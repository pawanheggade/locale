
import React from 'react';
import { calculatePasswordStrength, getStrengthColor, getStrengthLabel } from '../utils/password';

interface PasswordStrengthMeterProps {
  password: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  if (!password) return null;

  const score = calculatePasswordStrength(password);
  const color = getStrengthColor(score);
  const label = getStrengthLabel(score);

  return (
    <div 
      className="mt-2 animate-fade-in"
      role="progressbar"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={4}
      aria-valuetext={`Password strength: ${label}`}
      aria-label="Password strength indicator"
    >
      <div className="flex gap-1.5 h-1.5 mb-1.5">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-full flex-1 rounded-full transition-all duration-300 ${
              score >= level ? color : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium text-right transition-colors duration-300 ${
          score === 0 ? 'text-gray-400' :
          score === 1 ? 'text-red-600' :
          score === 2 ? 'text-orange-600' :
          score === 3 ? 'text-yellow-600' :
          'text-green-600'
      }`}>
        {label}
      </p>
    </div>
  );
};
