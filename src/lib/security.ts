/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║          GxStudio — PROPRIETARY SECURITY SHIELD v2.1            ║
 * ║  Unauthorized copying, reverse engineering, or redistribution   ║
 * ║  of this software is strictly prohibited.                       ║
 * ║  © 2024 GxStudio. All Rights Reserved.                          ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

/* ─── Constants ─────────────────────────────────────────────── */
const _0xA1 = '\u00A9 2024 GxStudio. All rights reserved.';
const _SHIELD_KEY = 'gxs_shield_active';

// ⚠️ ADD YOUR PRODUCTION DOMAIN HERE before going live
const _ALLOWED_DOMAINS: string[] = [
    'gxstudio.app',
    'gxstudio.vercel.app',
    'localhost',
    '127.0.0.1',
];

/* ─── 1. Domain / Hostname Lock ─────────────────────────────── */
function _domainLock(): void {
    try {
        const host = window.location.hostname.toLowerCase().replace(/^www\./, '');
        // Empty host = file:// protocol in dev – allow it
        if (!host) return;
        const allowed = _ALLOWED_DOMAINS.some(
            (d) => host === d || host.endsWith('.' + d)
        );
        if (!allowed) {
            document.documentElement.innerHTML = '';
            document.open();
            document.write(
                '<style>*{margin:0;padding:0;background:#0a0a0a;}body{display:flex;align-items:center;justify-content:center;height:100vh;} p{color:#ff3b3b;font-family:monospace;font-size:1.2rem;text-align:center;padding:2rem;}</style>' +
                '<p>\u26D4 Unauthorized Domain<br/>This application is licensed and cannot run on this host.</p>'
            );
            document.close();
        }
    } catch {
        // Never crash the app due to domain check – fail open in edge cases
    }
}

/* ─── 2. Frame-Busting (clickjacking protection) ────────────── */
function _bustFrames(): void {
    try {
        if (window.self !== window.top) {
            (window.top as Window).location.href = window.self.location.href;
        }
    } catch {
        try { window.self.location.href = 'about:blank'; } catch { /* ignore */ }
    }
}

/* ─── 3. Right-Click / Context-Menu Block ───────────────────── */
function _blockContextMenu(): void {
    document.addEventListener('contextmenu', (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }, true);
}

/* ─── 4. Keyboard Shortcut Block ────────────────────────────── */
function _blockShortcuts(): void {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
        const key = e.key?.toUpperCase();
        const ctrl = e.ctrlKey || e.metaKey;
        const shift = e.shiftKey;

        if (e.key === 'F12') { e.preventDefault(); return; }
        if (ctrl && shift && (key === 'I' || key === 'J' || key === 'C')) { e.preventDefault(); return; }
        if (ctrl && key === 'U') { e.preventDefault(); return; }
        if (ctrl && key === 'S') { e.preventDefault(); return; }
        if (ctrl && key === 'P') { e.preventDefault(); return; }
        if (ctrl && shift && key === 'K') { e.preventDefault(); return; }
    }, true);
}

/* ─── 5. Drag Protection for images/canvas ──────────────────── */
function _blockDragAndSelect(): void {
    document.addEventListener('dragstart', (e: DragEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'IMG' || target.tagName === 'CANVAS') {
            e.preventDefault();
        }
    }, true);

    const style = document.createElement('style');
    style.textContent = `
    canvas { -webkit-user-select: none !important; user-select: none !important; }
    .no-select { -webkit-user-select: none !important; user-select: none !important; }
  `;
    document.head.appendChild(style);
}

/* ─── 6. DevTools Detection (size-based only — no false positives) */
let _devToolsOpen = false;

