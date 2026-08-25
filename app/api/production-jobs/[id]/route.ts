import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/auth";
import { getDb } from "../../../lib/db";
import { organizationIdsForUser } from "../../../lib/campaigns";
import { isFeatureEnabled } from "../../../lib/feature-flags";
type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  if (!isFeatureEnabled("static_fulfillment")) return NextResponse.json({ error: "Not available" }, { status: 404 });
  const user = await getCurrentUser(); if (!user || !["admin", "operator", "institutional"].includes(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json().catch(() => ({})); const next = String(body.status ?? "");
  if (!["ready", "in_production", "printed", "shipped", "delivered", "reprint_required"].includes(next)) return NextResponse.json({ error: "Invalid production status" }, { status: 422 });
  const orgs = await organizationIdsForUser(user); const id = (await context.params).id; const now = new Date().toISOString();
  const result = await getDb().query<{ placement_id: string; version: number }>(`UPDATE production_jobs SET status=$1,vendor_organization_id=COALESCE($2,vendor_organization_id),substrate=COALESCE($3,substrate),finishing=COALESCE($4,finishing),target_completion=COALESCE($5,target_completion),version=version+1,updated_at=$6
    WHERE id=$7 AND version=$8 AND EXISTS (SELECT 1 FROM placements JOIN campaigns ON campaigns.id=placements.campaign_id JOIN inventory ON inventory.id=placements.inventory_id WHERE placements.id=production_jobs.placement_id AND (campaigns.organization_id=ANY($9::text[]) OR inventory.owner_organization_id=ANY($9::text[])))
    RETURNING placement_id,version`, [next, body.vendorOrganizationId ?? null, body.substrate ?? null, body.finishing ?? null, body.targetCompletion ?? null, now, id, Number(body.expectedVersion), orgs]);
  if (!result.rows[0]) return NextResponse.json({ error: "Production job changed or was not found" }, { status: 409 });
  if (next === "delivered") await getDb().query("UPDATE installation_work_orders SET status='ready',version=version+1,updated_at=$1 WHERE placement_id=$2 AND work_type='install' AND status='not_ready'", [now, result.rows[0].placement_id]);
  await getDb().query("INSERT INTO activity_events (id,organization_id,actor_id,subject_type,subject_id,action,next_state,created_at) SELECT $1,campaigns.organization_id,$2,'production_job',$3,'status_changed',$4,$5 FROM production_jobs JOIN placements ON placements.id=production_jobs.placement_id JOIN campaigns ON campaigns.id=placements.campaign_id WHERE production_jobs.id=$3", [`EVT-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`, user.id, id, next, now]);
  return NextResponse.json({ id, status: next, version: result.rows[0].version });
}
