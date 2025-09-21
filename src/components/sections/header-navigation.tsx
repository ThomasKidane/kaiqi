"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/demo", label: "Demo" },
  { href: "/system", label: "System" },
  { href: "/about", label: "About" },
  { href: "/press", label: "Press" },
  { href: "/careers", label: "Careers" },
  { href: "/contact", label: "Contact" },
];

const TerminalLogo = () => (
  <Link href="/" className="flex shrink-0 items-center gap-2.5">
    {/* Placeholder for the SVG logo, visually similar to the screenshot */}
    <div className="flex h-[20px] w-[20px] items-center justify-center rounded-[4px] bg-primary">
      <div className="h-2.5 w-2.5 border-l-2 border-t-2 border-primary-foreground"></div>
    </div>
    <span className="text-base font-medium tracking-[-0.01em] text-white">Kaiqi</span>
  </Link>
);

const HeaderNavigation = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'py-2' : 'py-4'}`}>
      <div className="container">
        <div className={`flex items-center justify-between rounded-full bg-black/80 px-2 py-1.5 shadow-sm backdrop-blur-lg border border-primary/30 transition-all duration-300`}>
          <TerminalLogo />
          
          <nav className="hidden md:flex">
            <ul className="flex items-center">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors hover:text-white ${
                      pathname === link.href ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
              className="p-3 text-white"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden pt-3">
          <div className="container">
            <nav className="rounded-2xl border border-border bg-background/95 p-4 backdrop-blur-xl">
              <ul className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block w-full rounded-md p-3 text-left text-base font-medium transition-colors hover:bg-muted ${
                      pathname === link.href ? "text-primary" : "text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default HeaderNavigation;