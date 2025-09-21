import Link from 'next/link';
import Image from 'next/image';

// The original logo is a complex SVG. As per guidelines, this text-based
// placeholder is a safe and accessible replacement.
const TerminalLogo = () => (
  <Link href="/" className="inline-block text-2xl font-bold tracking-tight text-foreground">
    Kaiqi
  </Link>
);

const Footer = () => {
    // Content adaptation to finance document organization
    const ctaText = "Ready to organize your finance documents of the future?";

    const technologyLinks = [
        { href: "/", label: "Homepage" },
        { href: "/system", label: "System" },
    ];

    const companyLinks = [
        { href: "/about", label: "About" },
        { href: "/press", label: "Press" },
        { href: "/careers", label: "Careers" },
        { href: "/contact", label: "Contact" },
    ];

    return (
        <footer className="border-t border-border bg-background pt-[120px] pb-10">
            <div className="container">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-x-8 gap-y-12 mb-20">
                    <div className="lg:col-span-3">
                        <TerminalLogo />
                    </div>

                    <div className="lg:col-span-5 grid grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-sm font-medium tracking-wider uppercase text-text-secondary">Technology</h3>
                            <ul className="mt-6 space-y-4">
                                {technologyLinks.map((link) => (
                                    <li key={link.href}>
                                        <Link href={link.href} className="text-base text-foreground hover:text-accent transition-colors">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium tracking-wider uppercase text-text-secondary">Company</h3>
                            <ul className="mt-6 space-y-4">
                                {companyLinks.map((link) => (
                                    <li key={link.href}>
                                        <Link href={link.href} className="text-base text-foreground hover:text-accent transition-colors">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="lg:col-span-4">
                         <h3 className="text-sm font-medium tracking-wider uppercase text-text-secondary">REACH US</h3>
                         <Link href="/contact" className="mt-6 block group">
                            <p className="text-4xl font-medium text-foreground leading-tight group-hover:text-accent transition-colors">
                                {ctaText}
                            </p>
                         </Link>
                         <p className="mt-4 text-base text-text-secondary">Connect with our experts today.</p>
                    </div>
                </div>

                <div className="border-t border-border pt-8 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-6">
                    <p className="text-sm text-muted-foreground text-center sm:text-left">Copyright Kaiqi © 2025 All Rights Reserved</p>
                    <div className="flex items-center justify-center">
                        <a 
                            href="https://www.linkedin.com/" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Image
                                src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/37f43346-3716-43c8-b720-aa9f901e52d7-terminal-industries-com/assets/svgs/linkedin-8.svg?"
                                alt="LinkedIn"
                                width={16}
                                height={16}
                                className="opacity-70 group-hover:opacity-100 transition-opacity"
                            />
                            LinkedIn
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;