/**
 * Animation Utility Functions
 *
 * Provides helper functions for animation timing and class names.
 */

/**
 * Calculate stagger delay for list item animations based on index.
 * Each item receives an additional 50ms delay.
 * Maximum delay is capped at 500ms to prevent excessively long animations.
 *
 * @param index - The zero-based index of the item in the list
 * @param baseDelay - The base delay increment per item (default: 50ms)
 * @param maxDelay - Maximum allowed delay (default: 500ms)
 * @returns The delay in milliseconds
 */
export function getStaggerDelay(
  index: number,
  baseDelay: number = 50,
  maxDelay: number = 500
): number {
  const calculatedDelay = index * baseDelay;
  return Math.min(calculatedDelay, maxDelay);
}

/**
 * Animation type to CSS class name mapping
 */
const animationClassMap: Record<string, string> = {
  'fade-in': 'animate-fade-in',
  'slide-in': 'animate-slide-in',
  'scale-in': 'animate-scale-in',
  shake: 'animate-shake',
  shimmer: 'animate-shimmer',
  burst: 'animate-burst',
};

/**
 * Get the CSS animation class name for a given animation type.
 *
 * @param animationType - The type of animation (e.g., 'fade-in', 'slide-in')
 * @returns The corresponding CSS class name (e.g., 'animate-fade-in')
 */
export function getAnimationClass(animationType: string): string {
  return animationClassMap[animationType] || `animate-${animationType}`;
}
