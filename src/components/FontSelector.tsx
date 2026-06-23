import { useState, useRef, useEffect } from "react";
import { JERSEY_FONTS, FONT_CATEGORIES, getFontsByCategory } from "@/lib/fonts";
import { Search, ChevronDown, Type, Check, Upload, Pipette } from "lucide-react";
import { toast } from "sonner";
import { saveCustomFont, getAllCustomFonts } from "@/lib/fontStorage";
import { logger } from "@/lib/logger";

// ─── Preset colour swatches (MS-Word style palette) ──────────────────────────
const COLOR_SWATCHES = [
    // Row 1 – Blacks & Whites
    "#000000", "#1C1C1C", "#3D3D3D", "#5A5A5A", "#808080",
    "#A0A0A0", "#C0C0C0", "#E0E0E0", "#F5F5F5", "#FFFFFF",
    // Row 2 – Reds & Oranges
    "#B71C1C", "#D32F2F", "#F44336", "#E91E63", "#FF5722",
    "#FF7043", "#FF8A65", "#FFAB91", "#FF6D00", "#FFAB40",
    // Row 3 – Yellows & Greens
    "#F9A825", "#FDD835", "#FFEE58", "#CDDC39", "#8BC34A",
    "#4CAF50", "#43A047", "#2E7D32", "#1B5E20", "#00C853",
    // Row 4 – Blues & Teals
    "#0D47A1", "#1565C0", "#1976D2", "#42A5F5", "#90CAF9",
    "#006064", "#00838F", "#00ACC1", "#26C6DA", "#80DEEA",
    // Row 5 – Purples & Pinks
    "#4A148C", "#6A1B9A", "#8E24AA", "#AB47BC", "#CE93D8",
    "#880E4F", "#AD1457", "#E91E63", "#F48FB1", "#FCE4EC",
    // Row 6 – Sports classics
    "#FFD700", "#C9A000", "#FF6600", "#CC0000", "#003399",
    "#006400", "#800080", "#FF0080", "#00CED1", "#8B4513",
];

interface FontSelectorProps {
    value: string;
    onChange: (font: string) => void;
    color?: string;
    onColorChange?: (color: string) => void;
    strokeColor?: string;
    onStrokeColorChange?: (color: string) => void;
    strokeWidth?: number;
    onStrokeWidthChange?: (width: number) => void;
    label?: string;
    showPreview?: boolean;
}

