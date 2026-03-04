const trustPoints = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    ),
    title: "Identity Verification",
    description: "Every user is verified via government-issued ID before gaining full access to listings or roommate profiles.",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    title: "Ownership Proof",
    description: "Landlords submit legal ownership documents. Our team manually reviews and approves each listing before it becomes visible.",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    title: "Scam Detection",
    description: "Our AI flags suspicious listing patterns — too-good-to-be-true pricing, duplicate photos, and known fraud profiles are blocked automatically.",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: "Report & Review",
    description: "Users can report suspicious activity instantly. Our trust & safety team responds within 24 hours, and accounts are suspended if issues are confirmed.",
  },
];

const testimonials = [
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

export default function SecuritySection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-rose-500 text-sm font-semibold tracking-widest uppercase mb-3">
            Trust & Safety
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
            We Take Rental Fraud Seriously
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            International students and newcomers are disproportionately targeted by rental scams. RentShield was built specifically to change that.
          </p>
        </div>

        {/* Trust points */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {trustPoints.map((point) => (
            <div key={point.title} className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 text-teal-400 mb-4 group-hover:bg-teal-500 group-hover:text-white transition-all duration-300 group-hover:scale-110">
                {point.icon}
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{point.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{point.description}</p>
            </div>
          ))}
        </div>

        {/* Security stat bar */}
        <div className="bg-gradient-to-r from-slate-900 to-teal-900 rounded-3xl p-8 sm:p-10 mb-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { value: "98%", label: "Fraud-Free Rate", sub: "across all listings" },
              { value: "< 24h", label: "Response Time", sub: "for reported issues" },
              { value: "100%", label: "Manual Review", sub: "of new listings" },
              { value: "0", label: "Fake Landlords", sub: "allowed on platform" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-4xl font-extrabold text-teal-400 mb-1">{stat.value}</p>
                <p className="text-white font-semibold text-sm">{stat.label}</p>
                <p className="text-slate-400 text-xs mt-0.5">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <svg className="w-8 h-8 text-teal-300 mb-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
              <p className="text-slate-700 leading-relaxed mb-5 italic text-sm">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-sm font-bold`}>
                  {t.initials}
                </div>
                <div>
                  <p className="text-slate-900 font-semibold text-sm">{t.name}</p>
                  <p className="text-slate-500 text-xs">{t.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}