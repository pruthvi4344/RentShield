const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Verified Landlords",
    description: "Every landlord on RentShield must prove property ownership and identity before listing. No unverified landlords, ever.",
    accent: "teal",
    badge: "Core",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" />
      </svg>
    ),
    title: "Verified Tenants",
    description: "Renters verify their identity and student or residency status. Landlords can rent with confidence knowing who they're dealing with.",
    accent: "violet",
    badge: "Core",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
    title: "Fraud Prevention",
    description: "Advanced detection systems flag suspicious listings and accounts automatically. We review every new listing before it goes live.",
    accent: "rose",
    badge: "Security",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: "Secure Chat",
    description: "End-to-end encrypted messaging between renters and landlords. Negotiate, ask questions, and schedule viewings safely inside the app.",
    accent: "cyan",
    badge: "Communication",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    title: "Roommate Finder",
    description: "Looking to share rent? Browse verified roommate profiles and connect safely with people in your city or near your university.",
    accent: "amber",
    badge: "Community",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    title: "Trusted Listings",
    description: "Real photos, accurate rent, confirmed availability. Every detail of a listing is vetted. If we find any misrepresentation, we remove it.",
    accent: "emerald",
    badge: "Quality",
  },
];

const accentMap: Record<string, { bg: string; icon: string; badge: string; border: string }> = {
  teal:    { bg: "bg-teal-50",    icon: "text-teal-600",    badge: "bg-teal-100 text-teal-700",    border: "border-teal-100 hover:border-teal-300" },
  violet:  { bg: "bg-violet-50",  icon: "text-violet-600",  badge: "bg-violet-100 text-violet-700",  border: "border-violet-100 hover:border-violet-300" },
  rose:    { bg: "bg-rose-50",    icon: "text-rose-600",    badge: "bg-rose-100 text-rose-700",    border: "border-rose-100 hover:border-rose-300" },
  cyan:    { bg: "bg-cyan-50",    icon: "text-cyan-600",    badge: "bg-cyan-100 text-cyan-700",    border: "border-cyan-100 hover:border-cyan-300" },
  amber:   { bg: "bg-amber-50",   icon: "text-amber-600",   badge: "bg-amber-100 text-amber-700",   border: "border-amber-100 hover:border-amber-300" },
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", badge: "bg-emerald-100 text-emerald-700", border: "border-emerald-100 hover:border-emerald-300" },
};

export default function Features() {
  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-teal-600 text-sm font-semibold tracking-widest uppercase mb-3">
            Platform Features
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Everything You Need to Rent Safely
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Built specifically for international students and newcomers who can't afford to take risks with housing.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const colors = accentMap[feature.accent];
            return (
              <div
                key={feature.title}
                className={`bg-white rounded-2xl p-6 border ${colors.border} transition-all duration-200 hover:shadow-lg group`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center ${colors.icon} group-hover:scale-110 transition-transform duration-200`}>
                    {feature.icon}
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colors.badge}`}>
                    {feature.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}