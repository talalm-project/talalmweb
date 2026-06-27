# TALA LM Design Specification

## Executive Summary

TALA LM is a React admin-panel application for local AI workspace management. It includes dashboard monitoring, notebook RAG workspaces, LaTeX paper editing, connector testing, user administration, settings, and system diagnostics.

The application already has a recognizable admin design language: fixed sidebar, sticky top navigation, `PageHeader`, card-based content panels, Bootstrap tables/forms, FontAwesome icons, status badges, dark/light theme tokens, and feature-specific workspace layouts. The current UI is functional and generally consistent for CRUD pages, but the design system is implicit rather than formal. Several patterns are repeated with small differences across features, especially tabs, detail blocks, chat panels, upload controls, modal forms, action placement, loading states, and auth-error handling.

Primary UX risks:

- Accessibility gaps in custom navigation, forms, focus states, tab semantics, live regions, and hidden file inputs.
- Complex workspaces can overwhelm users because controls, status, files, editor/chat, and destructive actions compete for attention.
- Responsive behavior exists but is uneven for dense dashboards, sidebars, tables, chat panels, notebook notes, and paper editor/PDF layouts.
- Loading and success feedback are present but inconsistent, mostly spinner-based, and not always screen-reader friendly.
- Technical debt in duplicated auth handling, duplicated modal/form patterns, class component usage in one command component, and local feature-specific UI primitives.

This document is based on a source audit plus the local `.codex/skills/ui-ux-pro-max` guidance. The skill recommends dashboard-oriented dark UI patterns, strong visible focus states, semantic controls, responsive table handling, loading feedback, and virtualization for long lists.

## Current Architecture

- Stack: React function components, React Router `HashRouter`, esbuild custom build, Bootstrap SCSS, FontAwesome icons, axios services.
- Entrypoint: `src/index.js`.
- App shell: `src/js/App.js` renders public login routes or authenticated admin shell.
- Authenticated layout: fixed `Sidebar`, sticky `TopNavigation`, and `main.app-page-shell`.
- Shared UI: `src/js/commons/PageHeader.js`, `AdminContent.js`, `ConfirmationModal.js`, `Loader.js`, `Pagination.js`.
- Services: thin axios wrappers in `src/js/services/`.
- Styling: `src/styles/index.scss` imports Bootstrap, tokens, component styles, page-specific SCSS, sidebar/top-nav/login styles.
- Theme: dark default and light body theme via CSS custom properties in `components.scss`.
- Design primitives: tokens in `variables.scss`, local fonts in `fonts.scss`, Bootstrap utilities, `talalm-*` custom classes.

## Screen Inventory

### Public Screens

| Screen | Route | Purpose | Main UI | Notes |
|---|---:|---|---|---|
| Login | `/`, `/login` when unauthenticated | Email/password sign-in | Split banner/form layout, feature cards, error rendering | Strongest branded page; email input lacks `type="email"` and labels lack `htmlFor`. |
| Home | Not routed in current `App.js` | Legacy/public landing | Centered title and login link | Appears unused; content references generic admin billing language, not current TALA LM IA. |

### Authenticated Screens

