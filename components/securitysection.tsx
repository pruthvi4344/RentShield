"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

type TrustPoint = {
  icon: ReactNode;
  title: string;
  description: string;
};

type StatItem = {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  sub: string;
  color: string;
  unit?: string;
};

type Testimonial = {
  quote: string;
  name: string;
  detail: string;
  initials: string;
  color: string;
};

type StatCounterProps = {
  stat: StatItem;
  triggered: boolean;
  delay: number;
};

type TrustCardProps = {
  point: TrustPoint;
  index: number;
  visible: boolean;
};

type TestimonialCardProps = {
  t: Testimonial;
  index: number;
  visible: boolean;
};

const trustPoints: TrustPoint[] = [
  {
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    ),
    title: "Identity Verification",
    description: "Every user is verified via government-issued ID before gaining full access to listings or roommate profiles.",
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    title: "Ownership Proof",
    description: "Landlords submit legal ownership documents. Our team manually reviews and approves each listing before it becomes visible.",
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    title: "Scam Detection",
    description: "Our AI flags suspicious listing patterns: too-good-to-be-true pricing, duplicate photos, and known fraud profiles are blocked automatically.",
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: "Report and Review",
    description: "Users can report suspicious activity instantly. Our trust and safety team responds within 24 hours, and accounts are suspended if issues are confirmed.",
  },
];

const stats: StatItem[] = [
  { value: 98, suffix: "%", label: "Fraud-Free Rate", sub: "across all listings", color: "text-teal-400" },
  { value: 24, prefix: "< ", label: "Response Time", sub: "for reported issues", color: "text-teal-400", unit: "h" },
  { value: 100, suffix: "%", label: "Manual Review", sub: "of new listings", color: "text-teal-400" },
  { value: 0, suffix: "", label: "Fake Landlords", sub: "allowed on platform", color: "text-teal-400" },
];

const testimonials: Testimonial[] = [
  {
    quote: "As an international student arriving in Toronto with no Canadian credit history, I was terrified of scams. RentShield found me a verified landlord in 3 days.",
    name: "Yuna K.",
    detail: "Masters student, UofT",
    initials: "YK",
    color: "from-violet-400 to-purple-500",
  },
  {
    quote: "I moved from Nigeria with my family. Every platform felt unsafe until I tried RentShield. The verification process gave me total peace of mind.",
    name: "Emeka O.",
    detail: "New immigrant, Ottawa",
    initials: "EO",
    color: "from-teal-400 to-cyan-500",
  },
];

function useCounter(target: number, triggered: boolean, duration = 1800, delay = 0) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!triggered) {
      return;
    }

    const startAfter = window.setTimeout(() => {
      startRef.current = null;

      const animate = (timestamp: number) => {
        if (startRef.current === null) {
          startRef.current = timestamp;
        }

        const progress = Math.min((timestamp - startRef.current) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(eased * target));

        if (progress < 1) {
          rafRef.current = window.requestAnimationFrame(animate);
        }
      };

      rafRef.current = window.requestAnimationFrame(animate);
    }, delay);

    return () => {
      window.clearTimeout(startAfter);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [triggered, target, duration, delay]);

  return count;
}

function StatCounter({ stat, triggered, delay }: StatCounterProps) {
  const count = useCounter(stat.value, triggered, 1800, delay);

  return (
    <div
      style={{
        opacity: triggered ? 1 : 0,
        transform: triggered ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      }}
    >
      <p className={`mb-1 text-4xl font-extrabold ${stat.color}`}>
        {stat.prefix || ""}
        {count}
        {stat.unit || ""}
        {stat.suffix || ""}
      </p>
      <p className="text-sm font-semibold text-white">{stat.label}</p>
      <p className="mt-0.5 text-xs text-slate-400">{stat.sub}</p>
    </div>
  );
}

function useInView<T extends HTMLElement>(threshold = 0.2): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold }
    );

    const element = ref.current;
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView];
}

