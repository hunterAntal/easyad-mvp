"use client";

import "./dashboard-shell.css";
import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  ClipboardCheck,
  CreditCard,
  Gauge,
  Globe2,
  Images,
  LayoutDashboard,
  LogOut,
  Map,
  MapPin,
  Megaphone,
  MonitorUp,
  PanelsTopLeft,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Booking, InventoryItem, Role, View } from "../data";
import { roleLabel, roleValues, roleWorkspaceView } from "../roles";
import { money, portalHref } from "../utils";
import { Brand } from "./shared-ui";
import type { DbUser } from "../lib/db";
import { LanguageSelector, useI18n } from "../i18n/client";

type NavItem = {
  view: View;
  label: string;
  icon: LucideIcon;
  group: "Workspace" | "Operations" | "Insights";
};

const roleNav: Record<Role, NavItem[]> = {
  advertiser: [
    { view: "portal", label: "Portal", icon: Globe2, group: "Workspace" },
    { view: "discover", label: "Discover", icon: Search, group: "Workspace" },
    { view: "booking", label: "Booking", icon: CalendarDays, group: "Operations" },
    { view: "campaigns", label: "Campaigns", icon: Megaphone, group: "Operations" },
    { view: "creative", label: "Creative studio", icon: Sparkles, group: "Operations" },
    { view: "resources", label: "Content", icon: Images, group: "Operations" },
    { view: "reports", label: "Performance", icon: BarChart3, group: "Insights" },
    { view: "billing", label: "Billing", icon: CreditCard, group: "Insights" },
  ],
  operator: [
    { view: "portal", label: "Portal", icon: Globe2, group: "Workspace" },
    { view: "inventory", label: "Inventory", icon: PanelsTopLeft, group: "Workspace" },
    { view: "resources", label: "Content", icon: Images, group: "Workspace" },
    { view: "calendar", label: "Schedule", icon: CalendarDays, group: "Operations" },
    { view: "approvals", label: "Approvals", icon: ClipboardCheck, group: "Operations" },
    { view: "reports", label: "Performance", icon: BarChart3, group: "Insights" },
    { view: "billing", label: "Billing", icon: CreditCard, group: "Insights" },
  ],
  institutional: [
    { view: "portal", label: "Portal", icon: Globe2, group: "Workspace" },
    { view: "network", label: "Network control", icon: Map, group: "Workspace" },
    { view: "inventory", label: "Inventory", icon: PanelsTopLeft, group: "Workspace" },
    { view: "resources", label: "Content", icon: Images, group: "Workspace" },
    { view: "calendar", label: "Schedule", icon: CalendarDays, group: "Operations" },
    { view: "approvals", label: "Approvals", icon: ClipboardCheck, group: "Operations" },
    { view: "accounts", label: "Team", icon: Users, group: "Operations" },
    { view: "reports", label: "Performance", icon: BarChart3, group: "Insights" },
    { view: "billing", label: "Billing", icon: CreditCard, group: "Insights" },
  ],
  admin: [
    { view: "portal", label: "Portal", icon: Globe2, group: "Workspace" },
    { view: "discover", label: "Marketplace", icon: Map, group: "Workspace" },
    { view: "network", label: "Screen control", icon: MonitorUp, group: "Workspace" },
    { view: "campaigns", label: "Campaigns", icon: Megaphone, group: "Operations" },
    { view: "resources", label: "Content", icon: Images, group: "Operations" },
    { view: "inventory", label: "Inventory", icon: Building2, group: "Operations" },
    { view: "approvals", label: "Approvals", icon: ShieldCheck, group: "Operations" },
    { view: "accounts", label: "Accounts", icon: Users, group: "Operations" },
    { view: "reports", label: "Analytics", icon: BarChart3, group: "Insights" },
    { view: "billing", label: "Revenue", icon: CircleDollarSign, group: "Insights" },
  ],
};

