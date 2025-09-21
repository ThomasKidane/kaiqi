"use client";

import { motion, useAnimationControls } from "framer-motion";
import { useEffect } from "react";

export const AnalysisSplit = () => {
  const scan = useAnimationControls();
  const pieces = useAnimationControls();
  const textData = useAnimationControls();
  const scanLine = useAnimationControls();
  const scanGlow = useAnimationControls();
  const documentContent = useAnimationControls();

  // Sample data for each piece
  const pieceData = [
    {
      title: "Vendor",
      data: "Sample Vendor LLC",
      color: "#2ecc71"
    },
    {
      title: "Amount",
      data: "$XXX.XX",
      color: "#f39c12"
    },
    {
      title: "Date",
      data: "YYYY-MM-DD",
      color: "#3498db"
    },
    {
      title: "Invoice",
      data: "INV-XXXXX",
      color: "#9b59b6"
    }
  ];

  useEffect(() => {
    const run = async () => {
      while (true) {
        // Reset all animations
        await pieces.start({ x: 0, y: 0, opacity: 0, transition: { duration: 0 } });
        await textData.start({ opacity: 0, transition: { duration: 0 } });
        await scan.start({ y: 0, opacity: 0, transition: { duration: 0 } });
        await scanLine.start({ y: 0, opacity: 0, transition: { duration: 0 } });
        await scanGlow.start({ opacity: 0, transition: { duration: 0 } });
        await documentContent.start({ opacity: 1, transition: { duration: 0 } });
        
        // Phase 1: Initial scan line appears
        await scanLine.start({ opacity: 1, transition: { duration: 0.3 } });
        
        // Phase 2: Scan line moves down the document
        await scanLine.start({ y: 200, transition: { duration: 2.5, ease: "easeInOut" } });
        
        // Phase 3: Scan glow effect follows
        await scanGlow.start({ opacity: 1, transition: { duration: 0.2 } });
        await scanGlow.start({ y: 200, transition: { duration: 2.3, ease: "easeInOut" } });
        
        // Phase 4: Document content fades as it's being processed
        await documentContent.start({ opacity: 0.3, transition: { duration: 0.5 } });
        
        // Phase 5: Split pieces with enhanced animation
        await pieces.start(i => ({
          opacity: 1,
          x: ((i % 2) === 0 ? -1 : 1) * (20 + i * 3),
          y: (i < 2 ? -1 : 1) * (15 + i * 3),
          transition: { duration: 1.2, ease: "easeOut" }
        }));
        
        // Phase 6: Show extracted data
        await new Promise(r => setTimeout(r, 300));
        await textData.start({ opacity: 1, transition: { duration: 0.7, ease: "easeOut" } });
        
        // Phase 7: Fade out scanning effects
        await scanLine.start({ opacity: 0, transition: { duration: 0.4 } });
        await scanGlow.start({ opacity: 0, transition: { duration: 0.4 } });
        
        // Phase 8: Pause to show results
        await new Promise(r => setTimeout(r, 1200));
      }
    };
    run();
  }, [scan, pieces, textData, scanLine, scanGlow, documentContent]);

  return (
    <section className="container py-24">
      <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-12 md:grid-cols-2">
        <div className="order-2 md:order-1">
          <p className="text-caption uppercase tracking-widest text-primary">Kaiqi • Analysis</p>
          <h2 className="mt-3 text-5xl font-light leading-tight text-white drop-shadow-md">Document analysis and structured extraction</h2>
          <p className="mt-5 text-body-lg text-muted-foreground">
            We scan, segment, and extract critical fields—amounts, dates, vendors, due dates—ready for queries and dashboards.
          </p>
        </div>

        {/* Animation */}
        <div className="order-1 md:order-2">
          <div className="relative mx-auto aspect-[4/3] w-full max-w-md">
            <svg viewBox="0 0 320 240" className="h-full w-full">
              {/* Background frame (negative space) */}
              <rect x="0" y="0" width="320" height="240" fill="none" />

              {/* Document sheet */}
              <defs>
                <linearGradient id="docShade" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff"/>
                  <stop offset="100%" stopColor="#f6f6f6"/>
                </linearGradient>
                <linearGradient id="scanGlow" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.8"/>
                  <stop offset="50%" stopColor="#00d4ff" stopOpacity="0.4"/>
                  <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.1"/>
                </linearGradient>
                <linearGradient id="scanLine" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.9"/>
                  <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.3"/>
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Paper */}
              <rect x="60" y="20" rx="8" ry="8" width="200" height="200" fill="url(#docShade)" stroke="#e5e5e5" />

              {/* Document content - realistic invoice content */}
              <motion.g animate={documentContent}>
                {/* Header */}
                <text x="80" y="45" fontSize="12" fontWeight="700" fill="#2c3e50">INVOICE</text>
                <text x="80" y="60" fontSize="8" fill="#7f8c8d">Invoice #: INV-00927</text>
                <text x="80" y="72" fontSize="8" fill="#7f8c8d">Date: 2025-08-14</text>
                
                {/* Vendor info */}
                <text x="80" y="90" fontSize="9" fontWeight="600" fill="#2c3e50">From:</text>
                <text x="80" y="102" fontSize="8" fill="#34495e">Acme Supplies LLC</text>
                <text x="80" y="114" fontSize="8" fill="#34495e">123 Business St</text>
                <text x="80" y="126" fontSize="8" fill="#34495e">San Francisco, CA 94105</text>
                
                {/* Items table */}
                <rect x="80" y="140" width="160" height="1" fill="#bdc3c7"/>
                <text x="80" y="155" fontSize="8" fontWeight="600" fill="#2c3e50">Description</text>
                <text x="200" y="155" fontSize="8" fontWeight="600" fill="#2c3e50">Amount</text>
                <text x="80" y="170" fontSize="8" fill="#34495e">Office Supplies</text>
                <text x="200" y="170" fontSize="8" fill="#34495e">$1,240.00</text>
                <text x="80" y="185" fontSize="8" fill="#34495e">Tax</text>
                <text x="200" y="185" fontSize="8" fill="#34495e">$102.40</text>
                <rect x="80" y="195" width="160" height="1" fill="#bdc3c7"/>
                <text x="80" y="210" fontSize="9" fontWeight="700" fill="#2c3e50">Total</text>
                <text x="200" y="210" fontSize="9" fontWeight="700" fill="#2c3e50">$1,342.40</text>
              </motion.g>

              {/* Enhanced scan line */}
              <motion.rect
                animate={scanLine}
                x="60"
                y="0"
                width="200"
                height="2"
                fill="url(#scanLine)"
                opacity={0}
                filter="url(#glow)"
              />

              {/* Scan glow effect */}
              <motion.rect
                animate={scanGlow}
                x="60"
                y="0"
                width="200"
                height="30"
                fill="url(#scanGlow)"
                opacity={0}
                rx="4"
              />


              {/* Split pieces overlay (simulate segments lifting off) */}
              {[0,1,2,3].map((i) => (
                <motion.g key={i} custom={i} animate={pieces}>
                  <motion.rect
                    x={60 + (i%2)*100}
                    y={20 + (i<2? 0 : 100)}
                    width="100"
                    height="100"
                    rx="8"
                    fill="#ffffff"
                    stroke="#ffd400"
                    strokeWidth="2"
                    opacity={0}
                  />
                  {/* Enhanced text data for each piece */}
                  <motion.g animate={textData} opacity={0}>
                    {/* Background with shadow effect */}
                    <rect
                      x={65 + (i%2)*100}
                      y={35 + (i<2? 0 : 100)}
                      width="90"
                      height="75"
                      rx="6"
                      fill="rgba(255,255,255,0.95)"
                      stroke={pieceData[i].color}
                      strokeWidth="2"
                      filter="drop-shadow(0 4px 8px rgba(0,0,0,0.1))"
                    />
                    {/* Colored header bar */}
                    <rect
                      x={65 + (i%2)*100}
                      y={35 + (i<2? 0 : 100)}
                      width="90"
                      height="20"
                      rx="6"
                      fill={pieceData[i].color}
                      fillOpacity="0.1"
                    />
                    {/* Title */}
                    <text
                      x={110 + (i%2)*100}
                      y={50 + (i<2? 0 : 100)}
                      textAnchor="middle"
                      fontSize="7"
                      fontWeight="700"
                      fill={pieceData[i].color}
                      style={{ textTransform: 'uppercase' }}
                    >
                      {pieceData[i].title}
                    </text>
                    {/* Data */}
                    <text
                      x={110 + (i%2)*100}
                      y={75 + (i<2? 0 : 100)}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="800"
                      fill="#2c3e50"
                    >
                      {pieceData[i].data}
                    </text>
                    {/* Status indicator */}
                    <circle
                      cx={110 + (i%2)*100}
                      cy={95 + (i<2? 0 : 100)}
                      r="4"
                      fill={pieceData[i].color}
                    />
                    <circle
                      cx={110 + (i%2)*100}
                      cy={95 + (i<2? 0 : 100)}
                      r="2"
                      fill="white"
                    />
                  </motion.g>
                </motion.g>
              ))}

              {/* Yellow accents (two-color discipline) */}
              <circle cx="260" cy="40" r="6" fill="#ffd400" />
              <circle cx="52" cy="200" r="4" fill="#ffd400" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AnalysisSplit;