| Screen | Route | Purpose | Main UI | Notes |
|---|---:|---|---|---|
| Dashboard | `/dashboard` | Research workspace overview | Stat cards, readiness checks, coverage table, capacity table, attention files | Good overview but dense; dashboard action labels could be more explicit. |
| Settings | `/settings` | Change password | Single `AdminContent` form | Labels lack `htmlFor`; success ends by redirecting to login without explanatory message. |
| Connectors Index | `/connectors` | Browse/filter connectors | Filter form and table | Clear CRUD pattern; no pagination currently. |
| Connectors Form | `/connectors/new`, `/connectors/:id/edit` | Create/edit local model connector | Long single-column form, range control, model selects | Auto-filled disabled fields are useful but need explanatory helper text. |
| Connectors Show | `/connectors/:id` | Connector details, inference test, embeddings test | Details tab, chat test, file dropzone, delete modal | Strong feature depth; duplicated chat/tabs with notebook. |
| Notebooks Index | `/notebooks` | Browse/filter notebooks and create notebook | Filter table, create modal, pagination | Good table pattern; modal creation could surface connector-loading states more clearly. |
| Notebooks Show | `/notebooks/:id` | Chat with notebook, manage files and notes | Collapsible files panel, chat, notes, config, multiple modals | Most complex flow; needs progressive disclosure and stronger responsive/a11y treatment. |
| Papers Index | `/papers` | Browse paper projects | Table, create modal | Clear and simple; no filtering or pagination. |
| Paper Show | `/papers/:id` | Edit LaTeX project, upload files, compile, preview PDF | Files tree, CodeMirror LaTeX editor, PDF preview, logs, actions | Powerful workspace; needs more formal tab semantics, save/compile feedback, and responsive layout rules. |
| Doctor | `/doctor` admin | Inspect sanitized backend config | System config table | Clear diagnostics; redirect handling differs from other pages. |
| Local Models | `/local-models` admin | Inspect backend model manifest | Model table with type badges | Clear; long paths need reliable wrapping and copy affordance. |
| Users Index | `/users` admin | Browse users | Table, pagination, create action in panel header | Good resource table; action placement differs from page-level convention. |
| Users Form | `/users/new`, `/users/:id/edit` admin | Create/edit user | Single-column form | Labels lack `htmlFor`; no required indicators; duplicate cancel action. |
| Users Show | `/users/:id` admin | View, activate, edit, delete user | Detail blocks and confirmation modals | Clear, but page-level actions are placed in panel header rather than `PageHeader`. |

## Component Inventory

| Component | Purpose | Used In | Strengths | Weaknesses | Design System Candidate |
|---|---|---|---|---|---|
| `PageHeader` | Page title, eyebrow, page actions | Most authenticated pages | Consistent page hierarchy and responsive wrapping | No breadcrumb slot, title can accept arbitrary JSX, no standardized action ordering | Yes |
| `AdminContent` | Card/panel frame with header actions/footer | Most pages | Simple reusable panel shell | Header action `btn-group` can squeeze/wrap poorly; no variants or semantic heading level | Yes |
| `ConfirmationModal` | Generic confirm/destructive modal | Users, connectors, notebooks, papers | Reusable loading state and icon buttons | Modal has no explicit `onHide`, fixed button labels, primary destructive action uses primary variant | Yes, revise |
| `Loader` | Spinner loading state | Most async pages/panels | Simple and consistent | No text by default, no `role=status` wrapper, not suitable for skeleton/loading tables | Yes, revise |
| `Pagination` | Page navigation | Users, notebooks | Handles ellipses and disabled states | Active page is on button class, no `aria-current`, ellipsis not hidden from screen readers | Yes |
| `Sidebar` | Main navigation | Authenticated shell | Persistent IA and active section | Uses clickable `<a>` without `href`, toggle lacks accessible button semantics, no mobile drawer pattern | Yes, revise |
| `TopNavigation` | Search, pinned services, theme, logout | Authenticated shell | Useful service search and quick access | Search results are not combobox/listbox semantic; star control is span; blur timeout pattern is fragile | Yes, revise |
| `Status badges` via `statusToLabel` and custom badge classes | Status communication | Tables, files, users, notebooks, papers | Good visual scanning | Status taxonomy and tones are not centrally documented | Yes |
| `Detail blocks` | Label/value cards | Users, connectors, notebooks | Consistent read-only data display | Repeated manually; long values and copy actions inconsistent | Yes |
| `Filter forms` | Table filtering | Connectors, notebooks | Standard Bootstrap row pattern | No shared filter bar component; submit/reset placement varies | Yes |
| `Resource tables` | List records | Users, connectors, notebooks, papers, dashboard, doctor, local models | Consistent table-responsive wrapper and action column | Mobile tables rely on horizontal scroll; no density/empty/error variants | Yes |
| `Modal forms` | Create/edit lightweight resources | Notebooks, papers, notebook title/file/note | Good transactional focus | Repeated modal structure; inconsistent validation summaries and button labels | Yes |
| `Tabs` | Switch detail/test/workspace sections | Connectors, notebooks, papers | Good progressive disclosure idea | Three different tab implementations and incomplete ARIA relationships in places | Yes |
| `Chat panel` | Prompt/response UI | Connectors, notebooks | Domain-specific and useful | Duplicated rendering; long conversations not virtualized; live updates not announced | Yes |
| `File panels` | File list/tree management | Notebooks, papers | Good direct manipulation for workspace tasks | Different models and layouts; tree keyboard navigation is limited | Yes |
| `Upload/dropzone` | Upload files | Connectors, notebooks, papers | Supports drag/drop or hidden picker patterns | Hidden input/dropzone semantics need strengthening; limits and accepted types are inconsistent | Yes |
| `Range control` | Context window/retrieval amount | Connectors, notebooks | Useful paired numeric/range input | Repeated markup; number input lacks id/label linkage in connector form | Yes |
| `PaperWorkspace` | Paper files/editor/PDF/log/actions workspace | Paper show | Clear specialized workflow | Very dense; action/log/editor tabs should be more task-oriented on smaller screens | Feature system |
| `NotebookWorkspace` | Notebook chat/notes/config workspace | Notebook show | Strong task grouping | Complex state and many controls in one panel; needs clearer active context | Feature system |

