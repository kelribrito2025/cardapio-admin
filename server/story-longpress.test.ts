import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Story Long Press to Pause (igual Instagram)", () => {
  const viewerPath = path.resolve(__dirname, "../client/src/components/StoryViewer.tsx");
  const content = fs.readFileSync(viewerPath, "utf-8");

  it("should define LONG_PRESS_THRESHOLD constant", () => {
    expect(content).toContain("LONG_PRESS_THRESHOLD");
    // Should be around 200ms
    expect(content).toMatch(/LONG_PRESS_THRESHOLD\s*=\s*200/);
  });

  it("should have pressStartTimeRef for tracking press duration", () => {
    expect(content).toContain("pressStartTimeRef");
    expect(content).toContain("useRef<number>(0)");
  });

  it("should have isLongPressRef to distinguish long press from tap", () => {
    expect(content).toContain("isLongPressRef");
  });

  it("should have handlePressStart that records start time and pauses", () => {
    expect(content).toContain("handlePressStart");
    expect(content).toContain("pressStartTimeRef.current = Date.now()");
    expect(content).toContain("setPaused(true)");
  });

  it("should have handlePressEnd that checks press duration", () => {
    expect(content).toContain("handlePressEnd");
    expect(content).toContain("pressDuration");
    expect(content).toContain("LONG_PRESS_THRESHOLD");
    expect(content).toContain("setPaused(false)");
  });

  it("should not navigate on long press release (>= threshold)", () => {
    // When pressDuration >= LONG_PRESS_THRESHOLD, should return early without navigating
    const handlePressEndStart = content.indexOf("handlePressEnd");
    const handlePressEndSection = content.substring(handlePressEndStart, handlePressEndStart + 500);
    expect(handlePressEndSection).toContain(">= LONG_PRESS_THRESHOLD");
    expect(handlePressEndSection).toContain("return");
  });

  it("should navigate on quick tap (< threshold) based on tap position", () => {
    const handlePressEndStart = content.indexOf("handlePressEnd");
    const handlePressEndSection = content.substring(handlePressEndStart, handlePressEndStart + 800);
    expect(handlePressEndSection).toContain("halfWidth");
    expect(handlePressEndSection).toContain("goPrev()");
    expect(handlePressEndSection).toContain("goNext()");
  });

  it("should use onMouseDown/onMouseUp for desktop press events", () => {
    expect(content).toContain("onMouseDown={handlePressStart}");
    expect(content).toContain("onMouseUp={handlePressEnd}");
  });

  it("should use onTouchStart/onTouchEnd for mobile press events", () => {
    expect(content).toContain("onTouchStart={handlePressStart}");
    expect(content).toContain("onTouchEnd={handlePressEnd}");
  });

  it("should prevent default onClick to avoid double navigation", () => {
    expect(content).toContain("handleClick");
    expect(content).toContain("e.preventDefault()");
    expect(content).toContain("e.stopPropagation()");
  });

  it("should handle mouse leave and touch cancel to resume", () => {
    expect(content).toContain("onMouseLeave");
    expect(content).toContain("onTouchCancel");
  });

  it("should stop propagation on close button to prevent pause/navigation", () => {
    // The close button should stop propagation on mouseDown and touchStart
    expect(content).toContain('onMouseDown={(e) => e.stopPropagation()}');
    expect(content).toContain('onTouchStart={(e) => e.stopPropagation()}');
  });

  it("should have select-none class to prevent text selection during long press", () => {
    expect(content).toContain("select-none");
  });
});
