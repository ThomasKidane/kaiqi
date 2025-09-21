import Image from "next/image";

const partners = [
  {
    name: 'Ryder',
    logoUrl: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/37f43346-3716-43c8-b720-aa9f901e52d7-terminal-industries-com/assets/svgs/ryder-1.svg?',
    width: 147,
    height: 41,
  },
  {
    name: 'Prologis',
    logoUrl: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/37f43346-3716-43c8-b720-aa9f901e52d7-terminal-industries-com/assets/svgs/prologis-2.svg?',
    width: 181,
    height: 34,
  },
  {
    name: 'NFI',
    logoUrl: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/37f43346-3716-43c8-b720-aa9f901e52d7-terminal-industries-com/assets/svgs/nfi-3.svg?',
    width: 118,
    height: 46,
  },
  {
    name: 'Lineage',
    logoUrl: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/37f43346-3716-43c8-b720-aa9f901e52d7-terminal-industries-com/assets/svgs/lineage-4.svg?',
    width: 170,
    height: 44,
  },
  {
    name: '8VC',
    logoUrl: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/37f43346-3716-43c8-b720-aa9f901e52d7-terminal-industries-com/assets/svgs/8vc-5.svg?',
    width: 114,
    height: 45,
  },
];

const IndustryPartners = () => {
  return (
    <section className="bg-background py-20 lg:py-32">
      <div className="container">
        <div className="flex flex-col items-center text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Built by the Industry
          </p>
          <h2 className="mt-4 max-w-lg text-[32px] font-normal leading-tight tracking-[-0.02em] text-foreground md:max-w-4xl md:text-[48px] md:leading-[1.2]">
            Built by space industry partners wanting a new standard for rocket operations
          </h2>
        </div>

        <div className="mt-16 lg:mt-24">
          <div className="grid grid-cols-2 border-l border-t border-border md:grid-cols-5">
            {partners.map((partner) => (
              <div
                key={partner.name}
                className="flex h-28 items-center justify-center border-b border-r border-border p-6"
              >
                <Image
                  src={partner.logoUrl}
                  alt={`${partner.name} logo`}
                  width={partner.width}
                  height={partner.height}
                  className="h-auto w-full max-w-[160px] filter grayscale"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default IndustryPartners;