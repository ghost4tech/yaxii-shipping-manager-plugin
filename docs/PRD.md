# Yaxii Shipping Manager — Product Requirements Document

## 1. Product Summary

**Product name:** Yaxii Shipping Manager
**Product type:** Free WordPress/WooCommerce plugin
**Target platform:** WordPress.org Plugin Directory
**Primary market:** Algeria
**Primary users:** WooCommerce merchants, COD store owners, agencies, WordPress developers

Yaxii Shipping Manager helps Algerian WooCommerce stores configure and manage shipping zones through a clean React admin interface instead of forcing users to deal with WooCommerce's default shipping-zone UX.

The first release is free. Its goal is practical merchant and agency usefulness while staying acceptable for the WordPress.org Plugin Directory.

## 2. Product Positioning

Yaxii Shipping Manager is:

> Algeria shipping setup for WooCommerce.

It is not a full courier integration platform in v1.
It is not Yaxii Smart Form Shipping Manager.
It is not a replacement for Yaxii Smart Form.
It is not a provider dispatch tool.

The plugin starts as a simple and useful setup assistant:

- Choose Algeria dataset mode
- Select wilayas
- Set home delivery prices
- Set office/stopdesk prices
- Preview WooCommerce shipping-zone changes
- Apply changes safely
- Manage prices later from a better UI
- Diagnose whether WooCommerce checkout will show shipping methods

## 3. Strategic Goals

### Primary Goals

1. Help Algerian merchants configure WooCommerce shipping quickly.
2. Help agencies reuse a clean setup flow across client stores.
3. Prevent WooCommerce checkout from showing “no shipping methods available.”
4. Establish a trustworthy local-first plugin foundation.
5. Leave room for a future bridge with Yaxii Smart Form shipping data without implementing it in the MVP.

### Non-Goals for Free MVP

The free MVP must not include:

- Licensing
- Paid/pro locks
- Telemetry
- Hidden remote calls
- Provider dispatch APIs
- Yalidine/ZR/Maystro sending
- Full YSF sync
- Scheduled automation
- Commune-level custom shipping engine
- Multi-country support
- Aggressive product upsells
- Dashboard spam notices

## 4. User Personas

### Merchant

A non-technical WooCommerce store owner selling with cash on delivery in Algeria.

Needs:

- Fast shipping setup
- Clear wilaya names
- Simple price editing
- No technical WooCommerce confusion
- Safe changes that do not break checkout

### Agency / Developer

A person configuring multiple WooCommerce stores for clients.

Needs:

- Fast setup wizard
- CSV import/export
- Repeatable shipping templates
- Diagnostics
- Clear preview before applying changes
- Low support burden

### Yaxii Ecosystem User

A merchant using or considering Yaxii Smart Form, Yaxii Confirm, or Yaxii COD Theme.

Needs:

- WooCommerce fallback checkout not broken
- Shipping methods consistent with COD workflow
- Future YSF sync/import path, explicitly outside the MVP

## 5. Core User Problems

### Problem 1 — WooCommerce Shipping UX Is Hard

WooCommerce shipping zones are powerful but confusing for Algerian COD merchants. Users often do not understand zones, methods, ordering, flat rates, and fallback behavior.

### Problem 2 — Algeria Location Data Is Missing or Poorly Represented

Stores need Algeria wilayas and communes/cities in a clean dataset. WooCommerce setups often rely on incomplete, old, or inconsistent location data.

### Problem 3 — Checkout Can Break

If WooCommerce checkout is not configured correctly, customers may reach checkout and see no available shipping method.

This is especially dangerous for stores using Yaxii Smart Form as the main order creator, because some customers can still leak into native WooCommerce checkout.

### Problem 4 — Agencies Need Repeatable Setup

Agencies do not want to manually configure shipping zones every time. They need a reusable process and import/export support.

## 6. Dataset Requirements

The plugin must support Algeria shipping datasets.

### Dataset Modes

1. **Current Algeria Dataset**
   - Current verified Algeria shipping dataset.
   - Default mode for new stores.
   - Must not label delegated, legacy, or provider-specific rows as official wilayas unless verified.

2. **Legacy Algeria Dataset**
   - Compatibility mode for stores and provider tables that still expect the legacy 58-row shape.
   - Must be clearly labeled as compatibility data, not a newer official wilaya count.

