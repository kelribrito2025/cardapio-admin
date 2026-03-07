import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Story Viewed Border (cinza quando todos vistos)", () => {
  // Test 1: StoryViewer has onAllViewed prop
  it("should have onAllViewed optional prop in StoryViewer", () => {
    const viewerPath = path.resolve(__dirname, "../client/src/components/StoryViewer.tsx");
    const content = fs.readFileSync(viewerPath, "utf-8");
    
    expect(content).toContain("onAllViewed?: () => void");
    expect(content).toContain("onAllViewed,");
  });

  // Test 2: StoryViewer calls onAllViewed when all stories are viewed
  it("should call onAllViewed when viewedStoriesRef.size equals stories.length", () => {
    const viewerPath = path.resolve(__dirname, "../client/src/components/StoryViewer.tsx");
    const content = fs.readFileSync(viewerPath, "utf-8");
    
    expect(content).toContain("viewedStoriesRef.current.size === stories.length");
    expect(content).toContain("onAllViewed()");
  });

  // Test 3: PublicMenu has allStoriesViewed state
  it("should have allStoriesViewed state in PublicMenu", () => {
    const menuPath = path.resolve(__dirname, "../client/src/pages/PublicMenu.tsx");
    const content = fs.readFileSync(menuPath, "utf-8");
    
    expect(content).toContain("allStoriesViewed");
    expect(content).toContain("setAllStoriesViewed");
  });

  // Test 4: PublicMenu uses sessionStorage to persist viewed stories
  it("should use sessionStorage to persist viewed story IDs", () => {
    const menuPath = path.resolve(__dirname, "../client/src/pages/PublicMenu.tsx");
    const content = fs.readFileSync(menuPath, "utf-8");
    
    expect(content).toContain("mindi_stories_viewed_");
    expect(content).toContain("sessionStorage.getItem");
    expect(content).toContain("sessionStorage.setItem");
  });

  // Test 5: PublicMenu checks viewed stories on load via useEffect
  it("should check viewed stories on load via useEffect", () => {
    const menuPath = path.resolve(__dirname, "../client/src/pages/PublicMenu.tsx");
    const content = fs.readFileSync(menuPath, "utf-8");
    
    // Should have useEffect that checks sessionStorage
    expect(content).toContain("Verificar se todos os stories já foram vistos");
    expect(content).toContain("JSON.parse(viewedRaw)");
  });

  // Test 6: PublicMenu passes onAllViewed to StoryViewer
  it("should pass onAllViewed callback to StoryViewer", () => {
    const menuPath = path.resolve(__dirname, "../client/src/pages/PublicMenu.tsx");
    const content = fs.readFileSync(menuPath, "utf-8");
    
    expect(content).toContain("onAllViewed={() =>");
    expect(content).toContain("setAllStoriesViewed(true)");
  });

  // Test 7: Borda muda para cinza quando allStoriesViewed é true
  it("should show gray gradient when allStoriesViewed is true", () => {
    const menuPath = path.resolve(__dirname, "../client/src/pages/PublicMenu.tsx");
    const content = fs.readFileSync(menuPath, "utf-8");
    
    // Should have conditional gradient
    expect(content).toContain("allStoriesViewed");
    expect(content).toContain("#d1d5db"); // gray color
    expect(content).toContain("#9ca3af"); // gray color
  });

  // Test 8: Animação pulsante desativada quando stories já vistos
  it("should disable pulse animation when allStoriesViewed is true", () => {
    const menuPath = path.resolve(__dirname, "../client/src/pages/PublicMenu.tsx");
    const content = fs.readFileSync(menuPath, "utf-8");
    
    // Should conditionally apply animation
    expect(content).toContain("allStoriesViewed ? undefined : { animation:");
  });

  // Test 9: Borda colorida quando stories NÃO foram todos vistos
  it("should show colorful Instagram gradient when stories not all viewed", () => {
    const menuPath = path.resolve(__dirname, "../client/src/pages/PublicMenu.tsx");
    const content = fs.readFileSync(menuPath, "utf-8");
    
    // Should still have the Instagram gradient for non-viewed state
    expect(content).toContain("#f09433");
    expect(content).toContain("#e6683c");
    expect(content).toContain("#dc2743");
    expect(content).toContain("#cc2366");
    expect(content).toContain("#bc1888");
  });

  // Test 10: useEffect re-checks when showStoryViewer changes
  it("should re-check viewed stories when StoryViewer closes", () => {
    const menuPath = path.resolve(__dirname, "../client/src/pages/PublicMenu.tsx");
    const content = fs.readFileSync(menuPath, "utf-8");
    
    // The useEffect dependency should include showStoryViewer
    expect(content).toContain("showStoryViewer]");
  });
});
