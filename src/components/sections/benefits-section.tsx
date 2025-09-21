import { cn } from "@/lib/utils";

interface TitlePart {
  text: string;
  bold?: boolean;
}

const benefits: { number: string; title: TitlePart[]; description: string }[] = [
  {
    number: "Benefit 01",
    title: [
      { text: "A single workspace for maximum, automated " },
      { text: "throughput", bold: true },
    ],
    description:
      "Deep integrations anticipate finance workflows, enabling Kaiqi to automate intake, triage, and routing: from capturing receipts and invoices to matching POs and syncing ledgers. It closes the loop by validating entries before close, providing end‑to‑end supervision across your entire finance document flow.",
  },
  {
    number: "Benefit 02",
    title: [
      { text: "Easy, ", bold: true },
      { text: "scalable workflow " },
      { text: "control", bold: true },
    ],
    description:
      "Designed for disruption‑free operations. Easy to deploy and support, no proprietary hardware, and a modern UI that teams adopt on day one. Configurable to your policies, Kaiqi integrates with your ERP, email, storage, and spreadsheet tools to keep every handoff in sync.",
  },
  {
    number: "Benefit 03",
    title: [
      { text: "Rapid, ", bold: true },
      { text: "repeatable ", bold: true },
      { text: "close " },
      { text: "success", bold: true },
    ],
    description:
      "We know finance teams run on critical timelines. Kaiqi accelerates monthly and quarterly close with structured extraction, audit trails, and collaboration. Ready to integrate immediately, and fast to scale from a single team to the entire organization.",
  },
];

const BenefitCard = ({
  number,
  title,
  description,
}: {
  number: string;
  title: TitlePart[];
  description: string;
}) => (
  <div className="bg-card border border-border rounded-lg p-8 lg:p-12 flex flex-col gap-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
    <p className="text-caption text-text-secondary">{number}</p>
    <h3 className="text-2xl font-normal text-foreground -tracking-[0.02em] leading-[1.4]">
      {title.map((part, index) =>
        part.bold ? (
          <strong key={index} className="font-medium">
            {part.text}
          </strong>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </h3>
    <p className="text-base font-normal text-text-secondary leading-normal">
      {description}
    </p>
  </div>
);

/**
 * BenefitsSection component displays a grid of three benefit cards,
 * adapted for finance operations.
 */
const BenefitsSection = () => {
  return (
    <section className="bg-transparent py-[120px]">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit) => (
            <BenefitCard key={benefit.number} {...benefit} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;