export default function SecuritySection() {
  const [headerRef, headerVisible] = useInView<HTMLDivElement>(0.3);
  const [pointsRef, pointsVisible] = useInView<HTMLDivElement>(0.15);
  const [statsRef, statsVisible] = useInView<HTMLDivElement>(0.3);
  const [testimonialsRef, testimonialsVisible] = useInView<HTMLDivElement>(0.2);

  return (
    <section className="overflow-hidden bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          ref={headerRef}
          className="mb-16 text-center"
          style={{
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          <div
            className="mb-4 inline-flex items-center justify-center"
            style={{
              opacity: headerVisible ? 1 : 0,
              transform: headerVisible ? "scale(1) rotate(0deg)" : "scale(0.5) rotate(-20deg)",
              transition: "opacity 0.5s ease 0.1s, transform 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.1s",
            }}
          >
            <div className="relative">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              {headerVisible ? <span className="absolute inset-0 animate-ping rounded-2xl bg-rose-200 opacity-50" /> : null}
            </div>
          </div>

          <span className="mb-3 inline-block text-sm font-semibold uppercase tracking-widest text-rose-500">
            Trust and Safety
          </span>
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            We Take Rental Fraud Seriously
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-500">
            International students and newcomers are disproportionately targeted by rental scams. RentShield was built specifically to change that.
          </p>
        </div>

        <div ref={pointsRef} className="mb-20 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {trustPoints.map((point, index) => (
            <TrustCard key={point.title} point={point} index={index} visible={pointsVisible} />
          ))}
        </div>

        <div
          ref={statsRef}
          className="relative mb-16 overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 to-teal-900 p-8 sm:p-10"
          style={{
            opacity: statsVisible ? 1 : 0,
            transform: statsVisible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.98)",
            transition: "opacity 0.6s ease, transform 0.6s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-teal-500 opacity-10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-teal-300 opacity-10 blur-3xl" />

          <div className="relative z-10 grid grid-cols-2 gap-8 text-center lg:grid-cols-4">
            {stats.map((stat, index) => (
              <StatCounter key={stat.label} stat={stat} triggered={statsVisible} delay={index * 150} />
            ))}
          </div>
        </div>

        <div ref={testimonialsRef} className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={testimonial.name} t={testimonial} index={index} visible={testimonialsVisible} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustCard({ point, index, visible }: TrustCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="group cursor-default text-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(36px) scale(0.93)",
        transition: `opacity 0.55s cubic-bezier(0.4,0,0.2,1) ${index * 120}ms,
                     transform 0.55s cubic-bezier(0.34,1.4,0.64,1) ${index * 120}ms`,
      }}
    >
      <div className="relative mb-4 inline-flex">
        <div
          className="absolute inset-0 rounded-2xl bg-teal-400 blur-md"
          style={{
            opacity: hovered ? 0.3 : 0,
            transform: hovered ? "scale(1.2)" : "scale(1)",
            transition: "opacity 0.3s ease, transform 0.3s ease",
          }}
        />
        <div
          className="relative flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{
            background: hovered ? "#14b8a6" : "#0f172a",
            color: hovered ? "#ffffff" : "#2dd4bf",
            transform: hovered ? "scale(1.1) rotate(-6deg)" : "scale(1) rotate(0deg)",
            transition: "background 0.3s ease, color 0.3s ease, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
            boxShadow: hovered ? "0 12px 28px rgba(20,184,166,0.35)" : "none",
          }}
        >
          {point.icon}
        </div>
      </div>

      <div
        className="mb-3 inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-600"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1)" : "scale(0)",
          transition: `opacity 0.3s ease ${index * 120 + 250}ms, transform 0.35s cubic-bezier(0.34,1.56,0.64,1) ${index * 120 + 250}ms`,
        }}
      >
        {index + 1}
      </div>

      <h3
        className="mb-2 font-bold text-slate-900"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(8px)",
          transition: `opacity 0.4s ease ${index * 120 + 150}ms, transform 0.4s ease ${index * 120 + 150}ms`,
        }}
      >
        {point.title}
      </h3>
      <p
        className="text-sm leading-relaxed text-slate-500"
        style={{
          opacity: visible ? 1 : 0,
          transition: `opacity 0.4s ease ${index * 120 + 220}ms`,
        }}
      >
        {point.description}
      </p>

      <div
        className="mx-auto mt-3 h-0.5 rounded-full bg-teal-400"
        style={{
          width: hovered ? "40px" : "0px",
          transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      />
    </div>
  );
}

function TestimonialCard({ t, index, visible }: TestimonialCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translateY(0) scale(1)"
          : index === 0
            ? "translateX(-30px) scale(0.97)"
            : "translateX(30px) scale(0.97)",
        transition: `opacity 0.6s ease ${index * 150}ms, transform 0.6s cubic-bezier(0.34,1.2,0.64,1) ${index * 150}ms,
                     box-shadow 0.25s ease, border-color 0.25s ease`,
        boxShadow: hovered
          ? "0 16px 40px -8px rgba(20,184,166,0.15), 0 0 0 1.5px rgba(20,184,166,0.25)"
          : "0 1px 3px rgba(0,0,0,0.06)",
      }}
      className="cursor-default rounded-2xl border border-slate-100 bg-slate-50 p-6"
    >
      <svg
        className="mb-4 h-8 w-8 text-teal-300"
        fill="currentColor"
        viewBox="0 0 24 24"
        style={{
          transform: hovered ? "translateY(-3px)" : "translateY(0)",
          transition: "transform 0.3s ease",
        }}
      >
        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
      </svg>

      <p className="mb-5 text-sm italic leading-relaxed text-slate-700">&ldquo;{t.quote}&rdquo;</p>

      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${t.color} text-sm font-bold text-white`}
          style={{
            transform: hovered ? "scale(1.1) rotate(-5deg)" : "scale(1) rotate(0deg)",
            transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          {t.initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{t.name}</p>
          <p className="text-xs text-slate-500">{t.detail}</p>
        </div>
      </div>
    </div>
  );
}
