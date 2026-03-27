 "use client";

import { useRouter } from "next/navigation";

const listings = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80",
    city: "Toronto, ON",
    neighbourhood: "Downtown / Spadina",
    type: "Condo",
    price: 2200,
    beds: 1,
    baths: 1,
    sqft: 620,
    amenities: ["Gym", "Laundry", "Parking"],
    landlordName: "James T.",
    verified: true,
    rating: 4.9,
    reviews: 12,
    tag: "Near UofT",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80",
    city: "Vancouver, BC",
    neighbourhood: "Kitsilano",
    type: "Apartment",
    price: 1950,
    beds: 1,
    baths: 1,
    sqft: 550,
    amenities: ["Utilities Incl.", "Pet Friendly", "Balcony"],
    landlordName: "Sarah M.",
    verified: true,
    rating: 4.8,
    reviews: 9,
    tag: "UBC Nearby",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80",
    city: "Waterloo, ON",
    neighbourhood: "Uptown Waterloo",
    type: "Private Room",
    price: 850,
    beds: 1,
    baths: 1,
    sqft: 280,
    amenities: ["WiFi", "Furnished", "All Inclusive"],
    landlordName: "Raj P.",
    verified: true,
    rating: 5.0,
    reviews: 7,
    tag: "Student Friendly",
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80",
    city: "Montréal, QC",
    neighbourhood: "Plateau-Mont-Royal",
    type: "Basement",
    price: 1100,
    beds: 1,
    baths: 1,
    sqft: 480,
    amenities: ["Laundry", "Storage", "Quiet Area"],
    landlordName: "Marie L.",
    verified: true,
    rating: 4.7,
    reviews: 15,
    tag: "Near McGill",
  },
];

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 text-xs font-semibold">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      Verified
    </span>
  );
}

export default function Listings() {
  const router = useRouter();

  function handleViewAllListings() {
    router.push(`/login?next=${encodeURIComponent("/renter?tab=listings")}`);
  }

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <span className="inline-block text-teal-600 text-sm font-semibold tracking-widest uppercase mb-3">
              Featured Listings
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Verified Rentals Across Canada
            </h2>
          </div>
          <button
            type="button"
            onClick={handleViewAllListings}
            className="flex-shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors"
          >
            View all listings
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>

        {/* Listing Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden bg-slate-200">
                <img
                  src={listing.image}
                  alt={`${listing.type} in ${listing.city}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Tag */}
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 bg-slate-900/75 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                    {listing.tag}
                  </span>
                </div>
                {/* Type badge */}
                <div className="absolute top-3 right-3">
                  <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-semibold rounded-full">
                    {listing.type}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Price */}
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-2xl font-extrabold text-slate-900">${listing.price.toLocaleString()}</span>
                  <span className="text-slate-400 text-sm">/mo</span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1 text-slate-500 text-sm mb-3">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate">{listing.neighbourhood}, {listing.city}</span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 text-xs text-slate-500 mb-3 pb-3 border-b border-slate-100">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    {listing.beds} bed
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {listing.baths} bath
                  </span>
                  <span>{listing.sqft} sqft</span>
                </div>

                {/* Amenities */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {listing.amenities.map((a) => (
                    <span key={a} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">{a}</span>
                  ))}
                </div>

                {/* Landlord */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                      {listing.landlordName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-700">{listing.landlordName}</p>
                      <div className="flex items-center gap-0.5">
                        <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-xs text-slate-500">{listing.rating} ({listing.reviews})</span>
                      </div>
                    </div>
                  </div>
                  {listing.verified && <VerifiedBadge />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
