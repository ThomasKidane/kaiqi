import Link from "next/link";

const CtaSection = () => {
  return (
    <section className="bg-transparent text-foreground">
      <div className="container flex flex-col items-center justify-center py-[120px] px-10 text-center">
        <h1 className="mb-20 max-w-4xl font-display text-[72px] font-light leading-[1.1] tracking-[-0.02em]">
          The finance workspace of the future starts today.
        </h1>
        <Link
          href="/contact"
          className="group flex h-[300px] w-[300px] items-center justify-center rounded-full border border-foreground/30 transition-colors hover:border-foreground"
          aria-label="Take charge of document operations"
        >
          <span className="text-center font-body text-2xl font-normal leading-tight">
            Take charge
            <br />
            of your
            <br />
            documents
          </span>
        </Link>
      </div>
    </section>
  );
};

export default CtaSection;