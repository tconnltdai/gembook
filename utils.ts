
export const generateColorFromSeed = (seed: string): string => {
  const hash = seed.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 60%)`;
};

export const uuid = () => Math.random().toString(36).substring(2, 9);
