"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { useToast } from "@/lib/toast";
import type { Gift, Guest } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Label } from "@/components/Label";
import { Input, Textarea, Select } from "@/components/Input";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { Spinner } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";
import { GiftCard } from "@/components/GiftCard";

type Tab = "pending" | "sent" | "letter";

export default function DashboardPage() {
  const router = useRouter();
  const { wedding, signOut, ready } = useRequireAuth();
  const { toast } = useToast();
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [pendingSearch, setPendingSearch] = useState("");
  const [sentSearch, setSentSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [slidingId, setSlidingId] = useState<string | null>(null);
  const [slideDir, setSlideDir] = useState<"right" | "left" | null>(null);

  // Guest list (for autocomplete)
  const [guestList, setGuestList] = useState<Guest[]>([]);
  const [acResults, setAcResults] = useState<Guest[]>([]);
  const [acOpen, setAcOpen] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formGuest, setFormGuest] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [saving, setSaving] = useState(false);

  // Letter state
  const [letterGiftId, setLetterGiftId] = useState("");
  const [letterText, setLetterText] = useState("");
  const [copied, setCopied] = useState(false);

  // ==========================================
  // Data loading
  // ==========================================
  const fetchGifts = useCallback(async (weddingId: string) => {
    const { data } = await supabase
      .from("gifts")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("created_at", { ascending: false });
    if (data) setGifts(data);
  }, []);

  const fetchGuests = useCallback(async (weddingId: string) => {
    const { data } = await supabase
      .from("guests")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("name", { ascending: true });
    if (data) setGuestList(data);
  }, []);

  useEffect(() => {
    if (!ready || !wedding) return;
    Promise.all([fetchGifts(wedding.id), fetchGuests(wedding.id)]).then(() => setLoading(false));
  }, [ready, wedding, fetchGifts, fetchGuests]);

  // ==========================================
  // Computed
  // ==========================================
  const pendingGifts = gifts.filter((g) => !g.thank_you_sent);
  const sentGifts = gifts.filter((g) => g.thank_you_sent);

  const filteredPending = pendingGifts.filter((g) => {
    const q = pendingSearch.toLowerCase();
    return (
      g.guest_name.toLowerCase().includes(q) ||
      g.description.toLowerCase().includes(q) ||
      g.address.toLowerCase().includes(q)
    );
  });

  const filteredSent = sentGifts.filter((g) => {
    const q = sentSearch.toLowerCase();
    return (
      g.guest_name.toLowerCase().includes(q) ||
      g.description.toLowerCase().includes(q) ||
      g.address.toLowerCase().includes(q)
    );
  });

  const total = gifts.length;
  const sentCount = sentGifts.length;
  const remaining = total - sentCount;
  const pct = total > 0 ? Math.round((sentCount / total) * 100) : 0;

  // ==========================================
  // Actions (with optimistic updates)
  // ==========================================
  async function sendThankYou(id: string) {
    if (busy) return;
    setBusy(true);
    const prevGifts = gifts;

    setSlidingId(id);
    setSlideDir("right");
    await new Promise((r) => setTimeout(r, 400));
    setSlidingId(null);
    setSlideDir(null);

    setGifts((prev) => prev.map((g) => g.id === id ? { ...g, thank_you_sent: true } : g));

    const { error } = await supabase.from("gifts").update({ thank_you_sent: true }).eq("id", id);
    if (error) {
      setGifts(prevGifts);
      toast("Failed to mark as sent: " + error.message, "error");
    }
    setBusy(false);
  }

  async function undoThankYou(id: string) {
    if (busy) return;
    setBusy(true);
    const prevGifts = gifts;

    setSlidingId(id);
    setSlideDir("left");
    await new Promise((r) => setTimeout(r, 400));
    setSlidingId(null);
    setSlideDir(null);

    setGifts((prev) => prev.map((g) => g.id === id ? { ...g, thank_you_sent: false } : g));

    const { error } = await supabase.from("gifts").update({ thank_you_sent: false }).eq("id", id);
    if (error) {
      setGifts(prevGifts);
      toast("Failed to undo: " + error.message, "error");
    }
    setBusy(false);
  }

  async function deleteGift(id: string, guestName: string) {
    if (busy) return;
    if (!confirm(`Delete gift from ${guestName}?`)) return;
    setBusy(true);
    const prevGifts = gifts;

    setGifts((prev) => prev.filter((g) => g.id !== id));

    const { error } = await supabase.from("gifts").delete().eq("id", id);
    if (error) {
      setGifts(prevGifts);
      toast("Failed to delete gift: " + error.message, "error");
    } else {
      toast("Gift removed", "info");
    }
    setBusy(false);
  }

  // ==========================================
  // Modal
  // ==========================================
  function openAdd() {
    setEditingId(null);
    setFormGuest("");
    setFormDesc("");
    setFormAddress("");
    setAcOpen(false);
    setAcResults([]);
    setModalOpen(true);
  }

  function handleGuestInput(value: string) {
    setFormGuest(value);
    if (value.trim().length < 2) {
      setAcOpen(false);
      setAcResults([]);
      return;
    }
    const q = value.toLowerCase();
    const matches = guestList.filter((g) => g.name.toLowerCase().includes(q)).slice(0, 8);
    setAcResults(matches);
    setAcOpen(matches.length > 0);
  }

  function selectGuest(guest: Guest) {
    setFormGuest(guest.name);
    if (guest.address) setFormAddress(guest.address);
    setAcOpen(false);
    setAcResults([]);
  }

  function openEdit(g: Gift) {
    setEditingId(g.id);
    setFormGuest(g.guest_name);
    setFormDesc(g.description);
    setFormAddress(g.address);
    setModalOpen(true);
  }

  async function saveModal() {
    if (!formGuest.trim() || !formDesc.trim()) {
      toast("Please fill in guest name and gift description.", "error");
      return;
    }
    setSaving(true);

    const payload = {
      guest_name: formGuest.trim(),
      description: formDesc.trim(),
      address: formAddress.trim(),
    };

    if (editingId) {
      const { data, error } = await supabase
        .from("gifts")
        .update(payload)
        .eq("id", editingId)
        .select()
        .single();
      if (error) {
        toast("Failed to save gift: " + error.message, "error");
        setSaving(false);
        return;
      }
      setGifts((prev) => prev.map((g) => g.id === editingId ? data : g));
      toast("Gift updated", "success");
    } else {
      const { data, error } = await supabase
        .from("gifts")
        .insert({ ...payload, wedding_id: wedding!.id })
        .select()
        .single();
      if (error) {
        toast("Failed to add gift: " + error.message, "error");
        setSaving(false);
        return;
      }
      setGifts((prev) => [data, ...prev]);
      toast("Gift added!", "success");
    }

    setModalOpen(false);
    setSaving(false);
  }

  // ==========================================
  // Letter
  // ==========================================
  function generateLetter(giftId: string) {
    setLetterGiftId(giftId);
    if (!giftId) { setLetterText(""); return; }
    const gift = gifts.find((g) => g.id === giftId);
    if (!gift || !wedding) return;

    setLetterText(
      `Dear ${gift.guest_name},\n\n` +
      `Thank you so much for the generous gift of ${gift.description.toLowerCase()}. ` +
      `We are truly grateful for your thoughtfulness and for being part of our special day.\n\n` +
      `Your kindness means the world to us as we begin this new chapter together. ` +
      `We cannot wait to put your wonderful gift to good use!\n\n` +
      `With love and gratitude,\n` +
      `${wedding.partner1_name} & ${wedding.partner2_name}`
    );
  }

  function goToLetter(giftId: string) {
    setActiveTab("letter");
    generateLetter(giftId);
  }

  async function copyLetter() {
    if (!letterText) return;
    await navigator.clipboard.writeText(letterText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function printLetter() {
    if (!letterText) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html>
<html><head><title>Thank You Letter</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap" rel="stylesheet">
<style>
  body { font-family: 'DM Serif Display', Georgia, serif; font-size: 16pt; line-height: 1.8; color: #2C2724; max-width: 6.5in; margin: 1in auto; padding: 0; }
  @media print { body { margin: 0; max-width: 100%; } }
</style></head><body>
${letterText.replace(/\n/g, "<br>")}
</body></html>`);
    printWindow.document.close();
    printWindow.onload = () => { printWindow.print(); };
  }

  // ==========================================
  // Sign out
  // ==========================================
  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  // ==========================================
  // Loading
  // ==========================================
  if (!ready || loading) {
    return <Spinner fullPage label="Loading gifts..." />;
  }

  // ==========================================
  // Render
  // ==========================================
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-stretch px-4 py-8">
      <PageHeader
        title="Thank You Tracker"
        subtitle={`${wedding?.partner1_name} & ${wedding?.partner2_name}`}
      />

      {/* Stats */}
      <Card variant="panel" className="mb-4 flex justify-center gap-8">
        <div className="text-center">
          <span className="block text-3xl font-semibold text-primary leading-none mb-1">{total}</span>
          <span className="text-xs font-medium uppercase tracking-[1.5px] text-text-muted">Total Gifts</span>
        </div>
        <div className="text-center">
          <span className="block text-3xl font-semibold text-primary leading-none mb-1">{sentCount}</span>
          <span className="text-xs font-medium uppercase tracking-[1.5px] text-text-muted">Thank Yous Sent</span>
        </div>
        <div className="text-center">
          <span className="block text-3xl font-semibold text-primary leading-none mb-1">{remaining}</span>
          <span className="text-xs font-medium uppercase tracking-[1.5px] text-text-muted">Remaining</span>
        </div>
      </Card>

      {/* Progress */}
      <div className="mb-6 text-center">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-gradient-to-r from-secondary to-primary transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="mt-1 inline-block text-sm text-text-muted">{pct}% complete</span>
      </div>

      {/* Tabs */}
      <nav className="mb-6 flex w-full justify-center border-b border-border">
        {([
          { key: "pending" as Tab, label: "Needs Thank You", count: pendingGifts.length },
          { key: "sent" as Tab, label: "Thank Yous Sent", count: sentGifts.length },
          { key: "letter" as Tab, label: "Thank You Letter", count: null },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 pb-2.5 pt-3 text-sm uppercase tracking-[2px] border-b-2 transition-colors ${
              activeTab === tab.key
                ? "text-text border-text"
                : "text-text-muted border-transparent hover:text-text"
            }`}
          >
            {tab.label}
            {tab.count !== null && (
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/12 px-1.5 text-xs font-semibold text-primary align-middle">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* =================== PENDING TAB =================== */}
      {activeTab === "pending" && (
        <div>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <Input
              type="text"
              value={pendingSearch}
              onChange={(e) => setPendingSearch(e.target.value)}
              placeholder="Search guests, gifts, or addresses..."
              className="flex-1"
            />
            <Button onClick={openAdd} className="whitespace-nowrap">
              + Add Gift
            </Button>
          </div>

          {filteredPending.length === 0 ? (
            <EmptyState
              message={
                pendingGifts.length === 0
                  ? "All caught up! Every gift has been thanked."
                  : "No matches found."
              }
            />
          ) : (
            <div className="flex flex-col gap-3">
              {filteredPending.map((g) => (
                <GiftCard
                  key={g.id}
                  gift={g}
                  sliding={slidingId === g.id}
                  slideDir={slideDir}
                  onSend={() => sendThankYou(g.id)}
                  onUndo={() => undoThankYou(g.id)}
                  onEdit={() => openEdit(g)}
                  onDelete={() => deleteGift(g.id, g.guest_name)}
                  onLetter={() => goToLetter(g.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* =================== SENT TAB =================== */}
      {activeTab === "sent" && (
        <div>
          <div className="mb-4">
            <Input
              type="text"
              value={sentSearch}
              onChange={(e) => setSentSearch(e.target.value)}
              placeholder="Search sent thank yous..."
            />
          </div>

          {filteredSent.length === 0 ? (
            <EmptyState
              message={
                sentGifts.length === 0
                  ? "No thank yous sent yet."
                  : "No matches found."
              }
            />
          ) : (
            <div className="flex flex-col gap-3">
              {filteredSent.map((g) => (
                <GiftCard
                  key={g.id}
                  gift={g}
                  sliding={slidingId === g.id}
                  slideDir={slideDir}
                  onSend={() => sendThankYou(g.id)}
                  onUndo={() => undoThankYou(g.id)}
                  onEdit={() => openEdit(g)}
                  onDelete={() => deleteGift(g.id, g.guest_name)}
                  onLetter={() => goToLetter(g.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* =================== LETTER TAB =================== */}
      {activeTab === "letter" && (
        <div className="flex flex-col gap-5">
          <div>
            <Label>Select a guest</Label>
            <Select
              value={letterGiftId}
              onChange={(e) => generateLetter(e.target.value)}
            >
              <option value="">-- Choose a guest --</option>
              {pendingGifts.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.guest_name} — {g.description}
                </option>
              ))}
              {sentGifts.length > 0 && (
                <optgroup label="Already Thanked">
                  {sentGifts.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.guest_name} — {g.description}
                    </option>
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
            className="w-full min-h-[260px] rounded-lg border border-border bg-background px-8 py-6 font-heading text-lg leading-relaxed text-text resize-y focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
          />

          {letterText && (
            <div className="flex flex-wrap gap-3">
              <Button onClick={copyLetter}>
                {copied ? "Copied!" : "Copy Letter to Clipboard"}
              </Button>
              <Button variant="outline" onClick={printLetter}>
                Print Letter
              </Button>
            </div>
          )}
        </div>
      )}

      {/* =================== MODAL =================== */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Gift" : "Add New Gift"}
      >
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Label>Guest Name</Label>
            <Input
              type="text"
              value={formGuest}
              onChange={(e) => handleGuestInput(e.target.value)}
              onBlur={() => setTimeout(() => setAcOpen(false), 150)}
              placeholder="e.g. Aunt Margaret"
              autoFocus
              autoComplete="off"
            />
            {acOpen && acResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 max-h-52 overflow-y-auto rounded-b-md border border-t-0 border-border bg-background shadow-card">
                {acResults.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onMouseDown={() => selectGuest(g)}
                    className="w-full px-4 py-2 text-left transition-colors hover:bg-primary/8"
                  >
                    <span className="block text-base font-medium text-text">{g.name}</span>
                    {g.address && (
                      <span className="block text-xs text-text-muted truncate">
                        {g.address.replace(/\n/g, ", ")}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>Gift Description</Label>
            <Input
              type="text"
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="e.g. KitchenAid Stand Mixer"
              onKeyDown={(e) => { if (e.key === "Enter") saveModal(); }}
            />
          </div>

          <div>
            <Label>Mailing Address</Label>
            <Textarea
              value={formAddress}
              onChange={(e) => setFormAddress(e.target.value)}
              rows={2}
              placeholder={"e.g. 123 Main St, Apt 4\nSpringfield, IL 62704"}
            />
          </div>

          <div className="mt-2 flex justify-center gap-3">
            <Button onClick={saveModal} disabled={saving}>
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
        <Button variant="link" onClick={() => router.push("/guests")}>
          Address Book
        </Button>
        <Button variant="link" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>
    </div>
  );
}
