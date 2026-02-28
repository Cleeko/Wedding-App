"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { useToast } from "@/lib/toast";
import type { Guest, InviteStatus, RsvpStatus } from "@/lib/types";

const INVITE_LABELS: Record<InviteStatus, string> = {
  not_sent: "Not Sent",
  sent: "Sent",
  delivered: "Delivered",
};
const INVITE_COLORS: Record<InviteStatus, string> = {
  not_sent: "bg-warm-gray/60 text-text-muted",
  sent: "bg-dusty-blue/15 text-dusty-blue",
  delivered: "bg-sage/15 text-sage-hover",
};
const RSVP_LABELS: Record<RsvpStatus, string> = {
  no_response: "No Response",
  attending: "Attending",
  declined: "Declined",
};
const RSVP_COLORS: Record<RsvpStatus, string> = {
  no_response: "bg-warm-gray/60 text-text-muted",
  attending: "bg-sage/15 text-sage-hover",
  declined: "bg-red-100 text-red-600",
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
    const { data } = await supabase
      .from("guests")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("name", { ascending: true });
    if (data) setGuests(data);
  }, []);

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
    if (error) { setImportResult("Import failed: " + error.message); }
    else { setImportResult(`Imported ${rows.length} guest${rows.length > 1 ? "s" : ""}!`); await fetchGuests(wedding.id); }
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

      {/* RSVP Stats */}
      {guests.length > 0 && (
        <div className="mb-5 grid grid-cols-3 gap-3 sm:grid-cols-6">
          <StatBox label="Total" value={stats.total} onClick={() => setFilterTab("all")} active={filterTab === "all"} />
          <StatBox label="Inv. Not Sent" value={stats.invNotSent} onClick={() => setFilterTab("not_sent")} active={filterTab === "not_sent"} color="text-text-muted" />
          <StatBox label="Inv. Sent" value={stats.invSent} onClick={() => setFilterTab("sent")} active={filterTab === "sent"} color="text-dusty-blue" />
          <StatBox label="Attending" value={stats.rsvpAttending} onClick={() => setFilterTab("attending")} active={filterTab === "attending"} color="text-sage-hover" />
          <StatBox label="Declined" value={stats.rsvpDeclined} onClick={() => setFilterTab("declined")} active={filterTab === "declined"} color="text-red-500" />
          <StatBox label="No RSVP" value={stats.rsvpNoResponse} onClick={() => setFilterTab("no_response")} active={filterTab === "no_response"} color="text-text-muted" />
        </div>
      )}

      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search guests..."
          className="flex-1 rounded-sm border border-warm-gray bg-parchment px-4 py-2.5 text-base focus:border-dusty-blue-light focus:outline-none"
        />
        <button onClick={openAdd}
          className="rounded-sm bg-dusty-blue px-5 py-2.5 text-sm uppercase tracking-[2px] text-parchment hover:bg-dusty-blue-hover hover:-translate-y-px hover:shadow-lg whitespace-nowrap transition-all">
          + Add Guest
        </button>
      </div>

      {/* CSV Import */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center rounded-sm border border-warm-gray/60 bg-parchment/50 p-4">
        <p className="flex-1 text-sm text-text-muted">
          <strong>Import from CSV</strong> — Name (required), Address, Email, Phone, Group
        </p>
        <label className="cursor-pointer rounded-sm border border-sage bg-transparent px-4 py-2 text-xs uppercase tracking-[1.5px] text-sage-hover hover:bg-sage hover:text-parchment text-center whitespace-nowrap transition-all">
          {importing ? "Importing..." : "Choose File"}
          <input ref={fileRef} type="file" accept=".csv" onChange={handleCSV} disabled={importing} className="hidden" />
        </label>
      </div>
      {importResult && (
        <p className={`-mt-4 mb-4 text-sm text-center ${importResult.includes("mport") && !importResult.includes("fail") ? "text-sage" : "text-red-600"}`}>
          {importResult}
        </p>
      )}

      {/* Export & Print */}
      {guests.length > 0 && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center rounded-sm border border-warm-gray/60 bg-parchment/50 p-4">
          <p className="flex-1 text-sm text-text-muted">
            <strong>Export & Print</strong>
          </p>
          <div className="flex flex-wrap gap-2">
            <button onClick={exportAddressCSV}
              className="rounded-sm border border-dusty-blue-light bg-transparent px-3 py-1.5 text-xs uppercase tracking-[1.5px] text-dusty-blue hover:bg-dusty-blue hover:text-parchment transition-all">
              Address Labels CSV
            </button>
            <button onClick={exportFullCSV}
              className="rounded-sm border border-dusty-blue-light bg-transparent px-3 py-1.5 text-xs uppercase tracking-[1.5px] text-dusty-blue hover:bg-dusty-blue hover:text-parchment transition-all">
              Full Guest List CSV
            </button>
          </div>
        </div>
      )}

      {/* Print Service Links */}
      {guests.length > 0 && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center rounded-sm border border-warm-gray/60 bg-parchment/50 p-4">
          <p className="flex-1 text-sm text-text-muted">
            <strong>Print Labels</strong> — Export CSV above, then upload to:
          </p>
          <div className="flex flex-wrap gap-2">
            <a href="https://www.canva.com/labels/templates/" target="_blank" rel="noopener noreferrer"
              className="rounded-sm border border-sage bg-transparent px-3 py-1.5 text-xs uppercase tracking-[1.5px] text-sage-hover hover:bg-sage hover:text-parchment transition-all text-center">
              Canva
            </a>
            <a href="https://www.shutterfly.com/cards-stationery/address-labels/" target="_blank" rel="noopener noreferrer"
              className="rounded-sm border border-sage bg-transparent px-3 py-1.5 text-xs uppercase tracking-[1.5px] text-sage-hover hover:bg-sage hover:text-parchment transition-all text-center">
              Shutterfly
            </a>
            <a href="https://www.walmart.com/cp/custom-cards-invitations/1702640" target="_blank" rel="noopener noreferrer"
              className="rounded-sm border border-sage bg-transparent px-3 py-1.5 text-xs uppercase tracking-[1.5px] text-sage-hover hover:bg-sage hover:text-parchment transition-all text-center">
              Walmart Photo
            </a>
          </div>
        </div>
      )}

      {/* Guest List */}
      {filtered.length === 0 ? (
        <p className="py-12 text-center italic text-text-muted">
          {guests.length === 0 ? "No guests yet. Add guests manually or import a CSV!" : "No matches found."}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((g) => (
            <div key={g.id}
              className="flex flex-col gap-2 rounded-sm border border-dusty-blue/12 border-l-3 border-l-dusty-blue-light bg-parchment p-4 transition-all hover:shadow-sm"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-semibold text-text-dark">{g.name}</span>
                    {g.group_label && (
                      <span className="rounded-full bg-dusty-blue/10 px-2 py-0.5 text-xs uppercase tracking-wider text-dusty-blue">
                        {g.group_label}
                      </span>
                    )}
                  </div>
                  {g.address && <div className="text-sm text-text-muted">{g.address.replace(/\n/g, ", ")}</div>}
                  <div className="flex flex-wrap gap-3 mt-0.5">
                    {g.email && <span className="text-sm text-text-muted">{g.email}</span>}
                    {g.phone && <span className="text-sm text-text-muted">{g.phone}</span>}
                    {g.plus_one_name && <span className="text-sm text-text-muted">+1: {g.plus_one_name}</span>}
                    {g.meal_choice && <span className="text-sm text-text-muted">Meal: {g.meal_choice}</span>}
                    {g.dietary_notes && <span className="text-sm text-text-muted">Diet: {g.dietary_notes}</span>}
                  </div>
                </div>

                <div className="flex flex-shrink-0 items-center gap-2">
                  {/* Invite status toggle */}
                  <button
                    onClick={() => cycleInvite(g)}
                    className={`rounded-full px-2.5 py-1 text-xs uppercase tracking-wider transition-all hover:opacity-80 ${INVITE_COLORS[g.invite_status]}`}
                    title="Click to cycle invite status"
                  >
                    {INVITE_LABELS[g.invite_status]}
                  </button>
                  {/* RSVP status toggle */}
                  <button
                    onClick={() => cycleRsvp(g)}
                    className={`rounded-full px-2.5 py-1 text-xs uppercase tracking-wider transition-all hover:opacity-80 ${RSVP_COLORS[g.rsvp_status]}`}
                    title="Click to cycle RSVP status"
                  >
                    {RSVP_LABELS[g.rsvp_status]}
                  </button>
                  <button onClick={() => openEdit(g)}
                    className="flex h-8 w-8 items-center justify-center rounded-sm border border-transparent text-text-muted hover:border-warm-gray hover:bg-parchment-dark transition-all" title="Edit">
                    &#9998;
                  </button>
                  <button onClick={() => deleteGuest(g.id, g.name)}
                    className="flex h-8 w-8 items-center justify-center rounded-sm border border-transparent text-text-muted hover:border-red-200 hover:text-red-600 transition-all" title="Delete">
                    &times;
                  </button>
                </div>
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
              className="rounded-full bg-dusty-blue/10 px-3 py-1 text-xs uppercase tracking-wider text-dusty-blue hover:bg-dusty-blue/20 transition-colors">
              {g} ({guests.filter((guest) => guest.group_label === g).length})
            </button>
          ))}
          {(search || filterTab !== "all") && (
            <button onClick={() => { setSearch(""); setFilterTab("all"); }}
              className="rounded-full bg-warm-gray/50 px-3 py-1 text-xs uppercase tracking-wider text-text-muted hover:bg-warm-gray transition-colors">
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* =================== MODAL =================== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-text-dark/50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-sm border border-dusty-blue/15 bg-gradient-to-br from-parchment to-parchment-dark p-8 shadow-lg">
            <h2 className="mb-5 text-center text-xl font-normal tracking-wider uppercase text-text-dark">
              {editingId ? "Edit Guest" : "Add Guest"}
            </h2>
            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[1.5px] text-text-muted">Name *</label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-sm border border-warm-gray bg-parchment-dark px-4 py-3 text-base text-text-dark focus:border-dusty-blue focus:outline-none"
                  placeholder="e.g. Aunt Margaret" autoFocus />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[1.5px] text-text-muted">Address</label>
                <textarea value={formAddress} onChange={(e) => setFormAddress(e.target.value)} rows={2}
                  className="w-full rounded-sm border border-warm-gray bg-parchment-dark px-4 py-3 text-base text-text-dark focus:border-dusty-blue focus:outline-none resize-y"
                  placeholder={"123 Main St\nSpringfield, IL 62704"} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[1.5px] text-text-muted">Email</label>
                  <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full rounded-sm border border-warm-gray bg-parchment-dark px-4 py-2.5 text-sm text-text-dark focus:border-dusty-blue focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[1.5px] text-text-muted">Phone</label>
                  <input type="tel" value={formPhone} onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full rounded-sm border border-warm-gray bg-parchment-dark px-4 py-2.5 text-sm text-text-dark focus:border-dusty-blue focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[1.5px] text-text-muted">Group / Side</label>
                <input type="text" value={formGroup} onChange={(e) => setFormGroup(e.target.value)}
                  className="w-full rounded-sm border border-warm-gray bg-parchment-dark px-4 py-2.5 text-sm text-text-dark focus:border-dusty-blue focus:outline-none"
                  placeholder="e.g. Bride's Family" />
              </div>

              {/* Invite & RSVP */}
              <div className="mt-2 border-t border-warm-gray pt-3">
                <p className="mb-2 text-xs uppercase tracking-[1.5px] text-text-muted font-semibold">Invite & RSVP</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-[1.5px] text-text-muted">Invite Status</label>
                    <select value={formInvite} onChange={(e) => setFormInvite(e.target.value as InviteStatus)}
                      className="w-full rounded-sm border border-warm-gray bg-parchment-dark px-3 py-2.5 text-sm text-text-dark focus:border-dusty-blue focus:outline-none">
                      <option value="not_sent">Not Sent</option>
                      <option value="sent">Sent</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-[1.5px] text-text-muted">RSVP</label>
                    <select value={formRsvp} onChange={(e) => setFormRsvp(e.target.value as RsvpStatus)}
                      className="w-full rounded-sm border border-warm-gray bg-parchment-dark px-3 py-2.5 text-sm text-text-dark focus:border-dusty-blue focus:outline-none">
                      <option value="no_response">No Response</option>
                      <option value="attending">Attending</option>
                      <option value="declined">Declined</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* +1, Meal, Dietary */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[1.5px] text-text-muted">+1 Name</label>
                  <input type="text" value={formPlusOne} onChange={(e) => setFormPlusOne(e.target.value)}
                    className="w-full rounded-sm border border-warm-gray bg-parchment-dark px-3 py-2.5 text-sm text-text-dark focus:border-dusty-blue focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[1.5px] text-text-muted">Meal Choice</label>
                  <input type="text" value={formMeal} onChange={(e) => setFormMeal(e.target.value)}
                    className="w-full rounded-sm border border-warm-gray bg-parchment-dark px-3 py-2.5 text-sm text-text-dark focus:border-dusty-blue focus:outline-none"
                    placeholder="e.g. Chicken, Vegetarian" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[1.5px] text-text-muted">Dietary Notes</label>
                <input type="text" value={formDietary} onChange={(e) => setFormDietary(e.target.value)}
                  className="w-full rounded-sm border border-warm-gray bg-parchment-dark px-3 py-2.5 text-sm text-text-dark focus:border-dusty-blue focus:outline-none"
                  placeholder="e.g. Gluten-free, Nut allergy" />
              </div>

              <div className="mt-3 flex justify-center gap-3">
                <button onClick={saveGuest} disabled={saving}
                  className="rounded-sm bg-dusty-blue px-6 py-2.5 text-sm uppercase tracking-[2px] text-parchment hover:bg-dusty-blue-hover disabled:opacity-60 disabled:cursor-not-allowed transition-all">
                  {saving ? "Saving..." : "Save"}
                </button>
                <button onClick={() => setModalOpen(false)}
                  className="rounded-sm border-2 border-sage bg-transparent px-6 py-2.5 text-sm uppercase tracking-[2px] text-sage-hover hover:bg-sage hover:text-parchment transition-all">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 flex justify-center gap-6">
        <button onClick={() => router.push("/dashboard")}
          className="text-sm text-text-muted hover:text-dusty-blue transition-colors">
          &larr; Back to Tracker
        </button>
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
      className={`rounded-sm border p-2.5 text-center transition-all ${
        active ? "border-dusty-blue bg-dusty-blue/8 shadow-sm" : "border-warm-gray/60 bg-parchment/50 hover:border-dusty-blue-light"
      }`}
    >
      <span className={`block text-xl font-semibold leading-none mb-0.5 ${color || "text-dusty-blue"}`}>{value}</span>
      <span className="block text-[0.6rem] uppercase tracking-wider text-text-muted leading-tight">{label}</span>
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