## UX Audit

Severity scale: Critical blocks task completion or accessibility. High causes frequent failure/confusion. Medium reduces efficiency or clarity. Low is polish or maintainability.

| Severity | Problem | Why It Matters | Recommendation |
|---|---|---|---|
| Critical | Sidebar uses clickable anchors without `href` for navigation/toggle. | Keyboard and screen reader users may not get correct button/link semantics. | Use real buttons for toggles and `Link`/anchors for navigation with accessible labels. |
| Critical | Some form controls lack programmatic labels or semantic input types. | Screen readers and autofill cannot reliably identify fields. | Add `id`/`htmlFor`, use `type=email`, `autocomplete`, and required indicators. |
| High | Custom search/pinned service interactions are not combobox/listbox semantic. | Keyboard navigation and screen reader behavior will be weak for service search. | Implement accessible combobox pattern, keyboard arrow navigation, `aria-expanded`, and result roles. |
| High | Tabs have multiple implementations and inconsistent panel relationships. | Users cannot rely on consistent keyboard interaction; maintainers duplicate fixes. | Create a shared tab pattern with roving tabindex, `aria-controls`, `aria-labelledby`, and keyboard support. |
| High | Loading states are mostly spinners or blank panel loaders. | Users cannot estimate progress; screen readers may not hear updates. | Use skeleton rows/cards where layout is known and `aria-live` for async results. |
| High | Notebook and paper workspaces expose many controls at once. | Hick's Law: too many visible decisions slow task completion. | Group controls by task state: setup, chat/edit, review, advanced. Hide advanced controls until needed. |
| High | Chat and file lists render all items. | Large notebooks or long conversations can degrade performance and scrolling. | Virtualize long file lists, notes, chat messages, and embedding result lists after measured thresholds. |
| Medium | Action placement varies between `PageHeader` and `AdminContent.headerActions`. | Users must relearn where primary actions live. | Reserve `PageHeader` for page-level actions and panel headers for local actions only. |
| Medium | Empty states are text-only or minimal. | They miss next-step guidance and reduce recoverability. | Add contextual action buttons to empty states, such as New Notebook, Upload File, Compile Paper. |
| Medium | Success feedback is inconsistent. | Users may not know whether save/create/upload actions succeeded. | Standardize inline success messages or toast notifications for saves, uploads, compile complete, reindex queued. |
| Medium | Destructive actions have inconsistent variants and locations. | Fitts' Law and error prevention suffer when destructive controls are near routine actions. | Use consistent danger styling, confirmation copy, and placement separated from primary flow. |
| Medium | Dashboard IA mixes research, model, and admin language. | Labels like Connector, Notebook, Coverage, Capacity require domain knowledge. | Add clearer resource descriptions and align nav descriptions with current product scope. |
| Medium | Tables rely on horizontal scroll on mobile. | Mobile users may miss off-screen actions and status. | Convert critical resource rows to stacked card rows below tablet width. |
| Medium | Fixed sidebar plus sticky top nav reduces small-screen usable space. | Narrow screens can feel crowded and actions may wrap awkwardly. | Use a mobile drawer/sidebar state and compact top nav. |
| Medium | Error handling redirects differ across pages. | Users may see abrupt full-page reloads or inconsistent auth recovery. | Centralize auth error handling and show stable session-expired feedback. |
| Low | The UI is almost entirely square/no-shadow. | This is consistent but hierarchy can feel flat in dense views. | Keep square radius, but use spacing, borders, and subtle elevation tokens intentionally. |
| Low | Some nav descriptions are outdated. | Search result previews can mislead users. | Update `navigationServices.js` descriptions to match local AI workspace tasks. |

