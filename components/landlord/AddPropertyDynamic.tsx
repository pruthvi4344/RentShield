"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { createLandlordListing } from "@/lib/landlordListingService";
import { getAuthIdentity } from "@/lib/profileService";

const STEP_TITLES = [
  "Basic Info",
  "Details & Price",
  "Special Offers",
  "Amenities",
  "Media",
  "Availability",
  "Review",
] as const;

const DRAFT_KEY = "rentshield:add-property-draft";
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_IMAGES = 15;
const MAX_VIDEOS = 2;

const propertyTypes = ["Apartment", "Condo", "Basement", "Private Room", "Shared Room"];
const furnishingTypes = [
  { value: "furnished", label: "Furnished" },
  { value: "unfurnished", label: "Unfurnished" },
  { value: "partially", label: "Partially" },
] as const;
const durationOptions = [1, 2, 3];
const leaseDurationOptions = [3, 6, 8, 12, 16, 24];
const canadianPostalCodePattern = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;

type ProvinceOption = {
  name: string;
  code: string;
  cities: string[];
};

type ParsedGooglePlace = {
  formattedAddress: string;
  streetAddress: string;
  country: string;
  province: string;
  city: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
  placeId: string;
};

const locationOptions: Record<string, ProvinceOption[]> = {
  Canada: [
    { name: "Alberta", code: "AB", cities: ["Calgary", "Edmonton", "Red Deer"] },
    { name: "British Columbia", code: "BC", cities: ["Burnaby", "Kelowna", "Richmond", "Surrey", "Vancouver", "Victoria"] },
    { name: "Manitoba", code: "MB", cities: ["Brandon", "Winnipeg"] },
    { name: "New Brunswick", code: "NB", cities: ["Fredericton", "Moncton", "Saint John"] },
    { name: "Newfoundland and Labrador", code: "NL", cities: ["Corner Brook", "St. John's"] },
    { name: "Nova Scotia", code: "NS", cities: ["Halifax", "Sydney"] },
    { name: "Ontario", code: "ON", cities: ["Hamilton", "Kingston", "Kitchener", "London", "Mississauga", "Ottawa", "Toronto", "Waterloo", "Windsor"] },
    { name: "Prince Edward Island", code: "PE", cities: ["Charlottetown"] },
    { name: "Quebec", code: "QC", cities: ["Gatineau", "Laval", "Montreal", "Quebec City", "Sherbrooke"] },
    { name: "Saskatchewan", code: "SK", cities: ["Regina", "Saskatoon"] },
  ],
  "United States": [
    { name: "California", code: "CA", cities: ["Los Angeles", "San Diego", "San Francisco"] },
    { name: "Illinois", code: "IL", cities: ["Chicago"] },
    { name: "Massachusetts", code: "MA", cities: ["Boston"] },
    { name: "Michigan", code: "MI", cities: ["Detroit"] },
    { name: "New York", code: "NY", cities: ["Buffalo", "New York City"] },
    { name: "Texas", code: "TX", cities: ["Austin", "Dallas", "Houston"] },
  ],
};

const locationCountries = Object.keys(locationOptions);

const amenitiesList = [
  { id: "wifi", label: "WiFi" },
  { id: "laundry", label: "Laundry" },
  { id: "parking", label: "Parking" },
  { id: "balcony", label: "Balcony" },
  { id: "gym", label: "Gym" },
  { id: "dishwasher", label: "Dishwasher" },
  { id: "ac", label: "A/C" },
  { id: "storage", label: "Storage" },
  { id: "elevator", label: "Elevator" },
  { id: "security", label: "Security System" },
];

type FormState = {
  title: string;
  propertyType: string;
  locationSearch: string;
  streetAddress: string;
  formattedAddress: string;
  placeId: string;
  latitude: string;
  longitude: string;
  country: string;
  province: string;
  city: string;
  postalCode: string;
  bedrooms: string;
  bathrooms: string;
  squareFeet: string;
  furnishingType: "furnished" | "unfurnished" | "partially" | "";
  monthlyRent: string;
  securityDeposit: string;
  discountPercentage: string;
  discountDurationMonths: string;
  limitedTimeOfferTitle: string;
  limitedTimeOfferDescription: string;
  limitedTimeOfferExpiresAt: string;
  utilitiesIncluded: boolean;
  internetIncluded: boolean;
  parkingIncluded: boolean;
  featuredListing: boolean;
  amenities: string[];
  matterportUrl: string;
  matterportEmbed: string;
  availableFrom: string;
  leaseDurationMonths: string;
};

type MediaItem = {
  id: string;
  file: File;
  previewUrl: string;
  mediaType: "image" | "video";
};

type StepErrors = Partial<Record<keyof FormState | "media" | "matterport", string>>;