### Dataset Rules

- Do not use “68 wilayas.”
- Do not mislabel delegated areas as official wilayas.
- Dataset must include stable codes.
- Dataset must include French and Arabic names.
- Dataset must preserve UTF-8 correctly.
- Dataset must be versioned.
- Dataset must be locally bundled.
- Dataset must not require remote calls.
- Communes/cities are included as dataset/reference/mapping data first.
- Commune-level pricing is not part of free MVP unless a real custom WooCommerce shipping method is explicitly scoped.

## 7. Free MVP Scope

The free MVP should include the following features.

### 7.1 Admin Dashboard

Purpose:

Show setup health and guide the user to the next action.

Must show:

- WooCommerce detected / missing
- Dataset mode
- Configured wilayas
- Missing shipping zones
- Checkout protection status
- Next recommended action

Must not show:

- Aggressive upsells
- Pro locks
- Product marketplace
- Remote product feed

### 7.2 Setup Wizard

Purpose:

Let users configure shipping in minutes.

Setup paths:

1. **Quick Setup**
   - Use default dataset
   - Enable all current wilayas
   - Apply default home/office prices
   - Go to preview

2. **Manual Setup**
   - Choose dataset mode
   - Select wilayas
   - Set prices
   - Go to preview

3. **CSV Import**
   - Upload a local CSV
   - Validate rows
   - Show errors
   - Go to preview

Wizard must end in a preview/dry-run plan before any write action.

### 7.3 Shipping Manager

Purpose:

Let users manage shipping prices from Yaxii Shipping Manager instead of WooCommerce’s default shipping-zone UX.

Free MVP fields:

- Wilaya code
- Wilaya name FR
- Wilaya name AR
- Enabled / disabled
- Home delivery enabled
- Home delivery price
- Office/stopdesk enabled
- Office/stopdesk price
- WooCommerce zone status
- Conflict status
- Last applied / last synced status

Free MVP actions:

- Edit price
- Bulk set home price
- Bulk set office price
- Enable selected
- Disable selected
- Preview changes
- Discard changes
- Save local settings
- Apply safe plan after preview engine exists

### 7.4 Diagnostics

Purpose:

Show whether WooCommerce checkout is safe.

Must detect:

- WooCommerce active / inactive
- Shipping enabled / not enabled
- Missing wilaya zones
- Duplicate zones
- Manual zones
- Yaxii-managed zones
- Disabled methods
- Rest-of-world fallback risk
- Checkout method availability for selected wilaya

### 7.5 Checkout Simulator

Purpose:

Let the user choose a wilaya and see what a customer would see at checkout.

Must show:

- Matching WooCommerce zone
- Available shipping methods
- Home delivery price
- Office delivery price
- Risk message if no method appears
- Conflict warning if multiple/manual zones overlap

### 7.6 Preview Planner

Purpose:

Generate a dry-run plan before writing to WooCommerce.

Plan groups:

- Zones to create
- Zones to update
- Methods to add
- Methods to update
- Manual zones skipped
- Conflicts
- Warnings
- Unchanged items

The preview planner must not write anything.

### 7.7 Safe Apply Engine

Purpose:

Apply the previewed plan safely.

Rules:

- Only applies after preview exists.
- Requires explicit confirmation.
- Requires capability and nonce checks.
- Creates/updates only Yaxii-managed zones by default.
- Skips manual zones by default.
- Does not delete merchant zones by default.
- Logs every create/update/skip/failure.
- Must be idempotent where possible.
- Must report partial failures clearly.

### 7.8 CSV Import / Export

Purpose:

Help agencies and merchants configure pricing faster.

Free MVP CSV fields:

```csv
wilaya_code,wilaya_name,enabled,home_enabled,home_price,office_enabled,office_price
16,Alger,1,1,500,1,300
31,Oran,1,1,700,1,400
```

CSV rules:

- Local file only.
- No remote parsing.
- Validate unknown wilaya codes.
- Validate missing prices.
- Validate invalid decimals.
- Show invalid rows before import.
- Export current plugin configuration.

## 8. Coming Later / Roadmap

### 8.1 Yaxii Smart Form Bridge

Purpose:

Let Yaxii Smart Form shipping configuration become the source of truth and mirror fallback shipping methods into WooCommerce checkout.