// ─── Defined at MODULE level — stable reference, no focus-loss bug ───────────
export const FontSelector = ({
    value,
    onChange,
    color = "#000000",
    onColorChange,
    strokeColor = "#FFFFFF",
    onStrokeColorChange,
    strokeWidth = 0,
    onStrokeWidthChange,
    label = "Font Family",
    showPreview = true,
}: FontSelectorProps) => {
    // Font picker state
    const [fontOpen, setFontOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const fontDropRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    // Color picker state
    const [colorOpen, setColorOpen] = useState(false);
    const [hexInput, setHexInput] = useState(color);
    const colorDropRef = useRef<HTMLDivElement>(null);
    const nativeColorRef = useRef<HTMLInputElement>(null);

    // Stroke picker state
    const [strokeOpen, setStrokeOpen] = useState(false);
    const [strokeHexInput, setStrokeHexInput] = useState(strokeColor);
    const strokeDropRef = useRef<HTMLDivElement>(null);
    const nativeStrokeColorRef = useRef<HTMLInputElement>(null);

    // Font import state
    const [customFonts, setCustomFonts] = useState<{ value: string; label: string; category?: string }[]>([]);
    const fontFileRef = useRef<HTMLInputElement>(null);

    const selectedFont = [...JERSEY_FONTS, ...customFonts].find(f => f.value === value);

    // Load persisted custom fonts on mount
    useEffect(() => {
        let mounted = true;
        getAllCustomFonts().then(stored => {
            if (!mounted) return;
            const newCustoms: typeof customFonts = [];
            for (const sf of stored) {
                try {
                    const fontFace = new FontFace(sf.name, sf.buffer);
                    fontFace.load().then(loaded => {
                        document.fonts.add(loaded);
                    }).catch(err => logger.error('Font load err:', err));
                    newCustoms.push({ value: sf.name, label: `${sf.name} (Custom)`, category: "Custom" });
                } catch (e) {
                    logger.error('Font hydration err', sf.name, e);
                }
            }
            if (newCustoms.length > 0) {
                setCustomFonts(prev => {
                    const existingNames = new Set(prev.map(p => p.value));
                    return [...prev, ...newCustoms.filter(c => !existingNames.has(c.value))];
                });
            }
        });
        return () => { mounted = false; };
    }, []);

    // Sync hex input with prop color
    useEffect(() => { setHexInput(color); }, [color]);
    useEffect(() => { setStrokeHexInput(strokeColor); }, [strokeColor]);

    // Close font dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (fontDropRef.current && !fontDropRef.current.contains(e.target as Node)) {
                setFontOpen(false); setSearch("");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Close color dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (colorDropRef.current && !colorDropRef.current.contains(e.target as Node)) {
                setColorOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Close stroke dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (strokeDropRef.current && !strokeDropRef.current.contains(e.target as Node)) {
                setStrokeOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Auto-focus search when font dropdown opens
    useEffect(() => {
        if (fontOpen) setTimeout(() => searchRef.current?.focus(), 50);
    }, [fontOpen]);

    type FontItem = { value: string; label: string; category?: string };
    const allFonts: FontItem[] = [...JERSEY_FONTS, ...customFonts];
    const filtered = (category === "All" ? allFonts : allFonts.filter(f => f.category === category || (customFonts.some(c => c.value === f.value) && category === "Custom")))
        .filter(f => f.label.toLowerCase().includes(search.toLowerCase()) || f.value.toLowerCase().includes(search.toLowerCase()));

    const handleFontSelect = (fontValue: string) => {
        onChange(fontValue);
        setFontOpen(false);
        setSearch("");
    };

    // ── Hex input handler ─────────────────────────────────────────────────────
    const applyHex = (raw: string) => {
        const hex = raw.startsWith("#") ? raw : `#${raw}`;
        if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
            onColorChange?.(hex);
            setHexInput(hex);
        }
    };
    
    const applyStrokeHex = (raw: string) => {
        const hex = raw.startsWith("#") ? raw : `#${raw}`;
        if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
            onStrokeColorChange?.(hex);
            setStrokeHexInput(hex);
        }
    };

    // ── Custom font import ─────────────────────────────────────────────────────
    const handleFontImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowed = [".ttf", ".otf", ".woff", ".woff2"];
        const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
        if (!allowed.includes(ext)) {
            toast.error("Unsupported font format. Use TTF, OTF, WOFF or WOFF2.");
            return;
        }

        try {
            const arrayBuffer = await file.arrayBuffer();
            // Font family name = filename without extension
            const fontName = file.name.replace(/\.[^.]+$/, "");
            const fontFace = new FontFace(fontName, arrayBuffer);
            const loaded = await fontFace.load();
            document.fonts.add(loaded);

            // Persist to IndexedDB
            await saveCustomFont(fontName, arrayBuffer);

            const newFont = { value: fontName, label: `${fontName} (Custom)`, category: "Custom" };
            setCustomFonts(prev => {
                if (prev.some(f => f.value === fontName)) return prev;
                return [...prev, newFont];
            });
            onChange(fontName);
            toast.success(`Font "${fontName}" imported!`);

            // Add Custom category to filter list if not already there
        } catch (err) {
            toast.error("Failed to load font file.");
        }

        // Reset input so same file can be re-imported
        e.target.value = "";
    };

    // ── Visible categories (add Custom if any custom fonts exist) ─────────────
    const visibleCategories = customFonts.length > 0
        ? [...FONT_CATEGORIES, "Custom"]
        : FONT_CATEGORIES;

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-3">

            {/* Section label */}
            <div className="flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
            </div>

            {/* Row: font trigger + color button + import button */}
            <div className="flex gap-2">

                {/* ── FONT DROPDOWN ── */}
                <div ref={fontDropRef} className="relative flex-1 min-w-0">
                    <button
                        onClick={() => setFontOpen(o => !o)}
                        className={`w-full flex items-center justify-between h-9 px-3 rounded-md border text-sm transition-all
              bg-background hover:bg-muted/30 focus:outline-none
              ${fontOpen ? "border-primary ring-2 ring-primary/20" : "border-border"}`}
                    >
                        <span className="truncate font-medium" style={{ fontFamily: value }}>
                            {selectedFont?.label ?? value}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground ml-2 shrink-0 transition-transform duration-150 ${fontOpen ? "rotate-180" : ""}`} />
                    </button>

                    {fontOpen && (
                        <div className="absolute z-50 top-[calc(100%+4px)] left-0 w-[280px] sm:w-[320px] rounded-lg border border-border bg-popover shadow-xl overflow-hidden animate-in fade-in-0 slide-in-from-top-1 duration-150">

                            {/* Search */}
                            <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/20">
                                <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                <input
                                    ref={searchRef}
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search fonts…"
                                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                                />
                                {search && (
                                    <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
                                )}
                            </div>

                            {/* Category chips */}
                            <div className="flex gap-1 px-3 py-2 overflow-x-auto border-b border-border bg-muted/10 scrollbar-none">
                                {visibleCategories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setCategory(cat)}
                                        className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all
                      ${category === cat
                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                : "bg-secondary text-secondary-foreground hover:bg-muted"}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            {/* Font list */}
                            <div className="max-h-52 overflow-y-auto py-1">
                                {filtered.length === 0 ? (
                                    <div className="py-6 text-center text-xs text-muted-foreground">No fonts match "{search}"</div>
                                ) : (
                                    filtered.map(font => (
                                        <button
                                            key={font.value}
                                            onClick={() => handleFontSelect(font.value)}
                                            className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-primary/10 transition-colors
                        ${value === font.value ? "bg-primary/10" : ""}`}
                                        >
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-base leading-tight truncate" style={{ fontFamily: font.value }}>
                                                    {font.value}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground mt-0.5">
                                                    {(font as FontItem).category ?? "Custom"}
                                                </span>
                                            </div>
                                            {value === font.value && <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-2" />}
                                        </button>
                                    ))
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-3 py-1.5 border-t border-border bg-muted/10 flex items-center justify-between">
                                <span className="text-[10px] text-muted-foreground">
                                    {filtered.length} font{filtered.length !== 1 ? "s" : ""}
                                    {search ? ` matching "${search}"` : category !== "All" ? ` in ${category}` : ""}
                                </span>
                                {/* Import from footer too */}
                                <button
                                    onClick={() => fontFileRef.current?.click()}
                                    className="flex items-center gap-1 text-[10px] text-primary hover:underline font-medium"
                                >
                                    <Upload className="w-3 h-3" /> Import font
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── COLOR BUTTON ── */}
                {onColorChange && (
                    <div ref={colorDropRef} className="relative">
                        <button
                            onClick={() => setColorOpen(o => !o)}
                            title="Font colour"
                            className={`h-9 w-9 rounded-md border flex items-center justify-center transition-all hover:bg-muted/30
                ${colorOpen ? "border-primary ring-2 ring-primary/20" : "border-border"}`}
                        >
                            {/* Letter A with colour bar underneath — like MS Word */}
                            <div className="flex flex-col items-center gap-px">
                                <span className="text-xs font-black leading-none" style={{ color }}>A</span>
                                <span className="w-4 h-1.5 rounded-sm" style={{ background: color }} />
                            </div>
                        </button>

                        {colorOpen && (
                            <div className="absolute z-50 top-[calc(100%+4px)] right-0 w-64 rounded-lg border border-border bg-popover shadow-xl p-3 space-y-3 animate-in fade-in-0 slide-in-from-top-1 duration-150">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <Pipette className="w-3 h-3" /> Font Colour
                                </p>

                                {/* Swatch grid */}
                                <div className="grid grid-cols-10 gap-1">
                                    {COLOR_SWATCHES.map(swatch => (
                                        <button
                                            key={swatch}
                                            title={swatch}
                                            onClick={() => { onColorChange(swatch); setHexInput(swatch); }}
                                            className={`w-5 h-5 rounded-sm border transition-transform hover:scale-110 hover:z-10
                        ${color === swatch ? "ring-2 ring-primary ring-offset-1 scale-110" : "border-border/40"}`}
                                            style={{ background: swatch }}
                                        />
                                    ))}
                                </div>

                                {/* Hex input row */}
                                <div className="flex items-center gap-2 pt-1 border-t border-border">
                                    {/* Native colour well */}
                                    <div className="relative w-8 h-8 rounded border border-border overflow-hidden shrink-0 cursor-pointer">
                                        <span className="absolute inset-0 pointer-events-none rounded" style={{ background: color }} />
                                        <input
                                            ref={nativeColorRef}
                                            type="color"
                                            value={color}
                                            onChange={e => { onColorChange(e.target.value); setHexInput(e.target.value); }}
                                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                        />
                                    </div>
                                    <input
                                        value={hexInput}
                                        onChange={e => setHexInput(e.target.value)}
                                        onBlur={e => applyHex(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && applyHex(hexInput)}
                                        maxLength={7}
                                        className="flex-1 h-8 px-2 rounded border border-border bg-background text-xs font-mono uppercase outline-none focus:ring-2 focus:ring-primary/30"
                                        placeholder="#000000"
                                    />
                                    <button
                                        onClick={() => applyHex(hexInput)}
                                        className="h-8 px-2 rounded bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition"
                                    >OK</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {/* ── STROKE BUTTON ── */}
                {onStrokeColorChange && onStrokeWidthChange && (
                    <div ref={strokeDropRef} className="relative">
                        <button
                            onClick={() => setStrokeOpen(o => !o)}
                            title="Outline/Stroke"
                            className={`h-9 w-9 rounded-md border flex items-center justify-center transition-all hover:bg-muted/30
                ${strokeOpen ? "border-primary ring-2 ring-primary/20" : "border-border"}`}
                        >
                            <div className="flex flex-col items-center gap-px relative">
                                <span className="text-xs font-black leading-none text-transparent" style={{ WebkitTextStroke: `1px ${strokeColor}` }}>A</span>
                            </div>
                        </button>

                        {strokeOpen && (
                            <div className="absolute z-50 top-[calc(100%+4px)] right-0 w-64 rounded-lg border border-border bg-popover shadow-xl p-3 space-y-3 animate-in fade-in-0 slide-in-from-top-1 duration-150">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <Type className="w-3 h-3" /> Outline Colour
                                </p>

                                {/* Swatch grid */}
                                <div className="grid grid-cols-10 gap-1">
                                    {COLOR_SWATCHES.map(swatch => (
                                        <button
                                            key={swatch}
                                            title={swatch}
                                            onClick={() => { onStrokeColorChange(swatch); setStrokeHexInput(swatch); }}
                                            className={`w-5 h-5 rounded-sm border transition-transform hover:scale-110 hover:z-10
                        ${strokeColor === swatch ? "ring-2 ring-primary ring-offset-1 scale-110" : "border-border/40"}`}
                                            style={{ background: swatch }}
                                        />
                                    ))}
                                </div>

                                {/* Hex input row */}
                                <div className="flex items-center gap-2 pt-1 border-t border-border">
                                    <div className="relative w-8 h-8 rounded border border-border overflow-hidden shrink-0 cursor-pointer">
                                        <span className="absolute inset-0 pointer-events-none rounded" style={{ background: strokeColor }} />
                                        <input
                                            ref={nativeStrokeColorRef}
                                            type="color"
                                            value={strokeColor}
                                            onChange={e => { onStrokeColorChange(e.target.value); setStrokeHexInput(e.target.value); }}
                                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                        />
                                    </div>
                                    <input
                                        value={strokeHexInput}
                                        onChange={e => setStrokeHexInput(e.target.value)}
                                        onBlur={e => applyStrokeHex(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && applyStrokeHex(strokeHexInput)}
                                        maxLength={7}
                                        className="flex-1 h-8 px-2 rounded border border-border bg-background text-xs font-mono uppercase outline-none focus:ring-2 focus:ring-primary/30"
                                        placeholder="#000000"
                                    />
                                    <button
                                        onClick={() => applyStrokeHex(strokeHexInput)}
                                        className="h-8 px-2 rounded bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition"
                                    >OK</button>
                                </div>
                                
                                <div className="pt-2 border-t border-border space-y-2">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                                        Outline Thickness
                                        <span>{strokeWidth}px</span>
                                    </p>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="20" 
                                        value={strokeWidth} 
                                        onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
                                        className="w-full accent-primary"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── IMPORT FONT BUTTON ── */}
                <button
                    onClick={() => fontFileRef.current?.click()}
                    title="Import custom font (.ttf, .otf, .woff)"
                    className="h-9 w-9 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
                >
                    <Upload className="w-4 h-4" />
                </button>

                {/* Hidden file input for font import */}
                <input
                    ref={fontFileRef}
                    type="file"
                    accept=".ttf,.otf,.woff,.woff2"
                    onChange={handleFontImport}
                    className="hidden"
                />
            </div>

            {/* ── LIVE PREVIEW ── */}
            {showPreview && value && (
                <div className="rounded-md border border-border bg-muted/20 px-4 py-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Preview</p>
                    <p className="text-2xl leading-tight" style={{ fontFamily: value, color, WebkitTextStroke: strokeWidth > 0 ? `${strokeWidth / 5}px ${strokeColor}` : 'none' }}>
                        ABCXYZ 123
                    </p>
                    <p className="text-sm mt-1 opacity-70" style={{ fontFamily: value, color, WebkitTextStroke: strokeWidth > 0 ? `${strokeWidth / 10}px ${strokeColor}` : 'none' }}>
                        Player Name #99
                    </p>
                </div>
            )}
        </div>
    );
};
