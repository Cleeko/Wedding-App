"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { useToast } from "@/lib/toast";
import type { Guest, InviteStatus, RsvpStatus } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Label } from "@/components/Label";
import { Input, Textarea, Select } from "@/components/Input";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { Spinner } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";

const INVITE_LABELS: Record<InviteStatus, string> = {
  not_sent: "Not Sent",
  sent: "Sent",
  delivered: "Delivered",
};
const INVITE_COLORS: Record<InviteStatus, string> = {
  not_sent: "bg-border/60 text-text-muted",
  sent: "bg-primary/15 text-primary",
  delivered: "bg-success/15 text-success",
};
const RSVP_LABELS: Record<RsvpStatus, string> = {
  no_response: "No Response",
  attending: "Attending",
  declined: "Declined",
};
const RSVP_COLORS: Record<RsvpStatus, string> = {
  no_response: "bg-border/60 text-text-muted",
  attending: "bg-success/15 text-success",
  declined: "bg-error/10 text-error",
};

type FilterTab = "all" | "not_sent" | "sent" | "delivered" | "attending" | "declined" | "no_response";

export default function GuestsPage() {
  const router = useRouter();
  const { wedding, ready } = useRequireAuth();
  const { toast } = useToast();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const fileRef = useRef<HTMLInputElement>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formGroup, setFormGroup] = useState("");
  const [formInvite, setFormInvite] = useState<InviteStatus>("not_sent");
  const [formRsvp, setFormRsvp] = useState<RsvpStatus>("no_response");
  const [formMeal, setFormMeal] = useState("");
  const [formPlusOne, setFormPlusOne] = useState("");
  const [formDietary, setFormDietary] = useState("");
  const [saving, setSaving] = useState(false);

  // CSV state
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState("");

  const fetchGuests = useCallback(async (weddingId: string) => {
    const { data, error } = await supabase
      .from("guests")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("name", { ascending: true });
    if (error) { toast("Failed to load guests: " + error.message, "error"); return; }
    if (data) setGuests(data);
  }, [toast]);

  useEffect(() => {
    if (!ready || !wedding) return;
    fetchGuests(wedding.id).then(() => setLoading(false));
  }, [ready, wedding, fetchGuests]);

  // ==========================================
  // Stats
  // ==========================================
  const stats = {
    total: guests.length,
    invNotSent: guests.filter((g) => g.invite_status === "not_sent").length,
    invSent: guests.filter((g) => g.invite_status === "sent").length,
    invDelivered: guests.filter((g) => g.invite_status === "delivered").length,
    rsvpAttending: guests.filter((g) => g.rsvp_status === "attending").length,
    rsvpDeclined: guests.filter((g) => g.rsvp_status === "declined").length,
    rsvpNoResponse: guests.filter((g) => g.rsvp_status === "no_response").length,
  };

  // ==========================================
  // Filtering
  // ==========================================
  const filtered = guests.filter((g) => {
    const q = search.toLowerCase();
    const matchesSearch =
      g.name.toLowerCase().includes(q) ||
      g.address.toLowerCase().includes(q) ||
      g.email.toLowerCase().includes(q) ||
      g.group_label.toLowerCase().includes(q) ||
      g.plus_one_name.toLowerCase().includes(q);

    if (filterTab === "all") return matchesSearch;
    if (filterTab === "not_sent" || filterTab === "sent" || filterTab === "delivered")
      return matchesSearch && g.invite_status === filterTab;
    return matchesSearch && g.rsvp_status === filterTab;
  });

  // ==========================================
  // Quick status updates
  // ==========================================
  async function cycleInvite(g: Guest) {
    const next: InviteStatus =
      g.invite_status === "not_sent" ? "sent" : g.invite_status === "sent" ? "delivered" : "not_sent";
    const prevGuests = guests;
    setGuests((prev) => prev.map((guest) => guest.id === g.id ? { ...guest, invite_status: next } : guest));
    const { error } = await supabase.from("guests").update({ invite_status: next }).eq("id", g.id);
    if (error) {
      setGuests(prevGuests);
      toast("Failed to update invite status: " + error.message, "error");
    }
  }

  async function cycleRsvp(g: Guest) {
    const next: RsvpStatus =
      g.rsvp_status === "no_response" ? "attending" : g.rsvp_status === "attending" ? "declined" : "no_response";
    const prevGuests = guests;
    setGuests((prev) => prev.map((guest) => guest.id === g.id ? { ...guest, rsvp_status: next } : guest));
    const { error } = await supabase.from("guests").update({ rsvp_status: next }).eq("id", g.id);
    if (error) {
      setGuests(prevGuests);
      toast("Failed to update RSVP: " + error.message, "error");
    }
  }

  // ==========================================
  // Modal
  // ==========================================
  function openAdd() {
    setEditingId(null);
    setFormName(""); setFormAddress(""); setFormEmail(""); setFormPhone("");
    setFormGroup(""); setFormInvite("not_sent"); setFormRsvp("no_response");
    setFormMeal(""); setFormPlusOne(""); setFormDietary("");
    setModalOpen(true);
  }

  function openEdit(g: Guest) {
    setEditingId(g.id);
    setFormName(g.name); setFormAddress(g.address); setFormEmail(g.email);
    setFormPhone(g.phone); setFormGroup(g.group_label);
    setFormInvite(g.invite_status); setFormRsvp(g.rsvp_status);
    setFormMeal(g.meal_choice); setFormPlusOne(g.plus_one_name);
    setFormDietary(g.dietary_notes);
    setModalOpen(true);
  }

  async function saveGuest() {
    if (!formName.trim()) { toast("Please enter a guest name.", "error"); return; }
    setSaving(true);
    const payload = {
      name: formName.trim(), address: formAddress.trim(), email: formEmail.trim(),
      phone: formPhone.trim(), group_label: formGroup.trim(),
      invite_status: formInvite, rsvp_status: formRsvp,
      meal_choice: formMeal.trim(), plus_one_name: formPlusOne.trim(),
      dietary_notes: formDietary.trim(),
    };
    if (editingId) {
      const { data, error } = await supabase.from("guests").update(payload).eq("id", editingId).select().single();
      if (error) { toast("Failed to save guest: " + error.message, "error"); setSaving(false); return; }
      setGuests((prev) => prev.map((g) => g.id === editingId ? data : g));
      toast("Guest updated", "success");
    } else {
      const { data, error } = await supabase.from("guests").insert({ ...payload, wedding_id: wedding!.id }).select().single();
      if (error) { toast("Failed to add guest: " + error.message, "error"); setSaving(false); return; }
      setGuests((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      toast("Guest added!", "success");
    }
    setModalOpen(false);
    setSaving(false);
  }

  async function deleteGuest(id: string, name: string) {
    if (!confirm(`Remove ${name} from your guest list?`)) return;
    const prevGuests = guests;
    setGuests((prev) => prev.filter((g) => g.id !== id));
    const { error } = await supabase.from("guests").delete().eq("id", id);
    if (error) {
      setGuests(prevGuests);
      toast("Failed to remove guest: " + error.message, "error");
    } else {
      toast("Guest removed", "info");
    }
  }

  // ==========================================
  // CSV Import
  // ==========================================
  async function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !wedding) return;
    setImporting(true); setImportResult("");
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) { setImportResult("File appears empty."); setImporting(false); return; }
    const headers = parseCSVRow(lines[0]).map((h) => h.toLowerCase().trim());
    const nameCol = headers.findIndex((h) => h.includes("name"));
    const addressCol = headers.findIndex((h) => h.includes("address"));
    const emailCol = headers.findIndex((h) => h.includes("email"));
    const phoneCol = headers.findIndex((h) => h.includes("phone"));
    const groupCol = headers.findIndex((h) => h.includes("group") || h.includes("side") || h.includes("category"));
    if (nameCol === -1) { setImportResult('No "Name" column found.'); setImporting(false); return; }
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVRow(lines[i]);
      const name = cols[nameCol]?.trim();
      if (!name) continue;
      rows.push({
        wedding_id: wedding.id, name,
        address: addressCol >= 0 ? cols[addressCol]?.trim() || "" : "",
        email: emailCol >= 0 ? cols[emailCol]?.trim() || "" : "",
        phone: phoneCol >= 0 ? cols[phoneCol]?.trim() || "" : "",
        group_label: groupCol >= 0 ? cols[groupCol]?.trim() || "" : "",
      });
    }
    if (rows.length === 0) { setImportResult("No valid rows found."); setImporting(false); return; }
    const { error } = await supabase.from("guests").insert(rows);
    if (error) { toast("Import failed: " + error.message, "error"); setImportResult("Import failed: " + error.message); }
    else { setImportResult(`Imported ${rows.length} guest${rows.length > 1 ? "s" : ""}!`); toast(`Imported ${rows.length} guest${rows.length > 1 ? "s" : ""}!`, "success"); await fetchGuests(wedding.id); }
    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  // ==========================================
  // CSV Export
  // ==========================================
  function exportAddressCSV() {
    const guestsWithAddress = guests.filter((g) => g.address.trim());
    if (guestsWithAddress.length === 0) {
      toast("No guests have addresses to export.", "info");
      return;
    }
    const header = "Name,Address Line 1,Address Line 2";
    const rows = guestsWithAddress.map((g) => {
      const lines = g.address.split(/\n/).map((l) => l.trim()).filter(Boolean);
      const line1 = lines[0] || "";
      const line2 = lines.slice(1).join(", ");
      return [g.name, line1, line2]
        .map((v) => `"${v.replace(/"/g, '""')}"`)
        .join(",");
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "guest-addresses.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportFullCSV() {
    if (guests.length === 0) { toast("No guests to export.", "info"); return; }
    const header = "Name,Address,Email,Phone,Group,Invite Status,RSVP,Plus One,Meal Choice,Dietary Notes";
    const rows = guests.map((g) =>
      [g.name, g.address.replace(/\n/g, ", "), g.email, g.phone, g.group_label,
       g.invite_status, g.rsvp_status, g.plus_one_name, g.meal_choice, g.dietary_notes]
        .map((v) => `"${(v || "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "guest-list-full.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // ==========================================
  // Loading
  // ==========================================
  if (!ready || loading) {
    return <Spinner fullPage label="Loading guest list..." />;
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-stretch px-4 py-8">
      <PageHeader
        title="Address Book"
        subtitle={`${guests.length} guest${guests.length !== 1 ? "s" : ""}`}
      />

      {/* RSVP Stats */}
      {guests.length > 0 && (
        <div className="mb-5 grid grid-cols-3 gap-3 sm:grid-cols-6">
          <StatBox label="Total" value={stats.total} onClick={() => setFilterTab("all")} active={filterTab === "all"} />
          <StatBox label="Inv. Not Sent" value={stats.invNotSent} onClick={() => setFilterTab("not_sent")} active={filterTab === "not_sent"} color="text-text-muted" />
          <StatBox label="Inv. Sent" value={stats.invSent} onClick={() => setFilterTab("sent")} active={filterTab === "sent"} color="text-primary" />
          <StatBox label="Attending" value={stats.rsvpAttending} onClick={() => setFilterTab("attending")} active={filterTab === "attending"} color="text-success" />
          <StatBox label="Declined" value={stats.rsvpDeclined} onClick={() => setFilterTab("declined")} active={filterTab === "declined"} color="text-error" />
          <StatBox label="No RSVP" value={stats.rsvpNoResponse} onClick={() => setFilterTab("no_response")} active={filterTab === "no_response"} color="text-text-muted" />
        </div>
      )}

      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search guests..."
          className="flex-1"
        />
        <Button onClick={openAdd} className="whitespace-nowrap">
          + Add Guest
        </Button>
      </div>

      {/* CSV Import */}
      <Card variant="panel" className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm text-text-muted">
          <strong>Import from CSV</strong> — Name (required), Address, Email, Phone, Group
        </p>
        <label className="cursor-pointer rounded-md border border-secondary/40 bg-transparent px-4 py-2 text-sm font-medium text-secondary-hover hover:bg-secondary hover:text-background text-center whitespace-nowrap transition-all">
          {importing ? "Importing..." : "Choose File"}
          <input ref={fileRef} type="file" accept=".csv" onChange={handleCSV} disabled={importing} className="hidden" />
        </label>
      </Card>
      {importResult && (
        <p className={`-mt-4 mb-4 text-sm text-center ${importResult.includes("mport") && !importResult.includes("fail") ? "text-success" : "text-error"}`}>
          {importResult}
        </p>
      )}

      {/* Export & Print */}
      {guests.length > 0 && (
        <Card variant="panel" className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm text-text-muted">
            <strong>Export & Print</strong>
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={exportAddressCSV}>
              Address Labels CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportFullCSV}>
              Full Guest List CSV
            </Button>
          </div>
        </Card>
      )}

      {/* Print Service Links */}
      {guests.length > 0 && (
        <Card variant="panel" className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm text-text-muted">
            <strong>Print Labels</strong> — Export CSV above, then upload to:
          </p>
          <div className="flex flex-wrap gap-2">
            <a href="https://www.canva.com/labels/templates/" target="_blank" rel="noopener noreferrer"
              className="rounded-md border border-secondary/40 bg-transparent px-3 py-1.5 text-xs font-medium text-secondary-hover hover:bg-secondary hover:text-background transition-all text-center">
              Canva
            </a>
            <a href="https://www.shutterfly.com/cards-stationery/address-labels/" target="_blank" rel="noopener noreferrer"
              className="rounded-md border border-secondary/40 bg-transparent px-3 py-1.5 text-xs font-medium text-secondary-hover hover:bg-secondary hover:text-background transition-all text-center">
              Shutterfly
            </a>
            <a href="https://www.walmart.com/cp/custom-cards-invitations/1702640" target="_blank" rel="noopener noreferrer"
              className="rounded-md border border-secondary/40 bg-transparent px-3 py-1.5 text-xs font-medium text-secondary-hover hover:bg-secondary hover:text-background transition-all text-center">
              Walmart Photo
            </a>
          </div>
        </Card>
      )}

      {/* Guest List */}
      {filtered.length === 0 ? (
        <EmptyState
          message={guests.length === 0 ? "No guests yet. Add guests manually or import a CSV!" : "No matches found."}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border/40">
          {/* Table Header */}
          <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 border-b border-border/60 bg-surface/60 px-4 py-2.5">
            <span className="text-xs font-medium text-text-muted">Name</span>
            <span className="text-xs font-medium text-text-muted">Group</span>
            <span className="text-xs font-medium text-text-muted">Invite</span>
            <span className="text-xs font-medium text-text-muted">RSVP</span>
            <span className="text-xs font-medium text-text-muted w-20"></span>
          </div>

          {/* Table Rows */}
          {filtered.map((g) => (
            <div key={g.id}
              className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-1 sm:gap-3 sm:items-center border-b border-border/30 px-4 py-3 transition-colors hover:bg-surface/50 last:border-b-0"
            >
              {/* Name column */}
              <div className="min-w-0">
                <span className="font-semibold text-text">{g.name}</span>
                {g.address && <div className="text-sm text-text-muted truncate">{g.address.replace(/\n/g, ", ")}</div>}
                <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                  {g.email && <span className="text-xs text-text-muted/70">{g.email}</span>}
                  {g.phone && <span className="text-xs text-text-muted/70">{g.phone}</span>}
                  {g.plus_one_name && <span className="text-xs text-text-muted/70">+1: {g.plus_one_name}</span>}
                </div>
              </div>

              {/* Group column */}
              <div className="text-sm text-text-muted">
                {g.group_label || <span className="text-text-muted/40">—</span>}
              </div>

              {/* Invite column */}
              <div>
                <button
                  onClick={() => cycleInvite(g)}
                  className={`rounded-full px-2.5 py-1 text-xs transition-all hover:opacity-80 ${INVITE_COLORS[g.invite_status]}`}
                  title="Click to cycle invite status"
                >
                  {INVITE_LABELS[g.invite_status]}
                </button>
              </div>

              {/* RSVP column */}
              <div>
                <button
                  onClick={() => cycleRsvp(g)}
                  className={`rounded-full px-2.5 py-1 text-xs transition-all hover:opacity-80 ${RSVP_COLORS[g.rsvp_status]}`}
                  title="Click to cycle RSVP status"
                >
                  {RSVP_LABELS[g.rsvp_status]}
                </button>
              </div>

              {/* Actions column */}
              <div className="flex items-center gap-1 w-20 justify-end">
                <Button variant="icon" onClick={() => openEdit(g)} title="Edit">
                  &#9998;
                </Button>
                <Button variant="danger" onClick={() => deleteGuest(g.id, g.name)} title="Delete">
                  &times;
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Group chips */}
      {[...new Set(guests.map((g) => g.group_label).filter(Boolean))].sort().length > 0 && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {[...new Set(guests.map((g) => g.group_label).filter(Boolean))].sort().map((g) => (
            <button key={g} onClick={() => setSearch(g)}
              className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary hover:bg-primary/20 transition-colors">
              {g} ({guests.filter((guest) => guest.group_label === g).length})
            </button>
          ))}
          {(search || filterTab !== "all") && (
            <button onClick={() => { setSearch(""); setFilterTab("all"); }}
              className="rounded-full bg-border/50 px-3 py-1 text-xs text-text-muted hover:bg-border transition-colors">
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* =================== MODAL =================== */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Guest" : "Add Guest"}
        maxHeight
      >
        <div className="flex flex-col gap-3">
          <div>
            <Label required>Name</Label>
            <Input type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Aunt Margaret" autoFocus />
          </div>
          <div>
            <Label>Address</Label>
            <Textarea value={formAddress} onChange={(e) => setFormAddress(e.target.value)} rows={2}
              placeholder={"123 Main St\nSpringfield, IL 62704"} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email</Label>
              <Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} className="py-2.5 text-sm" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input type="tel" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} className="py-2.5 text-sm" />
            </div>
          </div>
          <div>
            <Label>Group / Side</Label>
            <Input type="text" value={formGroup} onChange={(e) => setFormGroup(e.target.value)}
              placeholder="e.g. Bride's Family" className="py-2.5 text-sm" />
          </div>

          {/* Invite & RSVP */}
          <div className="mt-2 border-t border-border pt-3">
            <p className="mb-2 text-sm text-text-muted font-semibold">Invite & RSVP</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Invite Status</Label>
                <Select value={formInvite} onChange={(e) => setFormInvite(e.target.value as InviteStatus)} className="px-3 py-2.5 text-sm">
                  <option value="not_sent">Not Sent</option>
                  <option value="sent">Sent</option>
                  <option value="delivered">Delivered</option>
                </Select>
              </div>
              <div>
                <Label>RSVP</Label>
                <Select value={formRsvp} onChange={(e) => setFormRsvp(e.target.value as RsvpStatus)} className="px-3 py-2.5 text-sm">
                  <option value="no_response">No Response</option>
                  <option value="attending">Attending</option>
                  <option value="declined">Declined</option>
                </Select>
              </div>
            </div>
          </div>

          {/* +1, Meal, Dietary */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>+1 Name</Label>
              <Input type="text" value={formPlusOne} onChange={(e) => setFormPlusOne(e.target.value)} className="px-3 py-2.5 text-sm" />
            </div>
            <div>
              <Label>Meal Choice</Label>
              <Input type="text" value={formMeal} onChange={(e) => setFormMeal(e.target.value)}
                placeholder="e.g. Chicken, Vegetarian" className="px-3 py-2.5 text-sm" />
            </div>
          </div>
          <div>
            <Label>Dietary Notes</Label>
            <Input type="text" value={formDietary} onChange={(e) => setFormDietary(e.target.value)}
              placeholder="e.g. Gluten-free, Nut allergy" className="px-3 py-2.5 text-sm" />
          </div>

          <div className="mt-3 flex justify-center gap-3">
            <Button onClick={saveGuest} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Footer */}
      <div className="mt-8 flex justify-center gap-6">
        <Button variant="link" onClick={() => router.push("/dashboard")}>
          &larr; Back to Tracker
        </Button>
      </div>
    </div>
  );
}

// ==========================================
// Stat Box Component
// ==========================================
function StatBox({ label, value, onClick, active, color }: {
  label: string; value: number; onClick: () => void; active: boolean; color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md border p-2.5 text-center transition-all ${
        active ? "border-primary bg-primary/5" : "border-border/60 bg-surface/50 hover:border-primary/40"
      }`}
    >
      <span className={`block text-xl font-semibold leading-none mb-0.5 ${color || "text-primary"}`}>{value}</span>
      <span className="block text-[0.6rem] text-text-muted leading-tight">{label}</span>
    </button>
  );
}

// ==========================================
// CSV Parser
// ==========================================
function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (inQuotes) {
      if (ch === '"' && row[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ",") { result.push(current); current = ""; }
      else { current += ch; }
    }
  }
  result.push(current);
  return result;
}
