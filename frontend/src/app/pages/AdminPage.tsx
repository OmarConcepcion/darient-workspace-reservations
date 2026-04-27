import { ActivityIcon, EmptyState, PageHeader } from "../../shared/ui";

export const AdminPage = () => (
  <section className="space-y-8">
    <PageHeader
      eyebrow="Operations"
      title="Admin dashboard"
      description="Telemetry, alerts and device control. Live data wiring lands in the next phase."
    />
    <EmptyState
      icon={<ActivityIcon size={20} />}
      title="Dashboard coming online"
      description="Telemetry stream, alert log and desired-state controls will appear here once Phase 04 ships."
    />
  </section>
);
