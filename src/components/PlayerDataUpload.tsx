import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Upload, Users, Download, CheckCircle, AlertCircle,
  Plus, Trash2, Pencil, X, Save, FileSpreadsheet,
  UserPlus, Table2,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import type { PlayerData } from "@/pages/Index";
import { logger } from "@/lib/logger";
import { ALLOWED_SIZES, formatSizeDim } from "@/lib/sizes";
import localforage from 'localforage';

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: Field is defined OUTSIDE PlayerDataUpload.
// If it were inside, React would treat it as a brand-new component type on
// every render, unmounting/remounting the <input> and killing focus after
// each keystroke.
// ─────────────────────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  name: keyof PlayerData;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
}

const Field = ({ label, name, value, onChange, error, placeholder = "" }: FieldProps) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
      {label}
    </label>
    {name === "size" ? (
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`h-9 rounded-md border px-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 transition ${error ? "border-destructive" : "border-border"
          }`}
      >
        {ALLOWED_SIZES.map(s => (
          <option key={s} value={s}>
            Size {s} ({formatSizeDim(s)})
          </option>
        ))}
      </select>
    ) : (
      <Input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || label}
        className={`h-9 text-sm ${error ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
      />
    )}
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────

interface PlayerDataUploadProps {
  playerData: PlayerData[];
  onDataChange: (data: PlayerData[]) => void;
}

const emptyPlayer = (): PlayerData => ({
  playerName: "",
  jerseyNumber: "",
  size: "28",
  position: "",
  teamName: "",
  customTag: "",
});

type Tab = "manual" | "upload";
type FieldErrors = Partial<Record<keyof PlayerData, string>>;

export const PlayerDataUpload = ({ playerData, onDataChange }: PlayerDataUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("manual");

  // ── Add-form state ──────────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [newPlayer, setNewPlayer] = useState<PlayerData>(emptyPlayer());
  const [newErrors, setNewErrors] = useState<FieldErrors>({});

  // ── Edit-row state ──────────────────────────────────────────────────────────
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<PlayerData>(emptyPlayer());
  const [editErrors, setEditErrors] = useState<FieldErrors>({});

  // ─── Validation ─────────────────────────────────────────────────────────────
  const validateRow = (p: PlayerData): FieldErrors => {
    const errs: FieldErrors = {};
    if (!p.playerName.trim()) errs.playerName = "Player name is required";
    if (!p.jerseyNumber.trim()) errs.jerseyNumber = "Jersey number is required";
    if (!ALLOWED_SIZES.includes(p.size)) errs.size = "Select a valid size";
    return errs;
  };

  // ─── Add player ─────────────────────────────────────────────────────────────
  const handleAddPlayer = () => {
    const errs = validateRow(newPlayer);
    if (Object.keys(errs).length > 0) { setNewErrors(errs); return; }
    onDataChange([...playerData, { ...newPlayer }]);
    toast.success(`Player "${newPlayer.playerName}" added!`);
    setNewPlayer(emptyPlayer());
    setNewErrors({});
    setShowForm(false);
  };

  const openAddForm = () => {
    setNewPlayer(emptyPlayer());
    setNewErrors({});
    setShowForm(true);
  };

  const closeAddForm = () => {
    setShowForm(false);
    setNewErrors({});
  };

  // ─── Edit player ─────────────────────────────────────────────────────────────
  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditingPlayer({ ...playerData[index] });
    setEditErrors({});
  };

  const saveEdit = async () => {
    if (editingIndex === null) return;
    const errs = validateRow(editingPlayer);
    if (Object.keys(errs).length > 0) { setEditErrors(errs); return; }

    const oldPlayer = playerData[editingIndex];
    const nameChanged = oldPlayer.playerName !== editingPlayer.playerName;
    const numberChanged = oldPlayer.jerseyNumber !== editingPlayer.jerseyNumber;

    if (nameChanged || numberChanged) {
      const oldKey = `jerseyDesigner:playerElements_${oldPlayer.playerName}_${oldPlayer.jerseyNumber}`;
      const newKey = `jerseyDesigner:playerElements_${editingPlayer.playerName}_${editingPlayer.jerseyNumber}`;
      try {
        const oldData = await localforage.getItem(oldKey);
        if (oldData) {
          await localforage.setItem(newKey, oldData);
          await localforage.removeItem(oldKey);
          logger.info(`Migrated player canvas key from ${oldKey} to ${newKey}`);
        }
      } catch (err) {
        logger.error("Failed to migrate player canvas data on rename/number change:", err);
      }
    }

    const updated = [...playerData];
    updated[editingIndex] = { ...editingPlayer };
    onDataChange(updated);
    setEditingIndex(null);
    setEditErrors({});
    toast.success("Player updated!");
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditErrors({});
  };

  // ─── Delete player ──────────────────────────────────────────────────────────
  const deletePlayer = (index: number) => {
    onDataChange(playerData.filter((_, i) => i !== index));
    toast.success("Player removed");
  };

  // ─── Template download ──────────────────────────────────────────────────────
  const downloadTemplate = () => {
    const templateData = [
      { "Player Name": "John Doe", "Jersey Number": "10", "Size": "24", "Position": "Forward", "Team Name": "Falcons", "Custom Tag": "Captain" },
      { "Player Name": "Jane Smith", "Jersey Number": "7", "Size": "26", "Position": "Midfield", "Team Name": "Hawks", "Custom Tag": "Vice-Captain" },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Players");
    XLSX.writeFile(wb, "jersey_template.xlsx");
    toast.success("Template downloaded!");
  };

  // ─── Excel / CSV upload ─────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parseAndValidate = (data: any[]): { isValid: boolean; errors: string[]; validData: PlayerData[] } => {
    const errors: string[] = [];
    const validData: PlayerData[] = [];

    data.forEach((row, index) => {
      const rowNum = index + 2;
      const playerName = row["Player Name"];
      if (!playerName || typeof playerName !== "string") errors.push(`Row ${rowNum}: Player Name is required`);

      const jerseyStr = row["Jersey Number"] != null ? row["Jersey Number"].toString().trim() : "";
      if (!jerseyStr) errors.push(`Row ${rowNum}: Jersey Number is required`);

      let sizeStr = row["Size"] != null ? row["Size"].toString().trim() : "";
      if (sizeStr.endsWith(".0")) sizeStr = sizeStr.slice(0, -2);
      if (!sizeStr || !ALLOWED_SIZES.includes(sizeStr))
        errors.push(`Row ${rowNum}: Size must be one of: ${ALLOWED_SIZES.join(", ")}`);

      if (!errors.some(e => e.includes(`Row ${rowNum}`))) {
        validData.push({
          playerName: (playerName as string) || "",
          jerseyNumber: jerseyStr,
          size: sizeStr,
          position: row["Position"] || "",
          teamName: row["Team Name"] || "",
          customTag: row["Custom Tag"] || "",
        });
      }
    });

    return { isValid: errors.length === 0, errors, validData: errors.length === 0 ? validData : [] };
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error("Please upload an Excel (.xlsx, .xls) or CSV file");
      return;
    }
    setIsUploading(true);
    setValidationErrors([]);
    try {
      const workbook = XLSX.read(await file.arrayBuffer());
      const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
      if (jsonData.length === 0) { toast.error("Uploaded file is empty"); return; }

      const result = parseAndValidate(jsonData);
      if (result.isValid) {
        onDataChange(result.validData);
        toast.success(`Imported ${result.validData.length} players successfully`);
        setActiveTab("manual");
      } else {
        setValidationErrors(result.errors);
        toast.error(`${result.errors.length} validation error(s) found`);
      }
    } catch (err) {
      toast.error("Failed to parse file. Please check the format.");
      logger.error("Excel parsing error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  // ─── Inline form JSX (reused for add + edit) ────────────────────────────────
  const renderForm = (
    player: PlayerData,
    setPlayer: (p: PlayerData) => void,
    errors: FieldErrors,
    onSave: () => void,
    onCancel: () => void,
    saveLabel: string,
  ) => (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Player Name *" name="playerName" value={player.playerName}
          onChange={v => setPlayer({ ...player, playerName: v })}
          error={errors.playerName} placeholder="e.g. Virat Kohli" />

        <Field label="Jersey Number *" name="jerseyNumber" value={player.jerseyNumber}
          onChange={v => setPlayer({ ...player, jerseyNumber: v })}
          error={errors.jerseyNumber} placeholder="e.g. 18" />

        <Field label="Size *" name="size" value={player.size}
          onChange={v => setPlayer({ ...player, size: v })}
          error={errors.size} />

        <Field label="Position" name="position" value={player.position}
          onChange={v => setPlayer({ ...player, position: v })}
          placeholder="e.g. Batsman" />

        <Field label="Team Name" name="teamName" value={player.teamName}
          onChange={v => setPlayer({ ...player, teamName: v })}
          placeholder="e.g. Royal Challengers" />

        <Field label="Custom Tag" name="customTag" value={player.customTag}
          onChange={v => setPlayer({ ...player, customTag: v })}
          placeholder="e.g. Captain" />
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <Button variant="outline" size="sm" onClick={onCancel} className="gap-1.5">
          <X className="w-3.5 h-3.5" /> Cancel
        </Button>
        <Button size="sm" onClick={onSave} className="gap-1.5">
          <Save className="w-3.5 h-3.5" /> {saveLabel}
        </Button>
      </div>
    </div>
  );

  // ─── Player row ─────────────────────────────────────────────────────────────
  const renderPlayerRow = (player: PlayerData, index: number) => {
    if (editingIndex === index) {
      return (
        <div key={index} className="p-3">
          {renderForm(editingPlayer, setEditingPlayer, editErrors, saveEdit, cancelEdit, "Save Changes")}
        </div>
      );
    }

    return (
      <div key={index} className="group relative border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">

        {/* Custom tag — pinned to top-right corner */}
        {player.customTag && (
          <span className="absolute top-1.5 right-2 text-[9px] font-black uppercase tracking-wider text-primary/70 pointer-events-none select-none">
            {player.customTag}
          </span>
        )}

        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/80 to-primary/40 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
            {player.jerseyNumber || "—"}
          </div>

          <div className="flex-1 min-w-0">
            <span className="font-semibold text-sm truncate block">{player.playerName}</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">Size {player.size}</span>
              {player.position && <span className="text-xs text-muted-foreground">· {player.position}</span>}
              {player.teamName && <span className="text-xs text-muted-foreground">· {player.teamName}</span>}
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(index)} title="Edit player">
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost" size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => deletePlayer(index)} title="Delete player"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <Card className="flex flex-col overflow-hidden border-border shadow-sm">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold leading-none">Player Data</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {playerData.length > 0
                ? `${playerData.length} player${playerData.length !== 1 ? "s" : ""} added`
                : "Add or import player information"}
            </p>
          </div>
        </div>
        {playerData.length > 0 && (
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-xs font-semibold text-green-600">{playerData.length} ready</span>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border bg-muted/10">
        {(["manual", "upload"] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors ${activeTab === tab
              ? "border-b-2 border-primary text-primary bg-background"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            {tab === "manual"
              ? <><UserPlus className="w-3.5 h-3.5" /> Manual Entry</>
              : <><FileSpreadsheet className="w-3.5 h-3.5" /> Import File</>}
          </button>
        ))}
      </div>

      {/* ── MANUAL ENTRY TAB ── */}
      {activeTab === "manual" && (
        <div className="flex flex-col flex-1">

          {/* Add player section */}
          <div className="p-4 border-b border-border">
            {!showForm ? (
              <Button
                variant="outline"
                className="w-full border-dashed border-primary/40 text-primary hover:bg-primary/5 hover:border-primary gap-2 h-9 text-sm"
                onClick={openAddForm}
              >
                <Plus className="w-4 h-4" />
                Add New Player
              </Button>
            ) : (
              renderForm(newPlayer, setNewPlayer, newErrors, handleAddPlayer, closeAddForm, "Add Player")
            )}
          </div>

          {/* Player roster */}
          {playerData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-3">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                <Users className="w-7 h-7 text-muted-foreground/50" />
              </div>
              <div>
                <p className="text-sm font-medium">No players added yet</p>
                <p className="text-xs mt-0.5">Click "Add New Player" or import from a file</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto max-h-72">
              {playerData.map((player, i) => renderPlayerRow(player, i))}
            </div>
          )}

          {/* Footer */}
          {playerData.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/10">
              <span className="text-xs text-muted-foreground">
                {playerData.length} player{playerData.length !== 1 ? "s" : ""} in roster
              </span>
              <Button
                variant="ghost" size="sm"
                className="text-destructive hover:text-destructive text-xs gap-1.5 h-7 px-2"
                onClick={() => { onDataChange([]); toast.info("All players cleared"); }}
              >
                <Trash2 className="w-3 h-3" /> Clear All
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── IMPORT FILE TAB ── */}
      {activeTab === "upload" && (
        <div className="p-5 space-y-4">
          {/* Drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <Upload className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <p className="text-sm font-semibold">
              {isUploading ? "Importing…" : "Click to upload Excel or CSV"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Supports .xlsx, .xls, .csv</p>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) handleFileUpload(f);
              e.target.value = "";
            }}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />

          {/* Validation errors */}
          {validationErrors.length > 0 && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-sm font-semibold text-destructive">Validation Errors</span>
              </div>
              <ul className="text-xs text-destructive space-y-1 max-h-32 overflow-y-auto">
                {validationErrors.map((err, i) => <li key={i}>• {err}</li>)}
              </ul>
            </div>
          )}

          {/* Format guide + template */}
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Table2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Excel Format Guide</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><span className="font-semibold text-foreground">Required:</span> Player Name, Jersey Number, Size</p>
              <p><span className="font-semibold text-foreground">Optional:</span> Position, Team Name, Custom Tag</p>
              <p><span className="font-semibold text-foreground">Valid sizes:</span> {ALLOWED_SIZES.join(", ")}</p>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2 text-xs w-full">
              <Download className="w-3.5 h-3.5" />
              Download Sample Template
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};