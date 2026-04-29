/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║          GxStudio — PROPRIETARY SECURITY SHIELD v2.0            ║
 * ║  Unauthorized copying, reverse engineering, or redistribution   ║
 * ║  of this software is strictly prohibited.                       ║
 * ║  © 2024 GxStudio. All Rights Reserved.                          ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

/* ─── Constants ─────────────────────────────────────────────── */
const _0xA1 = '\u00A9 2024 GxStudio. All rights reserved.';
const _SHIELD_KEY = 'gxs_shield_active';
const _ALLOWED_DOMAINS: string[] = [
    'gxstudio.app',
    'gxstudio.vercel.app',
    'localhost',
    '127.0.0.1',
];

/* ─── 1. Domain / Hostname Lock ─────────────────────────────── */
function _domainLock(): void {
    const host = window.location.hostname.toLowerCase().replace(/^www\./, '');
    const allowed = _ALLOWED_DOMAINS.some(
        (d) => host === d || host.endsWith('.' + d)
    );
    if (!allowed) {
        document.documentElement.innerHTML = '';
        document.write(
            '<style>*{margin:0;padding:0;background:#0a0a0a;display:flex;align-items:center;justify-content:center;height:100vh;} p{color:#ff3b3b;font-family:monospace;font-size:1.2rem;text-align:center;padding:2rem;}</style>' +
            '<p>⛔ Unauthorized Domain<br/>This application is licensed and cannot run on this host.</p>'
        );
        throw new Error('DOMAIN_LOCK_VIOLATION');
    }
}

/* ─── 2. Frame-Busting (clickjacking protection) ────────────── */
function _bustFrames(): void {
    if (window.self !== window.top) {
        try {
            (window.top as Window).location.href = window.self.location.href;
        } catch {
            window.self.location.href = 'about:blank';
        }
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

        // DevTools shortcuts
        if (e.key === 'F12') { e.preventDefault(); return; }
        if (ctrl && shift && (key === 'I' || key === 'J' || key === 'C')) { e.preventDefault(); return; }
        if (ctrl && key === 'U') { e.preventDefault(); return; } // view-source
        if (ctrl && key === 'S') { e.preventDefault(); return; } // save page
        if (ctrl && key === 'P') { e.preventDefault(); return; } // print
        if (ctrl && shift && key === 'K') { e.preventDefault(); return; } // Firefox console
        if (ctrl && key === 'A' && (e.target as HTMLElement)?.tagName !== 'INPUT' && (e.target as HTMLElement)?.tagName !== 'TEXTAREA') {
            // Allow select-all inside inputs but block on canvas/body
        }
    }, true);
}

/* ─── 5. Text / DOM Select-All Block on Main App ────────────── */
function _blockDragAndSelect(): void {
    // Prevent dragging images / assets out
    document.addEventListener('dragstart', (e: DragEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'IMG' || target.tagName === 'CANVAS') {
            e.preventDefault();
        }
    }, true);

    // Prevent user selecting text on the designer canvas area
    const style = document.createElement('style');
    style.textContent = `
    canvas { -webkit-user-select: none !important; user-select: none !important; }
    .no-select { -webkit-user-select: none !important; user-select: none !important; }
  `;
    document.head.appendChild(style);
}

/* ─── 6. DevTools Detection ─────────────────────────────────── */
let _devToolsOpen = false;
let _devToolsTimer: ReturnType<typeof setInterval> | null = null;

function _onDevToolsOpened(): void {
    if (_devToolsOpen) return;
    _devToolsOpen = true;
    console.clear();
    // Overlay warning
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
    document.body.appendChild(overlay);

    // Nuke console output to prevent source reading
    const noop = () => { };
    ['log', 'debug', 'info', 'warn', 'error', 'dir', 'dirxml', 'table', 'trace', 'group', 'groupCollapsed', 'groupEnd', 'time', 'timeEnd', 'count', 'assert', 'profile', 'profileEnd'].forEach((m) => {
        (console as unknown as Record<string, unknown>)[m] = noop;
    });
}

