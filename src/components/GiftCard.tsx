import type { Gift } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Button } from "@/components/Button";

interface GiftCardProps {
  gift: Gift;
  sliding: boolean;
  slideDir: "right" | "left" | null;
  onSend: () => void;
  onUndo: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onLetter: () => void;
}

export function GiftCard({
  gift,
  sliding,
  slideDir,
  onSend,
  onUndo,
  onEdit,
  onDelete,
  onLetter,
}: GiftCardProps) {
  const slideClass = sliding
    ? slideDir === "right"
      ? "translate-x-full opacity-0"
      : "-translate-x-full opacity-0 bg-error/5 border-l-error/40"
    : "";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center justify-between rounded-md border bg-background p-4 transition-all duration-400",
        gift.thank_you_sent
          ? "border-secondary/20 border-l-3 border-l-secondary bg-gradient-to-r from-secondary/5 to-background"
          : "border-border/60 border-l-3 border-l-primary/40",
        slideClass,
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="text-lg font-semibold text-text">{gift.guest_name}</div>
        <div className="text-base text-text-muted">{gift.description}</div>
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
          <Button variant="outline" size="sm" onClick={onUndo}>
            Undo
          </Button>
        ) : (
          <>
            <Button variant="secondary" size="sm" onClick={onSend}>
              Send
            </Button>
            <Button variant="outline" size="sm" onClick={onLetter}>
              Letter
            </Button>
          </>
        )}
        <Button variant="icon" onClick={onEdit} title="Edit">
          &#9998;
        </Button>
        <Button variant="danger" onClick={onDelete} title="Delete">
          &times;
        </Button>
      </div>
    </div>
  );
}
