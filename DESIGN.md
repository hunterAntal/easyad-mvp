---
version: alpha
name: "EasyAD Platform"
description: "A civic-infrastructure-inspired outdoor-media marketplace and operations console for advertisers, screen operators, institutions, and local government."
colors:
  background: "#F3F5F7"
  panel: "#FFFFFF"
  ink: "#131B24"
  muted: "#5B6770"
  line: "#E4E8EA"
  primary: "#1F7A5A"
  primary-dark: "#14503C"
  info: "#2F5F9F"
  warning: "#C18A28"
  danger: "#B84F3F"
  navigation: "#111B22"
typography:
  sans:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace"
rounded:
  DEFAULT: "12px"
  sm: "9px"
  workspace-control: "6px"
  workspace-panel: "8px"
spacing:
  workspace-gap: "16px"
  section-gap: "28px"
  page-inline: "56px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.panel}"
    rounded: "{rounded.workspace-control}"
  button-primary-hover:
    backgroundColor: "{colors.primary-dark}"
    textColor: "{colors.panel}"
  button-warning:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.ink}"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.panel}"
  panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.workspace-panel}"
  supporting-text:
    textColor: "{colors.muted}"
  divider:
    backgroundColor: "{colors.line}"
  information-status:
    backgroundColor: "{colors.info}"
    textColor: "{colors.panel}"
  navigation:
    backgroundColor: "{colors.navigation}"
    textColor: "{colors.panel}"
  map:
    backgroundColor: "{colors.background}"
  device-preview:
    backgroundColor: "{colors.navigation}"
    rounded: "{rounded.workspace-panel}"
---

# EasyAD Platform Design System

## Overview

### Creative North Star

The product should feel like a well-run municipal operations room crossed with a physical media-control rack: clear status lamps, geographic context, bounded control surfaces, and an unmistakable distinction between routine publishing and emergency interruption. The public portal may be expressive; authenticated operations stay calm and dense.

### Product context and register

- **Audience and primary job:** Advertisers find and book outdoor media; operators maintain inventory; institutions and local governments control their own screen fleets and public messages; super admins oversee the marketplace.
- **Target market(s) and evidence:** The current product data and seed inventory are Canadian and centered on Thunder Bay, Ontario. The interface remains broadly North American and English-first.
- **Locale(s) and language policy:** English (`en`) and Canadian French (`fr`) are active. English is the default, while Quebec-region requests default to French until the person explicitly chooses a language. The locale cookie is canonical across public and authenticated website routes. Standalone `/devices/[id]` playback instead uses the language saved on that device in the dashboard; owned copy, accessible names, dates, numbers, and CAD currency follow the applicable locale.
- **Usage scene:** Desktop-first planning and operations with responsive access on phones. Fleet and emergency controls are used in time-sensitive, high-attention situations.
- **Register:** Hybrid. The landing route is a brand/marketing surface; authenticated workspaces are product/admin surfaces. `/government/about` is the public civic-information surface, `/government/login` is the civic trust surface, and `/government` is a business-named operations-shell variant for institutions and local government.
- **Memorable signature:** A map-to-screen control surface: choosing a physical device immediately reveals a faithful 16:9 representation of what the screen is generally showing.
- **Restraint:** Forms, publishing controls, permission states, alerts, and data lists use familiar product patterns with minimal decoration.
- **Anti-references:** Avoid generic gradient-card SaaS dashboards, consumer-social visual language, hidden critical actions, and emergency controls that resemble routine campaign actions.
- **Token ownership/runtime mapping:** Existing runtime CSS is canonical (Model B). This file mirrors accepted values from [`app/globals.css`](app/globals.css); component CSS consumes those variables or documented compact workspace variants. Drift is checked through the premium static audit and rendered-screen review.

## Colors

`primary` and `primary-dark` identify safe primary actions, selection, and focus. `info` supports maps and neutral system information. `warning` is reserved for caution and emergency-preparation states; `danger` is reserved for destructive or active high-impact states. `navigation` anchors the persistent operations shell. Emergency screens may use a high-contrast amber/black composition, but routine cards must not borrow that urgency.

The application is light-theme only today. Focus, text, and controls target WCAG 2.2 AA. Forced-colors mode must retain system-operable outlines and scrollbars.

## Typography

Inter with system fallbacks is the canonical product face. It is used at normal tracking in authenticated workspaces; the public hero may use scale and weight for expression. Monospace is reserved for API paths and machine identifiers. Labels use sentence case except established short uppercase eyebrows. Numerical status values use tabular alignment where comparison matters.