Modes:

1. Manual mode
2. Import from YSF
3. Sync from YSF

Not part of free MVP implementation.

YSF Sync may appear only as disabled/coming-later informational UI.

### 8.2 Provider Price Imports

Future unscheduled possibility, outside the MVP.

Possible sources:

- Yalidine price tables
- ZR Express price tables
- Maystro price tables
- CSV provider templates

Not provider dispatch.

### 8.3 Advanced Automation

Future unscheduled possibility, outside the MVP.

Examples:

- Scheduled price changes
- Seasonal shipping campaigns
- Bulk rule changes
- Agency templates
- Backup/restore snapshots
- Price history

### 8.4 Custom DZ Shipping Method

Future advanced feature.

Purpose:

Support real commune/city-level pricing in WooCommerce checkout.

This requires a proper WooCommerce shipping method, not native zone hacks.

Not part of free MVP.

## 9. WordPress.org Compliance Requirements

The plugin must be acceptable for WordPress.org.

Requirements:

- GPL-compatible
- No telemetry
- No hidden remote calls
- No external CDN assets
- No obfuscated code
- No misleading claims
- No aggressive upsells
- No fake Pro lock system in first release
- No dashboard spam
- No destructive actions without explicit confirmation
- Source code and build instructions included
- User-facing strings translation-ready
- Input sanitized
- Output escaped
- REST routes capability checked
- State-changing routes nonce protected

## 10. Technical Architecture Requirements

### Backend

Namespace:

`Yaxii\ShippingManager`

Prefix:

`yaxii_shipping_manager`

Text domain:

`yaxii-shipping-manager`

Backend must include:

- Main plugin bootstrap
- Admin page
- Asset loading only on plugin screen
- WooCommerce dependency guard
- REST API bridge
- Dataset repository
- Settings repository
- WooCommerce zone reader
- Diagnostics service
- Preview planner
- Safe apply service later

### Frontend

React app must be adapted for WordPress admin.

Rules:

- Static Vite build
- No SSR requirement
- No external CDN
- No Lovable telemetry
- wp-admin-safe routing
- REST API client
- Loading/error/empty states
- RTL-aware
- French/Arabic-ready
- Mock data isolated and removed task by task

## 11. MVP Release Criteria

Do not release until:

1. Plugin activates without fatal errors.
2. WooCommerce inactive state is handled gracefully.
3. React admin page loads only inside plugin screen.
4. Dataset mode works.
5. Wizard can configure local pricing intent.
6. Settings persist.
7. WooCommerce zones can be read safely.
8. Diagnostics show real WooCommerce state.
9. Preview planner works without writing.
10. Safe apply engine creates/updates only Yaxii-managed zones.
11. Manual zones are skipped by default.
12. CSV import/export works locally.
13. WordPress.org rules are respected.
14. Plugin Check issues are resolved or documented.
15. No Pro locks or fake paid features exist in the MVP UI.
16. No telemetry or remote calls exist.

## 12. First Implementation Roadmap

### TASK-ENV-001 — Agent Harness + Repository Normalization

Create AGENTS.md, CLAUDE.md, inspect Git root, inspect skills, and define safe repo workflow.

### TASK-ENV-002 — Product Reference Docs

Create PRD and architecture reference documents.

### TASK-001 — Plugin Foundation + React Mount

Create WordPress plugin shell, admin page, local asset enqueue, REST bootstrap endpoint, and mount React app safely.

### TASK-002 — Dataset Hardening

Replace mock dataset with verified current and legacy Algeria datasets.

### TASK-003 — Settings Persistence

Persist dataset mode, enabled wilayas, delivery methods, and prices.

### TASK-004 — Read-Only WooCommerce Diagnostics

Read existing WooCommerce zones/methods and return checkout safety diagnostics.

### TASK-005 — Preview Planner

Generate dry-run plan with create/update/skip/conflict groups.

### TASK-006 — Safe Apply Engine

Apply previewed plan safely to WooCommerce shipping zones.

### TASK-007 — CSV Import / Export

Add local CSV import/export for agency workflows.

### TASK-008 — WordPress.org Release Hardening

Run Plugin Check, i18n review, accessibility pass, build packaging, readme, screenshots, and release audit.
