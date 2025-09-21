"use client";

import React from 'react';

const animationStyles = `
  @keyframes scroll-up {
    from {
      transform: translateY(0);
    }
    to {
      transform: translateY(-50%);
    }
  }
  .animate-scroll-up {
    animation: scroll-up linear infinite;
  }
`;

const numbers = Array.from({ length: 10 }, (_, i) => i);
const numberSequence = [...numbers, ...numbers];

const NumberColumn = ({ duration }: { duration: string }) => (
    <div className="h-full">
        <div className="animate-scroll-up" style={{ animationDuration: duration }}>
            {numberSequence.map((num, i) => (
                <div key={`a-${i}`} className="text-center">{num}</div>
            ))}
        </div>
        <div className="animate-scroll-up" style={{ animationDuration: duration }}>
            {numberSequence.map((num, i) => (
                <div key={`b-${i}`} className="text-center">{num}</div>
            ))}
        </div>
    </div>
);

const ProductOverview = () => {
  return (
    <>
      <style>{animationStyles}</style>
      <section className="relative flex flex-col justify-center bg-background overflow-hidden py-24 lg:py-48">
        <div className="absolute inset-0 z-0 select-none" aria-hidden="true">
          <div className="absolute inset-y-0 flex justify-between w-full px-[10vw] md:px-[20%] text-[25vw] md:text-[250px] font-light leading-none text-foreground/5 pointer-events-none">
            <div className="w-auto h-full">
              <NumberColumn duration="20s" />
            </div>
            <div className="w-auto h-full">
              <NumberColumn duration="30s" />
            </div>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center -space-y-12 md:-space-y-24 pointer-events-none">
            <div className="text-[35vw] md:text-[400px] lg:text-[480px] font-light leading-[0.8] text-transparent tracking-tighter" style={{ WebkitTextStroke: '1px hsl(var(--border))' }}>
              ROS™
            </div>
            <div className="text-[35vw] md:text-[400px] lg:text-[480px] font-light leading-[0.8] text-transparent tracking-tighter" style={{ WebkitTextStroke: '1px hsl(var(--border))' }}>
              ROS™
            </div>
          </div>
        </div>
        <div className="container relative z-10 mx-auto px-4 text-center">
          <p className="text-sm font-normal text-muted-foreground uppercase tracking-wider">
            That's the
          </p>
          <h2 className="mt-2 text-5xl md:text-7xl lg:text-[80px] font-light text-foreground !leading-tight tracking-tighter">
            Rocket Operating System.
          </h2>
          <div className="mt-6">
            <div className="text-[25vw] sm:text-[200px] lg:text-[264px] font-light text-foreground !leading-none tracking-tighter">
              ROS
              <sup className="text-[8vw] sm:text-[60px] lg:text-[90px] -top-[0.4em] lg:-top-[0.5em] tracking-normal">
                ™
              </sup>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ProductOverview;