## Accessibility Audit

### Findings

- Keyboard navigation: Native buttons and links are generally used in content areas, but sidebar navigation/toggle uses `<a>` without `href`; top-nav star controls use spans; drag/drop zones need keyboard equivalence and state.
- ARIA: Some tablists use `role=tablist` and `aria-selected`, but roving tabindex and complete tab-panel relationships are inconsistent. Dynamic chat/loading/status changes usually lack `aria-live`.
- Focus states: Bootstrap defaults exist, but custom controls sometimes set `outline: 0` or rely on border color. A global `:focus-visible` token should be added.
- Color contrast: Dark mode tokens are generally strong. Light mode should be checked, especially muted text, warning/success badge colors, borders, and active tab states.
- Touch targets: Icon buttons are often `btn-sm`; some are below a comfortable 44px target. Compact admin UIs can allow 32px minimum on desktop, but mobile should increase targets.
- Screen reader compatibility: Loader lacks a text label; empty states and status changes are visual. Search results and pinned services need roles and keyboard semantics.
- Semantic HTML: Tables and forms use real elements. Some read-only detail fields use divs only, which is acceptable, but definition lists could improve semantics.
- Form accessibility: Many labels in forms lack `htmlFor`; required fields are not marked; validation errors are rendered but should be associated via `aria-describedby` and `aria-invalid`.
- Error messaging: Errors are visible but not consistently placed or announced. Modal errors are good but should use `role=alert` or `aria-live`.

### Accessibility Recommendations

1. Add a shared focus-visible style for buttons, links, custom tabs, switches, dropzones, and file rows.
2. Convert sidebar toggles and star controls to proper buttons.
3. Add skip link to `main.app-page-shell`.
4. Standardize form field component behavior: label id, input id, error id, `aria-invalid`, `aria-describedby`, required marker.
5. Add `aria-live="polite"` to async status regions: saves, uploads, compile job, reindexing, chat response, dashboard refresh.
6. Make tab components keyboard accessible with arrow keys, Home, End, and roving tabindex.
7. Ensure modal titles are connected to dialogs and destructive confirmations communicate consequences clearly.
8. Validate WCAG AA contrast for all theme token combinations before major visual changes.

## Responsive Audit

### Desktop 1440px+

- Overall shell works well: fixed sidebar, sticky top nav, full-width page shell.
- Dashboard and CRUD tables use available width effectively.
- Paper workspace needs strict min/max sizing for file/editor/PDF columns; recent alignment work improves this area.

### Laptop 1024px to 1366px

- Top-nav search, user block, logout, and pinned services can become dense.
- Paper and notebook workspaces have competing horizontal panels. Collapsible files panel helps notebook, but paper uses three dense panels.
- Admin card headers with action groups can wrap awkwardly.

### Tablet 768px to 1024px

- Sidebar remains fixed with closed width behavior rather than a true drawer. Content still pays left margin.
- Tables horizontal-scroll instead of cardifying.
- Notebook notes browser two-column layout can feel cramped.
- Chat composer controls and range controls need stacking rules.

### Mobile 375px to 767px

- Sidebar closed rail still takes horizontal space and may not be expected on phones.
- Top navigation wraps but can still show search, theme, user, and logout together.
- Tables require horizontal scroll; action columns may be off-screen.
- Modal forms should fit but need full-width buttons and larger touch targets.
- Dense workspace pages should switch to single-task screens or accordion/tab-first layouts.

### Responsive Recommendations

- Add explicit breakpoints: mobile `<576`, tablet `576-991`, laptop `992-1199`, desktop `1200+`, wide `1400+`.
- Convert resource tables to responsive cards on mobile.
- Use a mobile drawer for sidebar and hide user role copy in top nav on small screens.
- Use stacked action bars for page headers below tablet width.
- For paper workspace, show Files, Editor, Preview as tabs on tablet/mobile rather than three columns.
- For notebook workspace, make files rail/drawer bottom-sheet friendly on mobile.

