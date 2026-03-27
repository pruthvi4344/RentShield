"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

type FeatureAccent = "teal" | "violet" | "rose" | "cyan" | "amber" | "emerald";

type FeatureItem = {
  icon: ReactNode;
  title: string;
  description: string;
  accent: FeatureAccent;
  badge: string;
};

type AccentStyle = {
  bg: string;
  icon: string;
  badge: string;
  border: string;
  glow: string;
  ring: string;
};

type FeatureCardProps = {
  feature: FeatureItem;
  index: number;
  visible: boolean;
};

const features: FeatureItem[] = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Persona-Verified Landlords",
    description: "Landlords complete identity verification through Persona before they can build trust on the platform. This helps renters know who they are dealing with.",
    accent: "teal",
    badge: "Core",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" />
      </svg>
    ),
    title: "Phone-Verified Renters",
    description: "Renters verify their phone number to unlock protected access, communicate inside RentShield, and build a more trusted profile.",
    accent: "violet",
    badge: "Core",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
    title: "Structured Property Listings",
    description: "Listings include validated rent, address details, amenities, availability, photos, and videos so renters can compare properties with better clarity.",
    accent: "rose",
    badge: "Quality",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: "Secure In-App Messaging",
    description: "Renters and landlords can connect inside RentShield without sharing personal details too early, keeping conversations organized in one place.",
    accent: "cyan",
    badge: "Communication",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    title: "Roommate Matching",
    description: "Renters can publish roommate profiles, browse verified public profiles, send requests, and connect only after acceptance.",
    accent: "amber",
    badge: "Community",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    title: "Map & Verified Search",
    description: "Renters can explore active listings through filtered search and map view, using accurate property locations and verified listing details.",
    accent: "emerald",
    badge: "Discovery",
  },
];

const accentMap: Record<FeatureAccent, AccentStyle> = {
  teal: { bg: "bg-teal-50", icon: "text-teal-600", badge: "bg-teal-100 text-teal-700", border: "border-teal-100", glow: "rgba(20,184,166,0.15)", ring: "rgba(20,184,166,0.3)" },
  violet: { bg: "bg-violet-50", icon: "text-violet-600", badge: "bg-violet-100 text-violet-700", border: "border-violet-100", glow: "rgba(139,92,246,0.15)", ring: "rgba(139,92,246,0.3)" },
  rose: { bg: "bg-rose-50", icon: "text-rose-600", badge: "bg-rose-100 text-rose-700", border: "border-rose-100", glow: "rgba(244,63,94,0.15)", ring: "rgba(244,63,94,0.3)" },
  cyan: { bg: "bg-cyan-50", icon: "text-cyan-600", badge: "bg-cyan-100 text-cyan-700", border: "border-cyan-100", glow: "rgba(6,182,212,0.15)", ring: "rgba(6,182,212,0.3)" },
  amber: { bg: "bg-amber-50", icon: "text-amber-600", badge: "bg-amber-100 text-amber-700", border: "border-amber-100", glow: "rgba(245,158,11,0.15)", ring: "rgba(245,158,11,0.3)" },
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", badge: "bg-emerald-100 text-emerald-700", border: "border-emerald-100", glow: "rgba(16,185,129,0.15)", ring: "rgba(16,185,129,0.3)" },
};

const origins = [
  "translateY(40px) scale(0.94)",
  "translateY(40px) scale(0.94)",
  "translateY(40px) scale(0.94)",
  "translateY(40px) scale(0.94)",
  "translateY(40px) scale(0.94)",
  "translateY(40px) scale(0.94)",
] as const;

const CARD_DELAY = 100;

function FeatureCard({ feature, index, visible }: FeatureCardProps) {
  const colors = accentMap[feature.accent];
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : origins[index],
        transition: `opacity 0.55s cubic-bezier(0.4,0,0.2,1) ${index * CARD_DELAY}ms,
                     transform 0.55s cubic-bezier(0.34,1.4,0.64,1) ${index * CARD_DELAY}ms,
                     box-shadow 0.25s ease,
                     border-color 0.25s ease`,
        boxShadow: hovered
          ? `0 12px 40px -8px ${colors.glow}, 0 0 0 1.5px ${colors.ring}`
          : "0 1px 3px rgba(0,0,0,0.06)",
      }}
      className={`group cursor-default rounded-2xl border bg-white p-6 ${colors.border}`}
    >
      <div className="mb-4 flex items-start justify-between">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors.bg} ${colors.icon}`}
          style={{
            transform: hovered ? "scale(1.12) rotate(-4deg)" : "scale(1) rotate(0deg)",
            transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          {feature.icon}
        </div>

        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${colors.badge}`}
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(-8px)",
            transition: `opacity 0.4s ease ${index * CARD_DELAY + 200}ms,
                         transform 0.4s ease ${index * CARD_DELAY + 200}ms`,
          }}
        >
          {feature.badge}
        </span>
      </div>

      <h3
        className="mb-2 text-lg font-bold text-slate-900"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(6px)",
          transition: `opacity 0.4s ease ${index * CARD_DELAY + 150}ms,
                       transform 0.4s ease ${index * CARD_DELAY + 150}ms`,
        }}
      >
        {feature.title}
      </h3>

      <p
        className="text-sm leading-relaxed text-slate-500"
        style={{
          opacity: visible ? 1 : 0,
          transition: `opacity 0.4s ease ${index * CARD_DELAY + 250}ms`,
        }}
      >
        {feature.description}
      </p>

      <div
        className="mt-4 h-0.5 rounded-full"
        style={{
          background: `linear-gradient(90deg, ${colors.ring}, transparent)`,
          transform: hovered ? "scaleX(1)" : "scaleX(0)",
          transformOrigin: "left",
          transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
        }}
      />
    </div>
  );
}

export default function Features() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [triggered, setTriggered] = useState(false);
  const [visibleCards, setVisibleCards] = useState<boolean[]>(new Array(features.length).fill(false));

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered) {
          setTriggered(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = sectionRef.current;
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [triggered]);

  useEffect(() => {
    if (!triggered) {
      return;
    }

    const timers = features.map((_, index) =>
      window.setTimeout(() => {
        setVisibleCards((previous) => {
          const next = [...previous];
          next[index] = true;
          return next;
        });
      }, index * CARD_DELAY)
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [triggered]);

  return (
    <section ref={sectionRef} className="overflow-hidden bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="mb-16 text-center"
          style={{
            opacity: triggered ? 1 : 0,
            transform: triggered ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          <span className="mb-3 inline-block text-sm font-semibold uppercase tracking-widest text-teal-600">
            Platform Features
          </span>
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Everything You Need to Rent Safely
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-500">
            Built around verified identity, safer communication, and structured rental discovery for renters and landlords.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} visible={visibleCards[index]} />
          ))}
        </div>
      </div>
    </section>
  );
}
