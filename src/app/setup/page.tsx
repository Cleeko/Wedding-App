"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Label } from "@/components/Label";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Spinner } from "@/components/Spinner";

export default function SetupPage() {
  const router = useRouter();
  const { user, wedding, loading: authLoading, refetchWedding } = useAuth();
  const { toast } = useToast();
  const [partner1, setPartner1] = useState("");
  const [partner2, setPartner2] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/"); return; }
    if (wedding) { router.push("/dashboard"); return; }
  }, [user, wedding, authLoading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const { error } = await supabase.from("weddings").insert({
      user_id: user.id,
      partner1_name: partner1.trim(),
      partner2_name: partner2.trim(),
      wedding_date: weddingDate || null,
    });

    if (error) {
      toast("Something went wrong: " + error.message, "error");
      setLoading(false);
      return;
    }

    await refetchWedding();
    router.push("/dashboard");
  }

  if (authLoading || (!authLoading && !user) || wedding) {
    return <Spinner fullPage />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <PageHeader
            title="Welcome!"
            subtitle="Let's set up your wedding"
          />
        </div>

        <Card variant="form">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <Label>Partner 1</Label>
              <Input
                type="text"
                value={partner1}
                onChange={(e) => setPartner1(e.target.value)}
                required
                placeholder="First name"
              />
            </div>

            <div>
              <Label>Partner 2</Label>
              <Input
                type="text"
                value={partner2}
                onChange={(e) => setPartner2(e.target.value)}
                required
                placeholder="First name"
              />
            </div>

            <div>
              <Label>Wedding Date (optional)</Label>
              <Input
                type="date"
                value={weddingDate}
                onChange={(e) => setWeddingDate(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              size="lg"
              fullWidth
              className="mt-2"
            >
              {loading ? "Setting up..." : "Get Started"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
