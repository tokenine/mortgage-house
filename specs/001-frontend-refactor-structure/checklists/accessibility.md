# Accessibility Checklist: Frontend Refactor Structure

**Purpose**: Verify a11y is preserved after regrouping/renaming components and hooks
**Created**: 2025-12-16
**Feature**: [spec.md](../spec.md)

## Roles & Labels
- [ ] Buttons, links, dialogs retain correct roles/labels
- [ ] Form fields have associated labels and descriptions
- [ ] Toasts/status messages use appropriate ARIA roles (status/alert)

## Focus Management
- [ ] Tab order remains logical and unchanged for primary flows
- [ ] Modals trap focus and restore focus on close
- [ ] Skip links or equivalent navigation still function (if present)

## Keyboard Support
- [ ] All primary actions are operable via keyboard only
- [ ] Dialog open/close, submit/cancel flows work without mouse

## Visual Contrast
- [ ] Color contrast meets guidelines; theme changes didn’t regress readability
- [ ] Icons/graphics have text alternatives where needed

## Dynamic Content
- [ ] Live updates (toasts, progress) are announced appropriately
- [ ] Loading states persist and are communicated to assistive tech

## Notes
- Record checked components and findings in the PR
- If regressions are found, link to remediation changes
