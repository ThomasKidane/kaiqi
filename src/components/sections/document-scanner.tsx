"use client";

import React, { useEffect, useState } from "react";
// import { cn } from "@/lib/utils"; // Commented out as utils not available

// Simple fallback if cn isn't available
// Remove if your project already provides cn
function _cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export const DocumentScannerSection: React.FC = () => {
  const [scanning, setScanning] = useState(true);
  const [cycle, setCycle] = useState(0);
  const [extractedData, setExtractedData] = useState<boolean[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      // restart scan every 3.5s
      setScanning(false);
      setExtractedData([]); // Reset extracted data
      setTimeout(() => {
        setCycle((c) => c + 1);
        setScanning(true);
        
        // Animate data extraction with staggered timing
        const dataItems = [
          { label: "Date", value: "Processing..." },
          { label: "Vendor", value: "Extracting..." },
          { label: "Amount", value: "Analyzing..." },
          { label: "Due Date", value: "Scanning..." },
          { label: "Beneficiary", value: "Parsing..." },
          { label: "Status", value: "Processing..." },
        ];
        
        // Show each data item with a delay
        dataItems.forEach((_, index) => {
          setTimeout(() => {
            setExtractedData(prev => {
              const newData = [...prev];
              newData[index] = true;
              return newData;
            });
          }, 1000 + (index * 200)); // Start after 1s, then every 200ms
        });
      }, 200);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative py-28 bg-section-divider/40">
      <div className="container">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <p className="text-caption tracking-[0.3em] text-primary uppercase">How it works</p>
            <h2 className="mt-2 text-3xl md:text-5xl font-light -tracking-[0.02em] text-white drop-shadow-md">
              AI scanner extracts key fields from your documents
            </h2>
            <p className="mt-4 text-muted-foreground text-body-lg">
              Upload receipts, invoices, and statements. We detect dates, amounts, vendors, due dates, and more.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Scanner Preview */}
            <div className="relative rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              {/* Document sheet */}
              <div className="relative m-6 rounded-xl bg-white border border-border shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-6">
                {/* Sample receipt content */}
                <div className="space-y-2 text-sm text-zinc-700">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-zinc-900">Sample Vendor</span>
                    <span className="text-zinc-500">INV-XXXXX</span>
                  </div>
                  <div className="h-px bg-zinc-200 my-2" />
                  <div className="flex items-center justify-between">
                    <span>Date</span>
                    <span>YYYY-MM-DD</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Vendor</span>
                    <span>Sample Vendor LLC</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span>$XXX.XX</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tax</span>
                    <span>$XX.XX</span>
                  </div>
                  <div className="flex items-center justify-between font-medium">
                    <span>Total</span>
                    <span>$XXX.XX</span>
                  </div>
                </div>

                {/* Enhanced Scanning line */}
                <div
                  key={cycle}
                  className={_cn(
                    "pointer-events-none absolute left-0 right-0 h-12 bg-gradient-to-b from-primary/0 via-primary/40 to-primary/0",
                    scanning && "animate-scan"
                  )}
                  style={{ top: 0 }}
                />

                {/* Scan glow edges */}
                <div className="pointer-events-none absolute inset-x-6 top-6 h-1 bg-primary/50 blur-[2px]" />
                <div className="pointer-events-none absolute inset-x-6 bottom-6 h-1 bg-primary/50 blur-[2px]" />
                
                {/* Data extraction indicators */}
                {scanning && (
                  <div className="pointer-events-none absolute inset-0">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="absolute w-2 h-2 bg-primary rounded-full opacity-0 animate-pulse"
                        style={{
                          left: `${20 + (i * 12)}%`,
                          top: `${30 + (i * 8)}%`,
                          animationDelay: `${1000 + (i * 200)}ms`,
                          animationDuration: '0.5s'
                        }}
                      />
                    ))}
                  </div>
                )}

                <style>{`
                  @keyframes scanMove {
                    0% { transform: translateY(-8px); opacity: 0.3; }
                    10% { opacity: 0.8; }
                    90% { opacity: 0.8; }
                    100% { transform: translateY(calc(100% - 8px)); opacity: 0.3; }
                  }
                  .animate-scan { animation: scanMove 2.5s ease-in-out forwards; }
                  
                  @keyframes pulse {
                    0%, 100% { opacity: 0; transform: scale(0.8); }
                    50% { opacity: 1; transform: scale(1.2); }
                  }
                  .animate-pulse { animation: pulse 0.5s ease-in-out forwards; }
                `}</style>
              </div>
            </div>

            {/* Extracted Fields */}
            <div className="relative rounded-2xl border border-border bg-card shadow-sm p-8 flex flex-col justify-center">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Date", value: "2025-08-14", color: "bg-blue-500" },
                  { label: "Vendor", value: "Acme Supplies LLC", color: "bg-green-500" },
                  { label: "Amount", value: "$1,342.40", color: "bg-yellow-500" },
                  { label: "Due Date", value: "2025-09-13", color: "bg-purple-500" },
                  { label: "Beneficiary", value: "Operations", color: "bg-red-500" },
                  { label: "Status", value: "Pending", color: "bg-orange-500" },
                ].map((item, idx) => (
                  <div
                    key={item.label}
                    className={_cn(
                      "rounded-xl border border-border p-4 bg-white/80 backdrop-blur transition-all duration-500 ease-out",
                      extractedData[idx] 
                        ? "opacity-100 translate-y-0 scale-100" 
                        : "opacity-0 translate-y-4 scale-95"
                    )}
                    style={{ 
                      transitionDelay: extractedData[idx] ? `${idx * 100}ms` : '0ms'
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={_cn("w-2 h-2 rounded-full", item.color)} />
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{item.label}</p>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
                <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 bg-white">
                  <span className="size-2 rounded-full bg-green-500" /> OCR
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 bg-white">
                  <span className="size-2 rounded-full bg-blue-500" /> Regex
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 bg-white">
                  <span className="size-2 rounded-full bg-purple-500" /> LLM Extraction
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DocumentScannerSection;