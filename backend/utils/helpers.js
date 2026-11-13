export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Only accept plain strings from query params (blocks ?q[$ne]=x style operator injection).
export const queryString = (v) => (typeof v === 'string' ? v.trim().slice(0, 100) : '');

export const searchRegex = (q) => new RegExp(escapeRegex(q), 'i');

export const idEquals = (a, b) => String(a?._id ?? a) === String(b?._id ?? b);
