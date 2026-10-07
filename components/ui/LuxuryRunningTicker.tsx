"use client";

import React from "react";
import { cx } from "@/lib/utils";

interface LuxuryRunningTickerProps {
  className?: string;
  variant?: "dark" | "gold" | "subtle";
  speed?: "normal" | "slow" | "fast";
  items?: string[];
}

const DEFAULT_TICKER_ITEMS = [
  "TRUSTED BRAND ALL OVER KARACHI",
  "BESPOKE LIVING SPACES",
  "FAST CUSTOMER SUPPORT",
  "ARCHITECTURAL PRECISION & PREMIUM MATERIALS",
  "DHA · CLIFTON · BAHRIA TOWN",
];

export default function LuxuryRunningTicker({
  className = "",
  variant = "dark",
  items = DEFAULT_TICKER_ITEMS,
}: LuxuryRunningTickerProps) {
  // Replicate array items multiple times for an unbroken, seamless continuous loop
  const tickerItems = [...items, ...items, ...items];

  const variantStyles = {
    dark: "bg-[#11100E] border-y border-[#C5A880]/30 text-[#EAE6DF]",
    gold: "bg-[#161412] border-y border-[#C5A880]/40 text-[#C5A880]",
    subtle: "bg-surface/80 border-y border-line text-charcoal",
  }[variant];

  return (
    <div
      role="region"
      aria-label="Studio Highlights Ticker"
      className={cx(
        "group relative w-full overflow-hidden py-3 sm:py-3.5 select-none transition-colors",
        variantStyles,
        className
      )}
      style={{
        maskImage:
          "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)",
      }}
    >
      {/* 60fps GPU Hardware-Accelerated Train Track */}
      <div
        className="flex w-max will-change-transform transform-gpu animate-[hi-marquee-train_38s_linear_infinite] group-hover:[animation-play-state:paused] group-active:[animation-play-state:paused]"
        style={{
          transform: "translate3d(0, 0, 0)",
          backfaceVisibility: "hidden",
        }}
      >
        {tickerItems.map((item, idx) => (
          <div
            key={idx}
            className="flex shrink-0 items-center gap-6 px-6 font-serif text-[11px] sm:text-[13px] font-medium tracking-[0.28em] uppercase"
          >
            <span className="text-champagne/90 drop-shadow-[0_0_8px_rgba(197,168,128,0.35)]">
              ✦
            </span>
            <span className="transition-colors group-hover:text-champagne">
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