const viewTitles: Record<View, { title: string; eyebrow: string }> = {
  portal: { title: "Outdoor campaign buying portal", eyebrow: "Marketplace" },
  network: { title: "Public screen network control", eyebrow: "Institution workspace" },
  discover: { title: "Map-based inventory search", eyebrow: "Plan a campaign" },
  booking: { title: "Booking request", eyebrow: "Reserve media" },
  campaigns: { title: "Campaign spaces", eyebrow: "Manage campaigns" },
  creative: { title: "Creative production suite", eyebrow: "Build and validate" },
  resources: { title: "Content management", eyebrow: "Resource library" },
  inventory: { title: "Inventory management", eyebrow: "Device network" },
  calendar: { title: "Availability calendar", eyebrow: "Scheduling" },
  approvals: { title: "Approval workflow", eyebrow: "Review queue" },
  accounts: { title: "Account management", eyebrow: "People and access" },
  reports: { title: "Campaign analytics", eyebrow: "Performance" },
  billing: { title: "Payments and billing", eyebrow: "Finance" },
};

const groups: NavItem["group"][] = ["Workspace", "Operations", "Insights"];
const governmentNav: NavItem[] = [
  { view: "network", label: "Command centre", icon: Map, group: "Workspace" },
  { view: "inventory", label: "Screens", icon: PanelsTopLeft, group: "Workspace" },
  { view: "resources", label: "Media library", icon: Images, group: "Workspace" },
  { view: "calendar", label: "Schedule", icon: CalendarDays, group: "Operations" },
  { view: "approvals", label: "Approvals", icon: ClipboardCheck, group: "Operations" },
  { view: "accounts", label: "People and access", icon: Users, group: "Operations" },
  { view: "reports", label: "Performance", icon: BarChart3, group: "Insights" },
  { view: "billing", label: "Billing", icon: CreditCard, group: "Insights" },
];

type AppSurface = "marketplace" | "government";

export function Sidebar({ role, view, setRole, setView, currentUser, surface = "marketplace" }: { role: Role; view: View; setRole: (role: Role) => void; setView: (view: View) => void; currentUser?: DbUser | null; surface?: AppSurface }) {
  const { t } = useI18n();
  const roleOptions = currentUser?.role === "admin" ? [...roleValues] : currentUser ? [currentUser.role] : [...roleValues];
  const displayRole = roleLabel(role);
  const userName = currentUser?.name ?? (role === "operator" ? "MetroScreens" : role === "institutional" ? "Civic Media Group" : role === "admin" ? "Platform Admin" : "Pulse Athletic");
  const isGovernment = surface === "government";
  const navigation = isGovernment ? governmentNav : roleNav[role];

  return (
    <aside className={`sidebar${isGovernment ? " government-sidebar" : ""}`}>
      {isGovernment ? <GovernmentBrand /> : <Brand subtitle="Media operations" />}
      {isGovernment ? (
        <div className="government-scope-card">
          <span><ShieldCheck aria-hidden="true" /></span>
          <div><small>{t("Secure workspace")}</small><strong>{t(role === "admin" ? "Cross-institution oversight" : "Institution network")}</strong></div>
        </div>
      ) : <WorkspaceSwitcher role={role} options={roleOptions} onSelect={(next) => { setRole(next); setView(roleWorkspaceView[next]); }} />}
      <nav className="nav" aria-label={isGovernment ? t("Civic Screen Operations navigation") : t("{role} navigation", { role: t(displayRole) })}>
        {groups.map((group) => {
          const items = navigation.filter((item) => item.group === group);
          if (!items.length) return null;
          return (
            <div className="nav-group" key={group}>
              <span className="nav-group-label">{t(isGovernment ? governmentGroupLabel(group) : group)}</span>
              {items.map(({ view: navView, label, icon: Icon }) => (
                <a
                  aria-current={view === navView ? "page" : undefined}
                  key={navView}
                  href={isGovernment ? `/government?view=${navView}` : portalHref(role, navView)}
                  className={view === navView ? "active" : ""}
                  onClick={isGovernment ? undefined : (event) => { event.preventDefault(); setView(navView); }}
                >
                  <Icon aria-hidden="true" />
                  <span>{t(label)}</span>
                  {view === navView ? <span className="nav-active-mark" /> : null}
                </a>
              ))}
            </div>
          );
        })}
      </nav>
      {isGovernment ? <a className="government-marketplace-link" href="/"><Globe2 aria-hidden="true" /><span>{t("Open EasyAD Platform")}</span></a> : null}
      <div className="tenant-card">
        <div className="tenant-avatar" aria-hidden="true">{userName.slice(0, 2).toUpperCase()}</div>
        <div className="tenant-identity">
          <strong>{userName}</strong>
          <small>{currentUser ? `${currentUser.email} - ${t(roleLabel(currentUser.role))}` : t("Sign in to save changes")}</small>
          <span className="tenant-role"><span />{currentUser ? t(displayRole) : t("Demo workspace")}</span>
        </div>
        {currentUser ? (
          <form action="/api/auth/logout" method="post" noValidate>{isGovernment ? <input name="returnTo" type="hidden" value="/government/login" /> : null}<button className="sidebar-signout" type="submit" title={t("Sign out")}><LogOut aria-hidden="true" /><span>{t("Sign out")}</span></button></form>
        ) : (
          <a className="sidebar-signout" href={isGovernment ? "/government/login" : "/login"}><LogOut aria-hidden="true" /><span>{t("Sign in")}</span></a>
        )}
      </div>
    </aside>
  );
}

