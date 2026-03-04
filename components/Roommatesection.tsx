const profiles = [
  {
    initials: "KL",
    name: "Kim L.",
    from: "South Korea",
    school: "University of Toronto",
    budget: "$700–$900/mo",
    movingIn: "Sept 2025",
    looking: "Shared Room",
    color: "from-violet-400 to-purple-500",
    verified: true,
  },
  {
    initials: "OM",
    name: "Omar M.",
    from: "Egypt",
    school: "University of Waterloo",
    budget: "$500–$800/mo",
    movingIn: "Aug 2025",
    looking: "Private Room",
    color: "from-teal-400 to-cyan-500",
    verified: true,
  },
  {
    initials: "AP",
    name: "Anika P.",
    from: "India",
    school: "UBC Vancouver",
    budget: "$800–$1,100/mo",
    movingIn: "Sept 2025",
    looking: "Shared Apartment",
    color: "from-amber-400 to-orange-400",
    verified: true,
  },
];

export default function RoommateSection() {
  return (
    <section className="py-24 bg-gradient-to-br from-slate-900 to-slate-800 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left: Copy */}
          <div className="mb-12 lg:mb-0">
            <span className="inline-block text-teal-400 text-sm font-semibold tracking-widest uppercase mb-3">
              Roommate Finder
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-6 tracking-tight leading-tight">
              Moving Alone? Find a{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-300">
                Verified Roommate
              </span>{" "}
              Safely
            </h2>
            <p className="text-slate-300 text-lg mb-6 leading-relaxed">
              As an international student or newcomer, finding a roommate in a new country can feel risky. RentShield's roommate finder connects you only with verified users who've completed identity checks.
            </p>

            <ul className="space-y-3 mb-8">
              {[
                "Browse profiles filtered by university, city, and budget",
                "All roommate seekers are identity-verified",
                "Message safely before committing to anything",
                "Filter by move-in date, gender preference, lifestyle",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-slate-300 text-sm">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-teal-500/20 border border-teal-400/40 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {item}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3">
              <a
                href="/roommates"
                className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-xl transition-colors text-sm shadow-lg"
              >
                Find a Roommate
              </a>
              <a
                href="/roommates/post"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-colors text-sm"
              >
                Post Your Profile
              </a>
            </div>
          </div>

          {/* Right: Profile Cards */}
          <div className="space-y-4">
            {profiles.map((p) => (
              <div
                key={p.name}
                className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-5 flex items-center gap-4 hover:bg-white/15 transition-all duration-200 group"
              >
                {/* Avatar */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${p.color} flex items-center justify-center text-white text-lg font-bold flex-shrink-0 group-hover:scale-105 transition-transform`}>
                  {p.initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-white font-semibold">{p.name}</span>
                    {p.verified && (
                      <span className="flex items-center gap-0.5 text-teal-400 text-xs font-medium">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </span>
                    )}
                    <span className="text-slate-400 text-xs">from {p.from}</span>
                  </div>
                  <p className="text-slate-400 text-xs mb-2">{p.school}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-0.5 bg-white/10 text-slate-300 text-xs rounded-full">{p.budget}</span>
                    <span className="px-2 py-0.5 bg-white/10 text-slate-300 text-xs rounded-full">{p.movingIn}</span>
                    <span className="px-2 py-0.5 bg-white/10 text-slate-300 text-xs rounded-full">{p.looking}</span>
                  </div>
                </div>

                {/* Message button */}
                <button className="flex-shrink-0 w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 text-teal-400 hover:bg-teal-500 hover:text-white transition-all duration-200 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </button>
              </div>
            ))}

            <div className="text-center pt-2">
              <a href="/roommates" className="text-sm text-teal-400 hover:text-teal-300 font-medium transition-colors">
                View 200+ more verified profiles →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}