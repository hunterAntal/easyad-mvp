import { NextRequest, NextResponse } from "next/server";
import type { DeviceAlertType } from "../../../data";
import { canManageInstitutionAlerts, canManageInventoryRecord, getCurrentUser } from "../../../lib/auth";
import { createDeviceAlertIfNoConflict, getInventory, listDeviceAlerts } from "../../../lib/db";

const alertTypes: DeviceAlertType[] = ["amber", "evacuation", "public-safety"];
const maxTargets = 100;
const maxDurationMs = 24 * 60 * 60 * 1000;

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !canManageInstitutionAlerts(user)) return NextResponse.json({ error: "Institution account or Super Admin access required" }, { status: 403 });
  const alerts = await listDeviceAlerts(user.role === "institutional" ? user.id : undefined);
  return NextResponse.json({ alerts });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !canManageInstitutionAlerts(user)) return NextResponse.json({ error: "Institution account or Super Admin access required" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const alertType = alertTypes.includes(body.alertType) ? body.alertType as DeviceAlertType : null;
  const title = cleanText(body.title, 120);
  const message = cleanText(body.message, 600);
  const area = cleanText(body.area, 160);
  const targetDeviceIds = cleanDeviceIds(body.targetDeviceIds);
  const expiresAtMs = Date.parse(typeof body.expiresAt === "string" ? body.expiresAt : "");
  const now = Date.now();

  if (!alertType || !title || !message || !area || !targetDeviceIds.length) {
    return NextResponse.json({ error: "Alert type, title, instructions, area, and at least one screen are required" }, { status: 400 });
  }
  if (targetDeviceIds.length > maxTargets) {
    return NextResponse.json({ error: `Choose no more than ${maxTargets} screens per override` }, { status: 400 });
  }
  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= now || expiresAtMs - now > maxDurationMs) {
    return NextResponse.json({ error: "Choose an expiry between now and 24 hours from now" }, { status: 400 });
  }

  const devices = await Promise.all(targetDeviceIds.map((id) => getInventory(id)));
  if (devices.some((device) => !device)) return NextResponse.json({ error: "One or more selected screens no longer exist" }, { status: 404 });
  const resolvedDevices = devices.filter((device): device is NonNullable<typeof device> => Boolean(device));
  if (resolvedDevices.some((device) => !canManageInventoryRecord(user, device))) {
    return NextResponse.json({ error: "One or more selected screens belong to another institution" }, { status: 403 });
  }
  if (resolvedDevices.some((device) => device.approvalStatus !== "approved")) {
    return NextResponse.json({ error: "Publish every selected screen before starting an emergency override" }, { status: 409 });
  }

  const institutionIds = new Set(resolvedDevices.map((device) => device.institutionId).filter((id): id is string => Boolean(id)));
  if (institutionIds.size !== 1 || (user.role === "institutional" && !institutionIds.has(user.id))) {
    return NextResponse.json({ error: "Emergency overrides must target screens from one institution" }, { status: 403 });
  }
  const institutionId = Array.from(institutionIds)[0];
  const result = await createDeviceAlertIfNoConflict({
    institutionId,
    alertType,
    title,
    message,
    area,
    targetDeviceIds,
    issuedBy: user.name,
    createdBy: user.id,
    expiresAt: new Date(expiresAtMs).toISOString(),
  });

  if (!result.alert) {
    return NextResponse.json({ error: "End the active override on the selected screens before publishing another" }, { status: 409 });
  }

  return NextResponse.json({ alert: result.alert }, { status: 201 });
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maxLength) : "";
}

function cleanDeviceIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter((entry): entry is string => typeof entry === "string").map((entry) => entry.trim()).filter(Boolean)));
}
