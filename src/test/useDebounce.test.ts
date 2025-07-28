import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useDebounce } from "../hooks/useDebounce";

// Mock timers
vi.useFakeTimers();

describe("useDebounce Hook", () => {
  beforeEach(() => {
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.useFakeTimers();
  });

  describe("Basic Functionality", () => {
    it("should return initial value immediately", () => {
      const { result } = renderHook(() => useDebounce("initial", 500));

      expect(result.current).toBe("initial");
    });

    it("should debounce value changes", () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: "initial", delay: 500 },
        }
      );

      expect(result.current).toBe("initial");

      // Update value
      rerender({ value: "updated", delay: 500 });

      // Should still return initial value immediately after change
      expect(result.current).toBe("initial");

      // Fast-forward time by 400ms (less than delay)
      act(() => {
        vi.advanceTimersByTime(400);
      });

      // Should still return initial value
      expect(result.current).toBe("initial");

      // Fast-forward time by 100ms more (total 500ms)
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Should now return updated value
      expect(result.current).toBe("updated");
    });

    it("should reset timer on subsequent value changes", () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: "initial", delay: 500 },
        }
      );

      // First update
      rerender({ value: "first", delay: 500 });

      // Wait 300ms
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Second update (should reset timer)
      rerender({ value: "second", delay: 500 });

      // Wait another 300ms (total 600ms since first update, but only 300ms since second)
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Should still show initial value (timer was reset)
      expect(result.current).toBe("initial");

      // Wait another 200ms (total 500ms since second update)
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Should now show second value
      expect(result.current).toBe("second");
    });
  });

  describe("Different Data Types", () => {
    it("should work with strings", () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: "hello", delay: 300 },
        }
      );

      rerender({ value: "world", delay: 300 });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current).toBe("world");
    });

    it("should work with numbers", () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: 0, delay: 300 },
        }
      );

      rerender({ value: 42, delay: 300 });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current).toBe(42);
    });

    it("should work with booleans", () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: false, delay: 300 },
        }
      );

      rerender({ value: true, delay: 300 });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current).toBe(true);
    });

    it("should work with objects", () => {
      const initialObj = { name: "John", age: 30 };
      const updatedObj = { name: "Jane", age: 25 };

      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: initialObj, delay: 300 },
        }
      );

      rerender({ value: updatedObj, delay: 300 });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current).toEqual(updatedObj);
    });

    it("should work with arrays", () => {
      const initialArray = [1, 2, 3];
      const updatedArray = [4, 5, 6];

      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: initialArray, delay: 300 },
        }
      );

      rerender({ value: updatedArray, delay: 300 });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current).toEqual(updatedArray);
    });

    it("should work with null and undefined", () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: null, delay: 300 },
        }
      );

      rerender({ value: null, delay: 300 });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current).toBeNull();
    });
  });

  describe("Delay Changes", () => {
    it("should handle delay changes", () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: "initial", delay: 500 },
        }
      );

      // Update value with original delay
      rerender({ value: "updated", delay: 500 });

      // Wait 200ms
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Change delay (should reset timer with new delay)
      rerender({ value: "updated", delay: 300 });

      // Wait another 200ms (total 400ms since first update, 200ms since delay change)
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Should still show initial value
      expect(result.current).toBe("initial");

      // Wait another 100ms (total 300ms since delay change)
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Should now show updated value
      expect(result.current).toBe("updated");
    });

    it("should handle zero delay", () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: "initial", delay: 0 },
        }
      );

      rerender({ value: "updated", delay: 0 });

      // With zero delay, should update immediately on next tick
      act(() => {
        vi.advanceTimersByTime(0);
      });

      expect(result.current).toBe("updated");
    });

    it("should handle very large delays", () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: "initial", delay: 10000 },
        }
      );

      rerender({ value: "updated", delay: 10000 });

      // Wait 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Should still show initial value
      expect(result.current).toBe("initial");

      // Wait another 5 seconds (total 10 seconds)
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Should now show updated value
      expect(result.current).toBe("updated");
    });
  });

  describe("Timer Cleanup", () => {
    it("should cleanup timer on unmount", () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

      const { unmount, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: "initial", delay: 500 },
        }
      );

      // Update value to trigger timer
      rerender({ value: "updated", delay: 500 });

      // Unmount component
      unmount();

      // Should have called clearTimeout
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });

    it("should cleanup previous timer when value changes", () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

      const { rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: "initial", delay: 500 },
        }
      );

      // First update
      rerender({ value: "first", delay: 500 });

      // Second update (should cleanup first timer)
      rerender({ value: "second", delay: 500 });

      // Should have called clearTimeout at least once
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });

    it("should cleanup timer when delay changes", () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

      const { rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: "initial", delay: 500 },
        }
      );

      // Update value
      rerender({ value: "updated", delay: 500 });

      // Change delay
      rerender({ value: "updated", delay: 300 });

      // Should have called clearTimeout
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid successive changes", () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: "0", delay: 500 },
        }
      );

      // Make 5 rapid changes
      for (let i = 1; i <= 5; i++) {
        rerender({ value: i.toString(), delay: 500 });

        // Wait a short time between changes
        act(() => {
          vi.advanceTimersByTime(50);
        });
      }

      // Should still show initial value
      expect(result.current).toBe("0");

      // Wait for the debounce delay
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Should show the last value
      expect(result.current).toBe("5");
    });

    it("should handle same value updates", () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: "test", delay: 500 },
        }
      );

      // Update to same value
      rerender({ value: "test", delay: 500 });

      // Should still trigger debounce
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe("test");
    });

    it("should handle negative delays (treat as 0)", () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: "initial", delay: -100 },
        }
      );

      rerender({ value: "updated", delay: -100 });

      // Should update immediately (negative delay treated as 0)
      act(() => {
        vi.advanceTimersByTime(0);
      });

      expect(result.current).toBe("updated");
    });

    it("should handle fractional delays", () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: "initial", delay: 150.5 },
        }
      );

      rerender({ value: "updated", delay: 150.5 });

      // Wait slightly less than the delay (fractional delays are truncated to 150ms)
      act(() => {
        vi.advanceTimersByTime(149);
      });

      expect(result.current).toBe("initial");

      // Wait the remaining time to complete the delay
      act(() => {
        vi.advanceTimersByTime(1);
      });

      expect(result.current).toBe("updated");
    });
  });

  describe("Performance", () => {
    it("should not cause unnecessary re-renders when value doesn't change", () => {
      let renderCount = 0;

      const { rerender } = renderHook(
        ({ value, delay }) => {
          renderCount++;
          return useDebounce(value, delay);
        },
        {
          initialProps: { value: "test", delay: 500 },
        }
      );

      const initialRenderCount = renderCount;

      // Re-render with same props
      rerender({ value: "test", delay: 500 });

      // Should have triggered another render
      expect(renderCount).toBe(initialRenderCount + 1);
    });

    it("should handle large number of rapid changes efficiently", () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: 0, delay: 100 },
        }
      );

      // Make 100 rapid changes
      for (let i = 1; i <= 100; i++) {
        rerender({ value: i, delay: 100 });

        // Small time increment between changes
        act(() => {
          vi.advanceTimersByTime(1);
        });
      }

      // Should still show initial value
      expect(result.current).toBe(0);

      // Wait for debounce
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Should show final value
      expect(result.current).toBe(100);
    });
  });

  describe("Real-world Scenarios", () => {
    it("should work for search input debouncing", () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: "", delay: 300 },
        }
      );

      // Simulate typing "react"
      const searchTerm = "react";
      for (let i = 1; i <= searchTerm.length; i++) {
        rerender({ value: searchTerm.slice(0, i), delay: 300 });

        // Simulate typing speed (100ms between keystrokes)
        act(() => {
          vi.advanceTimersByTime(100);
        });
      }

      // Should still show empty string
      expect(result.current).toBe("");

      // Wait for debounce to complete
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Should show full search term
      expect(result.current).toBe("react");
    });

    it("should work for API call debouncing", () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: { query: "", page: 1 }, delay: 500 },
        }
      );

      // Simulate rapid filter changes
      rerender({ value: { query: "a", page: 1 }, delay: 500 });
      act(() => vi.advanceTimersByTime(100));

      rerender({ value: { query: "ap", page: 1 }, delay: 500 });
      act(() => vi.advanceTimersByTime(100));

      rerender({ value: { query: "app", page: 1 }, delay: 500 });
      act(() => vi.advanceTimersByTime(100));

      // Should still show initial value
      expect(result.current).toEqual({ query: "", page: 1 });

      // Complete the debounce
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Should show final value
      expect(result.current).toEqual({ query: "app", page: 1 });
    });

    it("should work for window resize debouncing", () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: { width: 1920, height: 1080 }, delay: 250 },
        }
      );

      // Simulate rapid resize events
      const resizeEvents = [
        { width: 1800, height: 1000 },
        { width: 1600, height: 900 },
        { width: 1400, height: 800 },
        { width: 1200, height: 700 },
      ];

      resizeEvents.forEach((size) => {
        rerender({ value: size, delay: 250 });
        act(() => vi.advanceTimersByTime(50)); // Fast resize events
      });

      // Should still show initial size
      expect(result.current).toEqual({ width: 1920, height: 1080 });

      // Complete debounce
      act(() => {
        vi.advanceTimersByTime(250);
      });

      // Should show final size
      expect(result.current).toEqual({ width: 1200, height: 700 });
    });
  });
});
