import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * Tests to verify that the celebration/congratulations modal
 * uses a centered Dialog instead of a sidebar Sheet.
 * 
 * The celebration should:
 * 1. Use Dialog component (not Sheet) for the celebration view
 * 2. Be unified for both mobile and desktop (single Dialog)
 * 3. Include confetti, progress bar, message, and CTA button
 * 4. Not allow closing by clicking outside (onInteractOutside preventDefault)
 */

const welcomeChecklistPath = join(__dirname, "../client/src/components/WelcomeChecklist.tsx");
const source = readFileSync(welcomeChecklistPath, "utf-8");

describe("Celebration modal uses Dialog instead of Sheet", () => {
  it("should import Dialog components", () => {
    expect(source).toContain("import {");
    expect(source).toContain("Dialog,");
    expect(source).toContain("DialogContent,");
    expect(source).toContain("DialogTitle,");
    expect(source).toContain("DialogDescription,");
    expect(source).toContain('from "@/components/ui/dialog"');
  });

  it("should use Dialog in celebration section, not Sheet", () => {
    // Extract the celebration section
    const celebrationStart = source.indexOf("// ==================== CELEBRATION CONTENT ====================");
    const celebrationEnd = source.indexOf("return (", source.indexOf("return (", celebrationStart) + 1);
    
    expect(celebrationStart).toBeGreaterThan(-1);
    
    // The celebration section should contain Dialog
    const celebrationSection = source.substring(celebrationStart, celebrationStart + 3000);
    expect(celebrationSection).toContain("<Dialog");
    expect(celebrationSection).toContain("<DialogContent");
    expect(celebrationSection).toContain("<DialogTitle");
    expect(celebrationSection).toContain("<DialogDescription");
  });

  it("should NOT use Sheet in celebration section", () => {
    // Find the celebration block - ends at the next return statement (the normal checklist)
    const celebrationStart = source.indexOf("// ==================== CELEBRATION CONTENT ====================");
    // Find the end of celebration by looking for the next main section marker
    const celebrationEnd = source.indexOf("// ==================== MOBILE", celebrationStart);
    // If marker not found, use a large range
    const endIdx = celebrationEnd > celebrationStart ? celebrationEnd : celebrationStart + 5000;
    
    expect(celebrationStart).toBeGreaterThan(-1);
    
    const celebrationSection = source.substring(celebrationStart, endIdx);
    
    // Should NOT contain Sheet components in the celebration section
    expect(celebrationSection).not.toContain("<Sheet ");
    expect(celebrationSection).not.toContain("<SheetContent");
  });

  it("should have a single unified Dialog for both mobile and desktop", () => {
    const celebrationStart = source.indexOf("// ==================== CELEBRATION CONTENT ====================");
    // Find the if (showCelebration) block and its return
    const ifIdx = source.indexOf("if (showCelebration)", celebrationStart);
    const returnInIf = source.indexOf("return (", ifIdx);
    // The celebration block ends at the closing of the if block (next top-level return)
    const nextReturn = source.indexOf("  return (", returnInIf + 10);
    
    expect(ifIdx).toBeGreaterThan(celebrationStart);
    expect(nextReturn).toBeGreaterThan(returnInIf);
    
    const celebrationSection = source.substring(returnInIf, nextReturn);
    
    // Should have exactly one Dialog (unified for mobile + desktop)
    const dialogCount = (celebrationSection.match(/<Dialog /g) || []).length;
    expect(dialogCount).toBe(1);
    
    // Should NOT have responsive breakpoint classes that split mobile/desktop
    expect(celebrationSection).not.toContain("hidden md:block");
  });

  it("should prevent closing by clicking outside", () => {
    const celebrationStart = source.indexOf("// ==================== CELEBRATION CONTENT ====================");
    const celebrationSection = source.substring(celebrationStart, celebrationStart + 3000);
    
    expect(celebrationSection).toContain("onInteractOutside");
    expect(celebrationSection).toContain("preventDefault");
  });

  it("should include Confetti component", () => {
    const celebrationStart = source.indexOf("// ==================== CELEBRATION CONTENT ====================");
    const celebrationSection = source.substring(celebrationStart, celebrationStart + 3000);
    
    expect(celebrationSection).toContain("<Confetti");
  });

  it("should include PartyPopper icon", () => {
    const celebrationStart = source.indexOf("// ==================== CELEBRATION CONTENT ====================");
    const celebrationSection = source.substring(celebrationStart, celebrationStart + 3000);
    
    expect(celebrationSection).toContain("<PartyPopper");
  });

  it("should include progress bar showing all steps completed", () => {
    const celebrationStart = source.indexOf("// ==================== CELEBRATION CONTENT ====================");
    const celebrationSection = source.substring(celebrationStart, celebrationStart + 5000);
    
    expect(celebrationSection).toContain("Todos os passos concluídos");
    expect(celebrationSection).toContain("from-green-500");
  });

  it("should include 'Ir para o Dashboard' button", () => {
    const celebrationStart = source.indexOf("// ==================== CELEBRATION CONTENT ====================");
    const celebrationSection = source.substring(celebrationStart, celebrationStart + 5000);
    
    expect(celebrationSection).toContain("Ir para o Dashboard");
    expect(celebrationSection).toContain("<Rocket");
  });

  it("should have handleDismissCelebration function", () => {
    expect(source).toContain("handleDismissCelebration");
    // Should set dismissed in localStorage
    expect(source).toContain('localStorage.setItem(dismissedKey, "true")');
  });
});
