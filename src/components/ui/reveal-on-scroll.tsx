"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";

interface RevealOnScrollProps {
  children: React.ReactNode;
  className?: string;
  /** seconds, e.g. 0, 0.1, 0.2 */
  delay?: number;
}

export const RevealOnScroll: React.FC<RevealOnScrollProps> = ({ children, className, delay = 0 }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: "0px 0px -10% 0px", threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}s` }}
      className={clsx(
        "will-change-[transform,opacity,filter] transition-all duration-700 ease-out",
        visible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-6 blur-sm",
        className
      )}
    >
      {children}
    </div>
  );
};

export default RevealOnScroll;