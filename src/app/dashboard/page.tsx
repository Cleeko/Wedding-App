"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { useToast } from "@/lib/toast";
import type { Gift, Guest } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { Label } from "@/components/Label";
import { Input, Textarea, Select } from "@/components/Input";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { Spinner } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";

type SortKey = "guest_name" | "description" | "thank_you_sent" | "created_at";
type SortDir = "asc" | "desc";
type Filter = "all" | "pending" | "sent";

export default function DashboardPage() {
  const router = useRouter();
  const { wedding, signOut, ready } = useRequireAuth();
  const { toast } = useToast();
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [busy, setBusy] = useState(false);

  // Guest list (for autocomplete)
  const [guestList, setGuestList] = useState<Guest[]>([]);
  const [acResults, setAcResults] = useState<Guest[]>([]);
  const [acOpen, setAcOpen] = useState(false);

  // Gift modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formGuest, setFormGuest] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [saving, setSaving] = useState(false);

  // Letter modal state
  const [letterOpen, setLetterOpen] = useState(false);
  const [letterGiftId, setLetterGiftId] = useState("");
  const [letterText, setLetterText] = useState("");
  const [copied, setCopied] = useState(false);

  // ==========================================
  // Data loading
  // ==========================================
  const fetchGifts = useCallback(async (weddingId: string) => {
    const { data, error } = await supabase
      .from("gifts")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("created_at", { ascending: false });
    if (error) { toast("Failed to load gifts: " + error.message, "error"); return; }
    if (data) setGifts(data);
  }, [toast]);

  const fetchGuests = useCallback(async (weddingId: string) => {
    const { data, error } = await supabase
      .from("guests")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("name", { ascending: true });
    if (error) return;
    if (data) setGuestList(data);
  }, []);

  useEffect(() => {
    if (!ready || !wedding) return;
    Promise.all([fetchGifts(wedding.id), fetchGuests(wedding.id)]).then(() => setLoading(false));
  }, [ready, wedding, fetchGifts, fetchGuests]);

  // ==========================================
  // Sorting & filtering
  // ==========================================
  const filtered = useMemo(() => {
    let result = gifts;

    if (filter === "pending") result = result.filter((g) => !g.thank_you_sent);
    if (filter === "sent") result = result.filter((g) => g.thank_you_sent);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (g) =>
          g.guest_name.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.address.toLowerCase().includes(q),
      );
    }

    const dir = sortDir === "asc" ? 1 : -1;
    result = [...result].sort((a, b) => {
      if (sortKey === "thank_you_sent") {
        return (Number(a.thank_you_sent) - Number(b.thank_you_sent)) * dir;
      }
      if (sortKey === "created_at") {
        return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
      }
      return a[sortKey].localeCompare(b[sortKey]) * dir;
    });

    return result;
  }, [gifts, filter, search, sortKey, sortDir]);

  const total = gifts.length;
  const sentCount = gifts.filter((g) => g.thank_you_sent).length;
  const remaining = total - sentCount;
  const pct = total > 0 ? Math.round((sentCount / total) * 100) : 0;

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  // ==========================================
  // Actions (optimistic)
  // ==========================================
  async function toggleThankYou(id: string, currentValue: boolean) {
    if (busy) return;
    setBusy(true);
    const prevGifts = gifts;
    const next = !currentValue;

    setGifts((prev) => prev.map((g) => (g.id === id ? { ...g, thank_you_sent: next } : g)));

    const { error } = await supabase.from("gifts").update({ thank_you_sent: next }).eq("id", id);
    if (error) {
      setGifts(prevGifts);
      toast("Failed to update: " + error.message, "error");
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
  // Gift Modal
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
    if (value.trim().length < 2) { setAcOpen(false); setAcResults([]); return; }
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
      const { data, error } = await supabase.from("gifts").update(payload).eq("id", editingId).select().single();
      if (error) { toast("Failed to save gift: " + error.message, "error"); setSaving(false); return; }
      setGifts((prev) => prev.map((g) => (g.id === editingId ? data : g)));
      toast("Gift updated", "success");
    } else {
      const { data, error } = await supabase.from("gifts").insert({ ...payload, wedding_id: wedding!.id }).select().single();
      if (error) { toast("Failed to add gift: " + error.message, "error"); setSaving(false); return; }
      setGifts((prev) => [data, ...prev]);
      toast("Gift added!", "success");
    }

    setModalOpen(false);
    setSaving(false);
  }

  // ==========================================
  // Letter Modal
  // ==========================================
  function buildLetter(gift: Gift) {
    if (!wedding) return "";
    return (
      `Dear ${gift.guest_name},\n\n` +
      `Thank you so much for the generous gift of ${gift.description.toLowerCase()}. ` +
      `We are truly grateful for your thoughtfulness and for being part of our special day.\n\n` +
      `Your kindness means the world to us as we begin this new chapter together. ` +
      `We cannot wait to put your wonderful gift to good use!\n\n` +
      `With love and gratitude,\n` +
      `${wedding.partner1_name} & ${wedding.partner2_name}`
    );
  }

  function openLetter(giftId: string) {
    setLetterGiftId(giftId);
    const gift = gifts.find((g) => g.id === giftId);
    if (gift) setLetterText(buildLetter(gift));
    setLetterOpen(true);
  }

  function changeLetterGift(giftId: string) {
    setLetterGiftId(giftId);
    if (!giftId) { setLetterText(""); return; }
    const gift = gifts.find((g) => g.id === giftId);
    if (gift) setLetterText(buildLetter(gift));
  }

  async function copyLetter() {
    if (!letterText) return;
    try {
      await navigator.clipboard.writeText(letterText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Couldn't copy — try selecting the text manually.", "error");
    }
  }

  function printLetter() {
    if (!letterText) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) { toast("Pop-up blocked — please allow pop-ups for this site.", "error"); return; }
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
    router.push("/login");
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
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-stretch px-4 py-8">
      <PageHeader
        title="Thank You Tracker"
        subtitle={`${wedding?.partner1_name} & ${wedding?.partner2_name}`}
      />

      {/* Stats row */}
      <div className="mb-4 flex items-center justify-center gap-8 rounded-md border border-border/40 bg-surface/50 p-4">
        <div className="text-center">
          <span className="block text-3xl font-semibold text-primary leading-none mb-1">{total}</span>
          <span className="text-xs font-medium text-text-muted">Total Gifts</span>
        </div>
        <div className="text-center">
          <span className="block text-3xl font-semibold text-primary leading-none mb-1">{sentCount}</span>
          <span className="text-xs font-medium text-text-muted">Thank Yous Sent</span>
        </div>
        <div className="text-center">
          <span className="block text-3xl font-semibold text-primary leading-none mb-1">{remaining}</span>
          <span className="text-xs font-medium text-text-muted">Remaining</span>
        </div>
      </div>

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

      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search guests, gifts, or addresses..."
          className="flex-1"
        />
        <div className="flex gap-2">
          {(["all", "pending", "sent"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                filter === f
                  ? "bg-primary text-background"
                  : "bg-surface text-text-muted hover:bg-border/60"
              }`}
            >
              {f === "all" ? `All (${total})` : f === "pending" ? `Pending (${remaining})` : `Sent (${sentCount})`}
            </button>
          ))}
        </div>
        <Button onClick={openAdd} className="whitespace-nowrap">
          + Add Gift
        </Button>
      </div>

      {/* =================== TABLE =================== */}
      {filtered.length === 0 ? (
        <EmptyState
          message={
            gifts.length === 0
              ? "No gifts yet. Add your first gift to get started!"
              : "No matches found."
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-surface/60">
                <th className="w-12 px-4 py-3 text-center">
                  <button
                    onClick={() => toggleSort("thank_you_sent")}
                    className="text-[0.65rem] font-semibold uppercase tracking-wider text-text-muted hover:text-text transition-colors"
                    title="Sort by status"
                  >
                    Sent{sortKey === "thank_you_sent" ? (
                      <span className="ml-1 text-primary">{sortDir === "asc" ? "\u25B2" : "\u25BC"}</span>
                    ) : (
                      <span className="ml-1 text-text-muted/30">&uarr;&darr;</span>
                    )}
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button
                    onClick={() => toggleSort("guest_name")}
                    className="text-[0.65rem] font-semibold uppercase tracking-wider text-text-muted hover:text-text transition-colors"
                  >
                    Guest{sortKey === "guest_name" ? (
                      <span className="ml-1 text-primary">{sortDir === "asc" ? "\u25B2" : "\u25BC"}</span>
                    ) : (
                      <span className="ml-1 text-text-muted/30">&uarr;&darr;</span>
                    )}
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button
                    onClick={() => toggleSort("description")}
                    className="text-[0.65rem] font-semibold uppercase tracking-wider text-text-muted hover:text-text transition-colors"
                  >
                    Gift{sortKey === "description" ? (
                      <span className="ml-1 text-primary">{sortDir === "asc" ? "\u25B2" : "\u25BC"}</span>
                    ) : (
                      <span className="ml-1 text-text-muted/30">&uarr;&darr;</span>
                    )}
                  </button>
                </th>
                <th className="hidden px-4 py-3 md:table-cell">
                  <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-text-muted">
                    Address
                  </span>
                </th>
                <th className="px-4 py-3 text-right">
                  <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-text-muted">
                    Actions
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => (
                <tr
                  key={g.id}
                  className="border-b border-border/30 transition-colors hover:bg-surface/40 last:border-b-0"
                >
                  {/* Checkbox */}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleThankYou(g.id, g.thank_you_sent)}
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-md border-2 transition-all ${
                        g.thank_you_sent
                          ? "border-success bg-success text-background"
                          : "border-border hover:border-primary/50"
                      }`}
                      title={g.thank_you_sent ? "Mark as not sent" : "Mark as sent"}
                    >
                      {g.thank_you_sent && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3.5 w-3.5">
                          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  </td>

                  {/* Guest name */}
                  <td className="px-4 py-3">
                    <span className={`font-medium ${g.thank_you_sent ? "text-text-muted line-through" : "text-text"}`}>
                      {g.guest_name}
                    </span>
                  </td>

                  {/* Gift description */}
                  <td className="px-4 py-3">
                    <span className={g.thank_you_sent ? "text-text-muted" : "text-text"}>
                      {g.description}
                    </span>
                  </td>

                  {/* Address (hidden on mobile) */}
                  <td className="hidden px-4 py-3 md:table-cell">
                    <span className="text-xs text-text-muted truncate block max-w-[200px]">
                      {g.address ? g.address.replace(/\n/g, ", ") : "\u2014"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openLetter(g.id)}
                        className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-primary/10 hover:text-primary"
                        title="Write letter"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M22 6l-10 7L2 6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button
                        onClick={() => openEdit(g)}
                        className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-primary/10 hover:text-primary"
                        title="Edit"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteGift(g.id, g.guest_name)}
                        className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-error/10 hover:text-error"
                        title="Delete"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
                          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Row count */}
      {filtered.length > 0 && (
        <p className="mt-2 text-xs text-text-muted text-right">
          Showing {filtered.length} of {total} gift{total !== 1 ? "s" : ""}
        </p>
      )}

      {/* =================== GIFT MODAL =================== */}
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

      {/* =================== LETTER MODAL =================== */}
      <Modal
        open={letterOpen}
        onClose={() => setLetterOpen(false)}
        title="Thank You Letter"
      >
        <div className="flex flex-col gap-4">
          <div>
            <Label>Select a guest</Label>
            <Select
              value={letterGiftId}
              onChange={(e) => changeLetterGift(e.target.value)}
            >
              <option value="">-- Choose a guest --</option>
              {gifts.filter((g) => !g.thank_you_sent).map((g) => (
                <option key={g.id} value={g.id}>
                  {g.guest_name} — {g.description}
                </option>
              ))}
              {gifts.filter((g) => g.thank_you_sent).length > 0 && (
                <optgroup label="Already Thanked">
                  {gifts.filter((g) => g.thank_you_sent).map((g) => (
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
            className="w-full min-h-[240px] rounded-lg border border-border bg-background px-6 py-4 font-heading text-base leading-relaxed text-text resize-y focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
          />

          {letterText && (
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={copyLetter}>
                {copied ? "Copied!" : "Copy to Clipboard"}
              </Button>
              <Button variant="outline" onClick={printLetter}>
                Print Letter
              </Button>
            </div>
          )}
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
