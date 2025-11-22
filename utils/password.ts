
export type PasswordStrength = 0 | 1 | 2 | 3 | 4;

export const calculatePasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  if (!password) return 0;

  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  return score as PasswordStrength;
};

export const getStrengthColor = (score: PasswordStrength): string => {
  switch (score) {
    case 0: return 'bg-gray-200';
    case 1: return 'bg-red-500';
    case 2: return 'bg-orange-500';
    case 3: return 'bg-yellow-500';
    case 4: return 'bg-green-500';
    default: return 'bg-gray-200';
  }
};

export const getStrengthLabel = (score: PasswordStrength): string => {
  switch (score) {
    case 0: return 'Too short';
    case 1: return 'Weak';
    case 2: return 'Fair';
    case 3: return 'Good';
    case 4: return 'Strong';
    default: return '';
  }
};
