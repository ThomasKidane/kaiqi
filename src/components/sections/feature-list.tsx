"use client";

import { useState, useRef, useEffect } from 'react';

const ROCKET_FEATURES = [
    "Autonomous launch sequences",
    "Mission control visibility",
    "AI-powered rocket systems",
    "Configurable launch platforms",
    "Integrated spacecraft systems",
    "Data-rich predictive analytics",
];

const FeatureList = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const listRef = useRef<HTMLUListElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            if (!listRef.current) return;
            
            const listTop = listRef.current.getBoundingClientRect().top + window.scrollY;
            const scrollY = window.scrollY;
            const vh = window.innerHeight;

            const scrollDistance = scrollY - listTop + vh / 2;
            let newIndex = Math.floor(scrollDistance / vh);
            newIndex = Math.max(0, Math.min(newIndex, ROCKET_FEATURES.length - 1));
            
            setActiveIndex(newIndex);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Initial check on load

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <section className="relative bg-secondary py-[120px]">
            <div className="container mx-auto px-10">
                <div className="grid grid-cols-1 lg:grid-cols-5 lg:gap-6">
                    <div className="h-[50vh] flex items-center justify-center lg:h-screen lg:col-span-2 lg:sticky top-0 lg:-mt-[120px]">
                        <div className="flex items-start font-light text-[#cccccc]" style={{ fontSize: 'clamp(100px, 15vw, 200px)', lineHeight: 1 }}>
                            <span>0</span>
                            <div className="h-[1em] overflow-hidden">
                                <div
                                    className="flex flex-col transition-transform duration-1000 ease-[cubic-bezier(0.86,0,0.07,1)]"
                                    style={{ transform: `translateY(-${activeIndex}em)` }}
                                >
                                    {ROCKET_FEATURES.map((_, index) => (
                                        <span key={index} className="h-[1em] flex items-center">{index + 1}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-3">
                        <ul ref={listRef}>
                            {ROCKET_FEATURES.map((feature, index) => (
                                <li
                                    key={index}
                                    className="h-screen flex items-center"
                                >
                                    <div className={`flex items-start text-3xl lg:text-4xl font-light leading-tight transition-colors duration-500 ${activeIndex === index ? 'text-foreground' : 'text-[#cccccc]'}`}>
                                        <span className={`mr-4 text-4xl transition-colors duration-500 ${activeIndex === index ? 'text-accent' : 'text-[#cccccc]'}`}>•</span>
                                        <p>{feature}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FeatureList;