## Design System Proposal

The app has an implicit design system. It should be formalized around the existing Bootstrap + `talalm-*` approach instead of replacing the stack.

### Typography Scale

- Font families:
  - Heading: Hanken Grotesk, fallback Geist/system.
  - Body: Geist, fallback Inter/system.
  - Mono: JetBrains Mono, fallback SFMono/Consolas.
- Proposed scale:
  - Display: 3rem to 6rem only for login/brand moments.
  - H1 page: 1.7rem desktop, 1.2rem mobile minimum.
  - H2 panel/section: 1.1rem to 1.25rem.
  - Body: 1rem.
  - Small/meta: 0.8rem.
  - Label/eyebrow: 0.62rem to 0.75rem uppercase, letter spacing 0.06em to 0.08em.

### Color Palette

Use existing tokens as the source of truth:

| Token | Dark | Light | Use |
|---|---:|---:|---|
| Background | `#131317` | `#f4f6f8` | App canvas |
| Surface lowest | `#0e0e12` | `#ffffff` | Inputs, embedded code, deep panels |
| Surface low | `#1b1b1f` | `#eef2f5` | Sidebar, secondary blocks |
| Surface | `#201f23` | `#ffffff` | Cards, top nav |
| Surface high | `#2a292e` | `#e7edf2` | Headers, hover |
| Text | `#e5e1e7` | `#344054` | Body |
| Text strong | `#f4f4f5` | `#111827` | Headings |
| Muted | `#a1a1aa` | `#667085` | Metadata |
| Primary | `#9395d3` | `#4f56b3` | Primary actions |
| Primary bright | `#c0c1ff` | `#343b91` | Links/focus |
| Secondary | `#dfc56c` | `#9f7a12` | Pinned/favorite/warning accent |
| Danger | `#ffb4ab` | existing danger token | Destructive/error |
| Success | `#9fcaa4` | existing success token | Healthy/active |
| Info | `#b7c8e1` | existing info token | Informational |

### Spacing System

- Base unit: 4px.
- Common scale: 4, 8, 12, 16, 24, 32, 48.
- Page shell: 12px mobile, 16px desktop horizontal, 20px top, 32px bottom.
- Cards: 16px body padding default, 12px compact table panels.
- Form row gap: Bootstrap `g-3` default.
- Workspace gap: 16px to 24px.

### Grid System

- Continue Bootstrap 12-column grid.
- Dashboard cards: `col-12 col-md-6 col-xl-3`.
- Primary split workspaces: use fixed/minmax file columns and flexible main content on desktop.
- Mobile: avoid three-column workspaces; use tabs/drawers.

### Breakpoints

- Mobile: `<576px`.
- Large phone/small tablet: `576px`.
- Tablet: `768px`.
- Laptop: `992px`.
- Desktop: `1200px`.
- Wide: `1400px+`.
- Existing `$small-screen-width: 800px` should be replaced or aligned with Bootstrap breakpoints.

### Elevation, Border Radius, Shadows

- Current style: square cards/buttons, `box-shadow: none`.
- Keep radius at `0` for current admin aesthetic.
- Use elevation sparingly:
  - Sticky navigation/search dropdown may use subtle border plus shadow token.
  - Modals should retain Bootstrap depth but align colors.
- Do not add decorative gradient blobs or heavy shadows.

### Component States

- Required states for every interactive component:
  - Default, hover, active/current, focus-visible, disabled, loading, error, success.
- Required states for async screens:
  - Initial loading, refreshing, empty, error, populated, partial failure.
- Required states for destructive flows:
  - Idle, confirming, deleting, failed, success/redirect.

### Animation Guidelines

- Use 150-250ms color/background/border transitions.
- Avoid scale transforms that shift layout.
- Respect `prefers-reduced-motion`.
- Loading animation should not be the only feedback; pair with text.

### Iconography

- Continue FontAwesome solid icons.
- Import only used icons.
- Use icon+text for primary commands, icon-only only for familiar compact actions with `aria-label` and `title`.
- Keep icon buttons fixed-size and at least 32px desktop, 40-44px mobile.

### Button Hierarchy

