# Vendor Compliance Copilot - Design Guidelines

## Design Approach

**Selected Approach**: Design System - Enterprise SaaS Pattern  
**Primary References**: Linear (modern enterprise UI), Asana (dashboard clarity), Notion (content organization)  
**Rationale**: Enterprise compliance tool requiring data density, clear hierarchy, and professional trust signals

## Typography System

**Font Stack**: Inter (primary), system-ui fallback via Google Fonts CDN

**Scale**:
- Page titles: text-3xl font-semibold
- Section headers: text-2xl font-semibold  
- Card/panel titles: text-lg font-medium
- Body text: text-base font-normal
- Table headers: text-sm font-semibold uppercase tracking-wide
- Helper text/metadata: text-sm text-gray-600
- Buttons: text-sm font-medium

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12** consistently
- Component padding: p-4 to p-6
- Section gaps: gap-4 to gap-8
- Page margins: p-6 to p-8
- Card spacing: p-6

**Grid System**: 
- Dashboard: 12-column responsive grid
- Tables: Full-width with fixed column widths
- Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 for stats/metrics

## Core Components

### Dashboard Layout
- **Top Navigation**: Fixed header with logo, global search, notifications, user menu (h-16)
- **Sidebar**: Persistent left navigation (w-64), collapsible on mobile, icons + labels
- **Main Content**: max-w-7xl with proper content spacing, starts below header

### Navigation Structure
Primary nav items: Dashboard, Vendors, Documents, Compliance Reports, Settings
Each with appropriate Heroicons (outline style)

### Vendor List/Table View
- Filterable data table with: Vendor Name, Category, Risk Badge, Compliance %, Status, Actions
- Row height: comfortable (h-14)
- Zebra striping for readability
- Sticky header on scroll
- Batch action bar when items selected

### Vendor Detail Page
Two-column layout (lg:grid-cols-3):
- **Left (2/3)**: Tabs for Documents, Activity Log, Details
- **Right (1/3)**: Sticky sidebar with Vendor Info Card, Quick Stats, Contact Info

### Document Cards
Grid layout showing:
- Document type icon/name
- Status badge (Missing/Pending/Approved/Expired/Rejected)
- Expiry date with countdown
- Action button (Upload/Review/Renew)
- Last updated timestamp
Min height: h-40, hover elevation effect

### Compliance Dashboard
**Hero Stats Section**: 4-column grid (grid-cols-4)
- Overall Compliance %
- Vendors at Risk
- Expiring This Month  
- Pending Reviews

Each stat card: Large number (text-4xl font-bold), label (text-sm), trend indicator

**Charts Area**: 
- Compliance by Category (horizontal bar chart)
- Expiration Timeline (line/area chart)
- Risk Distribution (donut chart)

### Status Badges
Pill-shaped badges with icons:
- Approved: Green checkmark
- Pending: Yellow clock
- Expired: Red alert
- Missing: Gray dash
- Rejected: Red x
Size: px-3 py-1 text-xs font-medium rounded-full

### Vendor Portal (External)
Single-page view with centered card (max-w-4xl):
- Company logo header
- Welcome message with vendor name
- Document checklist with clear upload CTAs
- Progress indicator at top
- Minimal, focused design - no sidebar

### Forms & Inputs
- Label above input: text-sm font-medium mb-2
- Input height: h-11
- Rounded corners: rounded-md
- Focus states: ring-2 offset-0
- Required field indicators: Red asterisk
- Helper text below: text-sm text-gray-600 mt-1

### Modals & Overlays
- Document review modal: max-w-4xl with document preview on left, approval form on right
- Confirmation dialogs: max-w-md centered
- Slide-over panels for filters: w-96 from right

### Notifications & Alerts
Toast notifications: Fixed bottom-right (bottom-4 right-4)
Inline alerts: Full-width with icon, message, dismiss button
Banner alerts: Sticky top for system-wide messages

### Buttons
- Primary CTA: px-4 py-2 rounded-md font-medium
- Secondary: Same with outline/ghost variant
- Icon buttons: Square (h-10 w-10) with centered icon
- Destructive actions: Red variant
- Loading states: Spinner + disabled opacity

### Tables
- Fixed layout with defined column widths
- Actions column: Always right-aligned (w-24)
- Sortable headers: Hover shows sort icon
- Empty states: Centered illustration + message + CTA
- Pagination: Bottom-right with page size selector

## Icons
**Library**: Heroicons (outline) via CDN
Common icons: CheckCircle, XCircle, Clock, AlertTriangle, Upload, Download, ChevronDown, Search, Bell, User, Cog

## Images

**Dashboard Header**: Optional branded illustration (max-h-48) showing compliance concept - supplier network, documents, checkmarks. Subtle, professional illustration style.

**Empty States**: Small illustrations (max-w-xs) for:
- No vendors added yet
- No documents uploaded  
- No pending reviews
- Filtered results empty

**Vendor Portal Welcome**: Subtle background pattern or abstract compliance imagery (opacity-10) behind the card

**No large hero image** - this is a functional dashboard application

## Accessibility
- All interactive elements: min-h-11 touch target
- Form labels: Properly associated with inputs
- Error messages: aria-live regions
- Focus indicators: Visible ring on all interactive elements
- Color never sole indicator: Always pair with icons/text

## Animation
Minimal, purposeful only:
- Table row hover: Slight background change
- Card hover: Subtle shadow elevation
- Modal entry: Fade + scale (200ms)
- Toast slide-in: From right (300ms)
- Loading spinners: Smooth rotation

## Responsive Behavior
- Mobile: Stack cards vertically, collapsible sidebar → hamburger menu
- Tablet: 2-column layouts become single column
- Desktop: Full multi-column dashboard layouts
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)