function _showDevToolsOverlay(): void {
    if (_devToolsOpen) return;
    _devToolsOpen = true;
    const overlay = document.createElement('div');
    overlay.id = 'gxs-security-overlay';
    overlay.style.cssText = [
        'position:fixed', 'inset:0', 'z-index:2147483647',
        'background:rgba(0,0,0,0.97)',
        'display:flex', 'flex-direction:column',
        'align-items:center', 'justify-content:center',
        'font-family:monospace', 'user-select:none',
    ].join(';');
    overlay.innerHTML = `
    <div style="border:2px solid #ff3b3b;border-radius:12px;padding:3rem 4rem;text-align:center;max-width:500px;">
      <div style="font-size:3rem;margin-bottom:1rem;">🔒</div>
      <h1 style="color:#ff3b3b;font-size:1.4rem;margin-bottom:0.75rem;letter-spacing:0.05em;">SECURITY ALERT</h1>
      <p style="color:#ccc;font-size:0.9rem;line-height:1.6;margin-bottom:1.5rem;">
        Developer tools have been detected.<br/>
        This application is protected by GxStudio Security Shield.<br/>
        Unauthorized inspection is prohibited.
      </p>
      <p style="color:#666;font-size:0.7rem;">${_0xA1}</p>
    </div>
  `;
    if (document.body) document.body.appendChild(overlay);
}

function _hideDevToolsOverlay(): void {
    _devToolsOpen = false;
    const overlay = document.getElementById('gxs-security-overlay');
    if (overlay) overlay.remove();
}

function _startDevToolsDetection(): void {
    // Size-based: DevTools docked undocks the window boundary
    // Threshold of 200 avoids false positives from browser chrome / zoom
    const THRESHOLD = 200;
    setInterval(() => {
        const widthDiff = window.outerWidth - window.innerWidth;
        const heightDiff = window.outerHeight - window.innerHeight;
        // Only trigger if BOTH dimensions are suspicious (avoids zoom/sidebar false positives)
        const opened = widthDiff > THRESHOLD || heightDiff > THRESHOLD;
        if (opened && !_devToolsOpen) _showDevToolsOverlay();
        if (!opened && _devToolsOpen) _hideDevToolsOverlay();
    }, 800);
}

/* ─── 7. Console Warning ─────────────────────────────────────── */
function _consoleWarn(): void {
    // Delay so it appears after app logs settle
    setTimeout(() => {
        console.log('%c\u26D4 STOP!', 'color:#ff3b3b;font-size:2rem;font-weight:bold;');
        console.log(
            '%cThis is a browser feature intended for developers. Inspecting this proprietary application may violate our Terms of Service and applicable law.',
            'color:#aaa;font-size:0.9rem;'
        );
    }, 3000);
}

/* ─── 8. Clipboard Protection ───────────────────────────────── */
function _blockClipboardRead(): void {
    document.addEventListener('copy', (e: ClipboardEvent) => {
        const sel = window.getSelection()?.toString() ?? '';
        if (sel.length > 20) {
            e.clipboardData?.setData('text/plain', sel.slice(0, 20) + '\u2026 [content protected]');
            e.preventDefault();
        }
    }, true);
}

/* ─── 9. Watermark ───────────────────────────────────────────── */
function _addWatermark(): void {
    if (document.getElementById('gxs-watermark')) return;
    const wm = document.createElement('div');
    wm.id = 'gxs-watermark';
    wm.style.cssText = [
        'position:fixed', 'bottom:6px', 'right:10px',
        'z-index:9999999', 'pointer-events:none',
        'font-family:monospace', 'font-size:10px',
        'color:rgba(255,255,255,0.15)', 'user-select:none',
        'letter-spacing:0.05em',
    ].join(';');
    wm.textContent = '\u00A9 GxStudio \u2013 Protected';
    document.body.appendChild(wm);
}

/* ─── 10. Session Integrity ──────────────────────────────────── */
function _integrityCheck(): void {
    try { sessionStorage.setItem(_SHIELD_KEY, 'true'); } catch { /* ignore */ }
}

/* ─── BOOT: Initialise all layers (wrapped — never crash app) ── */
export function initSecurityShield(): void {
    try {
        _domainLock();
        _bustFrames();
        _blockContextMenu();
        _blockShortcuts();
        _blockDragAndSelect();
        _startDevToolsDetection();
        _consoleWarn();
        _blockClipboardRead();
        _integrityCheck();

        // Watermark needs <body> to exist
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', _addWatermark);
        } else {
            _addWatermark();
        }
    } catch {
        // Security module must NEVER crash the host application
    }
}