- Primary: one main positive action per page/section.
- Outline primary: navigation/view/detail actions.
- Outline secondary: back/cancel/refresh.
- Success: state-changing positive action such as Activate.
- Danger/outline danger: destructive actions.
- Icon-only: local compact actions such as collapse, delete file, download file.

### Input Hierarchy

- Text/select/search: Bootstrap form controls with label above.
- Search with icon: input group or positioned icon, with accessible label.
- Range: paired range + numeric value with shared label and helper bounds.
- File upload: visible dropzone or button plus hidden input, with accepted types and max size text.
- Validation: inline field errors plus summary for multi-field forms.

### Feedback Patterns

- Inline alerts for blocking page/panel errors.
- Inline status badges for persistent resource state.
- Toasts or live regions for transient success: saved, uploaded, refreshed, compile complete.
- Progress bars for uploads/long-running compile; skeletons for known panel/table loading.

### Dialogs, Badges, Tags, Cards, Tables, Forms, Navigation

- Dialogs: define modal sizes, title hierarchy, primary/destructive action placement, loading lock behavior.
- Badges/tags: centralize status names, colors, and labels.
- Cards: use `AdminContent` for panels, stat card variants for metrics.
- Tables: standard columns, action column alignment, empty row, loading skeleton, mobile card variant.
- Forms: standard sectioning, required markers, help text, disabled field explanations.
- Navigation: sidebar sections, top search, pinned services, theme toggle, logout.
- Breadcrumbs: currently absent; add for nested resources, especially notebooks/papers/connectors/users.
- Tabs: standard shared component.
- Accordions: consider for mobile advanced controls.
- Pagination: standardize aria-current and disabled semantics.

## Navigation Improvements

- Add breadcrumbs for nested detail/edit screens:
  - Notebooks / Notebook title
  - Papers / Paper name
  - Connectors / Connector name
  - Users / User details
- Move page-level actions consistently into `PageHeader`.
- Keep panel actions scoped to panel content only.
- Make sidebar collapse control a button with label and persisted state.
- Add mobile sidebar drawer behavior.
- Improve top search:
  - Add keyboard navigation.
  - Announce result count.
  - Treat pinned/unpinned as button state with `aria-pressed`.
  - Update service descriptions to match actual product language.

## Information Architecture

Current top-level IA:

- Dashboard
- Notebooks
- Papers
- Connectors
- Settings
- Admin: Users, Doctor, Local Models

Recommended IA:

- Overview: Dashboard
- Workspaces: Notebooks, Papers
- Models: Connectors, Local Models
- Administration: Users, Settings, Doctor

This keeps user tasks grouped by mental model: monitor, work, configure models, administer system.

## User Flow Improvements

### Sign In

- Starting page: Login.
- Decision points: Email/password entry.
- Clicks: 1 submit after credentials.
- Confusion: Mock server/login field mismatch is documented. API base URL appears but may confuse non-technical users.
- Simplifications: Use email input type, autofocus first field, clearer invalid credentials error.
- Missing feedback: No non-field auth summary if response shape is unexpected.

### Browse And Open Notebook

- Starting page: Dashboard or Notebooks.
- Decision points: Filter by query/status, select View.
- Clicks: 1-3.
- Confusion: "Notebook" status, file count, and connector health are not fully explained.
- Simplifications: Add status tooltips and dashboard quick filters.
- Missing feedback: Filter application success/count message.

### Create Notebook

- Starting page: Notebooks.
- Decision points: New Notebook, title, connector.
- Clicks: 2-4.
- Confusion: Connector selection depends on async load; empty connector state needs clearer guidance.
- Simplifications: Disable New Notebook or show connector setup CTA when none exist.
- Missing validation: Required marker and connector dependency explanation.
- Missing success: Redirect is success, but toast could confirm creation.

### Notebook Chat

- Starting page: Notebook detail.
- Decision points: Files/context, retrieval mode, prompt.
- Clicks: 1 prompt submit, more if manual retrieval.
- Confusion: Manual retrieval and context chunks are advanced concepts.
- Simplifications: Collapse advanced retrieval settings behind "Context settings."
- Opportunities: Auto-select active files or recommend retrieval settings.
- Missing feedback: Screen-reader live announcement when inference begins/ends.

