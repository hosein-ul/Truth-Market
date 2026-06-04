"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useWriteContract } from "wagmi";
import { decodeEventLog } from "viem";
import { toast } from "sonner";
import { Sparkles, Lock } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ADDRESSES } from "@/lib/addresses";
import { marketFactoryAbi } from "@/lib/abis";
import { publicClient } from "@/lib/viem";
import { humanizeError } from "@/lib/errors";
import { CATEGORY_OPTIONS } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryChip } from "@/components/CategoryChip";
import { SealedBlock } from "@/components/Sealed";
import { MarketStatusBadge } from "@/components/MarketStatusBadge";
import { MARKET_STATUS } from "@/lib/abis";

export default function CreatePage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Crypto");
  const [days, setDays] = useState("7");
  const [oracle, setOracle] = useState("");
  const [busy, setBusy] = useState(false);

  const closesLabel = useMemo(() => {
    const d = Number(days) || 0;
    const date = new Date(Date.now() + d * 86400 * 1000);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [days]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isConnected || !address) return;
    if (!question.trim()) {
      toast.error("Please write a question for your market.");
      return;
    }
    const deadline = BigInt(Math.floor(Date.now() / 1000) + Number(days) * 86400);
    const oracleAddr = (
      oracle && /^0x[0-9a-fA-F]{40}$/.test(oracle) ? oracle : address
    ) as `0x${string}`;
    const toastId = toast.loading("Creating your market…");
    try {
      setBusy(true);
      const hash = await writeContractAsync({
        address: ADDRESSES.marketFactory,
        abi: marketFactoryAbi,
        functionName: "createMarket",
        args: [oracleAddr, deadline, question, description, category],
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      for (const log of receipt.logs) {
        try {
          const ev = decodeEventLog({
            abi: marketFactoryAbi,
            data: log.data,
            topics: log.topics,
          });
          if (ev.eventName === "MarketCreated") {
            toast.success("Market created! Redirecting…", { id: toastId });
            router.push(`/markets/${(ev.args as any).market}`);
            return;
          }
        } catch {
          /* unrelated log */
        }
      }
      toast.success("Market created!", { id: toastId });
      router.push("/");
    } catch (e) {
      toast.error(humanizeError(e), { id: toastId });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-sm font-semibold text-blue-300">
            <Sparkles className="h-3.5 w-3.5" />
            New sealed market
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight">
            Create a market
          </h1>
          <p className="mt-1 text-muted-foreground">
            Frame a clear yes/no question. Bets stay sealed until you resolve it.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Form */}
          <form onSubmit={submit} className="space-y-5 lg:col-span-3">
            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <Textarea
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Will ETH close above $5,000 on Dec 31, 2026?"
                rows={2}
                className="font-display text-lg font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Resolution criteria</Label>
              <Textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Resolves YES if the daily close on Coinbase ETH-USD on Dec 31, 2026 (UTC) is above $5,000. Otherwise NO."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Be specific — name the source, the exact time, and the threshold.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="days">Open for (days)</Label>
                <Input
                  id="days"
                  value={days}
                  onChange={(e) => setDays(e.target.value.replace(/[^\d]/g, ""))}
                  className="tabular-nums"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="oracle">Resolver address (optional)</Label>
              <Input
                id="oracle"
                value={oracle}
                onChange={(e) => setOracle(e.target.value)}
                placeholder="Defaults to your wallet"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                The resolver records the final outcome after the market closes.
              </p>
            </div>

            <div className="pt-2">
              {isConnected ? (
                <Button
                  type="submit"
                  disabled={busy || !question.trim()}
                  variant="gradient"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  {busy ? "Creating…" : "Create market"}
                </Button>
              ) : (
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <Button
                      type="button"
                      onClick={openConnectModal}
                      variant="gradient"
                      size="lg"
                      className="w-full sm:w-auto"
                    >
                      Connect wallet to create
                    </Button>
                  )}
                </ConnectButton.Custom>
              )}
            </div>
          </form>

          {/* Live preview */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-20">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Live preview
              </p>
              <Card className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <CategoryChip category={category} />
                  <MarketStatusBadge status={MARKET_STATUS.OPEN} />
                </div>
                <h3 className="mt-3 min-h-[48px] font-display text-[15px] font-bold leading-snug tracking-tight">
                  {question || "Your question will appear here…"}
                </h3>
                <div className="mt-3">
                  <SealedBlock />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Lock className="h-3.5 w-3.5" />
                    Sealed on open
                  </span>
                  <span>Closes {closesLabel}</span>
                </div>
              </Card>
              <p className="mt-3 px-1 text-xs leading-relaxed text-muted-foreground">
                While the market is open, the odds and every position stay hidden.
                The probability bar appears only after you resolve it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
