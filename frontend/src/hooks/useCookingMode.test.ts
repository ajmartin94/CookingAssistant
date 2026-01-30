import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCookingMode } from './useCookingMode';

const mockInstructions = [
  { stepNumber: 1, instruction: 'Preheat oven to 350F' },
  { stepNumber: 2, instruction: 'Mix dry ingredients' },
  { stepNumber: 3, instruction: 'Bake for 25 minutes', durationMinutes: 25 },
];

describe('useCookingMode', () => {
  it('should initialize at step 0', () => {
    const { result } = renderHook(() => useCookingMode(mockInstructions));
    expect(result.current.currentStep).toBe(0);
  });

  it('should advance step with next()', () => {
    const { result } = renderHook(() => useCookingMode(mockInstructions));
    act(() => result.current.next());
    expect(result.current.currentStep).toBe(1);
  });

  it('should decrement step with prev()', () => {
    const { result } = renderHook(() => useCookingMode(mockInstructions));
    act(() => result.current.next());
    act(() => result.current.prev());
    expect(result.current.currentStep).toBe(0);
  });

  it('should not go below step 0 with prev()', () => {
    const { result } = renderHook(() => useCookingMode(mockInstructions));
    act(() => result.current.prev());
    expect(result.current.currentStep).toBe(0);
  });

  it('should not go past last step with next()', () => {
    const { result } = renderHook(() => useCookingMode(mockInstructions));
    act(() => result.current.next());
    act(() => result.current.next());
    act(() => result.current.next()); // beyond last
    expect(result.current.currentStep).toBe(2);
  });

  it('should reset to step 0 with reset()', () => {
    const { result } = renderHook(() => useCookingMode(mockInstructions));
    act(() => result.current.next());
    act(() => result.current.next());
    act(() => result.current.reset());
    expect(result.current.currentStep).toBe(0);
  });

  it('should return isFirst true at step 0', () => {
    const { result } = renderHook(() => useCookingMode(mockInstructions));
    expect(result.current.isFirst).toBe(true);
    expect(result.current.isLast).toBe(false);
  });

  it('should jump to specific step with goTo()', () => {
    const { result } = renderHook(() => useCookingMode(mockInstructions));
    act(() => result.current.goTo(2));
    expect(result.current.currentStep).toBe(2);
  });

  it('should clamp goTo() to valid range', () => {
    const { result } = renderHook(() => useCookingMode(mockInstructions));
    act(() => result.current.goTo(-1));
    expect(result.current.currentStep).toBe(0);

    act(() => result.current.goTo(999));
    expect(result.current.currentStep).toBe(2);
  });

  it('should return isLast true at last step', () => {
    const { result } = renderHook(() => useCookingMode(mockInstructions));
    act(() => result.current.next());
    act(() => result.current.next());
    expect(result.current.isLast).toBe(true);
    expect(result.current.isFirst).toBe(false);
  });
});
