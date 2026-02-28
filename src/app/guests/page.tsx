"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { Wedding, Guest } from "@/lib/types";

export default function GuestsPage() {
  const router = useRouter();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formGroup, setFormGroup] = useState("");
  const [saving, setSaving] = useState(false);

  // CSV import state
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState("");

  const fetchGuests = useCallback(async (weddingId: string) => {
    const { data } = await supabase
      .from("guests")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("name", { ascending: true });
    if (data) setGuests(data);
  }, []);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/"); return; }

      const { data: w } = await supabase
        .from("weddings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!w) { router.push("/setup"); return; }
      setWedding(w);
      await fetchGuests(w.id);
      setLoading(false);
    }
    init();
  }, [router, fetchGuests]);

  // Filter
  const filtered = guests.filter((g) => {
    const q = search.toLowerCase();
    return (
      g.name.toLowerCase().includes(q) ||
      g.address.toLowerCase().includes(q) ||
      g.email.toLowerCase().includes(q) ||
      g.group_label.toLowerCase().includes(q)
    );
  });

  // Groups for display
  const groups = [...new Set(guests.map((g) => g.group_label).filter(Boolean))].sort();

  // ==========================================
  // Modal
  // ==========================================
  function openAdd() {
    setEditingId(null);
    setFormName("");
    setFormAddress("");
    setFormEmail("");
    setFormPhone("");
    setFormGroup("");
    setModalOpen(true);
  }

  function openEdit(g: Guest) {
    setEditingId(g.id);
    setFormName(g.name);
    setFormAddress(g.address);
    setFormEmail(g.email);
    setFormPhone(g.phone);
    setFormGroup(g.group_label);
    setModalOpen(true);
  }

  async function saveGuest() {
    if (!formName.trim()) {
      alert("Please enter a guest name.");
      return;
    }
    setSaving(true);

    const payload = {
      name: formName.trim(),
      address: formAddress.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim(),
      group_label: formGroup.trim(),
    };

    if (editingId) {
      await supabase.from("guests").update(payload).eq("id", editingId);
    } else {
      await supabase.from("guests").insert({ ...payload, wedding_id: wedding!.id });
    }

    await fetchGuests(wedding!.id);
    setModalOpen(false);
    setSaving(false);
  }

  async function deleteGuest(id: string, name: string) {
    if (!confirm(`Remove ${name} from your guest list?`)) return;
    await supabase.from("guests").delete().eq("id", id);
    await fetchGuests(wedding!.id);
  }

  // ==========================================
  // CSV Import
  // ==========================================
  async function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !wedding) return;
    setImporting(true);
    setImportResult("");

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) {
      setImportResult("File appears empty or has no data rows.");
      setImporting(false);
      return;
    }

    // Parse header
    const headers = parseCSVRow(lines[0]).map((h) => h.toLowerCase().trim());
    const nameCol = headers.findIndex((h) => h.includes("name"));
    const addressCol = headers.findIndex((h) => h.includes("address"));
    const emailCol = headers.findIndex((h) => h.includes("email"));
    const phoneCol = headers.findIndex((h) => h.includes("phone"));
    const groupCol = headers.findIndex((h) => h.includes("group") || h.includes("side") || h.includes("category"));

    if (nameCol === -1) {
      setImportResult('Could not find a "Name" column in the CSV headers.');
      setImporting(false);
      return;
    }

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVRow(lines[i]);
      const name = cols[nameCol]?.trim();
      if (!name) continue;
      rows.push({
        wedding_id: wedding.id,
        name,
        address: addressCol >= 0 ? cols[addressCol]?.trim() || "" : "",
        email: emailCol >= 0 ? cols[emailCol]?.trim() || "" : "",
        phone: phoneCol >= 0 ? cols[phoneCol]?.trim() || "" : "",
        group_label: groupCol >= 0 ? cols[groupCol]?.trim() || "" : "",
      });
    }

    if (rows.length === 0) {
      setImportResult("No valid guest rows found.");
      setImporting(false);
      return;
    }

    const { error } = await supabase.from("guests").insert(rows);
    if (error) {
      setImportResult("Import failed: " + error.message);
    } else {
      setImportResult(`Successfully imported ${rows.length} guest${rows.length > 1 ? "s" : ""}!`);
      await fetchGuests(wedding.id);
    }

    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  // ==========================================
  // Loading
  // ==========================================
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-3 border-warm-gray border-t-dusty-blue" />
          <p className="italic text-text-muted">Loading guest list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-stretch px-4 py-8">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-normal uppercase tracking-[4px] text-text-dark">
          Address Book
        </h1>
        <p className="mt-1 text-base italic text-text-muted tracking-wider">
          {guests.length} guest{guests.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search guests..."
          className="flex-1 rounded-sm border border-warm-gray bg-parchment px-4 py-2.5 text-base transition-colors focus:border-dusty-blue-light focus:outline-none"
        />
        <button
          onClick={openAdd}
          className="rounded-sm bg-dusty-blue px-5 py-2.5 text-sm uppercase tracking-[2px] text-parchment transition-all hover:bg-dusty-blue-hover hover:-translate-y-px hover:shadow-lg whitespace-nowrap"
        >
          + Add Guest
        </button>
      </div>

      {/* CSV Import */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center rounded-sm border border-warm-gray/60 bg-parchment/50 p-4">
        <div className="flex-1">
          <p className="text-sm text-text-muted">
            <strong>Import from CSV</strong> — columns: Name (required), Address, Email, Phone, Group
          </p>
        </div>
        <label className="cursor-pointer rounded-sm border border-sage bg-transparent px-4 py-2 text-xs uppercase tracking-[1.5px] text-sage-hover transition-all hover:bg-sage hover:text-parchment text-center whitespace-nowrap">
          {importing ? "Importing..." : "Choose File"}
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleCSV}
            disabled={importing}
            className="hidden"
          />
        </label>
      </div>
      {importResult && (
        <p className={`-mt-4 mb-4 text-sm text-center ${importResult.includes("Success") ? "text-sage" : "text-red-600"}`}>
          {importResult}
        </p>
      )}

      {/* Guest List */}
      {filtered.length === 0 ? (
        <p className="py-12 text-center italic text-text-muted">
          {guests.length === 0
            ? "No guests yet. Add guests manually or import a CSV!"
            : "No matches found."}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((g) => (
            <div
              key={g.id}
              className="flex flex-col gap-2 sm:flex-row sm:items-center justify-between rounded-sm border border-dusty-blue/12 border-l-3 border-l-dusty-blue-light bg-parchment p-4 transition-all hover:shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-text-dark">{g.name}</span>
                  {g.group_label && (
                    <span className="rounded-full bg-dusty-blue/10 px-2 py-0.5 text-xs uppercase tracking-wider text-dusty-blue">
                      {g.group_label}
                    </span>
                  )}
                </div>
                {g.address && (
                  <div className="text-sm text-text-muted">{g.address.replace(/\n/g, ", ")}</div>
                )}
                <div className="flex gap-4 mt-0.5">
                  {g.email && <span className="text-sm text-text-muted">{g.email}</span>}
                  {g.phone && <span className="text-sm text-text-muted">{g.phone}</span>}
                </div>
              </div>

              <div className="flex flex-shrink-0 items-center gap-2 sm:ml-4">
                <button
                  onClick={() => openEdit(g)}
                  className="flex h-8 w-8 items-center justify-center rounded-sm border border-transparent text-text-muted transition-all hover:border-warm-gray hover:bg-parchment-dark"
                  title="Edit"
                >
                  &#9998;
                </button>
                <button
                  onClick={() => deleteGuest(g.id, g.name)}
                  className="flex h-8 w-8 items-center justify-center rounded-sm border border-transparent text-text-muted transition-all hover:border-red-200 hover:text-red-600"
                  title="Delete"
                >
                  &times;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Groups summary */}
      {groups.length > 0 && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {groups.map((g) => (
            <button
              key={g}
              onClick={() => setSearch(g)}
              className="rounded-full bg-dusty-blue/10 px-3 py-1 text-xs uppercase tracking-wider text-dusty-blue transition-colors hover:bg-dusty-blue/20"
            >
              {g} ({guests.filter((guest) => guest.group_label === g).length})
            </button>
          ))}
          {search && (
            <button
              onClick={() => setSearch("")}
              className="rounded-full bg-warm-gray/50 px-3 py-1 text-xs uppercase tracking-wider text-text-muted transition-colors hover:bg-warm-gray"
            >
              Clear filter
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-text-dark/50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div className="w-full max-w-md rounded-sm border border-dusty-blue/15 bg-gradient-to-br from-parchment to-parchment-dark p-8 shadow-lg">
            <h2 className="mb-5 text-center text-xl font-normal tracking-wider uppercase text-text-dark">
              {editingId ? "Edit Guest" : "Add Guest"}
            </h2>

            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[1.5px] text-text-muted">Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-sm border border-warm-gray bg-parchment-dark px-4 py-3 text-base text-text-dark focus:border-dusty-blue focus:outline-none"
                  placeholder="e.g. Aunt Margaret"
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1 block text-xs uppercase tracking-[1.5px] text-text-muted">Address</label>
                <textarea
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  rows={2}
                  className="w-full rounded-sm border border-warm-gray bg-parchment-dark px-4 py-3 text-base text-text-dark focus:border-dusty-blue focus:outline-none resize-y"
                  placeholder={"123 Main St\nSpringfield, IL 62704"}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[1.5px] text-text-muted">Email</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full rounded-sm border border-warm-gray bg-parchment-dark px-4 py-2.5 text-sm text-text-dark focus:border-dusty-blue focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[1.5px] text-text-muted">Phone</label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full rounded-sm border border-warm-gray bg-parchment-dark px-4 py-2.5 text-sm text-text-dark focus:border-dusty-blue focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs uppercase tracking-[1.5px] text-text-muted">Group / Side</label>
                <input
                  type="text"
                  value={formGroup}
                  onChange={(e) => setFormGroup(e.target.value)}
                  className="w-full rounded-sm border border-warm-gray bg-parchment-dark px-4 py-2.5 text-sm text-text-dark focus:border-dusty-blue focus:outline-none"
                  placeholder="e.g. Bride's Family, Groom's Friends"
                />
              </div>

              <div className="mt-2 flex justify-center gap-3">
                <button
                  onClick={saveGuest}
                  disabled={saving}
                  className="rounded-sm bg-dusty-blue px-6 py-2.5 text-sm uppercase tracking-[2px] text-parchment transition-all hover:bg-dusty-blue-hover disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setModalOpen(false)}
                  className="rounded-sm border-2 border-sage bg-transparent px-6 py-2.5 text-sm uppercase tracking-[2px] text-sage-hover transition-all hover:bg-sage hover:text-parchment"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer nav */}
      <div className="mt-8 flex justify-center gap-6">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm text-text-muted transition-colors hover:text-dusty-blue"
        >
          &larr; Back to Tracker
        </button>
      </div>
    </div>
  );
}

// ==========================================
// CSV parser (handles quoted fields with commas)
// ==========================================
function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (inQuotes) {
      if (ch === '"' && row[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        result.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}