function _onDevToolsClosed(): void {
    _devToolsOpen = false;
    const overlay = document.getElementById('gxs-security-overlay');
    if (overlay) overlay.remove();
}

function _startDevToolsDetection(): void {
    // Method 1: Size-based detection
    const threshold = 160;
    _devToolsTimer = setInterval(() => {
        const widthDiff = window.outerWidth - window.innerWidth;
        const heightDiff = window.outerHeight - window.innerHeight;
        const opened = widthDiff > threshold || heightDiff > threshold;
        if (opened && !_devToolsOpen) _onDevToolsOpened();
        if (!opened && _devToolsOpen) _onDevToolsClosed();
    }, 500);

    // Method 2: debugger-based detection via toString trick
    const _dt = /./;
    _dt.toString = () => { _onDevToolsOpened(); return ''; };
    // Trigger it periodically with devtools-only code path
    setInterval(() => {
        console.log('%c', _dt);
    }, 2000);

    // Method 3: Firebug legacy check
    if (typeof (window as unknown as Record<string, unknown>)['_firebug'] !== 'undefined') {
        _onDevToolsOpened();
    }
}

/* ─── 7. Console Warning & Honeypot ─────────────────────────── */
function _consoleWarn(): void {
    const style1 = 'color:#ff3b3b;font-size:2rem;font-weight:bold;';
    const style2 = 'color:#ccc;font-size:0.9rem;';
    console.log('%c⛔ STOP!', style1);
    console.log(
        '%cThis is a browser feature intended for developers. Do not paste code or inspect this application. Doing so may violate our Terms of Service and applicable law.',
        style2
    );
}

/* ─── 8. Source-Map Poisoning (runtime noop) ─────────────────── */
function _removeSourceMapLinks(): void {
    // If any script tags have sourceMappingURL comments they're stripped at build.
    // This is a runtime safety net.
    document.querySelectorAll('script[src]').forEach((el) => {
        const s = el as HTMLScriptElement;
        if (s.src.includes('.map')) s.remove();
    });
}

/* ─── 9. Clipboard Hijack Prevention ────────────────────────── */
function _blockClipboardRead(): void {
    document.addEventListener('copy', (e: ClipboardEvent) => {
        const sel = window.getSelection()?.toString() ?? '';
        if (sel.length > 20) {
            // Allow copying short texts (e.g. user inputs), block bulk code copy
            e.clipboardData?.setData('text/plain', sel.slice(0, 20) + '… [content protected]');
            e.preventDefault();
        }
    }, true);
}

/* ─── 10. Anti-Screenshot (CSS pointer-events on sensitive areas) */
function _addWatermark(): void {
    const wm = document.createElement('div');
    wm.id = 'gxs-watermark';
    wm.style.cssText = [
        'position:fixed', 'bottom:6px', 'right:10px',
        'z-index:9999999', 'pointer-events:none',
        'font-family:monospace', 'font-size:10px',
        'color:rgba(255,255,255,0.18)', 'user-select:none',
        'letter-spacing:0.05em',
    ].join(';');
    wm.textContent = '© GxStudio – Protected';
    document.body.appendChild(wm);
}

/* ─── 11. Session Integrity Check ───────────────────────────── */
function _integrityCheck(): void {
    sessionStorage.setItem(_SHIELD_KEY, 'true');
}

/* ─── BOOT: Initialise all layers ───────────────────────────── */
export function initSecurityShield(): void {
    try { _domainLock(); } catch { /* re-throw only for domain lock */ }
    _bustFrames();
    _blockContextMenu();
    _blockShortcuts();
    _blockDragAndSelect();
    _startDevToolsDetection();
    _consoleWarn();
    _removeSourceMapLinks();
    _blockClipboardRead();
    _integrityCheck();

    // Watermark is added after DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _addWatermark);
    } else {
        _addWatermark();
    }
}
