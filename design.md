# LMS UI/UX Design System

---

## Layout & Navigation

### Page Structure

* Page container: max-width 1400px, centered, padding 24px
* Header region: contains breadcrumb, title, action buttons
* Sidebar: 256px expanded / 64px collapsed, toggle at top
* Mobile drawer: 280px width, overlay bg-black/50

### Breadcrumbs

* Format: `Admin / Students / [Name]` with chevron separators
* All segments clickable except current page
* Visible on all pages except login
* Persists across page navigation

### Sidebar

* User avatar + name + role displayed in card at top
* Brand label: "LMS Admin" (admin role), "LMS" (student role)
* Toggle button to collapse/expand
* State persisted in localStorage

### Sub-Navigation

* Horizontal tabs below page title
* Used for sections with multiple views (e.g., Overview | Activity | Documents)
* Active tab: bottom border accent + bold text

### Mobile Behavior

* Hamburger menu triggers slide-in drawer
* Drawer closes on outside click and Escape key

---

## Visual Hierarchy

### Typography Scale

| Element | Size | Weight |
|---------|------|--------|
| Page Title (h1) | 24px | Bold |
| Section Header (h2) | 20px | Semibold |
| Card Title (h3) | 16px | Semibold |
| Body | 14px | Regular |
| Caption | 12px | Regular |

### Button Styles

* Primary: Filled indigo, darken 10% on hover
* Secondary: Outline style
* Destructive: Red outline style

### Status Badges

* Pill shape with semantic colors:
  * Approved: green
  * Pending: amber
  * Rejected: red
  * Draft: blue

### Visual Grouping

* Related fields: bg-muted/30 background, 16px padding
* Section dividers: border-b border-border, 32px vertical margin
* Empty state: 48px icon + 16px semibold title + 14px muted description + action button

### Hover Effects

* Primary buttons: darken 10%
* Cards: subtle shadow increase
* Transition duration: 150ms ease

---

## Spacing & Alignment

### Spacing Tokens

| Token | Value | Application |
|-------|-------|--------------|
| xs | 4px | Icon gaps |
| sm | 8px | Chips, tight groupings |
| md | 16px | Default element gap |
| lg | 24px | Card padding, section gaps |
| xl | 32px | Major section separation |

### Grid Layouts

* Forms: grid-cols-1 md:grid-cols-2 lg:grid-cols-3, gap-4
* Dashboard stats: grid-cols-1 md:grid-cols-2 lg:grid-cols-4, gap-4
* Tables: full-width, cell padding 16px

### Component Sizing

* Card padding: 24px
* Button padding: 10px 16px
* Input height: 40px
* Table row height: 56px minimum

### Border Radius

* Cards: 12px (rounded-xl)
* Buttons: 8px (rounded-lg)
* Inputs: 8px (rounded-lg)
* Badges: full (rounded-full)
* Avatars: full (rounded-full)

---

## Form Experience

### Step Indicator

* Horizontal steps with numbered circle + label
* Completed steps: checkmark icon
* Below indicator: "Step X of Y - [Step Name]" + percentage

### Field Layout

* Label: above input, 14px medium weight
* Required indicator: red asterisk after label
* Helper text: below input, 12px muted color
* Error message: inline below field, red, persists until fixed

### Validation Rules

* Required fields: asterisk after label
* Real-time validation on blur:
  * Email: format validation
  * Phone: 10 digits
  * Pincode: 6 digits

### Autosave Behavior

* Triggers every 30 seconds with 300ms debounce
* During save: "Saving..." indicator
* After save: "All changes saved" + timestamp
* Location: top-right corner of form

### Navigation

* Back button: preserves all entered data
* Unsaved changes warning: "You have unsaved changes. Are you sure you want to leave?"
* Form data: persisted in localStorage as backup

### Action Buttons

* Back button: outline style, positioned left
* Next/Submit: primary style, positioned right
* Step advances only after current step validates

