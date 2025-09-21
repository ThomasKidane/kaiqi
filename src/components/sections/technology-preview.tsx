import Link from "next/link";
import React from "react";

const TechnologyPreview = () => {
  return (
    <section className="bg-background py-20 lg:py-32">
      <div className="container mx-auto flex flex-col items-center px-10 text-center">
        <div className="relative mb-6">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="h-20 w-20 rounded-full bg-accent/10 blur-2xl" />
          </div>
          <p className="relative text-sm text-muted-foreground tracking-wider">
            How it Works
          </p>
        </div>

        <h2 className="mb-16 max-w-5xl text-5xl font-normal leading-[1.2] tracking-[-0.02em] text-foreground md:text-6xl md:leading-[1.1]">
          Revolutionary technology that transforms launch operations from
          preparation to liftoff
        </h2>

        <Link
          href="/system"
          className="border-y border-border py-3 text-xs font-medium uppercase tracking-[0.15em] text-foreground transition-colors hover:border-foreground/50"
        >
          Take a closer look
        </Link>
      </div>
    </section>
  );
};

export default TechnologyPreview;