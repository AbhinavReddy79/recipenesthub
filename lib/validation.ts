export type FieldErrors<T extends string> = Partial<Record<T, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(value: string): string | undefined {
  if (!value.trim()) return "Enter your email address.";
  if (!EMAIL_PATTERN.test(value.trim())) return "Enter a valid email, like name@example.com.";
  return undefined;
}

export function validatePassword(value: string, { strict = false } = {}): string | undefined {
  if (!value) return "Enter your password.";
  if (!strict) return undefined;
  if (value.length < 8) return "Use at least 8 characters.";
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return "Include at least one letter and one number.";
  return undefined;
}

export function validateRequired(value: string, label: string, min = 1): string | undefined {
  if (!value.trim()) return `${label} is required.`;
  if (value.trim().length < min) return `${label} must be at least ${min} characters.`;
  return undefined;
}

/** 0–4 score used by the password strength meter. */
export function passwordStrength(value: string): number {
  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= 12) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score++;
  return score;
}

export function hasErrors<T extends string>(errors: FieldErrors<T>): boolean {
  return Object.values(errors).some(Boolean);
}
