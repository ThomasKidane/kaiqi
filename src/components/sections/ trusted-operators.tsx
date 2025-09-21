import React from 'react';
import Image from 'next/image';

const logos = [
  {
    src: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/37f43346-3716-43c8-b720-aa9f901e52d7-terminal-industries-com/assets/images/logo-05-3.png?",
    alt: "A partner logo",
    width: 322,
    height: 111,
  },
  {
    src: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/37f43346-3716-43c8-b720-aa9f901e52d7-terminal-industries-com/assets/svgs/coca-cola-6.svg?",
    alt: "Coca-Cola logo",
    width: 300,
    height: 94,
  },
  {
    src: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/37f43346-3716-43c8-b720-aa9f901e52d7-terminal-industries-com/assets/svgs/hp-7.svg?",
    alt: "HP logo",
    width: 2500,
    height: 2500,
  },
];

const TrustedOperators = () => {
  return (
    <section className="bg-background text-foreground py-[120px]">
      <div className="container mx-auto px-10">
        <div className="text-center mb-20 md:mb-24">
          <p className="text-sm text-text-secondary mb-4">
            Trusted by Operators
          </p>
          <h2 className="text-4xl md:text-5xl font-light tracking-tighter leading-tight max-w-4xl mx-auto">
            Trusted by <strong className="font-medium">leading space operators</strong> looking for rocket innovation
          </h2>
        </div>

        <div className="relative border-t border-border">
          <div className="absolute inset-0 pointer-events-none">
            <div className="container mx-auto h-full px-10">
              <div className="hidden md:grid grid-cols-6 h-full w-full">
                <div className="h-full border-r border-border" />
                <div className="h-full border-r border-border" />
                <div className="h-full border-r border-border" />
                <div className="h-full border-r border-border" />
                <div className="h-full border-r border-border" />
                <div className="h-full" />
              </div>
              <div className="grid md:hidden grid-cols-2 h-full w-full">
                <div className="h-full border-r border-border" />
                <div className="h-full" />
              </div>
            </div>
          </div>

          <div className="relative z-10 flex justify-center items-center gap-x-16 md:gap-x-24 h-[180px]">
            {logos.map((logo, index) => (
              <div key={index} className="flex-shrink-0 px-2">
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={logo.width}
                  height={logo.height}
                  className="h-9 md:h-12 w-auto object-contain text-foreground"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustedOperators;