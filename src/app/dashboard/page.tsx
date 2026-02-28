"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { useToast } from "@/lib/toast";
import type { Gift, Guest, InviteStatus, RsvpStatus } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Label } from "@/components/Label";
import { Input, Textarea, Select } from "@/components/Input";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { Spinner } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";

/* ============================================================
   Constants
   ============================================================ */
const INVITE_LABELS: Record<InviteStatus, string> = { not_sent: "Not Sent", sent: "Sent", delivered: "Delivered" };
const INVITE_COLORS: Record<InviteStatus, string> = {
  not_sent: "bg-surface text-accent border border-border",
  sent: "bg-primary/15 text-primary-hover font-medium",
  delivered: "bg-success/20 text-success font-medium",
};
const RSVP_LABELS: Record<RsvpStatus, string> = { no_response: "No Response", attending: "Attending", declined: "Declined" };
const RSVP_COLORS: Record<RsvpStatus, string> = {
  no_response: "bg-surface text-accent border border-border",
  attending: "bg-success/20 text-success font-medium",
  declined: "bg-error/15 text-error font-medium",
};

/* ============================================================
   Types
   ============================================================ */
type MainTab = "guests" | "gifts" | "letter";
type GiftSortKey = "guest_name" | "description" | "thank_you_sent" | "created_at";
type SortDir = "asc" | "desc";
type GiftFilter = "all" | "pending" | "sent";
type GuestFilter = "all" | "not_sent" | "sent" | "delivered" | "attending" | "declined" | "no_response";

/* ============================================================
   Page
   ============================================================ */