### Manage Notebook Files

- Starting page: Notebook detail.
- Decision points: Upload, download, delete, reindex, manual retrieval include.
- Clicks: 2-4 per action.
- Confusion: File statuses and delete availability need clearer help.
- Simplifications: Batch reindex/delete only when multiple files exist.
- Missing confirmation: Delete exists; upload success should be explicit.

### Connector Setup And Test

- Starting page: Connectors.
- Decision points: Pick local model, embedding model, context window, save, test inference/embeddings.
- Clicks: 4-8.
- Confusion: Disabled auto-filled fields can look broken.
- Simplifications: Use read-only detail preview area after selection.
- Opportunities: Preselect recommended models.
- Missing feedback: Successful save redirects but no success confirmation.

### Paper Editing And Compile

- Starting page: Papers.
- Decision points: Create/open paper, upload files/folders, choose file, edit, save/compile, preview/download.
- Clicks: 3+.
- Confusion: Upload destination versus new folder path requires careful reading.
- Simplifications: Make upload destination a single chooser with "new folder" option.
- Opportunities: Auto-select `main.tex`, auto-refresh logs/PDF.
- Missing validation: Compile prerequisites should be surfaced before compile.
- Missing confirmation: File delete currently immediate; folder/paper delete confirms.

### User Administration

- Starting page: Users.
- Decision points: Create/view/edit/activate/delete.
- Clicks: 2-5.
- Confusion: Delete copy says archive, button says delete.
- Simplifications: Use "Archive User" if behavior is archive.
- Missing feedback: Activation success stays on page but could use toast.

### System Diagnostics

- Starting page: Doctor or Local Models.
- Decision points: Review table.
- Clicks: 1.
- Confusion: Technical setting labels are raw-ish.
- Simplifications: Group into cards/sections with copy buttons for values.

## Visual Improvements

- Whitespace: CRUD pages are comfortable. Dense workspaces need stronger internal spacing and collapsible advanced sections.
- Alignment: Tables and cards mostly align. Panel headers with action groups are a weak point on narrow widths.
- Contrast: Dark mode is generally readable. Light mode needs full WCAG AA testing for muted text, badges, borders, and warning colors.
- Typography: Font choices are coherent. Need formal scale and consistent h2/h3 usage in panels and modals.
- Readability: Long paths, JSON blocks, embeddings, and chat markdown need scroll/copy/collapse affordances.
- Consistency: Buttons and badges are mostly consistent; tabs, upload controls, detail blocks, and modals are inconsistent.
- Information density: Appropriate for admin users, but notebook/paper screens should reveal advanced settings progressively.
- Use of color: Status colors are helpful; avoid using color as the only indicator.
- Dark mode compatibility: Stronger than light mode. CodeMirror editor theme follows body dataset.
- Brand consistency: Login is branded; authenticated pages are more generic admin. Add subtle TALA LM domain cues through labels and IA, not decorative art.
- Overall polish: Functional and solid; polish gains will come from systematizing spacing, focus, loading, and responsive behavior.

## Component Recommendations

1. Formalize `PageHeader`, `AdminContent`, `Button`, `IconButton`, `Badge`, `StatusBadge`, `FormField`, `ModalForm`, `ConfirmationDialog`, `Tabs`, `Table`, `EmptyState`, `Alert`, `Loader/Skeleton`, `UploadDropzone`.
2. Create shared `ResourceTable` conventions rather than a generic abstraction at first: action column, empty row, loading skeleton, mobile card behavior.
3. Extract shared chat primitives from connector/notebook after behavior stabilizes.
4. Extract shared tabs before adding new tabbed screens.
5. Replace one-off auth error handling with a service or hook-level convention.
6. Make `ReindexNotebookCommand` a function component when it is next touched.
7. Add shared status taxonomy for notebook, file, compile, user, connector states.

## Design Tokens

Recommended token groups:

```scss
// space
$space-1: 0.25rem;
$space-2: 0.5rem;
$space-3: 0.75rem;
$space-4: 1rem;
$space-5: 1.5rem;
$space-6: 2rem;

// size
$control-height-sm: 2rem;
$control-height-md: 2.5rem;
$control-height-lg: 3rem;
$touch-target-min: 2.75rem;

// typography
$font-size-label: 0.72rem;
$font-size-small: 0.8rem;
$font-size-body: 1rem;
$font-size-section: 1.15rem;
$font-size-page-title: 1.7rem;

// borders
$radius-none: 0;
$border-default: 1px solid var(--talalm-border);
$border-strong: 1px solid var(--talalm-border-strong);

// motion
$motion-fast: 150ms;
$motion-default: 200ms;
$motion-slow: 300ms;
```

## Future Design System

Phase the design system without changing the stack:

1. Document tokens and existing component variants.
2. Add accessibility guarantees to shared primitives.
3. Consolidate duplicated patterns only after usage is clear.
4. Add a local component gallery or Storybook-like static page if the app grows.
5. Introduce visual regression checks for key screens after layout stabilizes.

Future component set:

- App shell: Sidebar, TopNavigation, Breadcrumbs, PageHeader.
- Surfaces: Panel, StatCard, DetailBlock, EmptyState.
- Data: ResourceTable, DataTableToolbar, Pagination, StatusBadge.
- Input: FormField, SearchField, SelectField, RangeField, FileUploadField.
- Feedback: Alert, Toast, Loader, Skeleton, Progress.
- Overlay: ModalForm, ConfirmationDialog.
- Workspace: Tabs, Chat, FileBrowser, EditorShell, PreviewShell.

## Prioritized Roadmap

### Quick Wins

| Recommendation | Impact | Complexity | Priority | Risk |
|---|---|---|---|---|
| Add `/.codex/` ignore rule and document UI/UX skill usage in AGENTS | Medium | Low | P0 | Low |
| Add `htmlFor`/`id`, semantic input types, autocomplete to forms | High | Low | P0 | Low |
| Add skip link and global focus-visible style | High | Low | P0 | Low |
| Convert sidebar toggle/navigation anchors to semantic controls | High | Low | P0 | Medium |
| Add `aria-current` to pagination active page | Medium | Low | P1 | Low |
| Add accessible labels/status text to loaders | Medium | Low | P1 | Low |
| Update nav service descriptions to match current IA | Medium | Low | P1 | Low |
| Add contextual empty-state actions | Medium | Low | P1 | Low |

### Medium Effort

| Recommendation | Impact | Complexity | Priority | Risk |
|---|---|---|---|---|
| Create shared tabs component with keyboard support | High | Medium | P1 | Medium |
| Standardize page-level action placement | High | Medium | P1 | Medium |
| Introduce FormField pattern for validation, help text, required markers | High | Medium | P1 | Medium |
| Add toast/live-region feedback for save/upload/compile/reindex | High | Medium | P1 | Medium |
| Convert mobile resource tables to cards | High | Medium | P2 | Medium |
| Improve top navigation search accessibility | High | Medium | P2 | Medium |
| Consolidate confirmation modal variants and destructive button hierarchy | Medium | Medium | P2 | Low |
| Add breadcrumbs to nested resource pages | Medium | Medium | P2 | Low |

### Large Refactors

| Recommendation | Impact | Complexity | Priority | Risk |
|---|---|---|---|---|
| Rework mobile app shell into drawer sidebar | High | High | P2 | High |
| Extract shared chat components for connector and notebook | Medium | High | P3 | Medium |
| Extract shared file browser/upload primitives for notebook and paper | Medium | High | P3 | Medium |
| Centralize auth/session error handling | High | High | P2 | Medium |
| Add virtualization for large chats/files/notes/embedding results | High | High | P3 | Medium |
| Build formal design-system documentation/gallery | Medium | High | P3 | Low |

### Future Enhancements

| Recommendation | Impact | Complexity | Priority | Risk |
|---|---|---|---|---|
| Add user preferences for sidebar state and table density | Medium | Medium | P4 | Low |
| Add copy-to-clipboard controls for paths, config, IDs, logs | Medium | Low | P4 | Low |
| Add dashboard drill-down filters to notebooks/connectors | Medium | Medium | P4 | Medium |
| Add compile status timeline for papers | Medium | Medium | P4 | Medium |
| Add saved search/pinned filter presets | Low | Medium | P4 | Low |
| Add WCAG contrast test automation | High | Medium | P4 | Low |