---

## Multi-Step Form Design Spec

### Progress Stepper

* Layout: horizontal numbered circles connected by line
* Circle size: 32px diameter
* Completed: filled primary color + checkmark icon
* Current: filled primary color + step number
* Upcoming: border only, muted color
* Step labels: below circles, 12px
* Connector line: 2px, changes color when step complete

### Step Indicator Text

* Format: "Step X of Y - [Step Name]" centered below stepper
* Progress percentage: shown as "33% complete"
* Current step name: bold weight

### Field Grouping

* Each step: clear theme (Basic Info → Contact → Courses → Payment)
* Group related fields in sections with subheadings
* Section spacing: 24px between groups
* Field spacing: 16px between fields in same group

### Field Layout

* Label: above input, 14px medium weight
* Required: red asterisk after label
* Optional: "Optional" text in muted color, right-aligned
* Helper text: below input, 12px muted
* Error message: inline below, red text, shows on invalid

### Inline Validation

* Trigger: on blur
* Valid: green checkmark icon right of field
* Invalid: red border on field + error message below
* Error clears: on valid input
* Prevent step advance until current step validates

### Autosave Behavior

* Trigger: every 30 seconds with 300ms debounce
* Indicator location: top-right of form
* States: "Saving..." (muted) → "All changes saved at HH:MM" (success)
* Persist to localStorage as backup

### Navigation

* Back button: outline style, left side
* Next/Submit button: primary style, right side
* Sticky at bottom: buttons always visible
* Unsaved warning: "You have unsaved changes" on page leave
* "Save as Draft" option to exit early

### Final Review Step

* Summary view: all entered data grouped by original step
* Edit links: click to jump back to specific step
* Submit button: "Confirm & Submit" with confirmation

---

## Upload UX Design Spec

### Upload Zone

* Layout: Dashed border dropzone with centered content
* Size: Full-width, min-height 200px
* Visual: Rounded-xl border, muted background, icon + text centered
* Interaction: Entire zone clickable to trigger file picker
* Drag state: Border changes to primary color, bg to primary/5

### Supported Formats

* Display: Below or inside dropzone - "Accepted: JPG, PNG, PDF (max 5MB)"
* Inline validation: Check file type before upload attempt
* Error display: Red border + message below field

### Progress Feedback

* Per-file progress bar: 4px height, rounded, primary color fill
* Status states: "Uploading..." → "Processing..." → "Complete" (checkmark)
* Time estimate: Optional "About 30 sec remaining"
* Failure state: Red background, "Retry" button visible

### Preview UI

* Thumbnail: 80x80px rounded-lg, actual image or file type icon
* Layout: Horizontal list or 2-column grid for multiple files
* File info: Name (truncated), file size, type badge
* Actions: Remove (X), View, Replace buttons per file
* Empty: Show upload zone; filled: show file cards

### Error Handling

* Pre-upload validation: File type, size checked before submit
* Error message: Specific - "File too large. Max 5MB" not "Upload failed"
* Recovery: "Try again" button, preserve other uploaded files
* Preserve form: Upload errors should NOT reset other form data

### Multi-File Support

* Batch upload: Allow selecting multiple files at once
* Individual status: Each file shows own progress/error state
* Bulk actions: "Remove all", "Replace all" where applicable

---

## Data Display

### Dashboard Stats Cards

* Layout: icon (24px) + label (14px) + value (28px bold) + optional trend
* Trend format: "↑ 12%" green, "↓ 8%" red
* Activity section: below stats, sorted by most recent

---

## Dashboard Design Spec

### Layout Structure

* Stats grid: 4 columns desktop, 2 columns tablet, 1 column mobile
* Card height: auto, minimum 100px
* Gap between cards: 16px

### Component Arrangement

* Stats cards: top row, full width
* Filter pills: below stats, horizontal scroll on mobile
* Content area: below filters, max-height with scroll
* Floating action bar: fixed bottom, 80px from bottom edge

