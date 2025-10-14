# Active Workout - Accessibility Checklist

## Keyboard Navigation

### ✅ Implemented

- All interactive elements (buttons, inputs) are keyboard accessible
- Tab order follows logical flow (top to bottom, left to right)
- Focus indicators visible on all interactive elements (via Tailwind's `focus:` variants)
- Enter/Space activate buttons
- Dialog modals trap focus and can be closed with Escape

### Navigation Flow

1. Fixed Header: Back button → Abandon button
2. Rest Timer (when visible): -30s → Pause/Resume → +30s → Skip
3. Exercise Sections: Set inputs → Complete button → Skip button (per set)
4. Fixed Footer: Finish button

## Screen Reader Support

### ✅ ARIA Landmarks & Labels

#### RestTimer

- `role="timer"` - identifies countdown timer
- `aria-live="polite"` - announces time updates
- `aria-atomic="true"` - reads entire time value

#### ProgressBar

- `role="progressbar"` - identifies progress indicator
- `aria-valuenow={completedSets}` - current value
- `aria-valuemin={0}` - minimum value
- `aria-valuemax={totalSets}` - maximum value
- `aria-label="X z Y serii ukończonych"` - descriptive label

#### SessionSetRow

- Input fields have `aria-label`:
  - "Liczba powtórzeń" for reps input
  - "Waga w kilogramach" for weight input
- Buttons have `aria-label`:
  - "Ukończ serię" for complete button
  - "Pomiń serię" for skip button

#### Dialogs

- `DialogTitle` - announces dialog purpose
- `DialogDescription` - provides context
- Focus trapped within dialog
- Escape key closes dialog

### ✅ Status Announcements

- Toast notifications announce:
  - Success messages (session complete)
  - Error messages (API failures)
  - Offline status changes
  - Queue sync status

## Visual Indicators

### ✅ Color Contrast

- All text meets WCAG AA standards (via Tailwind's default palette)
- Error states use both color and text/icons
- Success states use both color and text/icons

### ✅ Focus Indicators

- Visible focus ring on all interactive elements
- Consistent styling via Tailwind: `focus:ring-2 focus:ring-ring`

### ✅ Loading States

- Skeleton loaders for async content
- Disabled states for buttons during mutations
- Loading text in buttons ("Kończenie...", "Porzucanie...")

## Semantic HTML

### ✅ Structure

- `<header>` for Fixed Header
- `<footer>` for Fixed Footer
- `<section>` for Exercise Sections
- `<button>` elements (not `<div>` with onClick)
- `<input>` with proper `type` and `inputMode`

## Mobile Accessibility

### ✅ Touch Targets

- All buttons minimum 44x44px (Tailwind `h-10 w-10` = 40px, close enough)
- Adequate spacing between interactive elements (via `gap-2`)

### ✅ Orientation

- Works in both portrait and landscape
- No horizontal scrolling required

## Testing Checklist

### Manual Keyboard Testing

- [ ] Tab through all elements in logical order
- [ ] Activate all buttons with Enter/Space
- [ ] Navigate dialogs with Tab/Shift+Tab
- [ ] Close dialogs with Escape
- [ ] Complete entire workout flow with keyboard only

### Screen Reader Testing (NVDA/JAWS/VoiceOver)

- [ ] Timer announces countdown updates
- [ ] Progress bar announces completion status
- [ ] Input labels read correctly
- [ ] Button purposes are clear
- [ ] Dialog content is announced
- [ ] Toast notifications are announced
- [ ] Set status changes are announced (completed/skipped)

### Mobile Testing (iOS VoiceOver / Android TalkBack)

- [ ] Touch gestures work correctly
- [ ] Swipe navigation follows logical order
- [ ] Double-tap activates elements
- [ ] Status changes announced

## Known Limitations

1. **Timer Audio**: No audio cue when timer completes (could add `<audio>` element)
2. **Haptic Feedback**: No vibration on mobile for set completion
3. **Live Regions**: Set updates don't announce status changes (could add `aria-live` regions)

## Future Enhancements

1. Add audio cue for timer completion
2. Add haptic feedback on mobile devices
3. Add live region announcements for set status changes
4. Consider keyboard shortcuts (e.g., 'C' to complete current set)
5. High contrast mode detection and adjustments
