/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import BookingView from "../app/component/booking-view";
import type { InventoryItem } from "../app/data";
import type { BookingDraft } from "../app/types";

const baseItem: InventoryItem = {
  id: "INV-BOOKING-1",
  name: "Booking Test Unit",
  operator: "Test Operator",
  format: "digital",
  deliveryMode: "digital",
  x: 50,
  y: 50,
  address: "1 Booking Way",
  price: 500,
  impressions: 100000,
  traffic: 80000,
  income: 90000,
  audience: "Commuters",
  competitor: "Low",
  occupancy: 10,
  imageInterval: 6,
  maxLoopSeconds: 120,
  availableFrom: "2026-07-01",
  availableTo: "2026-08-01",
};

const draft: BookingDraft = {
  advertiser: "Test Advertiser",
  campaign: "Test Campaign",
  start: "2026-07-10",
  end: "2026-07-12",
  adSlots: 1,
};

function renderBooking(item: InventoryItem) {
  render(
    <BookingView
      item={item}
      inventory={[item]}
      draft={draft}
      bookings={[]}
      setDraft={vi.fn()}
      hasCapacityConflict={() => false}
      onSubmit={vi.fn().mockResolvedValue(true)}
      canBuy
    />,
  );
}

test("physical billboards omit digital loop-time metrics", () => {
  renderBooking({ ...baseItem, format: "static", deliveryMode: "static" });

  expect(screen.queryByText("Reserved loop time")).not.toBeInTheDocument();
  expect(screen.queryByText("Available loop time")).not.toBeInTheDocument();
  expect(screen.queryByText("Booked loop time")).not.toBeInTheDocument();
  expect(screen.getByText("Estimated spend")).toBeInTheDocument();
  expect(screen.getByText("Run length")).toBeInTheDocument();
  expect(screen.getByText("Estimated impressions")).toBeInTheDocument();
  expect(screen.getByText("Available")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Submit booking for approval" })).toBeDisabled();

  fireEvent.change(screen.getByLabelText("Creative image for approval"), {
    target: { files: [new File(["image"], "billboard.png", { type: "image/png" })] },
  });

  expect(screen.getByText("billboard.png")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Submit booking for approval" })).toBeEnabled();
});

test("physical billboard requests outside the owner-defined dates are unavailable", () => {
  renderBooking({ ...baseItem, format: "static", deliveryMode: "static", availableFrom: "2026-08-01", availableTo: "2026-08-31" });

  expect(screen.getByText("Unavailable")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Submit booking for approval" })).toBeDisabled();
  expect(screen.queryByText("Capacity full")).not.toBeInTheDocument();
});

test("booking rejects non-image creative files before submission", () => {
  renderBooking(baseItem);

  fireEvent.change(screen.getByLabelText("Creative image for approval"), {
    target: { files: [new File(["not an image"], "creative.pdf", { type: "application/pdf" })] },
  });

  expect(screen.getByRole("alert")).toHaveTextContent("Choose a PNG, JPEG, or GIF image.");
  expect(screen.getByRole("button", { name: "Submit booking for approval" })).toBeDisabled();
});

test("digital bookings accept animated GIF creative", () => {
  renderBooking(baseItem);

  fireEvent.change(screen.getByLabelText("Creative image for approval"), {
    target: { files: [new File(["GIF89a"], "animated.gif", { type: "image/gif" })] },
  });

  expect(screen.getByText("animated.gif")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Submit booking for approval" })).toBeEnabled();
});

test("physical billboard bookings do not accept animated GIF creative", () => {
  renderBooking({ ...baseItem, format: "static", deliveryMode: "static" });

  fireEvent.change(screen.getByLabelText("Creative image for approval"), {
    target: { files: [new File(["GIF89a"], "animated.gif", { type: "image/gif" })] },
  });

  expect(screen.getByRole("alert")).toHaveTextContent("Choose a PNG or JPEG image.");
  expect(screen.getByRole("button", { name: "Submit booking for approval" })).toBeDisabled();
});

test("digital screens retain loop-time metrics", () => {
  renderBooking(baseItem);

  expect(screen.getByText("Reserved loop time")).toBeInTheDocument();
  expect(screen.getByText("Available loop time")).toBeInTheDocument();
  expect(screen.getByText("Booked loop time")).toBeInTheDocument();
});

test("legacy static-format inventory also omits loop-time metrics", () => {
  renderBooking({ ...baseItem, format: "static", deliveryMode: undefined });

  expect(screen.queryByText("Reserved loop time")).not.toBeInTheDocument();
  expect(screen.queryByText("Available loop time")).not.toBeInTheDocument();
  expect(screen.queryByText("Booked loop time")).not.toBeInTheDocument();
});
