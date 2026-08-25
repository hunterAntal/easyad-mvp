/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { InventoryItem } from "../app/data";
import MapLibreInventoryMap, { DEFAULT_MAP_VIEW_RADIUS_KM, DEFAULT_MAP_ZOOM, DEVICE_MARKER_MIN_ZOOM, getAvailableCities, shouldShowDeviceMarkers } from "../app/component/maplibre-inventory-map";

const inventory: InventoryItem[] = [{
  id: "INV-MAP-1",
  name: "City Hall Screen",
  operator: "Civic Media",
  format: "digital",
  x: 50,
  y: 50,
  address: "1 Civic Square, Thunder Bay, ON",
  price: 500,
  impressions: 120000,
  traffic: 80000,
  income: 90000,
  audience: "Residents",
  competitor: "Low",
  occupancy: 40,
  imageInterval: 6,
  maxLoopSeconds: 120,
  availableFrom: "2026-08-01",
  availableTo: "2026-09-01",
}];

describe("shared inventory map zoom behavior", () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  });

  test("uses a 30 km city-scale default", () => {
    expect(DEFAULT_MAP_VIEW_RADIUS_KM).toBe(30);
    expect(DEFAULT_MAP_ZOOM).toBeGreaterThanOrEqual(DEVICE_MARKER_MIN_ZOOM);
    expect(shouldShowDeviceMarkers(DEFAULT_MAP_ZOOM)).toBe(true);
    expect(shouldShowDeviceMarkers(DEVICE_MARKER_MIN_ZOOM - 0.1)).toBe(false);
  });

  test("anchors each city marker to a representative matching device", () => {
    const cities = getAvailableCities([
      inventory[0],
      { ...inventory[0], id: "INV-MAP-2", x: 54, y: 48, address: "2 Civic Square, Thunder Bay, ON" },
      { ...inventory[0], id: "INV-MAP-3", x: 25, y: 20, address: "3 Harbour Street, Toronto, ON" },
    ]);

    expect(cities).toEqual([
      expect.objectContaining({ label: "Thunder Bay, ON", inventoryCount: 2, x: 50, y: 50 }),
      expect.objectContaining({ label: "Toronto, ON", inventoryCount: 1, x: 25, y: 20 }),
    ]);
  });

  test("city availability counts exclude unavailable physical billboards", () => {
    const cities = getAvailableCities([
      inventory[0],
      { ...inventory[0], id: "INV-STATIC-AVAILABLE", format: "static", deliveryMode: "static", availableFrom: "2000-01-01", availableTo: "2099-01-01" },
      { ...inventory[0], id: "INV-STATIC-UNAVAILABLE", format: "static", deliveryMode: "static", availableFrom: "2000-01-01", availableTo: "2001-01-01" },
    ]);

    expect(cities).toEqual([
      expect.objectContaining({ label: "Thunder Bay, ON", inventoryCount: 2 }),
    ]);
  });

  test("replaces device pins with a city marker when zooming out and restores them at city level", async () => {
    const { container } = render(
      <MapLibreInventoryMap
        inventory={inventory}
        visibleInventory={inventory}
        selectedInventoryId={inventory[0].id}
        selectedLocation={{ x: 50, y: 50 }}
        radius={30}
        showCompetitors
      />,
    );

    const pin = screen.getByRole("button", { name: "City Hall Screen, Digital Screen" });
    expect(pin).toHaveAttribute("aria-pressed", "true");
    expect(pin.textContent).toBe("");
    expect(pin.querySelector(".fallback-pin-glyph")).toHaveAttribute("viewBox", "0 0 34 40");
    expect(pin.querySelector(".fallback-pin-body")).toHaveAttribute("d", expect.stringContaining("15.5 21.5"));
    expect(container.querySelectorAll(".fallback-pin")).toHaveLength(1);
    expect(screen.getByText("Available device")).toBeInTheDocument();
    expect(screen.getByText("Selected device")).toBeInTheDocument();
    expect(screen.getByText("Nearby business")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));

    await waitFor(() => {
      expect(container.querySelectorAll(".fallback-pin")).toHaveLength(0);
      expect(container.querySelectorAll(".fallback-city-marker")).toHaveLength(1);
      const cityMarker = screen.getByRole("button", { name: "Thunder Bay, ON: 1 available device. Zoom in to view devices." });
      expect(cityMarker).toHaveTextContent(/^1$/);
      expect(cityMarker).not.toHaveTextContent("Thunder Bay");
      expect(screen.getByText("Available city")).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent("Choose a city or zoom in to view devices");
    });

    fireEvent.click(screen.getByRole("button", { name: "Thunder Bay, ON: 1 available device. Zoom in to view devices." }));
    await waitFor(() => expect(container.querySelectorAll(".fallback-pin")).toHaveLength(1));
  });

  test("portal variant shows available devices without selection or competitor overlays", () => {
    const { container } = render(
      <MapLibreInventoryMap
        inventory={inventory}
        visibleInventory={inventory}
        selectedInventoryId={inventory[0].id}
        selectedLocation={{ x: 50, y: 50 }}
        radius={30}
        showCompetitors
        variant="portal"
      />,
    );

    const pin = screen.getByRole("button", { name: "City Hall Screen, Digital Screen" });
    expect(pin).not.toHaveAttribute("aria-pressed");
    expect(pin).not.toHaveClass("selected");
    expect(screen.getByText("Available device")).toBeInTheDocument();
    expect(screen.queryByText("Selected device")).not.toBeInTheDocument();
    expect(screen.queryByText("Nearby business")).not.toBeInTheDocument();
    expect(container.querySelector(".fallback-center")).not.toBeInTheDocument();
    expect(container.querySelector(".fallback-radius")).not.toBeInTheDocument();
    expect(container.querySelector(".fallback-business")).not.toBeInTheDocument();
  });
});
