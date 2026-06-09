import { createFileRoute } from "@tanstack/react-router";
import { SectionHeading } from "@/components/SectionHeading";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({ meta: [{ title: "AI Assistant — Wealth OS" }] }),
  component: AssistantPage,
});

function AssistantPage() {
  return (
    <div>
      <SectionHeading title="Aria · AI Assistant" sub="Ask anything about your portfolio, goals, or spending. Aria sees your live data." />
      <div className="fintech-card p-6 text-sm text-muted-foreground">
        <p>Tap the floating ✦ button to open Aria. Try:</p>
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li>"How am I doing this month?"</li>
          <li>"Where am I overspending?"</li>
          <li>"Suggest a rebalance for my portfolio."</li>
          <li>"What's my safest path to KES 1M?"</li>
        </ul>
      </div>
    </div>
  );
}