const initialFormState: FormState = {
  title: "",
  propertyType: "",
  locationSearch: "",
  streetAddress: "",
  formattedAddress: "",
  placeId: "",
  latitude: "",
  longitude: "",
  country: "Canada",
  province: "",
  city: "",
  postalCode: "",
  bedrooms: "",
  bathrooms: "",
  squareFeet: "",
  furnishingType: "",
  monthlyRent: "",
  securityDeposit: "",
  discountPercentage: "",
  discountDurationMonths: "",
  limitedTimeOfferTitle: "",
  limitedTimeOfferDescription: "",
  limitedTimeOfferExpiresAt: "",
  utilitiesIncluded: false,
  internetIncluded: false,
  parkingIncluded: false,
  featuredListing: false,
  amenities: [],
  matterportUrl: "",
  matterportEmbed: "",
  availableFrom: "",
  leaseDurationMonths: "12",
};

function buildSpecialOfferBadge(form: FormState): string | null {
  if (form.featuredListing) return "Featured Property";
  if (Number(form.discountPercentage) > 0) {
    const duration = Number(form.discountDurationMonths) || 1;
    return `First ${duration} month${duration > 1 ? "s" : ""} ${form.discountPercentage}% off`;
  }
  if (form.limitedTimeOfferTitle.trim()) return form.limitedTimeOfferTitle.trim();
  return null;
}

function formatPostalCode(value: string): string {
  const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  if (cleaned.length <= 3) return cleaned;
  return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
}

function buildListingCity(country: string, province: string, city: string): string {
  const provinceEntry = (locationOptions[country] ?? []).find(
    (option) => option.name === province || option.code === province,
  );
  if (!city.trim()) return "";
  if (!province.trim()) return city.trim();
  return `${city.trim()}, ${provinceEntry?.code ?? province.trim()}`;
}

function getAddressComponent(components: Array<{ long_name?: string; short_name?: string; types?: string[] }> | undefined, type: string) {
  return components?.find((component) => component.types?.includes(type));
}

function parseGooglePlace(place: any): ParsedGooglePlace | null {
  if (!place?.place_id || !place?.formatted_address || !place?.geometry?.location) {
    return null;
  }

  const streetNumber = getAddressComponent(place.address_components, "street_number")?.long_name ?? "";
  const route = getAddressComponent(place.address_components, "route")?.long_name ?? "";
  const city =
    getAddressComponent(place.address_components, "locality")?.long_name ??
    getAddressComponent(place.address_components, "postal_town")?.long_name ??
    getAddressComponent(place.address_components, "administrative_area_level_2")?.long_name ??
    "";
  const province = getAddressComponent(place.address_components, "administrative_area_level_1")?.long_name ?? "";
  const country = getAddressComponent(place.address_components, "country")?.long_name ?? "Canada";
  const postalCode = formatPostalCode(getAddressComponent(place.address_components, "postal_code")?.long_name ?? "");
  const streetAddress = [streetNumber, route].filter(Boolean).join(" ").trim();
  const latitude = typeof place.geometry.location.lat === "function" ? place.geometry.location.lat() : null;
  const longitude = typeof place.geometry.location.lng === "function" ? place.geometry.location.lng() : null;

  return {
    formattedAddress: place.formatted_address,
    streetAddress,
    country,
    province,
    city,
    postalCode,
    latitude,
    longitude,
    placeId: place.place_id,
  };
}

function GooglePlaceSearch({
  value,
  onInputChange,
  onPlaceSelected,
  hasError,
  disabled,
  city,
  country,
}: {
  value: string;
  onInputChange: (value: string) => void;
  onPlaceSelected: (place: ParsedGooglePlace) => void;
  hasError: boolean;
  disabled: boolean;
  city: string;
  country: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<any>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const { isLoaded, loadError } = useJsApiLoader({
    id: "rentshield-google-places",
    googleMapsApiKey: apiKey,
    libraries: ["places"],
  });

  useEffect(() => {
    const googleObject = (window as Window & { google?: any }).google;
    if (!apiKey || !isLoaded || !inputRef.current || !googleObject?.maps?.places || autocompleteRef.current || disabled) {
      return;
    }

    const autocomplete = new googleObject.maps.places.Autocomplete(inputRef.current, {
      fields: ["address_components", "formatted_address", "geometry", "place_id"],
      types: ["address"],
      componentRestrictions: { country: "ca" },
    });

    const listener = autocomplete.addListener("place_changed", () => {
      const parsed = parseGooglePlace(autocomplete.getPlace());
      if (parsed) {
        onPlaceSelected(parsed);
      }
    });

    autocompleteRef.current = autocomplete;

    return () => {
      if (listener?.remove) listener.remove();
      if (googleObject?.maps?.event && autocompleteRef.current) {
        googleObject.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
      autocompleteRef.current = null;
    };
  }, [apiKey, city, country, disabled, isLoaded, onPlaceSelected]);

  if (!apiKey) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
        Add <code className="font-mono">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable Google Places autocomplete.
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => onInputChange(event.target.value)}
        placeholder={
          country !== "Canada"
            ? "Canada listings only"
            : disabled
            ? "Select city first"
            : loadError
              ? "Google Places failed to load"
              : `Enter address in ${city}`
        }
        disabled={!isLoaded || disabled}
        className={`${inputClass(hasError)} disabled:cursor-not-allowed disabled:opacity-60`}
      />
      <p className="text-xs text-slate-400">
        {country !== "Canada"
          ? "Google address validation is currently enabled for Canada listings only."
          : disabled
          ? "Select country, province, and city before entering the street address."
          : "Select an address from Google suggestions. Only verified Google matches are accepted."}
      </p>
    </div>
  );
}

