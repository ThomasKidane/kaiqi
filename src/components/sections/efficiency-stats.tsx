export const EfficiencyStats = () => {
    const stats = [
      {
        value: "20–30%",
        label: "Time lost searching or reconciling docs",
        note: "Fragmented storage and naming conventions",
      },
      {
        value: "40%",
        label: "Handoffs create duplicated effort",
        note: "Poor coordination across teams/tools",
      },
      {
        value: "3–5%",
        label: "Revenue leakage from missed terms",
        note: "Untracked invoices, lapsing contracts",
      },
      {
        value: "2× faster",
        label: "Close cycles with unified document truth",
        note: "Structured extraction + audit trail",
      },
    ];
  
    return (
      <section className="relative bg-transparent py-[120px]">
        <div className="container">
          <div className="mb-10 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <p className="text-xs font-medium tracking-[0.3em] text-text-tertiary uppercase">Impact</p>
          </div>
          <h2 className="text-3xl md:text-5xl font-light -tracking-[-0.02em] text-foreground max-w-4xl">
            Information organization and cross-team coordination are the biggest drag on finance efficiency.
          </h2>
          <p className="mt-4 text-text-secondary text-body-lg max-w-3xl">
            Kaiqi centralizes unstructured documents, extracts the fields that matter, and keeps every handoff in sync.
          </p>
  
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl bg-card border border-border p-6 shadow-sm"
              >
                <div className="text-4xl md:text-5xl font-light text-foreground">{s.value}</div>
                <div className="mt-2 text-base text-foreground">{s.label}</div>
                <div className="mt-3 text-sm text-text-tertiary">{s.note}</div>
              </div>
            ))}
          </div>
  
          <p className="mt-8 text-xs text-text-tertiary">
            Benchmarks aggregated from finance operations surveys and internal customer interviews.
          </p>
        </div>
      </section>
    );
  };