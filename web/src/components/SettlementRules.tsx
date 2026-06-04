import { shortAddr } from "@/lib/format";

export function SettlementRules({
  description,
  oracle,
  deadline,
  disputeWindow,
}: {
  description: string;
  oracle: string;
  deadline: number;
  disputeWindow: number;
}) {
  const deadlineDate = new Date(deadline * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const disputeDays = Math.round(disputeWindow / 86400);

  const rules = [
    `Oracle (${shortAddr(oracle)}) posts outcome after deadline on ${deadlineDate}`,
    `A ${disputeDays}-day dispute window follows before finalization`,
    "Winners receive a pro-rata share of the total pool",
    "Losing positions receive zero payout",
    `Market voids automatically if unresolved after the ${disputeDays}-day window`,
    "All individual positions remain encrypted until settlement",
  ];

  return (
    <div className="panel">
      <div className="panel-header">Settlement Rules</div>
      <div className="p-5 space-y-4">
        {description && (
          <p className="text-bone-dim text-[13px] leading-[1.65] font-sans">
            {description}
          </p>
        )}
        <div className="space-y-2">
          {rules.map((rule, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="font-mono text-[10px] text-signal mt-[2px] flex-shrink-0">◈</span>
              <span className="font-mono text-[11px] text-bone-dim leading-[1.5]">{rule}</span>
            </div>
          ))}
        </div>
        <div
          className="font-mono text-[9px] text-bone-dark leading-[1.6] pt-2"
          style={{ boxShadow: "inset 0 0.5px 0 0 rgba(46,52,65,0.6)" }}
        >
          <div className="pt-2">
            Powered by <span className="text-signal">Zama FHEVM</span> — on-chain fully homomorphic encryption.
            Bet amounts and sides are encrypted at the protocol level, not just hidden by policy.
          </div>
        </div>
      </div>
    </div>
  );
}
