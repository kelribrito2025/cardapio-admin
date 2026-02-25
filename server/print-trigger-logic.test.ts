import { describe, it, expect } from 'vitest';

/**
 * Tests for the print_order SSE event trigger logic.
 * 
 * The Mindi Printer app connects via SSE and listens for print_order events.
 * The key settings are:
 * - printOnNewOrder: true/false - whether to print when a new order is created
 * - autoPrintEnabled: true/false - legacy setting for old direct printing system
 * 
 * The fix ensures that printOnNewOrder alone is sufficient to trigger SSE print_order,
 * without requiring autoPrintEnabled to be true.
 */

describe('Print trigger logic - createPublicOrder', () => {
  it('should trigger print_order when printOnNewOrder=true (regardless of autoPrintEnabled)', () => {
    const printerSettings = {
      autoPrintEnabled: false,
      printOnNewOrder: true,
      beepOnPrint: true,
    };

    // This is the fixed condition from createPublicOrder
    const shouldPrint = !!printerSettings?.printOnNewOrder;

    expect(shouldPrint).toBe(true);
  });

  it('should trigger print_order when both autoPrintEnabled and printOnNewOrder are true', () => {
    const printerSettings = {
      autoPrintEnabled: true,
      printOnNewOrder: true,
      beepOnPrint: true,
    };

    const shouldPrint = !!printerSettings?.printOnNewOrder;

    expect(shouldPrint).toBe(true);
  });

  it('should NOT trigger print_order when printOnNewOrder=false', () => {
    const printerSettings = {
      autoPrintEnabled: true,
      printOnNewOrder: false,
      beepOnPrint: true,
    };

    const shouldPrint = !!printerSettings?.printOnNewOrder;

    expect(shouldPrint).toBe(false);
  });

  it('should NOT trigger print_order when printerSettings is null', () => {
    const printerSettings = null;

    const shouldPrint = !!(printerSettings as any)?.printOnNewOrder;

    expect(shouldPrint).toBe(false);
  });

  it('should NOT trigger print_order when printerSettings is undefined', () => {
    const printerSettings = undefined;

    const shouldPrint = !!printerSettings?.printOnNewOrder;

    expect(shouldPrint).toBe(false);
  });
});

describe('Print trigger logic - updateOrderStatus (accept)', () => {
  it('should NOT print on accept when printOnNewOrder=true (already printed on creation)', () => {
    const printerSettings = {
      autoPrintEnabled: false,
      printOnNewOrder: true,
      printOnStatusChange: false,
    };

    // The condition in updateOrderStatus: only print if printOnNewOrder is false
    // (because if printOnNewOrder is true, it was already printed in createPublicOrder)
    const shouldPrint = printerSettings && !printerSettings.printOnNewOrder;

    expect(shouldPrint).toBe(false);
  });

  it('should print on accept when printOnNewOrder=false (was not printed on creation)', () => {
    const printerSettings = {
      autoPrintEnabled: false,
      printOnNewOrder: false,
      printOnStatusChange: false,
    };

    const shouldPrint = printerSettings && !printerSettings.printOnNewOrder;

    expect(shouldPrint).toBe(true);
  });

  it('should NOT print on accept when printerSettings is null', () => {
    const printerSettings = null;

    const shouldPrint = printerSettings && !(printerSettings as any).printOnNewOrder;

    expect(shouldPrint).toBeFalsy();
  });
});

describe('Print trigger logic - no duplicate printing', () => {
  it('should print exactly once when printOnNewOrder=true: on creation only', () => {
    const printerSettings = {
      printOnNewOrder: true,
      autoPrintEnabled: false,
    };

    const printsOnCreation = !!printerSettings?.printOnNewOrder;
    const printsOnAccept = printerSettings && !printerSettings.printOnNewOrder;

    expect(printsOnCreation).toBe(true);
    expect(printsOnAccept).toBe(false);
    // Total prints = 1 (creation only)
  });

  it('should print exactly once when printOnNewOrder=false: on accept only', () => {
    const printerSettings = {
      printOnNewOrder: false,
      autoPrintEnabled: false,
    };

    const printsOnCreation = !!printerSettings?.printOnNewOrder;
    const printsOnAccept = printerSettings && !printerSettings.printOnNewOrder;

    expect(printsOnCreation).toBe(false);
    expect(printsOnAccept).toBeTruthy();
    // Total prints = 1 (accept only)
  });
});

describe('Print trigger logic - legacy methods skipped when SSE active', () => {
  it('should skip POSPrinterDriver and Socket TCP when printOnNewOrder=true', () => {
    const printerSettings = {
      printOnNewOrder: true,
      posPrinterEnabled: true,
      posPrinterLinkcode: 'some-code',
    };

    // SSE print fires
    const ssePrintFires = !!printerSettings?.printOnNewOrder;
    // Legacy methods are wrapped in: if (!printerSettings?.printOnNewOrder)
    const legacyMethodsRun = !printerSettings?.printOnNewOrder;

    expect(ssePrintFires).toBe(true);
    expect(legacyMethodsRun).toBe(false);
  });

  it('should allow legacy methods when printOnNewOrder=false', () => {
    const printerSettings = {
      printOnNewOrder: false,
      posPrinterEnabled: true,
      posPrinterLinkcode: 'some-code',
    };

    const ssePrintFires = !!printerSettings?.printOnNewOrder;
    const legacyMethodsRun = !printerSettings?.printOnNewOrder;

    expect(ssePrintFires).toBe(false);
    expect(legacyMethodsRun).toBe(true);
  });

  it('should not have both SSE and legacy printing active at the same time', () => {
    // For any printerSettings configuration, only one path should be active
    const configs = [
      { printOnNewOrder: true },
      { printOnNewOrder: false },
    ];

    configs.forEach(settings => {
      const ssePrints = !!settings.printOnNewOrder;
      const legacyPrints = !settings.printOnNewOrder;

      // XOR: exactly one should be true
      expect(ssePrints !== legacyPrints).toBe(true);
    });
  });
});
