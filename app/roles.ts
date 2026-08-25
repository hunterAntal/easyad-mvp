import type { Role, View } from "./data";

export const roleValues = ["advertiser", "operator", "institutional", "admin"] as const satisfies readonly Role[];

export const managedRoleOptions = [
  { value: "advertiser", label: "Advertiser" },
  { value: "institutional", label: "Institution account" },
  { value: "operator", label: "Operator" },
] as const satisfies readonly { value: Exclude<Role, "admin">; label: string }[];

const roleLabels: Record<Role, string> = {
  advertiser: "Advertiser",
  operator: "Operator",
  institutional: "Institution account",
  admin: "Super Admin",
};

export const roleWorkspaceView: Record<Role, View> = {
  advertiser: "discover",
  operator: "inventory",
  institutional: "network",
  admin: "reports",
};

export function roleLabel(role: Role) {
  return roleLabels[role];
}

export function canAccessInstitutionWorkspace(role: Role | null | undefined) {
  return role === "institutional" || role === "admin";
}
