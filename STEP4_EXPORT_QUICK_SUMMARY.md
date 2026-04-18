# STEP 4 EXPORT - QUICK BUG SUMMARY

## 🔴 CRITICAL BUGS (Fix Immediately)

### Bug #1: Missing jerseyImages Prop
- **Where:** `/src/pages/Index.tsx` Line 308
- **Problem:** Step4Export requires `jerseyImages` prop but it's not passed
- **Fix:** Add `jerseyImages={jerseyImages}` to the Step4Export component

### Bug #2: Canvas Cleared During Bulk Export
- **Where:** `/src/components/ExportPanel.tsx` Line 465
- **Problem:** `exportFullProductionPack()` calls `canvasRef.clear()` and never restores designs
- **Result:** User's entire design is lost after bulk export
- **Fix:** Save all canvas objects before export, restore them after

### Bug #4: Standard Bundle Doesn't Restore Canvas State
- **Where:** `/src/components/ExportPanel.tsx` Line 331-374
- **Problem:** Canvas player text is updated for each export but never restored
- **Result:** Wrong player's name/number displayed after export
- **Fix:** Save and restore initial player text state

---

## 🟠 HIGH PRIORITY BUGS

### Bug #3: Sleeve Export Confusing Error
- **Where:** `/src/components/ExportPanel.tsx` Lines 199, 243
- **Problem:** Error message misleading when sleeve bounds calculation fails
- **Fix:** Add better error context about what failed

### Bug #5: DPI Quality Labels Wrong
- **Where:** `/src/components/ExportPanel.tsx` Lines 40-55
- **Problem:** Quality multiplier values don't match stated DPI
- **Fix:** Recalculate correct multipliers for 300/450/600 DPI

### Bug #6: Points Deducted Before Validation
- **Where:** `/src/components/ExportPanel.tsx` Line 152
- **Problem:** Points taken even if export fails
- **Fix:** Validate export will work BEFORE deducting points

---

## 🟡 MEDIUM PRIORITY BUGS

### Bug #7: No Progress Indicator During Bulk Export
- **Where:** `/src/components/ExportPanel.tsx` Lines 595-597
- **Problem:** No UI feedback during large exports (looks frozen)
- **Fix:** Add proper progress bar/percentage display

### Bug #8: Blob Conversion Has No Error Handling
- **Where:** `/src/components/ExportPanel.tsx` Lines 23-33
- **Problem:** Invalid dataURL crashes blob conversion silently
- **Fix:** Add try-catch and validation

### Bug #9: File Naming Can Create Duplicates
- **Where:** `/src/components/ExportPanel.tsx` Lines 63-83
- **Problem:** Similar player names create same filename, files overwritten
- **Fix:** Add conflict detection and sequential numbering

### Bug #10: Custom Logos Fail Silently
- **Where:** `/src/components/ExportPanel.tsx` Lines 541-551
- **Problem:** Logo load failures not reported to user
- **Fix:** Show warning toast when logos fail to load

---

## 🟢 LOW PRIORITY BUGS

### Bug #11: Size Scale Factor Missing from Standard Bundle
- **Where:** `/src/components/ExportPanel.tsx` Line 337
- **Fix:** Apply size scale factor consistently in all exports

### Bug #12: Preview Window Pop-up Issues
- **Where:** `/src/components/ExportPanel.tsx` Line 286
- **Fix:** Add better pop-up blocker handling

### Bug #13: Disabled Button States Not Clear
- **Where:** `/src/components/ExportPanel.tsx` Lines 704, 758, 772
- **Fix:** Add tooltips explaining why buttons are disabled

---

## FILES CREATED
- `STEP4_EXPORT_BUGS.md` - Detailed bug report with code references
- `STEP4_EXPORT_QUICK_SUMMARY.md` - This quick reference

## NEXT STEPS
1. Fix the 3 critical bugs first
2. Address all high priority bugs
3. Schedule medium/low priority fixes for next sprint
4. Add comprehensive error logging throughout export module
5. Add unit tests for export functions