### Spacing

* Page padding: 24px
* Card padding: 20px
* Section gap: 24px
* Element gap: 12px

### Visual Hierarchy

* Stats value: 28px bold, primary color
* Stats label: 14px regular, muted
* Trend badge: 12px, positioned right of value
* Filter pills: 14px medium, horizontal layout
* Active filter: filled background with subtle shadow

### Premium Patterns

* Filter pills with count badges
* Floating bulk action bar on selection
* Skeleton shimmer placeholders during load
* "Showing X–Y of Z" pagination indicator
* Inline confirmation dialogs for destructive actions
* Stacked toast notifications bottom-right

---

## Student List Design Spec

### Table Structure

* Row height: 56px minimum
* Cell padding: 16px horizontal, 12px vertical
* Columns: Checkbox | Name | Email | Status | Payment | Actions
* Sticky header: 48px height, subtle bottom shadow on scroll
* Alternating rows: subtle background variation or hover highlight

### Readability

* Font: 14px body, 13px for secondary columns
* Name column: bold weight
* Secondary text: muted color
* Status badge: inline pill within cell
* Line height: 1.5 for wrapped content

### Search & Filter Bar

* Full-width search input above table
* Filter pills below search: All | Draft | Pending | Approved | Rejected
* Active filter: filled background + count badge (e.g., "Pending (12)")
* "Clear all" button appears when any filter active
* Search filters: name, email, phone

### Sorting

* Click column header to toggle asc/desc
* Active sort: chevron indicator (↑/↓)
* Default: createdAt desc (most recent first)
* Visual indicator on sorted column only

### Bulk Selection

* Checkbox in first column
* Header checkbox: "Select all" on current page
* Selection badge: "X selected" appears above table
* Floating action bar: Approve | Reject | Delete
* Clear selection button

### Actions Visibility

* Primary actions: visible buttons (View, Edit)
* Secondary actions: overflow menu (⋯) per row
* Menu items: Delete, View Details, Update Payment
* Hover reveals row actions

### Empty State

* Icon: 48px centered
* Title: 16px semibold
* Description: 14px muted
* CTA button if actionable

### Pagination

* Format: "Showing 1-20 of 156"
* Position: top-right of table
* Per-page: 20 / 50 / 100 dropdown
* Page numbers with ellipsis for large sets
* URL params sync on page change

---

## Feedback & Interaction

### Confirmation Dialogs

* Triggers: Delete, Reject status change
* Delete message: "Delete [Name]? This cannot be undone."
* Reject message: "Reject this registration? The student will be notified."
* Buttons: Cancel (outline) + Confirm (destructive)
* Modal: centered, max-width 480px, backdrop bg-black/50 with blur

### Toast Notifications

* Position: bottom-right, stacked max 3
* Duration: 4 seconds with progress bar
* Success: green left border
* Error: red left border + "Retry" button
* Reversible actions: "Undo" button for 30 seconds

### Loading States

* Page load: skeleton matching content layout
* Button: spinner + "Loading..." text
* Table rows: shimmer skeleton
* Transition: 200ms fade from skeleton to content

### Error Handling

* API failure: toast with message + "Try again" button
* Network offline: top banner "You're offline. Changes will sync when connection restored"
* Form submit error: inline above form, scroll to it

### Modal Behavior

* Centered, max-width 480px
* Backdrop: bg-black/50 with blur
* Closes on: Escape key and outside click

### Transitions

* Page: 150ms fade
* Modal: fade + scale from 95% to 100%
* Hover: 150ms ease
* Skeleton shimmer: 1.5s loop

---

## Implementation Priority

