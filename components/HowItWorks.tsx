"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const steps = [
  {
    number: "01",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    title: "Create Your Account",
    description:
      "Sign up in minutes. Tell us if you're a renter looking for housing or a landlord listing a property.",
    color: "from-teal-400 to-teal-500",
    shadow: "shadow-teal-200",
    ring: "ring-teal-100",
  },
  {
    number: "02",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
    title: "Get Verified",
    description:
      "Landlords complete identity verification through Persona before listing properties. Renters verify their phone number to unlock trusted access and communication.",
    color: "from-violet-400 to-violet-500",
    shadow: "shadow-violet-200",
    ring: "ring-violet-100",
  },
  {
    number: "03",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
    title: "Find or List a Property",
    description:
      "Browse verified listings with real photos, accurate pricing, and landlord badges. Or post your property to reach trusted renters.",
    color: "from-amber-400 to-orange-400",
    shadow: "shadow-amber-200",
    ring: "ring-amber-100",
  },
  {
    number: "04",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    ),
    title: "Chat Securely and Rent",
    description:
      "Message landlords directly through our encrypted chat. Ask questions, schedule viewings, and finalize your rental safely in one place.",
    color: "from-cyan-400 to-teal-500",
    shadow: "shadow-cyan-200",
    ring: "ring-cyan-100",
  },
] as const;

const STEP_DELAYS = [0, 600, 1200, 1800] as const;
const LINE_START_DELAY = 300;
const LINE_DURATION = 1800;

export default function HowItWorks() {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const [triggered, setTriggered] = useState(false);
  const [lineWidth, setLineWidth] = useState(0);
  const [visibleSteps, setVisibleSteps] = useState<boolean[]>([false, false, false, false]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered) {
          setTriggered(true);
        }
      },
      { threshold: 0.25 }
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

    const timers = steps.map((_, index) =>
      window.setTimeout(() => {
        setVisibleSteps((previous) => {
          const next = [...previous];
          next[index] = true;
          return next;
        });
      }, STEP_DELAYS[index])
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [triggered]);

  useEffect(() => {
    if (!triggered) {
      return;
    }

    startRef.current = null;

    const animate = (timestamp: number) => {
      if (startRef.current === null) {
        startRef.current = timestamp;
      }

      const elapsed = timestamp - startRef.current - LINE_START_DELAY;
      if (elapsed < 0) {
        rafRef.current = window.requestAnimationFrame(animate);
        return;
      }

      const progress = Math.min((elapsed / LINE_DURATION) * 100, 100);
      setLineWidth(progress);

      if (progress < 100) {
        rafRef.current = window.requestAnimationFrame(animate);
      }
    };

    rafRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [triggered]);

  function handleGetStarted() {
    router.push("/login");
  }

  return (
    <section id="how-it-works" ref={sectionRef} className="overflow-hidden bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="mb-16 text-center transition-all duration-700"
          style={{
            opacity: triggered ? 1 : 0,
            transform: triggered ? "translateY(0)" : "translateY(24px)",
          }}
        >
          <span className="mb-3 inline-block text-sm font-semibold uppercase tracking-widest text-teal-600">
            The Process
          </span>
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Renting Made Simple and Safe
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-500">
            From sign-up to move-in, every step is designed to protect both renters and landlords from fraud.
          </p>
        </div>

        <div className="relative">
          <div
            className="absolute left-[calc(12.5%+2.5rem)] right-[calc(12.5%+2.5rem)] top-10 z-0 hidden h-0.5 bg-slate-100 transition-opacity duration-500 lg:block"
            style={{ opacity: triggered ? 1 : 0 }}
          />

          <div
            className="pointer-events-none absolute left-[calc(12.5%+2.5rem)] top-10 z-0 hidden h-0.5 lg:block"
            style={{
              width: `calc((100% - 25% - 5rem) * ${lineWidth / 100})`,
              background: "linear-gradient(90deg, #2dd4bf, #a78bfa, #fbbf24, #22d3ee)",
              boxShadow: lineWidth > 5 ? "0 0 8px 1px rgba(45,212,191,0.4)" : "none",
              transition: "box-shadow 0.3s",
            }}
          />

          {triggered && lineWidth > 0 && lineWidth < 100 ? (
            <div
              className="pointer-events-none absolute top-10 z-10 hidden lg:block"
              style={{
                left: `calc(12.5% + 2.5rem + (100% - 25% - 5rem) * ${lineWidth / 100})`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <span className="block h-3 w-3 animate-ping rounded-full bg-teal-400 shadow-lg shadow-teal-300" />
            </div>
          ) : null}

          <div className="relative z-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="group flex flex-col items-center text-center"
                style={{
                  opacity: visibleSteps[index] ? 1 : 0,
                  transform: visibleSteps[index]
                    ? "translateY(0) scale(1)"
                    : "translateY(32px) scale(0.92)",
                  transition:
                    "opacity 0.55s cubic-bezier(0.4,0,0.2,1), transform 0.55s cubic-bezier(0.34,1.56,0.64,1)",
                }}
              >
                <div className="relative mb-5">
                  <div
                    className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.color} opacity-0 blur-md`}
                    style={{
                      opacity: visibleSteps[index] ? 0.35 : 0,
                      transition: "opacity 0.6s ease",
                      transform: "scale(1.15)",
                    }}
                  />
                  <div
                    className={`relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${step.color} text-white shadow-xl ${step.shadow} ring-4 ${step.ring} transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl`}
                  >
                    {step.icon}
                  </div>
                  <span
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white shadow"
                    style={{
                      transform: visibleSteps[index] ? "scale(1) rotate(0deg)" : "scale(0) rotate(-90deg)",
                      transition: "transform 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.2s",
                    }}
                  >
                    {index + 1}
                  </span>
                </div>

                <h3
                  className="mb-2 text-lg font-bold text-slate-900"
                  style={{
                    opacity: visibleSteps[index] ? 1 : 0,
                    transition: "opacity 0.4s ease 0.25s",
                  }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-sm leading-relaxed text-slate-500"
                  style={{
                    opacity: visibleSteps[index] ? 1 : 0,
                    transition: "opacity 0.4s ease 0.35s",
                  }}
                >
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div
          className="mt-14 text-center"
          style={{
            opacity: visibleSteps[3] ? 1 : 0,
            transform: visibleSteps[3] ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.5s ease 0.4s, transform 0.5s ease 0.4s",
          }}
        >
          <button
            type="button"
            onClick={handleGetStarted}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-8 py-3.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-teal-600 hover:shadow-lg"
          >
            Get Started Free
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