function isAllowedFile(file: File): { ok: boolean; type: "image" | "video" | null } {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "webp"].includes(extension)) return { ok: true, type: "image" };
  if (["mp4", "mov"].includes(extension)) return { ok: true, type: "video" };
  return { ok: false, type: null };
}

function validateBasicInfo(form: FormState): StepErrors {
  const errors: StepErrors = {};
  if (!form.title.trim()) errors.title = "Property title is required";
  else if (form.title.trim().length < 5) errors.title = "Property title must be at least 5 characters";
  if (!form.propertyType.trim()) errors.propertyType = "Property type is required";
  if (!form.streetAddress.trim()) errors.streetAddress = "Street address is required";
  else if (form.streetAddress.trim().length < 8) errors.streetAddress = "Street address must be at least 8 characters";
  if (!form.country.trim()) errors.country = "Country is required";
  else if (form.country !== "Canada") errors.country = "Google address validation currently supports Canada listings only";
  if (!form.province.trim()) errors.province = "Province is required";
  if (!form.city.trim()) errors.city = "City is required";
  if (form.country.trim() && form.province.trim() && form.city.trim() && (!form.placeId.trim() || !form.latitude.trim() || !form.longitude.trim())) {
    errors.streetAddress = "Please select address from suggestions";
  }
  if (!form.postalCode.trim()) errors.postalCode = "Postal code is required";
  else if (form.country === "Canada" && !canadianPostalCodePattern.test(form.postalCode.trim())) {
    errors.postalCode = "Enter a valid Canadian postal code in A1A 1A1 format";
  }
  return errors;
}

function validateDetailsAndPrice(form: FormState): StepErrors {
  const errors: StepErrors = {};
  const bedrooms = Number(form.bedrooms);
  const bathrooms = Number(form.bathrooms);
  const squareFeet = Number(form.squareFeet);
  const monthlyRent = Number(form.monthlyRent);
  const securityDeposit = Number(form.securityDeposit);

  if (!form.bedrooms || bedrooms <= 0) errors.bedrooms = "Bedrooms is required";
  if (!form.bathrooms || bathrooms <= 0) errors.bathrooms = "Bathrooms is required";
  if (!form.squareFeet || squareFeet <= 0) errors.squareFeet = "Square feet is required";
  if (!form.monthlyRent || monthlyRent <= 0) {
    errors.monthlyRent = "Rent must be > 0";
  }
  if (!form.securityDeposit || securityDeposit < 0) {
    errors.securityDeposit = "Deposit is required";
  } else if (monthlyRent > 0 && securityDeposit > monthlyRent * 3) {
    errors.securityDeposit = "Deposit cannot exceed 3 months rent";
  }
  if (!form.furnishingType) errors.furnishingType = "Furnishing type is required";

  return errors;
}

function validateSpecialOffers(form: FormState): StepErrors {
  const errors: StepErrors = {};
  const hasDiscount = form.discountPercentage.trim() || form.discountDurationMonths.trim();
  const hasLimitedOffer =
    form.limitedTimeOfferTitle.trim() ||
    form.limitedTimeOfferDescription.trim() ||
    form.limitedTimeOfferExpiresAt.trim();

  if (hasDiscount) {
    const discount = Number(form.discountPercentage);
    const duration = Number(form.discountDurationMonths);

    if (!form.discountPercentage.trim() || discount <= 0 || discount > 100) {
      errors.discountPercentage = "Discount percentage must be between 1 and 100";
    }
    if (!form.discountDurationMonths.trim() || !durationOptions.includes(duration)) {
      errors.discountDurationMonths = "Duration must be between 1 and 3 months";
    }
  }

  if (hasLimitedOffer) {
    if (!form.limitedTimeOfferTitle.trim()) errors.limitedTimeOfferTitle = "Offer title is required";
    if (!form.limitedTimeOfferDescription.trim()) errors.limitedTimeOfferDescription = "Offer description is required";
    if (!form.limitedTimeOfferExpiresAt.trim()) errors.limitedTimeOfferExpiresAt = "Expiration date is required";
  }

  return errors;
}

function validateMedia(form: FormState, mediaItems: MediaItem[]): StepErrors {
  void form;
  const errors: StepErrors = {};
  const images = mediaItems.filter((item) => item.mediaType === "image").length;
  const videos = mediaItems.filter((item) => item.mediaType === "video").length;
  if (images > MAX_IMAGES) errors.media = `Maximum ${MAX_IMAGES} images allowed`;
  if (videos > MAX_VIDEOS) errors.media = `Maximum ${MAX_VIDEOS} videos allowed`;
  return errors;
}

function validateAvailability(form: FormState): StepErrors {
  const errors: StepErrors = {};
  if (form.availableFrom && Number.isNaN(Date.parse(form.availableFrom))) {
    errors.availableFrom = "Available from date is invalid";
  }
  return errors;
}

