export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || '');

export const passwordError = (v) => {
  if (!v) return 'Password is required';
  if (v.length < 8) return 'Use at least 8 characters';
  if (!/[A-Za-z]/.test(v)) return 'Include at least one letter';
  if (!/\d/.test(v)) return 'Include at least one number';
  return '';
};