function GovernmentBrand() {
  const { t } = useI18n();
  return (
    <div className="government-brand">
      <span className="government-brand-mark"><Building2 aria-hidden="true" /><i /></span>
      <div><small>{t("EasyAD Platform")}</small><strong>{t("Civic Screen Operations")}</strong><span>{t("Public display command")}</span></div>
    </div>
  );
}

function governmentGroupLabel(group: NavItem["group"]) {
  if (group === "Workspace") return "Command centre";
  if (group === "Operations") return "Fleet operations";
  return "Oversight";
}

function WorkspaceSwitcher({ role, options, onSelect }: { role: Role; options: Role[]; onSelect: (role: Role) => void }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function closeOnOutsidePointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className={`workspace-switcher${open ? " is-open" : ""}`} ref={rootRef}>
      <button aria-expanded={open} aria-haspopup="listbox" aria-label={t("Workspace")} className="workspace-switcher-button" onClick={() => setOpen((current) => !current)} type="button">
        <span className="workspace-switcher-icon"><LayoutDashboard aria-hidden="true" /></span>
        <span className="workspace-switcher-copy"><small>{t("Active workspace")}</small><strong>{t(roleLabel(role))}</strong></span>
        <ChevronDown className="workspace-switcher-chevron" aria-hidden="true" />
      </button>
      {open ? (
        <div aria-label={t("Available workspaces")} className="workspace-menu" role="listbox">
          {options.map((option) => (
            <button
              aria-label={t(roleLabel(option))}
              aria-selected={option === role}
              className={option === role ? "selected" : ""}
              key={option}
              onClick={() => { onSelect(option); setOpen(false); }}
              role="option"
              type="button"
            >
              <span>{t(roleLabel(option))}</span>
              {option === role ? <Check aria-hidden="true" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function Topbar({ view, visibleCount, inventory, bookings, surface = "marketplace" }: { view: View; visibleCount: number; inventory: InventoryItem[]; bookings: Booking[]; surface?: AppSurface }) {
  const { locale, t } = useI18n();
  const averageOccupancy = inventory.length ? Math.round(inventory.reduce((sum, item) => sum + item.occupancy, 0) / inventory.length) : 0;
  const bookedValue = bookings.reduce((sum, booking) => sum + booking.spend, 0);
  const title = viewTitles[view];
  const isGovernment = surface === "government";
  return (
    <header className={`topbar${isGovernment ? " government-topbar" : ""}`}>
      <div className="topbar-title">
        <p className="eyebrow">{t(isGovernment ? "Civic Screen Operations" : title.eyebrow)}</p>
        <h1>{t(isGovernment && view === "network" ? "Screen network command centre" : title.title)}</h1>
      </div>
      {isGovernment && view === "network" ? <div className="government-session-status"><span /><div><strong>{t("Institution systems")}</strong><small>{t("Authenticated operating session")}</small></div></div> : null}
      <div className="topbar-tools">
        {view !== "network" ? <div className="metrics" aria-label={t("Workspace summary")}>
          <div><MapPin aria-hidden="true" /><span>{visibleCount}</span><small>{t("Matching units")}</small></div>
          <div><Gauge aria-hidden="true" /><span>{averageOccupancy}%</span><small>{t("Average occupancy")}</small></div>
          <div><CircleDollarSign aria-hidden="true" /><span>{money(bookedValue, locale)}</span><small>{t("Booked value")}</small></div>
        </div> : null}
        <LanguageSelector placement="embedded" />
      </div>
    </header>
  );
}