function getStepErrors(step: number, form: FormState, mediaItems: MediaItem[]): StepErrors {
  switch (step) {
    case 0:
      return validateBasicInfo(form);
    case 1:
      return validateDetailsAndPrice(form);
    case 2:
      return validateSpecialOffers(form);
    case 3:
      return {};
    case 4:
      return validateMedia(form, mediaItems);
    case 5:
      return validateAvailability(form);
    case 6:
      return {
        ...validateBasicInfo(form),
        ...validateDetailsAndPrice(form),
        ...validateSpecialOffers(form),
        ...validateMedia(form, mediaItems),
        ...validateAvailability(form),
      };
    default:
      return {};
  }
}

function inputClass(hasError: boolean): string {
  return [
    "w-full rounded-xl border px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2",
    hasError
      ? "border-rose-300 bg-rose-50 text-slate-900 placeholder-slate-400 focus:border-rose-400 focus:ring-rose-100"
      : "border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:ring-teal-200",
  ].join(" ");
}

function InlineError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs font-medium text-rose-600">{message}</p>;
}

export default function AddPropertyDynamic() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [stepErrors, setStepErrors] = useState<StepErrors>({});
  const [globalError, setGlobalError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [draftStatus, setDraftStatus] = useState<"" | "Saving draft..." | "Draft saved">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [validationMessages, setValidationMessages] = useState<string[]>([]);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const didHydrateDraft = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const imageCount = mediaItems.filter((item) => item.mediaType === "image").length;
  const videoCount = mediaItems.filter((item) => item.mediaType === "video").length;
  const offerBadge = buildSpecialOfferBadge(form);
  const availableProvinces = locationOptions[form.country] ?? [];
  const availableCities = availableProvinces.find((province) => province.name === form.province)?.cities ?? [];

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const saved = window.localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { form?: Partial<FormState> };
        if (parsed.form) {
          setForm((prev) => ({ ...prev, ...parsed.form }));
        }
      }
    } catch {
      // Ignore corrupted draft and continue with empty form.
    } finally {
      didHydrateDraft.current = true;
    }
  }, []);

  useEffect(() => {
    if (!didHydrateDraft.current || typeof window === "undefined" || submitted) return;

    setDraftStatus("Saving draft...");
    const timeout = window.setTimeout(() => {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ form }));
      setDraftStatus("Draft saved");
      window.setTimeout(() => setDraftStatus(""), 1200);
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [form, submitted]);

  useEffect(() => {
    return () => {
      mediaItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [mediaItems]);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function clearSelectedPlaceDetails() {
    setForm((prev) => ({
      ...prev,
      locationSearch: "",
      placeId: "",
      latitude: "",
      longitude: "",
      formattedAddress: "",
    }));
  }

  function handleCountryChange(value: string) {
    setForm((prev) => ({
      ...prev,
      country: value,
      province: "",
      city: "",
      streetAddress: "",
      locationSearch: "",
      placeId: "",
      latitude: "",
      longitude: "",
      postalCode: "",
      formattedAddress: "",
    }));
  }

  function handleProvinceChange(value: string) {
    setForm((prev) => ({
      ...prev,
      province: value,
      city: "",
      streetAddress: "",
      locationSearch: "",
      placeId: "",
      latitude: "",
      longitude: "",
      postalCode: "",
      formattedAddress: "",
    }));
  }

  function handleCityChange(value: string) {
    setForm((prev) => ({
      ...prev,
      city: value,
      streetAddress: "",
      locationSearch: "",
      placeId: "",
      latitude: "",
      longitude: "",
      postalCode: "",
      formattedAddress: "",
    }));
  }

  const handlePlaceSelected = useCallback((place: ParsedGooglePlace) => {
    setForm((prev) => ({
      ...prev,
      locationSearch: place.formattedAddress,
      formattedAddress: place.formattedAddress,
      streetAddress: place.streetAddress,
      country: place.country || prev.country || "Canada",
      province: place.province,
      city: place.city,
      postalCode: place.postalCode,
      latitude: place.latitude !== null ? String(place.latitude) : "",
      longitude: place.longitude !== null ? String(place.longitude) : "",
      placeId: place.placeId,
    }));
  }, []);

  function toggleAmenity(id: string) {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(id)
        ? prev.amenities.filter((item) => item !== id)
        : [...prev.amenities, id],
    }));
  }

  function removeMedia(id: string) {
    setMediaItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  }

  function addFiles(files: FileList | File[]) {
    const incoming = Array.from(files);
    const nextErrors: StepErrors = {};

    setGlobalError("");

    const accepted: MediaItem[] = [];
    let images = imageCount;
    let videos = videoCount;

    for (const file of incoming) {
      const fileCheck = isAllowedFile(file);
      if (!fileCheck.ok || !fileCheck.type) {
        nextErrors.media = "Only jpg, png, webp, mp4, and mov files are allowed";
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        nextErrors.media = "Each media file must be 20MB or smaller";
        continue;
      }

      if (fileCheck.type === "image" && images >= MAX_IMAGES) {
        nextErrors.media = `Maximum ${MAX_IMAGES} images allowed`;
        continue;
      }

      if (fileCheck.type === "video" && videos >= MAX_VIDEOS) {
        nextErrors.media = `Maximum ${MAX_VIDEOS} videos allowed`;
        continue;
      }

      accepted.push({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        mediaType: fileCheck.type,
      });

      if (fileCheck.type === "image") images += 1;
      if (fileCheck.type === "video") videos += 1;
    }

    if (accepted.length > 0) {
      setMediaItems((prev) => [...prev, ...accepted]);
    }

    setStepErrors((prev) => ({ ...prev, ...nextErrors }));
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    addFiles(event.dataTransfer.files);
  }

  function openValidationModal(errors: StepErrors) {
    const messages = Array.from(new Set(Object.values(errors).filter(Boolean))) as string[];
    if (messages.length === 0) return;
    setValidationMessages(messages);
    setShowValidationModal(true);
  }

  function handleContinue() {
    const errors = getStepErrors(step, form, mediaItems);
    setStepErrors(errors);
    if (Object.keys(errors).length > 0) {
      openValidationModal(errors);
      return;
    }
    setStep((prev) => Math.min(prev + 1, STEP_TITLES.length - 1));
  }

  async function handleSubmit() {
    const finalErrors = getStepErrors(6, form, mediaItems);
    setStepErrors(finalErrors);
    if (Object.keys(finalErrors).length > 0) {
      openValidationModal(finalErrors);
      return;
    }

    setIsSubmitting(true);
    setGlobalError("");
    setSubmitStatus("Uploading media...");

    try {
      const auth = await getAuthIdentity();
      if (!auth || auth.role !== "landlord") {
        throw new Error("Landlord session not found.");
      }

      await createLandlordListing(
        auth.id,
        {
          title: form.title.trim(),
          property_type: form.propertyType,
          street_address: form.streetAddress.trim(),
          formatted_address: form.formattedAddress.trim() || null,
          place_id: form.placeId.trim() || null,
          latitude: form.latitude ? Number(form.latitude) : null,
          longitude: form.longitude ? Number(form.longitude) : null,
          city: buildListingCity(form.country, form.province, form.city),
          postal_code: form.postalCode.trim(),
          bedrooms: Number(form.bedrooms),
          bathrooms: Number(form.bathrooms),
          square_feet: Number(form.squareFeet),
          furnished_status: form.furnishingType || "furnished",
          monthly_rent: Number(form.monthlyRent),
          security_deposit: Number(form.securityDeposit),
          utilities_included: form.utilitiesIncluded,
          internet_included: form.internetIncluded,
          parking_included: form.parkingIncluded,
          amenities: form.amenities,
          discount_percentage: form.discountPercentage ? Number(form.discountPercentage) : null,
          discount_duration_months: form.discountDurationMonths ? Number(form.discountDurationMonths) : null,
          limited_time_offer_title: form.limitedTimeOfferTitle.trim() || null,
          limited_time_offer_description: form.limitedTimeOfferDescription.trim() || null,
          limited_time_offer_expires_at: form.limitedTimeOfferExpiresAt || null,
          featured_listing: form.featuredListing,
          matterport_url: null,
          matterport_embed: null,
          tour_360_storage_path: null,
          available_from: form.availableFrom || null,
          lease_duration_months: form.leaseDurationMonths ? Number(form.leaseDurationMonths) : null,
          status: "pending",
        },
        mediaItems.map((item) => item.file),
        (message) => setSubmitStatus(message),
      );

      if (typeof window !== "undefined") {
        window.localStorage.removeItem(DRAFT_KEY);
      }
      mediaItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      setMediaItems([]);
      setForm(initialFormState);
      setStep(0);
      setSubmitted(true);
      setSubmitStatus("");
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "Failed to submit listing.");
    } finally {
      setIsSubmitting(false);
      setSubmitStatus("");
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center py-10 text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-3xl font-bold text-emerald-600">
            OK
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Listing submitted</h2>
          <p className="mt-2 max-w-lg text-sm text-slate-500">
            Your property draft was submitted for review. It will appear in landlord listings once processing is complete.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="mt-6 rounded-xl bg-teal-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-600"
          >
            Add another property
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Add New Property</h2>
          <p className="mt-1 text-sm text-slate-500">Build a verified listing with pricing, offers, media, and a final renter-facing preview.</p>
        </div>
        <div className="text-sm font-medium text-slate-500">{draftStatus || "Autosave enabled"}</div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-7">
          {STEP_TITLES.map((title, index) => {
            const isCurrent = index === step;
            const isDone = index < step;

            return (
              <div key={title} className="flex items-center gap-3">
                <div
                  className={[
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all",
                    isDone
                      ? "bg-teal-500 text-white"
                      : isCurrent
                        ? "bg-teal-50 text-teal-700 ring-2 ring-teal-500 ring-offset-2"
                        : "bg-slate-100 text-slate-400",
                  ].join(" ")}
                >
                  {isDone ? "OK" : index + 1}
                </div>
                <div className="min-w-0">
                  <p className={`truncate text-xs font-semibold uppercase tracking-wide ${isCurrent || isDone ? "text-teal-700" : "text-slate-400"}`}>
                    Step {index + 1}
                  </p>
                  <p className={`truncate text-sm font-medium ${isCurrent ? "text-slate-900" : "text-slate-500"}`}>{title}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {globalError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{globalError}</div>
      )}

      {submitStatus && (
        <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-700">{submitStatus}</div>
      )}

      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h3 className="text-lg font-bold text-slate-900">{STEP_TITLES[step]}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {step === 0 && "Required: title, property type, street address, country, province, city, and postal code."}
            {step === 1 && "Required: beds, baths, square feet, rent, deposit, and furnishing."}
            {step === 2 && "Optional promotional offers that make the property stand out."}
            {step === 3 && "Optional amenities. Select all that apply."}
            {step === 4 && "Upload listing photos and videos."}
            {step === 5 && "Availability details shown on the renter listing."}
            {step === 6 && "Review the renter-facing preview before final submission."}
          </p>
        </div>

        <div className="p-6 transition-all duration-300">
          {step === 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Property title</label>
                <input
                  value={form.title}
                  onChange={(event) => updateForm("title", event.target.value)}
                  placeholder="e.g. Modern Studio Near UofT"
                  className={inputClass(Boolean(stepErrors.title))}
                />
                <InlineError message={stepErrors.title} />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Property type</label>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                  {propertyTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => updateForm("propertyType", type)}
                      className={[
                        "rounded-xl border px-4 py-3 text-sm font-semibold transition-colors",
                        form.propertyType === type
                          ? "border-teal-500 bg-teal-50 text-teal-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-teal-200",
                      ].join(" ")}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <InlineError message={stepErrors.propertyType} />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Country</label>
                <select
                  value={form.country}
                  onChange={(event) => handleCountryChange(event.target.value)}
                  className={inputClass(Boolean(stepErrors.country))}
                >
                  <option value="">Select country</option>
                  {locationCountries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-400">Default is Canada for local rental inventory.</p>
                <InlineError message={stepErrors.country} />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Province</label>
                <select
                  value={form.province}
                  onChange={(event) => handleProvinceChange(event.target.value)}
                  disabled={!form.country}
                  className={`${inputClass(Boolean(stepErrors.province))} disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <option value="">Select province</option>
                  {availableProvinces.map((province) => (
                    <option key={province.code} value={province.name}>
                      {province.name}
                    </option>
                  ))}
                </select>
                <InlineError message={stepErrors.province} />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">City</label>
                <input
                  list="listing-city-options"
                  value={form.city}
                  onChange={(event) => handleCityChange(event.target.value)}
                  placeholder="Search city"
                  disabled={!form.province}
                  className={`${inputClass(Boolean(stepErrors.city))} disabled:cursor-not-allowed disabled:opacity-60`}
                />
                <datalist id="listing-city-options">
                  {availableCities.map((city) => (
                    <option key={city} value={city} />
                  ))}
                </datalist>
                <p className="mt-1 text-xs text-slate-400">Select province first to narrow city options.</p>
                <InlineError message={stepErrors.city} />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Street address</label>
                <GooglePlaceSearch
                  value={form.locationSearch}
                  onInputChange={(value) => {
                    setForm((prev) => ({
                      ...prev,
                      locationSearch: value,
                      streetAddress: value,
                      placeId: "",
                      latitude: "",
                      longitude: "",
                      formattedAddress: "",
                    }));
                  }}
                  onPlaceSelected={handlePlaceSelected}
                  hasError={Boolean(stepErrors.streetAddress)}
                  disabled={!form.city || form.country !== "Canada"}
                  city={form.city}
                  country={form.country}
                />
                {form.formattedAddress && form.placeId && (
                  <div className="mt-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                    Verified address from Google
                  </div>
                )}
                <InlineError message={stepErrors.streetAddress} />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Postal code</label>
                <input
                  value={form.postalCode}
                  onChange={(event) => {
                    clearSelectedPlaceDetails();
                    updateForm("postalCode", formatPostalCode(event.target.value));
                  }}
                  placeholder="A1A 1A1"
                  className={inputClass(Boolean(stepErrors.postalCode))}
                />
                <p className="mt-1 text-xs text-slate-400">Canadian format: A1A 1A1</p>
                <InlineError message={stepErrors.postalCode} />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Latitude</label>
                <input value={form.latitude} readOnly className={inputClass(false)} />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Longitude</label>
                <input value={form.longitude} readOnly className={inputClass(false)} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Bedrooms</label>
                  <input type="number" min="0" value={form.bedrooms} onChange={(event) => updateForm("bedrooms", event.target.value)} className={inputClass(Boolean(stepErrors.bedrooms))} />
                  <InlineError message={stepErrors.bedrooms} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Bathrooms</label>
                  <input type="number" min="0" value={form.bathrooms} onChange={(event) => updateForm("bathrooms", event.target.value)} className={inputClass(Boolean(stepErrors.bathrooms))} />
                  <InlineError message={stepErrors.bathrooms} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Square feet</label>
                  <input type="number" min="0" value={form.squareFeet} onChange={(event) => updateForm("squareFeet", event.target.value)} className={inputClass(Boolean(stepErrors.squareFeet))} />
                  <InlineError message={stepErrors.squareFeet} />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Furnishing type</label>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {furnishingTypes.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateForm("furnishingType", option.value)}
                      className={[
                        "rounded-xl border px-4 py-3 text-sm font-semibold transition-colors",
                        form.furnishingType === option.value
                          ? "border-teal-500 bg-teal-50 text-teal-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-teal-200",
                      ].join(" ")}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <InlineError message={stepErrors.furnishingType} />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Monthly rent ($)</label>
                  <input type="number" min="0" value={form.monthlyRent} onChange={(event) => updateForm("monthlyRent", event.target.value)} className={inputClass(Boolean(stepErrors.monthlyRent))} />
                  <InlineError message={stepErrors.monthlyRent} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Security deposit ($)</label>
                  <input type="number" min="0" value={form.securityDeposit} onChange={(event) => updateForm("securityDeposit", event.target.value)} className={inputClass(Boolean(stepErrors.securityDeposit))} />
                  <InlineError message={stepErrors.securityDeposit} />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-700">
                Special offers are optional. Leave every field empty if you do not want to promote this listing.
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <h4 className="text-base font-bold text-slate-900">Discount offer</h4>
                <p className="mt-1 text-sm text-slate-500">Example: First month 20% off.</p>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Discount percentage</label>
                    <input type="number" min="0" max="100" value={form.discountPercentage} onChange={(event) => updateForm("discountPercentage", event.target.value)} placeholder="20" className={inputClass(Boolean(stepErrors.discountPercentage))} />
                    <InlineError message={stepErrors.discountPercentage} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Duration (months)</label>
                    <select value={form.discountDurationMonths} onChange={(event) => updateForm("discountDurationMonths", event.target.value)} className={inputClass(Boolean(stepErrors.discountDurationMonths))}>
                      <option value="">Select duration</option>
                      {durationOptions.map((value) => (
                        <option key={value} value={value}>
                          {value} month{value > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                    <InlineError message={stepErrors.discountDurationMonths} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <h4 className="text-base font-bold text-slate-900">Limited time offer</h4>
                <p className="mt-1 text-sm text-slate-500">Example: Sign before July 1 and get $200 off.</p>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Offer title</label>
                    <input value={form.limitedTimeOfferTitle} onChange={(event) => updateForm("limitedTimeOfferTitle", event.target.value)} placeholder="Sign before July 1 and get $200 off" className={inputClass(Boolean(stepErrors.limitedTimeOfferTitle))} />
                    <InlineError message={stepErrors.limitedTimeOfferTitle} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Expiration date</label>
                    <input type="date" value={form.limitedTimeOfferExpiresAt} onChange={(event) => updateForm("limitedTimeOfferExpiresAt", event.target.value)} className={inputClass(Boolean(stepErrors.limitedTimeOfferExpiresAt))} />
                    <InlineError message={stepErrors.limitedTimeOfferExpiresAt} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Offer description</label>
                    <textarea value={form.limitedTimeOfferDescription} onChange={(event) => updateForm("limitedTimeOfferDescription", event.target.value)} rows={3} placeholder="Explain the promotion and why renters should act now." className={inputClass(Boolean(stepErrors.limitedTimeOfferDescription))} />
                    <InlineError message={stepErrors.limitedTimeOfferDescription} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4">
                  <input type="checkbox" checked={form.utilitiesIncluded} onChange={(event) => updateForm("utilitiesIncluded", event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Utilities included</p>
                    <p className="text-xs text-slate-500">Show heat, water, and hydro in the offer block.</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4">
                  <input type="checkbox" checked={form.internetIncluded} onChange={(event) => updateForm("internetIncluded", event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Internet included</p>
                    <p className="text-xs text-slate-500">Highlights strong move-in value.</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4">
                  <input type="checkbox" checked={form.parkingIncluded} onChange={(event) => updateForm("parkingIncluded", event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Parking included</p>
                    <p className="text-xs text-slate-500">Useful for suburban or family-focused listings.</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4">
                  <input type="checkbox" checked={form.featuredListing} onChange={(event) => updateForm("featuredListing", event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Featured listing</p>
                    <p className="text-xs text-slate-500">Displays a Featured Property badge in renter search results.</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {amenitiesList.map((amenity) => {
                  const selected = form.amenities.includes(amenity.id);
                  return (
                    <button
                      key={amenity.id}
                      type="button"
                      onClick={() => toggleAmenity(amenity.id)}
                      className={[
                        "rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-colors",
                        selected ? "border-teal-500 bg-teal-50 text-teal-700" : "border-slate-200 bg-white text-slate-700 hover:border-teal-200",
                      ].join(" ")}
                    >
                      {amenity.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-sm text-slate-500">{form.amenities.length} amenities selected.</p>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">

              <div
                onDragEnter={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setDragActive(false);
                }}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={[
                  "cursor-pointer rounded-3xl border-2 border-dashed p-8 text-center transition-colors",
                  dragActive ? "border-teal-500 bg-teal-50" : "border-slate-200 bg-slate-50 hover:border-teal-300 hover:bg-teal-50/40",
                ].join(" ")}
              >
                <input ref={fileInputRef} type="file" multiple accept=".jpg,.jpeg,.png,.webp,.mp4,.mov" className="hidden" onChange={(event) => event.target.files && addFiles(event.target.files)} />
                <p className="text-base font-bold text-slate-900">Drag files or click to upload</p>
                <p className="mt-2 text-sm text-slate-500">Images: jpg, png, webp. Videos: mp4, mov. Max 20MB each.</p>
                <p className="mt-1 text-xs text-slate-400">Up to {MAX_IMAGES} images and {MAX_VIDEOS} videos.</p>
              </div>
              <InlineError message={stepErrors.media} />

              {mediaItems.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                    <span>{imageCount} image(s)</span>
                    <span>{videoCount} video(s)</span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {mediaItems.map((item) => (
                      <div key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <div className="relative aspect-[4/3] bg-slate-100">
                          {item.mediaType === "image" ? (
                            <img src={item.previewUrl} alt={item.file.name} className="h-full w-full object-cover" />
                          ) : (
                            <video src={item.previewUrl} className="h-full w-full object-cover" controls />
                          )}
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              removeMedia(item.id);
                            }}
                            className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm"
                          >
                            X
                          </button>
                        </div>
                        <div className="p-3">
                          <p className="truncate text-sm font-semibold text-slate-900">{item.file.name}</p>
                          <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">{item.mediaType}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {step === 5 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Available from</label>
                <input type="date" value={form.availableFrom} onChange={(event) => updateForm("availableFrom", event.target.value)} className={inputClass(Boolean(stepErrors.availableFrom))} />
                <InlineError message={stepErrors.availableFrom} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Lease duration (months)</label>
                <select value={form.leaseDurationMonths} onChange={(event) => updateForm("leaseDurationMonths", event.target.value)} className={inputClass(false)}>
                  {leaseDurationOptions.map((months) => (
                    <option key={months} value={months}>
                      {months} months
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-5">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="relative aspect-[16/7] bg-slate-100">
                    {mediaItems.find((item) => item.mediaType === "image") ? (
                      <img
                        src={mediaItems.find((item) => item.mediaType === "image")?.previewUrl}
                        alt={form.title || "Property preview"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm font-medium text-slate-400">No cover image selected yet</div>
                    )}
                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-white">{form.propertyType || "Property type"}</span>
                      {offerBadge && (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                          {form.featuredListing ? "Featured Property" : offerBadge}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 p-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h4 className="text-xl font-bold text-slate-900">{form.title || "Untitled listing"}</h4>
                        <p className="mt-1 text-sm text-slate-500">
                          {[form.formattedAddress || form.streetAddress, buildListingCity(form.country, form.province, form.city), form.postalCode]
                            .filter(Boolean)
                            .join(", ") || "Address pending"}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-2xl font-extrabold text-slate-900">{form.monthlyRent ? `$${Number(form.monthlyRent).toLocaleString()}` : "$0"}<span className="text-base font-medium text-slate-400">/mo</span></p>
                        <p className="mt-1 text-xs font-medium text-slate-500">{form.bedrooms || "-"} bd Â· {form.bathrooms || "-"} ba Â· {form.squareFeet || "-"} sq ft</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {form.amenities.length > 0 ? (
                        form.amenities.map((amenity) => (
                          <span key={amenity} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            {amenity}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-400">No amenities selected</span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 md:grid-cols-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Offers</p>
                        <p className="mt-1 text-sm font-medium text-slate-700">{offerBadge ?? "No promotional offer"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Media</p>
                        <p className="mt-1 text-sm font-medium text-slate-700">{imageCount} images, {videoCount} videos</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Availability</p>
                        <p className="mt-1 text-sm font-medium text-slate-700">{form.availableFrom || "Not set"} Â· {form.leaseDurationMonths} months</p>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
          disabled={step === 0 || isSubmitting}
          className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Back
        </button>

        {step < STEP_TITLES.length - 1 ? (
          <button
            type="button"
            onClick={handleContinue}
            disabled={isSubmitting}
            className="rounded-xl bg-teal-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
            className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting ? "Submitting..." : "Submit listing"}
          </button>
        )}
      </div>

      {showValidationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-lg font-bold text-slate-900">Required fields missing</h4>
                <p className="mt-1 text-sm text-slate-500">Complete these items before moving to the next step.</p>
              </div>
              <button type="button" onClick={() => setShowValidationModal(false)} className="text-sm font-semibold text-slate-500 hover:text-slate-700">
                Close
              </button>
            </div>
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <ul className="space-y-2 text-sm font-medium text-amber-800">
                {validationMessages.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
            <div className="mt-5 flex justify-end">
              <button type="button" onClick={() => setShowValidationModal(false)} className="rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-600">
                Review form
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
