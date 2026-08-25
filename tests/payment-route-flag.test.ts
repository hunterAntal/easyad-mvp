import * as assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { afterEach, test, vi } from "vitest";

vi.mock("../app/lib/auth", () => ({
  getCurrentUser: async () => ({ id: "USR-ADMIN", role: "admin" }),
  canManageInventory: () => true,
  canManageInventoryRecord: () => true,
}));

vi.mock("../app/lib/db", () => ({
  getBooking: vi.fn(),
  getInventory: vi.fn(),
  getTransactionByBooking: vi.fn(),
  updateBookingRecord: vi.fn(),
  upsertTransaction: vi.fn(),
}));

import { POST } from "../app/api/bookings/[id]/payment/route";

afterEach(() => {
  delete process.env.FEATURE_PAYMENTS;
});

test("payment endpoint is unavailable when its flag is absent", async () => {
  delete process.env.FEATURE_PAYMENTS;
  const response = await POST(
    new NextRequest("http://localhost/api/bookings/BK-1/payment", { method: "POST", body: "{}" }),
    { params: Promise.resolve({ id: "BK-1" }) },
  );

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "Payment collection is not available" });
});