export default function DashboardPage() {
  const router = useRouter();
  const { wedding, signOut, ready } = useRequireAuth();
  const { toast } = useToast();

  // Main tab
  const [activeTab, setActiveTab] = useState<MainTab>("gifts");

  // ── Shared data ──
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // ── Gift tab state ──
  const [giftSearch, setGiftSearch] = useState("");
  const [giftFilter, setGiftFilter] = useState<GiftFilter>("all");
  const [giftSortKey, setGiftSortKey] = useState<GiftSortKey>("created_at");
  const [giftSortDir, setGiftSortDir] = useState<SortDir>("desc");

  // ── Guest tab state ──
  const [guestSearch, setGuestSearch] = useState("");
  const [guestFilter, setGuestFilter] = useState<GuestFilter>("all");
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState("");

  // ── Gift modal state ──
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [giftEditingId, setGiftEditingId] = useState<string | null>(null);
  const [formGiftGuest, setFormGiftGuest] = useState("");
  const [formGiftDesc, setFormGiftDesc] = useState("");
  const [formGiftAddress, setFormGiftAddress] = useState("");
  const [giftSaving, setGiftSaving] = useState(false);
  const [acResults, setAcResults] = useState<Guest[]>([]);
  const [acOpen, setAcOpen] = useState(false);

  // ── Guest modal state ──
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [guestEditingId, setGuestEditingId] = useState<string | null>(null);
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
  const [guestSaving, setGuestSaving] = useState(false);

  // ── Letter tab state ──
  const [letterGiftId, setLetterGiftId] = useState("");
  const [letterText, setLetterText] = useState("");
  const [copied, setCopied] = useState(false);

  /* ============================================================
     Data loading
     ============================================================ */
  const fetchGifts = useCallback(async (weddingId: string) => {
    const { data, error } = await supabase.from("gifts").select("*").eq("wedding_id", weddingId).order("created_at", { ascending: false });
    if (error) { toast("Failed to load gifts: " + error.message, "error"); return; }
    if (data) setGifts(data);
  }, [toast]);

  const fetchGuests = useCallback(async (weddingId: string) => {
    const { data, error } = await supabase.from("guests").select("*").eq("wedding_id", weddingId).order("name", { ascending: true });
    if (error) { toast("Failed to load guests: " + error.message, "error"); return; }
    if (data) setGuests(data);
  }, [toast]);

  useEffect(() => {
    if (!ready || !wedding) return;
    Promise.all([fetchGifts(wedding.id), fetchGuests(wedding.id)]).then(() => setLoading(false));
  }, [ready, wedding, fetchGifts, fetchGuests]);

  /* ============================================================
     Gift: sorting & filtering
     ============================================================ */
  const filteredGifts = useMemo(() => {
    let result = gifts;
    if (giftFilter === "pending") result = result.filter((g) => !g.thank_you_sent);
    if (giftFilter === "sent") result = result.filter((g) => g.thank_you_sent);
    if (giftSearch.trim()) {
      const q = giftSearch.toLowerCase();
      result = result.filter((g) => g.guest_name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q) || g.address.toLowerCase().includes(q));
    }
    const dir = giftSortDir === "asc" ? 1 : -1;
    return [...result].sort((a, b) => {
      if (giftSortKey === "thank_you_sent") return (Number(a.thank_you_sent) - Number(b.thank_you_sent)) * dir;
      if (giftSortKey === "created_at") return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
      return a[giftSortKey].localeCompare(b[giftSortKey]) * dir;
    });
  }, [gifts, giftFilter, giftSearch, giftSortKey, giftSortDir]);

  const giftTotal = gifts.length;
  const giftSent = gifts.filter((g) => g.thank_you_sent).length;
  const giftRemaining = giftTotal - giftSent;
  const giftPct = giftTotal > 0 ? Math.round((giftSent / giftTotal) * 100) : 0;

  function toggleGiftSort(key: GiftSortKey) {
    if (giftSortKey === key) setGiftSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setGiftSortKey(key); setGiftSortDir("asc"); }
  }

  /* ============================================================
     Guest: filtering
     ============================================================ */
  const guestStats = useMemo(() => ({
    total: guests.length,
    invNotSent: guests.filter((g) => g.invite_status === "not_sent").length,
    invSent: guests.filter((g) => g.invite_status === "sent").length,
    invDelivered: guests.filter((g) => g.invite_status === "delivered").length,
    rsvpAttending: guests.filter((g) => g.rsvp_status === "attending").length,
    rsvpDeclined: guests.filter((g) => g.rsvp_status === "declined").length,
    rsvpNoResponse: guests.filter((g) => g.rsvp_status === "no_response").length,
  }), [guests]);

  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      const q = guestSearch.toLowerCase();
      const match = g.name.toLowerCase().includes(q) || g.address.toLowerCase().includes(q) || g.email.toLowerCase().includes(q) || g.group_label.toLowerCase().includes(q) || g.plus_one_name.toLowerCase().includes(q);
      if (!match) return false;
      if (guestFilter === "all") return true;
      if (guestFilter === "not_sent" || guestFilter === "sent" || guestFilter === "delivered") return g.invite_status === guestFilter;
      return g.rsvp_status === guestFilter;
    });
  }, [guests, guestSearch, guestFilter]);

  /* ============================================================
     Gift actions (optimistic)
     ============================================================ */
  async function toggleThankYou(id: string, current: boolean) {
    if (busy) return;
    setBusy(true);
    const prev = gifts;
    setGifts((p) => p.map((g) => (g.id === id ? { ...g, thank_you_sent: !current } : g)));
    const { error } = await supabase.from("gifts").update({ thank_you_sent: !current }).eq("id", id);
    if (error) { setGifts(prev); toast("Failed to update: " + error.message, "error"); }
    setBusy(false);
  }

  async function deleteGift(id: string, name: string) {
    if (busy) return;
    if (!confirm(`Delete gift from ${name}?`)) return;
    setBusy(true);
    const prev = gifts;
    setGifts((p) => p.filter((g) => g.id !== id));
    const { error } = await supabase.from("gifts").delete().eq("id", id);
    if (error) { setGifts(prev); toast("Failed to delete: " + error.message, "error"); }
    else toast("Gift removed", "info");
    setBusy(false);
  }

  /* ============================================================
     Guest actions (optimistic)
     ============================================================ */
  async function cycleInvite(g: Guest) {
    const next: InviteStatus = g.invite_status === "not_sent" ? "sent" : g.invite_status === "sent" ? "delivered" : "not_sent";
    const prev = guests;
    setGuests((p) => p.map((x) => (x.id === g.id ? { ...x, invite_status: next } : x)));
    const { error } = await supabase.from("guests").update({ invite_status: next }).eq("id", g.id);
    if (error) { setGuests(prev); toast("Failed to update invite: " + error.message, "error"); }
  }

  async function cycleRsvp(g: Guest) {
    const next: RsvpStatus = g.rsvp_status === "no_response" ? "attending" : g.rsvp_status === "attending" ? "declined" : "no_response";
    const prev = guests;
    setGuests((p) => p.map((x) => (x.id === g.id ? { ...x, rsvp_status: next } : x)));
    const { error } = await supabase.from("guests").update({ rsvp_status: next }).eq("id", g.id);
    if (error) { setGuests(prev); toast("Failed to update RSVP: " + error.message, "error"); }
  }

  async function deleteGuest(id: string, name: string) {
    if (!confirm(`Remove ${name} from your guest list?`)) return;
    const prev = guests;
    setGuests((p) => p.filter((g) => g.id !== id));
    const { error } = await supabase.from("guests").delete().eq("id", id);
    if (error) { setGuests(prev); toast("Failed to remove: " + error.message, "error"); }
    else toast("Guest removed", "info");
  }

  /* ============================================================
     Gift modal
     ============================================================ */
  function openAddGift() {
    setGiftEditingId(null); setFormGiftGuest(""); setFormGiftDesc(""); setFormGiftAddress("");
    setAcOpen(false); setAcResults([]); setGiftModalOpen(true);
  }
  function openEditGift(g: Gift) {
    setGiftEditingId(g.id); setFormGiftGuest(g.guest_name); setFormGiftDesc(g.description); setFormGiftAddress(g.address);
    setGiftModalOpen(true);
  }
  function handleGuestInput(value: string) {
    setFormGiftGuest(value);
    if (value.trim().length < 2) { setAcOpen(false); setAcResults([]); return; }
    const q = value.toLowerCase();
    const matches = guests.filter((g) => g.name.toLowerCase().includes(q)).slice(0, 8);
    setAcResults(matches); setAcOpen(matches.length > 0);
  }
  function selectGuest(guest: Guest) {
    setFormGiftGuest(guest.name);
    if (guest.address) setFormGiftAddress(guest.address);
    setAcOpen(false); setAcResults([]);
  }
  async function saveGift() {
    if (!formGiftGuest.trim() || !formGiftDesc.trim()) { toast("Please fill in guest name and gift description.", "error"); return; }
    setGiftSaving(true);
    const payload = { guest_name: formGiftGuest.trim(), description: formGiftDesc.trim(), address: formGiftAddress.trim() };
    if (giftEditingId) {
      const { data, error } = await supabase.from("gifts").update(payload).eq("id", giftEditingId).select().single();
      if (error) { toast("Failed to save: " + error.message, "error"); setGiftSaving(false); return; }
      setGifts((p) => p.map((g) => (g.id === giftEditingId ? data : g)));
      toast("Gift updated", "success");
    } else {
      const { data, error } = await supabase.from("gifts").insert({ ...payload, wedding_id: wedding!.id }).select().single();
      if (error) { toast("Failed to add: " + error.message, "error"); setGiftSaving(false); return; }
      setGifts((p) => [data, ...p]);
      toast("Gift added!", "success");
    }
    setGiftModalOpen(false); setGiftSaving(false);
  }

  /* ============================================================
     Guest modal
     ============================================================ */
  function openAddGuest() {
    setGuestEditingId(null); setFormName(""); setFormAddress(""); setFormEmail(""); setFormPhone("");
    setFormGroup(""); setFormInvite("not_sent"); setFormRsvp("no_response");
    setFormMeal(""); setFormPlusOne(""); setFormDietary(""); setGuestModalOpen(true);
  }
  function openEditGuest(g: Guest) {
    setGuestEditingId(g.id); setFormName(g.name); setFormAddress(g.address); setFormEmail(g.email);
    setFormPhone(g.phone); setFormGroup(g.group_label); setFormInvite(g.invite_status); setFormRsvp(g.rsvp_status);
    setFormMeal(g.meal_choice); setFormPlusOne(g.plus_one_name); setFormDietary(g.dietary_notes);
    setGuestModalOpen(true);
  }
  async function saveGuest() {
    if (!formName.trim()) { toast("Please enter a guest name.", "error"); return; }
    setGuestSaving(true);
    const payload = { name: formName.trim(), address: formAddress.trim(), email: formEmail.trim(), phone: formPhone.trim(), group_label: formGroup.trim(), invite_status: formInvite, rsvp_status: formRsvp, meal_choice: formMeal.trim(), plus_one_name: formPlusOne.trim(), dietary_notes: formDietary.trim() };
    if (guestEditingId) {
      const { data, error } = await supabase.from("guests").update(payload).eq("id", guestEditingId).select().single();
      if (error) { toast("Failed to save: " + error.message, "error"); setGuestSaving(false); return; }
      setGuests((p) => p.map((g) => (g.id === guestEditingId ? data : g)));
      toast("Guest updated", "success");
    } else {
      const { data, error } = await supabase.from("guests").insert({ ...payload, wedding_id: wedding!.id }).select().single();
      if (error) { toast("Failed to add: " + error.message, "error"); setGuestSaving(false); return; }
      setGuests((p) => [...p, data].sort((a, b) => a.name.localeCompare(b.name)));
      toast("Guest added!", "success");
    }
    setGuestModalOpen(false); setGuestSaving(false);
  }

  /* ============================================================
     CSV Import / Export
     ============================================================ */
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

  function exportAddressCSV() {
    const withAddr = guests.filter((g) => g.address.trim());
    if (withAddr.length === 0) { toast("No guests have addresses to export.", "info"); return; }
    const header = "Name,Address Line 1,Address Line 2";
    const rows = withAddr.map((g) => {
      const lines = g.address.split(/\n/).map((l) => l.trim()).filter(Boolean);
      return [g.name, lines[0] || "", lines.slice(1).join(", ")].map((v) => `"${v.replace(/"/g, '""')}"`).join(",");
    });
    downloadCSV([header, ...rows].join("\n"), "guest-addresses.csv");
  }

  function exportFullCSV() {
    if (guests.length === 0) { toast("No guests to export.", "info"); return; }
    const header = "Name,Address,Email,Phone,Group,Invite Status,RSVP,Plus One,Meal Choice,Dietary Notes";
    const rows = guests.map((g) =>
      [g.name, g.address.replace(/\n/g, ", "), g.email, g.phone, g.group_label, g.invite_status, g.rsvp_status, g.plus_one_name, g.meal_choice, g.dietary_notes]
        .map((v) => `"${(v || "").replace(/"/g, '""')}"`).join(","),
    );
    downloadCSV([header, ...rows].join("\n"), "guest-list-full.csv");
  }

  /* ============================================================
     Letter
     ============================================================ */
  function buildLetter(gift: Gift) {
    if (!wedding) return "";
    return `Dear ${gift.guest_name},\n\nThank you so much for the generous gift of ${gift.description.toLowerCase()}. We are truly grateful for your thoughtfulness and for being part of our special day.\n\nYour kindness means the world to us as we begin this new chapter together. We cannot wait to put your wonderful gift to good use!\n\nWith love and gratitude,\n${wedding.partner1_name} & ${wedding.partner2_name}`;
  }

  function goToLetter(giftId: string) {
    setActiveTab("letter");
    setLetterGiftId(giftId);
    const gift = gifts.find((g) => g.id === giftId);
    if (gift) setLetterText(buildLetter(gift));
  }

  function changeLetterGift(giftId: string) {
    setLetterGiftId(giftId);
    if (!giftId) { setLetterText(""); return; }
    const gift = gifts.find((g) => g.id === giftId);
    if (gift) setLetterText(buildLetter(gift));
  }

  async function copyLetter() {
    if (!letterText) return;
    try { await navigator.clipboard.writeText(letterText); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { toast("Couldn't copy — try selecting the text manually.", "error"); }
  }

  function printLetter() {
    if (!letterText) return;
    const w = window.open("", "_blank");
    if (!w) { toast("Pop-up blocked — please allow pop-ups.", "error"); return; }
    w.document.write(`<!DOCTYPE html><html><head><title>Thank You Letter</title><link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap" rel="stylesheet"><style>body{font-family:'DM Serif Display',Georgia,serif;font-size:16pt;line-height:1.8;color:#2C2724;max-width:6.5in;margin:1in auto;padding:0}@media print{body{margin:0;max-width:100%}}</style></head><body>${letterText.replace(/\n/g, "<br>")}</body></html>`);
    w.document.close();
    w.onload = () => { w.print(); };
  }

  /* ============================================================
     Sign out
     ============================================================ */
  async function handleSignOut() { await signOut(); router.push("/login"); }

  /* ============================================================
     Loading
     ============================================================ */
  if (!ready || loading) return <Spinner fullPage label="Loading..." />;

  /* ============================================================
     Sort icon helper
     ============================================================ */
  function SortInd({ col }: { col: GiftSortKey }) {
    if (giftSortKey !== col) return <span className="ml-1 text-text-muted/30">&uarr;&darr;</span>;
    return <span className="ml-1 text-primary">{giftSortDir === "asc" ? "\u25B2" : "\u25BC"}</span>;
  }

  /* ============================================================
     Render
     ============================================================ */
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-stretch px-4 py-8">
      <PageHeader
        title="Thank You Tracker"
        subtitle={`${wedding?.partner1_name} & ${wedding?.partner2_name}`}
      />

      {/* ========== MAIN TABS ========== */}
      <nav className="mb-6 flex w-full rounded-lg bg-card p-1 shadow-card">
        {([
          { key: "guests" as MainTab, label: "Guest List", count: guests.length },
          { key: "gifts" as MainTab, label: "Gift Tracker", count: gifts.length },
          { key: "letter" as MainTab, label: "Thank You Letter", count: null },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium tracking-wide transition-all ${
              activeTab === tab.key
                ? "bg-primary text-white shadow-soft"
                : "text-text-muted hover:text-text hover:bg-surface/80"
            }`}
          >
            {tab.label}
            {tab.count !== null && (
              <span className={`ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold align-middle ${
                activeTab === tab.key ? "bg-white/25 text-white" : "bg-primary/12 text-primary"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* ╔══════════════════════════════════════════╗
         ║            GUEST LIST TAB                ║
         ╚══════════════════════════════════════════╝ */}
      {activeTab === "guests" && (
        <div>
          {/* Stats */}
          {guests.length > 0 && (
            <div className="mb-5 grid grid-cols-3 gap-2.5 sm:grid-cols-6">
              <StatBox label="Total" value={guestStats.total} onClick={() => setGuestFilter("all")} active={guestFilter === "all"} />
              <StatBox label="Inv. Not Sent" value={guestStats.invNotSent} onClick={() => setGuestFilter("not_sent")} active={guestFilter === "not_sent"} color="text-accent" />
              <StatBox label="Inv. Sent" value={guestStats.invSent} onClick={() => setGuestFilter("sent")} active={guestFilter === "sent"} color="text-primary" />
              <StatBox label="Attending" value={guestStats.rsvpAttending} onClick={() => setGuestFilter("attending")} active={guestFilter === "attending"} color="text-success" />
              <StatBox label="Declined" value={guestStats.rsvpDeclined} onClick={() => setGuestFilter("declined")} active={guestFilter === "declined"} color="text-error" />
              <StatBox label="No RSVP" value={guestStats.rsvpNoResponse} onClick={() => setGuestFilter("no_response")} active={guestFilter === "no_response"} color="text-accent" />
            </div>
          )}

          {/* Toolbar */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <Input type="text" value={guestSearch} onChange={(e) => setGuestSearch(e.target.value)} placeholder="Search guests..." className="flex-1" />
            <Button onClick={openAddGuest} className="whitespace-nowrap">+ Add Guest</Button>
          </div>

          {/* CSV Import */}
          <Card variant="panel" className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center !bg-card !border-border shadow-soft">
            <p className="flex-1 text-sm text-accent">
              <strong className="text-text">Import CSV</strong> — Name (required), Address, Email, Phone, Group
            </p>
            <label className="cursor-pointer rounded-md border border-secondary/40 bg-transparent px-4 py-2 text-sm font-medium text-secondary-hover hover:bg-secondary hover:text-background text-center whitespace-nowrap transition-all">
              {importing ? "Importing..." : "Choose File"}
              <input ref={fileRef} type="file" accept=".csv" onChange={handleCSV} disabled={importing} className="hidden" />
            </label>
          </Card>
          {importResult && (
            <p className={`-mt-2 mb-4 text-sm text-center ${importResult.includes("mport") && !importResult.includes("fail") ? "text-success" : "text-error"}`}>
              {importResult}
            </p>
          )}

          {/* Export */}
          {guests.length > 0 && (
            <Card variant="panel" className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center !bg-card !border-border shadow-soft">
              <p className="flex-1 text-sm text-accent"><strong className="text-text">Export</strong></p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={exportAddressCSV}>Address Labels CSV</Button>
                <Button variant="outline" size="sm" onClick={exportFullCSV}>Full Guest List CSV</Button>
              </div>
            </Card>
          )}

          {/* Guest table */}
          {filteredGuests.length === 0 ? (
            <EmptyState message={guests.length === 0 ? "No guests yet. Add guests manually or import a CSV!" : "No matches found."} />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-card">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="px-4 py-3"><span className="text-[0.65rem] font-semibold uppercase tracking-wider text-accent">Name</span></th>
                    <th className="hidden px-4 py-3 sm:table-cell"><span className="text-[0.65rem] font-semibold uppercase tracking-wider text-accent">Group</span></th>
                    <th className="px-4 py-3"><span className="text-[0.65rem] font-semibold uppercase tracking-wider text-accent">Invite</span></th>
                    <th className="px-4 py-3"><span className="text-[0.65rem] font-semibold uppercase tracking-wider text-accent">RSVP</span></th>
                    <th className="px-4 py-3 text-right"><span className="text-[0.65rem] font-semibold uppercase tracking-wider text-accent">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGuests.map((g) => (
                    <tr key={g.id} className="border-b border-border/40 transition-colors hover:bg-surface/60 last:border-b-0">
                      <td className="px-4 py-3">
                        <span className="font-medium text-text">{g.name}</span>
                        {g.address && <div className="text-xs text-text-muted truncate max-w-[220px]">{g.address.replace(/\n/g, ", ")}</div>}
                        <div className="flex flex-wrap gap-x-3">
                          {g.email && <span className="text-xs text-text-muted/70">{g.email}</span>}
                          {g.phone && <span className="text-xs text-text-muted/70">{g.phone}</span>}
                          {g.plus_one_name && <span className="text-xs text-text-muted/70">+1: {g.plus_one_name}</span>}
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 sm:table-cell">
                        <span className="text-sm text-text-muted">{g.group_label || "\u2014"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => cycleInvite(g)} className={`rounded-full px-2.5 py-1 text-xs transition-all hover:opacity-80 ${INVITE_COLORS[g.invite_status]}`} title="Click to cycle">
                          {INVITE_LABELS[g.invite_status]}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => cycleRsvp(g)} className={`rounded-full px-2.5 py-1 text-xs transition-all hover:opacity-80 ${RSVP_COLORS[g.rsvp_status]}`} title="Click to cycle">
                          {RSVP_LABELS[g.rsvp_status]}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEditGuest(g)} className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-primary/10 hover:text-primary" title="Edit">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </button>
                          <button onClick={() => deleteGuest(g.id, g.name)} className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-error/10 hover:text-error" title="Delete">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Group chips */}
          {[...new Set(guests.map((g) => g.group_label).filter(Boolean))].sort().length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {[...new Set(guests.map((g) => g.group_label).filter(Boolean))].sort().map((g) => (
                <button key={g} onClick={() => setGuestSearch(g)} className="rounded-full bg-card border border-primary/30 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10 hover:border-primary/50 shadow-soft transition-colors">
                  {g} ({guests.filter((x) => x.group_label === g).length})
                </button>
              ))}
              {(guestSearch || guestFilter !== "all") && (
                <button onClick={() => { setGuestSearch(""); setGuestFilter("all"); }} className="rounded-full bg-border/50 px-3 py-1 text-xs text-text-muted hover:bg-border transition-colors">
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ╔══════════════════════════════════════════╗
         ║            GIFT TRACKER TAB              ║
         ╚══════════════════════════════════════════╝ */}
      {activeTab === "gifts" && (
        <div>
          {/* Stats + Progress */}
          <div className="mb-4 flex items-center justify-center gap-8 rounded-lg border border-border bg-card p-5 shadow-card">
            <div className="text-center">
              <span className="block text-3xl font-semibold text-primary leading-none mb-1">{giftTotal}</span>
              <span className="text-xs font-medium text-accent">Total Gifts</span>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <span className="block text-3xl font-semibold text-success leading-none mb-1">{giftSent}</span>
              <span className="text-xs font-medium text-accent">Thank Yous Sent</span>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <span className="block text-3xl font-semibold text-secondary leading-none mb-1">{giftRemaining}</span>
              <span className="text-xs font-medium text-accent">Remaining</span>
            </div>
          </div>
          <div className="mb-6 text-center">
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface border border-border">
              <div className="h-full rounded-full bg-gradient-to-r from-secondary to-primary transition-all duration-500" style={{ width: `${giftPct}%` }} />
            </div>
            <span className="mt-1.5 inline-block text-sm font-medium text-accent">{giftPct}% complete</span>
          </div>

          {/* Toolbar */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input type="text" value={giftSearch} onChange={(e) => setGiftSearch(e.target.value)} placeholder="Search guests, gifts, or addresses..." className="flex-1" />
            <div className="flex gap-2">
              {(["all", "pending", "sent"] as GiftFilter[]).map((f) => (
                <button key={f} onClick={() => setGiftFilter(f)} className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all border ${giftFilter === f ? "bg-primary text-white border-primary shadow-soft" : "bg-card text-accent border-border hover:border-primary/50"}`}>
                  {f === "all" ? `All (${giftTotal})` : f === "pending" ? `Pending (${giftRemaining})` : `Sent (${giftSent})`}
                </button>
              ))}
            </div>
            <Button onClick={openAddGift} className="whitespace-nowrap">+ Add Gift</Button>
          </div>

          {/* Gift table */}
          {filteredGifts.length === 0 ? (
            <EmptyState message={gifts.length === 0 ? "No gifts yet. Add your first gift to get started!" : "No matches found."} />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-card">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="w-12 px-4 py-3 text-center">
                      <button onClick={() => toggleGiftSort("thank_you_sent")} className="text-[0.65rem] font-semibold uppercase tracking-wider text-accent hover:text-text transition-colors" title="Sort by status">
                        Sent<SortInd col="thank_you_sent" />
                      </button>
                    </th>
                    <th className="px-4 py-3">
                      <button onClick={() => toggleGiftSort("guest_name")} className="text-[0.65rem] font-semibold uppercase tracking-wider text-accent hover:text-text transition-colors">
                        Guest<SortInd col="guest_name" />
                      </button>
                    </th>
                    <th className="px-4 py-3">
                      <button onClick={() => toggleGiftSort("description")} className="text-[0.65rem] font-semibold uppercase tracking-wider text-accent hover:text-text transition-colors">
                        Gift<SortInd col="description" />
                      </button>
                    </th>
                    <th className="hidden px-4 py-3 md:table-cell"><span className="text-[0.65rem] font-semibold uppercase tracking-wider text-accent">Address</span></th>
                    <th className="px-4 py-3 text-right"><span className="text-[0.65rem] font-semibold uppercase tracking-wider text-accent">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGifts.map((g) => (
                    <tr key={g.id} className="border-b border-border/40 transition-colors hover:bg-surface/60 last:border-b-0">
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => toggleThankYou(g.id, g.thank_you_sent)} className={`inline-flex h-6 w-6 items-center justify-center rounded-md border-2 transition-all ${g.thank_you_sent ? "border-success bg-success text-white shadow-soft" : "border-border bg-card hover:border-primary"}`} title={g.thank_you_sent ? "Mark as not sent" : "Mark as sent"}>
                          {g.thank_you_sent && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3.5 w-3.5"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                        </button>
                      </td>
                      <td className="px-4 py-3"><span className={`font-medium ${g.thank_you_sent ? "text-text-muted line-through" : "text-text"}`}>{g.guest_name}</span></td>
                      <td className="px-4 py-3"><span className={g.thank_you_sent ? "text-text-muted" : "text-text"}>{g.description}</span></td>
                      <td className="hidden px-4 py-3 md:table-cell"><span className="text-xs text-text-muted truncate block max-w-[200px]">{g.address ? g.address.replace(/\n/g, ", ") : "\u2014"}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => goToLetter(g.id)} className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-primary/10 hover:text-primary" title="Write letter">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" strokeLinecap="round" strokeLinejoin="round" /><path d="M22 6l-10 7L2 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </button>
                          <button onClick={() => openEditGift(g)} className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-primary/10 hover:text-primary" title="Edit">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </button>
                          <button onClick={() => deleteGift(g.id, g.guest_name)} className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-error/10 hover:text-error" title="Delete">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {filteredGifts.length > 0 && (
            <p className="mt-2 text-xs text-text-muted text-right">Showing {filteredGifts.length} of {giftTotal} gift{giftTotal !== 1 ? "s" : ""}</p>
          )}
        </div>
      )}

      {/* ╔══════════════════════════════════════════╗
         ║          THANK YOU LETTER TAB            ║
         ╚══════════════════════════════════════════╝ */}
      {activeTab === "letter" && (
        <div className="flex flex-col gap-5">
          <div className="rounded-lg border border-border bg-card p-5 shadow-card">
            <Label>Select a guest</Label>
            <Select value={letterGiftId} onChange={(e) => changeLetterGift(e.target.value)}>
              <option value="">-- Choose a guest --</option>
              {gifts.filter((g) => !g.thank_you_sent).map((g) => (
                <option key={g.id} value={g.id}>{g.guest_name} — {g.description}</option>
              ))}
              {gifts.filter((g) => g.thank_you_sent).length > 0 && (
                <optgroup label="Already Thanked">
                  {gifts.filter((g) => g.thank_you_sent).map((g) => (
                    <option key={g.id} value={g.id}>{g.guest_name} — {g.description}</option>
                  ))}
                </optgroup>
              )}
            </Select>
          </div>

          <textarea
            value={letterText}
            onChange={(e) => setLetterText(e.target.value)}
            placeholder="Select a guest above to generate a thank you letter..."
            rows={10}
            className="w-full min-h-[260px] rounded-lg border border-border bg-card px-8 py-6 font-heading text-lg leading-relaxed text-text shadow-card resize-y focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />

          {letterText && (
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={copyLetter}>{copied ? "Copied!" : "Copy to Clipboard"}</Button>
              <Button variant="outline" onClick={printLetter}>Print Letter</Button>
            </div>
          )}
        </div>
      )}

      {/* ========== GIFT MODAL ========== */}
      <Modal open={giftModalOpen} onClose={() => setGiftModalOpen(false)} title={giftEditingId ? "Edit Gift" : "Add New Gift"}>
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Label>Guest Name</Label>
            <Input type="text" value={formGiftGuest} onChange={(e) => handleGuestInput(e.target.value)} onBlur={() => setTimeout(() => setAcOpen(false), 150)} placeholder="e.g. Aunt Margaret" autoFocus autoComplete="off" />
            {acOpen && acResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 max-h-52 overflow-y-auto rounded-b-md border border-t-0 border-border bg-background shadow-card">
                {acResults.map((g) => (
                  <button key={g.id} type="button" onMouseDown={() => selectGuest(g)} className="w-full px-4 py-2 text-left transition-colors hover:bg-primary/8">
                    <span className="block text-base font-medium text-text">{g.name}</span>
                    {g.address && <span className="block text-xs text-text-muted truncate">{g.address.replace(/\n/g, ", ")}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <Label>Gift Description</Label>
            <Input type="text" value={formGiftDesc} onChange={(e) => setFormGiftDesc(e.target.value)} placeholder="e.g. KitchenAid Stand Mixer" onKeyDown={(e) => { if (e.key === "Enter") saveGift(); }} />
          </div>
          <div>
            <Label>Mailing Address</Label>
            <Textarea value={formGiftAddress} onChange={(e) => setFormGiftAddress(e.target.value)} rows={2} placeholder={"e.g. 123 Main St, Apt 4\nSpringfield, IL 62704"} />
          </div>
          <div className="mt-2 flex justify-center gap-3">
            <Button onClick={saveGift} disabled={giftSaving}>{giftSaving ? "Saving..." : "Save"}</Button>
            <Button variant="ghost" onClick={() => setGiftModalOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* ========== GUEST MODAL ========== */}
      <Modal open={guestModalOpen} onClose={() => setGuestModalOpen(false)} title={guestEditingId ? "Edit Guest" : "Add Guest"} maxHeight>
        <div className="flex flex-col gap-3">
          <div>
            <Label required>Name</Label>
            <Input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Aunt Margaret" autoFocus />
          </div>
          <div>
            <Label>Address</Label>
            <Textarea value={formAddress} onChange={(e) => setFormAddress(e.target.value)} rows={2} placeholder={"123 Main St\nSpringfield, IL 62704"} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Email</Label><Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} className="py-2.5 text-sm" /></div>
            <div><Label>Phone</Label><Input type="tel" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} className="py-2.5 text-sm" /></div>
          </div>
          <div>
            <Label>Group / Side</Label>
            <Input type="text" value={formGroup} onChange={(e) => setFormGroup(e.target.value)} placeholder="e.g. Bride's Family" className="py-2.5 text-sm" />
          </div>
          <div className="mt-2 border-t border-border pt-3">
            <p className="mb-2 text-sm text-text-muted font-semibold">Invite & RSVP</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Invite Status</Label>
                <Select value={formInvite} onChange={(e) => setFormInvite(e.target.value as InviteStatus)} className="px-3 py-2.5 text-sm">
                  <option value="not_sent">Not Sent</option><option value="sent">Sent</option><option value="delivered">Delivered</option>
                </Select>
              </div>
              <div>
                <Label>RSVP</Label>
                <Select value={formRsvp} onChange={(e) => setFormRsvp(e.target.value as RsvpStatus)} className="px-3 py-2.5 text-sm">
                  <option value="no_response">No Response</option><option value="attending">Attending</option><option value="declined">Declined</option>
                </Select>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>+1 Name</Label><Input type="text" value={formPlusOne} onChange={(e) => setFormPlusOne(e.target.value)} className="px-3 py-2.5 text-sm" /></div>
            <div><Label>Meal Choice</Label><Input type="text" value={formMeal} onChange={(e) => setFormMeal(e.target.value)} placeholder="e.g. Chicken" className="px-3 py-2.5 text-sm" /></div>
          </div>
          <div>
            <Label>Dietary Notes</Label>
            <Input type="text" value={formDietary} onChange={(e) => setFormDietary(e.target.value)} placeholder="e.g. Gluten-free, Nut allergy" className="px-3 py-2.5 text-sm" />
          </div>
          <div className="mt-3 flex justify-center gap-3">
            <Button onClick={saveGuest} disabled={guestSaving}>{guestSaving ? "Saving..." : "Save"}</Button>
            <Button variant="ghost" onClick={() => setGuestModalOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Footer */}
      <div className="mt-8 flex justify-center">
        <Button variant="link" onClick={handleSignOut}>Sign Out</Button>
      </div>
    </div>
  );
}

/* ============================================================
   Helper Components
   ============================================================ */
function StatBox({ label, value, onClick, active, color }: {
  label: string; value: number; onClick: () => void; active: boolean; color?: string;
}) {
  return (
    <button onClick={onClick} className={`rounded-lg border p-2.5 text-center transition-all ${active ? "border-primary bg-card shadow-card ring-1 ring-primary/20" : "border-border bg-card shadow-soft hover:border-primary/50 hover:shadow-card"}`}>
      <span className={`block text-xl font-semibold leading-none mb-0.5 ${color || "text-primary"}`}>{value}</span>
      <span className="block text-[0.6rem] text-accent leading-tight font-medium">{label}</span>
    </button>
  );
}

/* ============================================================
   Utilities
   ============================================================ */
function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

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
