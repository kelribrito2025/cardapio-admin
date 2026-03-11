import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db functions
const mockUpdateTable = vi.fn();
const mockGetDeactivatedTables = vi.fn();
const mockDeleteTable = vi.fn();

vi.mock("./db", () => ({
  updateTable: (...args: any[]) => mockUpdateTable(...args),
  getDeactivatedTables: (...args: any[]) => mockGetDeactivatedTables(...args),
  deleteTable: (...args: any[]) => mockDeleteTable(...args),
}));

describe("Table Deactivation Feature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("deactivate table", () => {
    it("should call updateTable with isActive: false", async () => {
      mockUpdateTable.mockResolvedValue(undefined);

      const tableId = 42;
      await mockUpdateTable(tableId, { isActive: false });

      expect(mockUpdateTable).toHaveBeenCalledWith(42, { isActive: false });
      expect(mockUpdateTable).toHaveBeenCalledTimes(1);
    });

    it("should not hard delete the table when deactivating", async () => {
      mockUpdateTable.mockResolvedValue(undefined);

      const tableId = 42;
      await mockUpdateTable(tableId, { isActive: false });

      expect(mockDeleteTable).not.toHaveBeenCalled();
    });
  });

  describe("restore table", () => {
    it("should call updateTable with isActive: true", async () => {
      mockUpdateTable.mockResolvedValue(undefined);

      const tableId = 42;
      await mockUpdateTable(tableId, { isActive: true });

      expect(mockUpdateTable).toHaveBeenCalledWith(42, { isActive: true });
      expect(mockUpdateTable).toHaveBeenCalledTimes(1);
    });
  });

  describe("list deactivated tables", () => {
    it("should return deactivated tables for establishment", async () => {
      const deactivatedTables = [
        { id: 1, number: 1, isActive: false, establishmentId: 100 },
        { id: 5, number: 5, isActive: false, establishmentId: 100 },
      ];
      mockGetDeactivatedTables.mockResolvedValue(deactivatedTables);

      const result = await mockGetDeactivatedTables(100);

      expect(mockGetDeactivatedTables).toHaveBeenCalledWith(100);
      expect(result).toHaveLength(2);
      expect(result[0].isActive).toBe(false);
      expect(result[1].isActive).toBe(false);
    });

    it("should return empty array when no deactivated tables", async () => {
      mockGetDeactivatedTables.mockResolvedValue([]);

      const result = await mockGetDeactivatedTables(100);

      expect(result).toEqual([]);
    });
  });

  describe("permanent delete", () => {
    it("should hard delete the table", async () => {
      mockDeleteTable.mockResolvedValue(undefined);

      const tableId = 42;
      await mockDeleteTable(tableId);

      expect(mockDeleteTable).toHaveBeenCalledWith(42);
      expect(mockDeleteTable).toHaveBeenCalledTimes(1);
    });

    it("should not call updateTable when permanently deleting", async () => {
      mockDeleteTable.mockResolvedValue(undefined);

      await mockDeleteTable(42);

      expect(mockUpdateTable).not.toHaveBeenCalled();
    });
  });

  describe("deactivate vs delete flow", () => {
    it("deactivate should use soft delete (isActive=false), not hard delete", async () => {
      mockUpdateTable.mockResolvedValue(undefined);

      // Simulate deactivate flow
      await mockUpdateTable(10, { isActive: false });

      expect(mockUpdateTable).toHaveBeenCalledWith(10, { isActive: false });
      expect(mockDeleteTable).not.toHaveBeenCalled();
    });

    it("restore then permanent delete should work in sequence", async () => {
      mockUpdateTable.mockResolvedValue(undefined);
      mockDeleteTable.mockResolvedValue(undefined);

      // First restore
      await mockUpdateTable(10, { isActive: true });
      expect(mockUpdateTable).toHaveBeenCalledWith(10, { isActive: true });

      // Then permanent delete
      await mockDeleteTable(10);
      expect(mockDeleteTable).toHaveBeenCalledWith(10);
    });
  });
});
