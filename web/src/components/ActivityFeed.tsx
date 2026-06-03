import type { ActivityItem } from "@/lib/activity";

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <div className="panel">
      <div className="panel-header">
        Recent Activity
        <span className="font-mono text-[9px] text-bone-dark">
          {items.length} event{items.length !== 1 ? "s" : ""}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <div className="font-mono text-[10px] text-bone-dark mb-2">◈ No activity yet</div>
          <div className="font-mono text-[9px] text-bone-dark">
            Be the first to place a sealed bet on this market.
          </div>
        </div>
      ) : (
        <div>
          {items.map((item, i) => (
            <div key={i} className="activity-row">
              <div className="flex items-center gap-3">
                <span className="text-signal font-mono text-[10px]">◈</span>
                <div>
                  <span className="font-mono text-[11px] text-bone">{item.trader}</span>
                  <span className="font-mono text-[11px] text-bone-dim"> placed a </span>
                  <span className="font-mono text-[11px] text-signal">sealed bet</span>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="font-mono text-[10px] text-bone-dark">{item.ageLabel}</span>
                {item.txHash && (
                  <a
                    href={`https://sepolia.etherscan.io/tx/${item.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[9px] text-bone-dark hover:text-bone transition-colors"
                  >
                    ↗
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
