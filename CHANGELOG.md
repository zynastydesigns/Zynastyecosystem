# Changelog

All notable changes to the Zynasty Ecosystem portals are recorded here.

## Unreleased / Initial repo commit — 2026-07-15

### Removed
- **`client-portal.html`** — was a byte-for-byte duplicate of `index.html`,
  not linked to from anywhere in either app. Removed to avoid the two copies
  silently drifting out of sync on future edits.

### Fixed
- **Numeric keypad closing / digits entering in reverse order** in the Quotation
  Builder (Qty, Rate, Length, Height/Width fields). Root cause: every keystroke
  triggered a full re-render of the item list, and cursor position couldn't be
  restored on `type="number"` inputs (`setSelectionRange` isn't supported on
  that input type on mobile). Fixed by switching these fields to
  `type="text" inputmode="decimal"` and replacing the full re-render with a
  targeted recalculation that updates only the affected total/amount text.
- **Same issue on Discount % / Tax % fields**, which also caused the page to
  auto-scroll upward on every digit typed. Fixed the same way.
- **KYC data loss**: saving the Edit Project form was silently dropping
  `kycCompleted`, `kycFullName`, `kycEmail`, `kycAadhaarNumber`,
  `kycAddress`, and `kycSubmittedAt`, since they weren't part of the form and
  weren't carried over from the existing project record. Now preserved.

### Added
- **Salutation field** (Mr. / Mrs. / Ms. / Mx. / Dr.) next to Client Name.
  Used in project cards, the Quotation Builder header, generated PDFs, and
  all client-facing emails/WhatsApp messages.
- **Pre-quotation welcome messaging**: for projects in "In Discussion" status
  that don't yet have a saved quotation, the studio portal now shows
  "Email Welcome" / "WhatsApp Welcome" buttons (project access code + portal
  link) instead of "Email Client" / "WhatsApp Client". Once a quotation is
  saved (`quotationSavedAt` is set), it switches to the original
  quotation-ready buttons.
