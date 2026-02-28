"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { Wedding, Gift } from "@/lib/types";

type Tab = "pending" | "sent" | "letter";

export default function DashboardPage() {
  const router = useRouter();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [pendingSearch, setPendingSearch] = useState("");
  const [sentSearch, setSentSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [slidingId, setSlidingId] = useState<string | null>(null);
  const [slideDir, setSlideDir] = useState<"right" | "left" | null>(null);

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
      await fetchGifts(w.id);
      setLoading(false);
    }
    init();
  }, [router, fetchGifts]);

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
  // Actions
  // ==========================================
  async function sendThankYou(id: string) {
    if (busy) return;
    setBusy(true);
    setSlidingId(id);
    setSlideDir("right");
    await new Promise((r) => setTimeout(r, 400));
    setSlidingId(null);
    setSlideDir(null);

    await supabase.from("gifts").update({ thank_you_sent: true }).eq("id", id);
    await fetchGifts(wedding!.id);
    setBusy(false);
  }

  async function undoThankYou(id: string) {
    if (busy) return;
    setBusy(true);
    setSlidingId(id);
    setSlideDir("left");
    await new Promise((r) => setTimeout(r, 400));
    setSlidingId(null);
    setSlideDir(null);

    await supabase.from("gifts").update({ thank_you_sent: false }).eq("id", id);
    await fetchGifts(wedding!.id);
    setBusy(false);
  }

  async function deleteGift(id: string, guestName: string) {
    if (busy) return;
    if (!confirm(`Delete gift from ${guestName}?`)) return;
    setBusy(true);
    await supabase.from("gifts").delete().eq("id", id);
    await fetchGifts(wedding!.id);
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
    setModalOpen(true);
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
      alert("Please fill in guest name and gift description.");
      return;
    }
    setSaving(true);

    if (editingId) {
      await supabase
        .from("gifts")
        .update({
          guest_name: formGuest.trim(),
          description: formDesc.trim(),
          address: formAddress.trim(),
        })
        .eq("id", editingId);
    } else {
      await supabase.from("gifts").insert({
        wedding_id: wedding!.id,
        guest_name: formGuest.trim(),
        description: formDesc.trim(),
        address: formAddress.trim(),
      });
    }

    await fetchGifts(wedding!.id);
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

  // ==========================================
  // Sign out
  // ==========================================
  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  // ==========================================
  // Loading
  // ==========================================
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-3 border-warm-gray border-t-dusty-blue" />
          <p className="italic text-text-muted">Loading gifts...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // Render
  // ==========================================
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-stretch px-4 py-8">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-normal uppercase tracking-[4px] text-text-dark">
          Thank You Tracker
        </h1>
        <p className="mt-1 text-base italic text-text-muted tracking-wider">
          {wedding?.partner1_name} & {wedding?.partner2_name}
        </p>
      </div>

      {/* Stats */}
      <div className="mb-4 flex justify-center gap-8 rounded-sm border border-dusty-blue/15 bg-gradient-to-br from-parchment to-parchment-dark p-5 shadow-sm">
        <div className="text-center">
          <span className="block text-3xl font-semibold text-dusty-blue leading-none mb-1">{total}</span>
          <span className="text-xs uppercase tracking-[1.5px] text-text-muted">Total Gifts</span>
        </div>
        <div className="text-center">
          <span className="block text-3xl font-semibold text-dusty-blue leading-none mb-1">{sentCount}</span>
          <span className="text-xs uppercase tracking-[1.5px] text-text-muted">Thank Yous Sent</span>
        </div>
        <div className="text-center">
          <span className="block text-3xl font-semibold text-dusty-blue leading-none mb-1">{remaining}</span>
          <span className="text-xs uppercase tracking-[1.5px] text-text-muted">Remaining</span>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6 text-center">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-warm-gray">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sage to-dusty-blue transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="mt-1 inline-block text-sm italic text-text-muted">{pct}% complete</span>
      </div>

      {/* Tabs */}
      <nav className="mb-6 flex w-full justify-center border-b border-warm-gray">
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
                ? "text-text-dark border-text-dark"
                : "text-text-muted border-transparent hover:text-text-dark"
            }`}
          >
            {tab.label}
            {tab.count !== null && (
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-dusty-blue/12 px-1.5 text-xs font-semibold text-dusty-blue align-middle">
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
            <input
              type="text"
              value={pendingSearch}
              onChange={(e) => setPendingSearch(e.target.value)}
              placeholder="Search guests, gifts, or addresses..."
              className="flex-1 rounded-sm border border-warm-gray bg-parchment px-4 py-2.5 text-base transition-colors focus:border-dusty-blue-light focus:outline-none"
            />
            <button
              onClick={openAdd}
              className="rounded-sm bg-dusty-blue px-5 py-2.5 text-sm uppercase tracking-[2px] text-parchment transition-all hover:bg-dusty-blue-hover hover:-translate-y-px hover:shadow-lg whitespace-nowrap"
            >
              + Add Gift
            </button>
          </div>

          {filteredPending.length === 0 ? (
            <p className="py-12 text-center italic text-text-muted">
              {pendingGifts.length === 0
                ? 'All caught up! Every gift has been thanked.'
                : 'No matches found.'}
            </p>
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
            <input
              type="text"
              value={sentSearch}
              onChange={(e) => setSentSearch(e.target.value)}
              placeholder="Search sent thank yous..."
              className="w-full rounded-sm border border-warm-gray bg-parchment px-4 py-2.5 text-base transition-colors focus:border-dusty-blue-light focus:outline-none"
            />
          </div>

          {filteredSent.length === 0 ? (
            <p className="py-12 text-center italic text-text-muted">
              {sentGifts.length === 0
                ? 'No thank yous sent yet.'
                : 'No matches found.'}
            </p>
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
            <label className="mb-1 block text-xs uppercase tracking-[1.5px] text-text-muted">
              Select a guest
            </label>
            <select
              value={letterGiftId}
              onChange={(e) => generateLetter(e.target.value)}
              className="w-full rounded-sm border border-warm-gray bg-parchment-dark px-4 py-3 text-base text-text-dark focus:border-dusty-blue focus:outline-none"
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
            </select>
          </div>

          <textarea
            value={letterText}
            onChange={(e) => setLetterText(e.target.value)}
            placeholder="Select a guest above to generate a thank you letter..."
            rows={10}
            className="w-full min-h-[260px] rounded-sm border border-dusty-blue/15 bg-parchment px-8 py-6 text-lg leading-relaxed text-text-dark resize-y focus:border-dusty-blue focus:outline-none"
          />

          {letterText && (
            <button
              onClick={copyLetter}
              className="self-start rounded-sm bg-dusty-blue px-5 py-2.5 text-sm uppercase tracking-[2px] text-parchment transition-all hover:bg-dusty-blue-hover hover:-translate-y-px hover:shadow-lg"
            >
              {copied ? "Copied!" : "Copy Letter to Clipboard"}
            </button>
          )}
        </div>
      )}

      {/* =================== MODAL =================== */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-text-dark/50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div className="w-full max-w-md rounded-sm border border-dusty-blue/15 bg-gradient-to-br from-parchment to-parchment-dark p-8 shadow-lg">
            <h2 className="mb-5 text-center text-xl font-normal tracking-wider uppercase text-text-dark">
              {editingId ? "Edit Gift" : "Add New Gift"}
            </h2>

            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[1.5px] text-text-muted">
                  Guest Name
                </label>
                <input
                  type="text"
                  value={formGuest}
                  onChange={(e) => setFormGuest(e.target.value)}
                  className="w-full rounded-sm border border-warm-gray bg-parchment-dark px-4 py-3 text-base text-text-dark transition-colors focus:border-dusty-blue focus:outline-none"
                  placeholder="e.g. Aunt Margaret"
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1 block text-xs uppercase tracking-[1.5px] text-text-muted">
                  Gift Description
                </label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full rounded-sm border border-warm-gray bg-parchment-dark px-4 py-3 text-base text-text-dark transition-colors focus:border-dusty-blue focus:outline-none"
                  placeholder="e.g. KitchenAid Stand Mixer"
                  onKeyDown={(e) => { if (e.key === "Enter") saveModal(); }}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs uppercase tracking-[1.5px] text-text-muted">
                  Mailing Address
                </label>
                <textarea
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  rows={2}
                  className="w-full rounded-sm border border-warm-gray bg-parchment-dark px-4 py-3 text-base text-text-dark transition-colors focus:border-dusty-blue focus:outline-none resize-y"
                  placeholder={"e.g. 123 Main St, Apt 4\nSpringfield, IL 62704"}
                />
              </div>

              <div className="mt-2 flex justify-center gap-3">
                <button
                  onClick={saveModal}
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

      {/* Footer */}
      <div className="mt-8 text-center">
        <button
          onClick={handleSignOut}
          className="text-sm text-text-muted transition-colors hover:text-dusty-blue"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

// ==========================================
// Gift Card Component
// ==========================================
function GiftCard({
  gift,
  sliding,
  slideDir,
  onSend,
  onUndo,
  onEdit,
  onDelete,
  onLetter,
}: {
  gift: Gift;
  sliding: boolean;
  slideDir: "right" | "left" | null;
  onSend: () => void;
  onUndo: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onLetter: () => void;
}) {
  const slideClass = sliding
    ? slideDir === "right"
      ? "translate-x-full opacity-0"
      : "-translate-x-full opacity-0 bg-red-800/5 border-l-red-400/40"
    : "";

  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center justify-between rounded-sm border bg-parchment p-4 transition-all duration-400 ${
        gift.thank_you_sent
          ? "border-sage/20 border-l-3 border-l-sage bg-gradient-to-r from-sage/5 to-parchment"
          : "border-dusty-blue/12 border-l-3 border-l-dusty-blue-light"
      } ${slideClass}`}
    >
      <div className="min-w-0 flex-1">
        <div className="text-lg font-semibold text-text-dark">{gift.guest_name}</div>
        <div className="text-base italic text-text-muted">{gift.description}</div>
        {gift.address ? (
          <div className="mt-0.5 text-sm text-text-muted tracking-wide">
            {gift.address.replace(/\n/g, ", ")}
          </div>
        ) : (
          <div className="mt-0.5 text-sm italic text-text-muted/50">No address</div>
        )}
      </div>

      <div className="flex flex-shrink-0 items-center gap-2 sm:ml-4">
        {gift.thank_you_sent ? (
          <button
            onClick={onUndo}
            className="rounded-sm border border-warm-gray bg-transparent px-3 py-1.5 text-xs uppercase tracking-[1.5px] text-text-muted transition-colors hover:text-dusty-blue hover:border-dusty-blue-light"
          >
            Undo
          </button>
        ) : (
          <>
            <button
              onClick={onSend}
              className="rounded-sm bg-sage px-3 py-1.5 text-xs uppercase tracking-[1.5px] text-parchment transition-all hover:bg-sage-hover hover:shadow-md"
            >
              Send
            </button>
            <button
              onClick={onLetter}
              className="rounded-sm border border-dusty-blue-light bg-transparent px-3 py-1.5 text-xs uppercase tracking-[1.5px] text-dusty-blue transition-all hover:bg-dusty-blue hover:text-parchment"
            >
              Letter
            </button>
          </>
        )}
        <button
          onClick={onEdit}
          className="flex h-8 w-8 items-center justify-center rounded-sm border border-transparent text-text-muted transition-all hover:border-warm-gray hover:bg-parchment-dark"
          title="Edit"
        >
          &#9998;
        </button>
        <button
          onClick={onDelete}
          className="flex h-8 w-8 items-center justify-center rounded-sm border border-transparent text-text-muted transition-all hover:border-red-200 hover:text-red-600"
          title="Delete"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
