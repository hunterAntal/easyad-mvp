# Demo Users and Devices

## Phase 1 static inventory

| Stable ID | Inventory unit | Delivery mode | Specification |
|---|---|---|---|
| `INV-DEMO-STATIC-001` | Memorial Avenue Bulletin Face | Static | `SPEC-INV-DEMO-STATIC-001`, face-specific 3048 × 1524 mm trim |
| `INV-DEMO-STATIC-002` | Balmoral Campus Poster Face | Static | `SPEC-INV-DEMO-STATIC-002`, face-specific 1219 × 1829 mm trim |

These fixtures intentionally use different production requirements. They must not be consolidated into a universal static-art specification.

This is the canonical reference for the local demo identities and device ownership graph. The data is intentionally fictional and may be recreated with:

```bash
npm run seed:demo-data
```

Login emails and passwords are stored only in the ignored local file `DEMO_ACCOUNTS.md`. That file must never be committed or uploaded. The seed refuses non-local and production databases unless `ALLOW_REMOTE_DEMO_DATA=1` is explicitly set. Rerunning it is idempotent: it restores the accounts, passwords, active status, memberships, and device fields without deleting bookings, media, or other application data.

## Role model

- Governmental and other institutional owners both use the persisted `institutional` role. The governmental distinction is expressed by the organization identity and device tags because the current database has no separate `governmental` role.
- An `institutional` account owns every device whose `institution_id` equals that account's user ID. The owner can manage and directly publish across its complete fleet.
- An `operator` belongs to one owner through `users.institution_id`. It can manage that owner's devices, but its new devices and media follow operator approval rules.
- A common ad buyer uses the `advertiser` role. Advertisers can discover inventory, book placements, pay, and submit creative; they do not own devices.
- `inventory.created_by` records the person who initially manages the seeded record. Authorization is based on the owning `inventory.institution_id`, so the owner and all of its delegated operators can manage the device.

## Governmental users

| Stable user ID | Name | Role | Membership / capacity |
|---|---|---|---|
| `USR-DEMO-GOV-TB` | City of Thunder Bay Screen Operations | `institutional` | Government owner; 4 operator seats |
| `USR-DEMO-GOV-OP-01` | Maya Chen — Civic Screen Operator | `operator` | Member of `USR-DEMO-GOV-TB` |
| `USR-DEMO-GOV-OP-02` | Noah Martin — Civic Communications | `operator` | Member of `USR-DEMO-GOV-TB` |

The governmental owner signs in at `/government/login`. Delegated operators use `/login`.

## Institutional users

| Stable user ID | Name | Role | Membership / capacity |
|---|---|---|---|
| `USR-DEMO-INST-LU` | Lakehead University Campus Media | `institutional` | Institution owner; 3 operator seats |
| `USR-DEMO-INST-OP-01` | Priya Singh — Campus Media Operator | `operator` | Member of `USR-DEMO-INST-LU` |

The institutional owner signs in at `/government/login` because that route is the product's shared institutional-owner workspace. The delegated operator uses `/login`.

## Common users (ad buyers)

| Stable user ID | Name | Role |
|---|---|---|
| `USR-DEMO-ADV-01` | Northline Fitness Marketing | `advertiser` |
| `USR-DEMO-ADV-02` | Atlas Grocery Campaign Team | `advertiser` |
| `USR-DEMO-ADV-03` | North Shore Media Buying | `advertiser` |

North Shore Media Buying is also an `agency` organization fixture with client `CLI-DEMO-NORTH-SHORE-01` (Harbour Dental Group) and brand `BRD-DEMO-HARBOUR-01` (Harbour Smiles). This provides a stable agency/client planning path when `FEATURE_AGENCY_WORKSPACE=true`.

Ad buyers sign in at `/login`.

## Government-owned devices

All three devices have `institution_id = USR-DEMO-GOV-TB` and are manageable by the governmental owner and both of its delegated operators.

| Stable device ID | Device | Format / template | Initial manager | State |
|---|---|---|---|---|
| `INV-DEMO-GOV-001` | Thunder Bay City Hall Civic Screen | digital / public-info | `USR-DEMO-GOV-OP-01` | approved, published inventory |
| `INV-DEMO-GOV-002` | Marina Park Community Display | digital / community | `USR-DEMO-GOV-OP-01` | approved, published inventory |
| `INV-DEMO-GOV-003` | Water Street Transit Terminal Display | transit / transit | `USR-DEMO-GOV-OP-02` | approved, published inventory |

## Institution-owned devices

All three devices have `institution_id = USR-DEMO-INST-LU` and are manageable by the university owner and its delegated operator.

| Stable device ID | Device | Format / template | Initial manager | State |
|---|---|---|---|---|
| `INV-DEMO-INST-001` | Lakehead University Agora Screen | digital / community | `USR-DEMO-INST-OP-01` | approved, published inventory |
| `INV-DEMO-INST-002` | Lakehead Athletics Centre Entrance Display | digital / weather | `USR-DEMO-INST-OP-01` | approved, published inventory |
| `INV-DEMO-INST-003` | Lakehead University Transit Shelter | transit / transit | `USR-DEMO-INST-LU` | approved, published inventory |

## AI generation contract

When generating fixtures, tests, screenshots, campaigns, media, alerts, or narratives from this dataset:

1. Treat the stable IDs in this file as immutable identifiers. Read local login details from the ignored `DEMO_ACCOUNTS.md` only when credentials are required.
2. Use `USR-DEMO-GOV-TB` for government-owned records and `USR-DEMO-INST-LU` for university-owned records.
3. Keep delegated operators inside their documented institution; do not attach advertisers to an institution.
4. Use `inventory.institution_id` as the ownership boundary and `inventory.created_by` only as provenance.
5. Use the application coordinate fields `x` and `y` as map percentages, not longitude and latitude.
6. Keep all names and credentials fictional and local-development-only.
