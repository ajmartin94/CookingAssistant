/**
 * Animation utility functions
 */

const STAGGER_DELAY_MS = 50;
const MAX_STAGGER_DELAY_MS = 500;

export function getStaggerDelay(index: number): number {
  return Math.min(index * STAGGER_DELAY_MS, MAX_STAGGER_DELAY_MS);
}

const ANIMATION_CLASS_MAP: Record<string, string> = {
  'fade-in': 'animate-fade-in',
  'slide-in': 'animate-slide-in',
  'scale-in': 'animate-scale-in',
  shake: 'animate-shake',
  shimmer: 'animate-shimmer',
  burst: 'animate-burst',
};

export function getAnimationClass(type: string): string {
  return ANIMATION_CLASS_MAP[type] || '';
}
