import React from 'react';
import Link from 'next/link';

const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-lg">
          Welcome to Kaiqi
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto drop-shadow-md">
          Experience the future of document processing with our cutting-edge AI platform
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/demo">
            <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg text-lg font-semibold transition-colors shadow-lg">
              Try Demo
            </button>
          </Link>
          <button className="border border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-3 rounded-lg text-lg font-semibold transition-colors">
            Learn More
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;