| Priority | Features | Status |
|----------|----------|--------|
| P0 | Breadcrumbs | ✅ Done |
| P0 | Confirmation dialogs | ✅ Done |
| P0 | Pagination | ✅ Done |
| P0 | Autosave feedback | ✅ Done |
| P0 | Sticky table header | 🔲 Pending |
| P1 | Sidebar collapse | 🔲 Pending |
| P1 | Bulk selection + actions | ✅ Done |
| P1 | Inline validation | ✅ Done |
| P1 | Empty states | 🔲 Pending |
| P2 | Column sorting | ✅ Done |
| P2 | Export CSV | 🔲 Pending |
| P2 | Undo toast | 🔲 Pending |
| P2 | Trend indicators | 🔲 Pending |
| P0 | Upload component | ✅ Done |

---

## Implemented Components

### Breadcrumbs
* File: `frontend/src/components/ui/Breadcrumbs.tsx`
* Props: `items: BreadcrumbItem[]`, `className?: string`
* Behavior: Chevron separators, clickable segments except current
* Integration: PageHeader now accepts `breadcrumbs` prop

### ConfirmationDialog
* File: `frontend/src/components/ui/ConfirmationDialog.tsx`
* Props: `open`, `onOpenChange`, `title`, `description`, `confirmLabel`, `cancelLabel`, `variant`, `onConfirm`, `loading`
* Behavior: ESC key closes, backdrop click closes, body scroll lock

### Pagination
* File: `frontend/src/components/ui/Pagination.tsx`
* Props: `currentPage`, `totalPages`, `totalItems`, `itemsPerPage`, `onPageChange`, `onItemsPerPageChange`
* Behavior: "Showing X-Y of Z", page numbers with ellipsis, per-page selector

### BulkActions
* File: `frontend/src/components/ui/BulkActions.tsx`
* Props: `selectedCount`, `onApprove`, `onReject`, `onDelete`, `onClear`, `loading`
* Behavior: Fixed bottom-center, slides in when items selected

### PageHeader (updated)
* File: `frontend/src/components/ui/PageHeader.tsx`
* New prop: `breadcrumbs?: BreadcrumbItem[]`
* Behavior: Renders breadcrumbs above title

---

## Student Layout System

### Layout Structure

* Reuse `AppLayout` with `isAdmin={false}`
* Sidebar: 256px width, 64px collapsed (future)
* Content area: `container mx-auto p-6`, max-width 1400px
* Mobile: hamburger menu + drawer

### Navigation

| Item | Label | href |
|------|-------|------|
| 1 | Dashboard | `/student/dashboard` |
| 2 | My Courses | `/student/courses` |
| 3 | Profile | `/student/profile` |
| 4 | (optional) Payments | `/student/payments` |

### UX Rules

* PageHeader with breadcrumbs on all pages
* Card-based design, 24px padding, rounded-xl
* Tables: use Pagination, sorting, bulk selection
* Buttons: primary, secondary, destructive (same as admin)
* Typography: h1=24px bold, h2=20px semibold, body=14px

### Student Dashboard

* Stats grid: 4 columns desktop, 2 tablet, 1 mobile
* Progress indicator: horizontal bar, no emojis
* Course cards: thumbnail + title + progress badge
* Empty state: icon + message + action button

---

## Landing Page Design

### Layout Sections

**1. Hero Section**
* Layout: centered, max-width 600px
* Content: logo + tagline + 2 buttons
* Buttons: "Get Started" (primary), "Login" (secondary)
* Background: subtle pattern or solid color

**2. Features Section**
* Layout: 3-column grid, gap-6
* Card content: icon (24px) + title (16px semibold) + description (14px)
* Card style: border border-border, rounded-xl, p-6

**3. CTA Section**
* Layout: centered, max-width 500px
* Content: message + primary button

### Visual Rules

* Spacing: lg=24px, xl=32px between sections
* Colors: use CSS variables (primary, muted, background)
* Typography: match admin scale
* No animations or heavy gradients
* Cards: same styling as admin cards

### Navigation

* No sidebar or header
* Full-width content, centered
* Login button navigates to `/login`
* Get Started navigates to `/login` (or register if available)