## Layout

The authenticated shell uses a 244px desktop sidebar and a natural-height document workspace. The Civic Screen Operations variant keeps that geometry and every shared workspace component, but replaces marketplace workspace switching with a fixed institution scope card, civic masthead, and government-route navigation. Panels use a 16px gap and compact internal padding. Map and preview surfaces own their bounded aspect or scroll behavior; they must not impose viewport height or overflow constraints on sibling forms. Public sections use up to 56px inline space at wide viewports and collapse to one column below the existing 900px breakpoint. The marketplace advertises the civic product only through a compact final-page gateway; detailed institutional positioning belongs to `/government/about`, keeping the top navigation focused on marketplace actions.

## Elevation & Depth

Hierarchy comes from tonal layers, borders, and restrained shadows. Workspace panels use the existing small shadow; overlays use the large shared shadow. Maps and screen previews may sit one elevation above supporting controls. Static status blocks do not receive decorative floating shadows.

## Shapes

Public surfaces use 9–12px radii. Dense workspace controls use 6px and panels use 8px. Status pills may be fully rounded when they encode state; ordinary buttons do not become pills. Device previews preserve their physical screen aspect and use a modest frame radius.

## Components

### Foundational visual states

Every interactive component defines default, hover, focus-visible, active, disabled, and busy states without changing its footprint. Selection combines border, surface, and text/icon cues. Loading uses the app-owned spinner or stable pending copy; skeletons are not a default. Warning and error states include text, not color alone.

### Buttons and actions

Primary green is for the main safe action. Neutral dark/outline buttons handle secondary work. Warning amber identifies reversible caution. Danger red is reserved for destructive or high-impact final confirmation. Busy labels retain control dimensions and block duplicate activation.

### Navigation and data display

The dark sidebar is the canonical authenticated navigation. Civic Screen Operations is its named government variant: it uses the same navy, green, and blue tokens with a building-and-status-lamp identifier and does not introduce a second palette. Current items use the green/blue selection wash and an accessible `aria-current`. Data lists retain stable row geometry and transform to stacked records when narrow. The fleet map and device list remain synchronized to one selected device. At city scale, device locations use compact, accessible teardrop buttons without embedded labels so geographic context remains readable; neutral slate means unselected and primary green means selected, reinforced by accessible pressed state and the synchronized device list. Below city scale, individual device pins give way to green city-availability count markers anchored to one representative matching device. The visible marker shows only the device count, while its accessible name identifies the city and interaction; activating it centers and zooms into that city. The public portal uses an availability-only map variant: it shows available-device and city markers without selection, competitor markers, search-radius graphics, or campaign-status overlays.

The shared language control is embedded at the far right of public and authenticated top bars, directly after the primary top-bar action where present. Its compact trigger opens the complete language menu on hover, click, or keyboard focus; non-shell routes use the same component as a floating fallback. Standalone device playback is the deliberate exception: `/devices/[id]` contains no website language control or other interactive chrome, and its configured display language is managed from the inventory dashboard.

### Forms and overlays

Fields use shared border, radius, hover, and focus tokens. Native select and date popups are accepted for the current English/French product; their operating-system-owned popup geometry and localized presentation are part of the supported contract. App-owned validation and errors remain in-page. Dialogs use the shared modal primitive, stay within the visual viewport, trap focus, close with Escape when safe, and restore focus. Toasts are acknowledgements only.

### Iconography

Lucide is the canonical icon family, using consistent outline strokes. Icons reinforce labels; unfamiliar or high-impact actions always keep visible text.

### Motion

Motion communicates selection, entry, and confirmation at roughly 140–260ms. No perpetual decorative motion appears in the workspace. `prefers-reduced-motion` removes transforms and nonessential transitions.

### Content and data visualization

Copy names what people control: devices, screens, content, publishing, and emergency overrides. Status vocabulary stays literal (`Published`, `Unpublished`, `Active override`). The UI never implies that a screen-only emergency override has been issued through an official public-alerting system.

## Do's and Don'ts

- **Do:** Make geographic selection, device status, and screen content legible in one view.
- **Do:** Visually separate routine content publishing from emergency interruption and require an explicit confirmation for the latter.
- **Don't:** Introduce a second token palette or fork the shared dashboard functionality for institutional tools; use the documented Civic Screen Operations shell variant.
- **Don't:** Hide permission limits, publish uncertainty, or alert scope behind icon-only controls or transient toasts.
