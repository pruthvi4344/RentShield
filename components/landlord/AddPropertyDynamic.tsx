"use client";

import { useEffect, useRef, useState } from "react";
import { createLandlordListing } from "@/lib/landlordListingService";
import { getAuthIdentity } from "@/lib/profileService";
import Viewer360 from "@/components/Viewer360";

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
const MAX_PANORAMAS = 1;
const MAX_PANORAMA_WIDTH = 4096;

const propertyTypes = ["Apartment", "Condo", "Basement", "Private Room", "Shared Room"];
const furnishingTypes = [
  { value: "furnished", label: "Furnished" },
  { value: "unfurnished", label: "Unfurnished" },
  { value: "partially", label: "Partially" },
] as const;
const cities = ["Toronto, ON", "Vancouver, BC", "Waterloo, ON", "Montreal, QC", "Ottawa, ON", "Calgary, AB"];
const durationOptions = [1, 2, 3];
const leaseDurationOptions = [3, 6, 8, 12, 16, 24];

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
  streetAddress: string;
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
  mediaType: "image" | "video" | "panorama";
};

type StepErrors = Partial<Record<keyof FormState | "media" | "matterport", string>>;

const initialFormState: FormState = {
  title: "",
  propertyType: "",
  streetAddress: "",
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

function isAllowedFile(file: File): { ok: boolean; type: "image" | "video" | null } {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "webp"].includes(extension)) return { ok: true, type: "image" };
  if (["mp4", "mov"].includes(extension)) return { ok: true, type: "video" };
  return { ok: false, type: null };
}

function buildPanoramaFile(file: File): File {
  const extension = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : ".jpg";
  const baseName = file.name.replace(/\.[^.]+$/, "");
  const safeName = `${baseName}__panorama__${extension}`;
  return new File([file], safeName, { type: file.type || "image/jpeg", lastModified: file.lastModified });
}

async function loadImageElement(file: File): Promise<HTMLImageElement> {
  return await new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Panorama image could not be read."));
    };
    image.src = objectUrl;
  });
}

async function optimizePanoramaFile(file: File): Promise<File> {
  const image = await loadImageElement(file);
  if (image.naturalWidth <= MAX_PANORAMA_WIDTH) {
    return file;
  }

  const targetWidth = MAX_PANORAMA_WIDTH;
  const targetHeight = Math.max(1, Math.round((image.naturalHeight / image.naturalWidth) * targetWidth));
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    return file;
  }
  context.drawImage(image, 0, 0, targetWidth, targetHeight);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.92);
  });
  if (!blob) {
    return file;
  }

  const baseName = file.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg", lastModified: file.lastModified });
}

function validateBasicInfo(form: FormState): StepErrors {
  const errors: StepErrors = {};
  if (!form.title.trim()) errors.title = "Property title is required";
  if (!form.propertyType.trim()) errors.propertyType = "Property type is required";
  if (!form.streetAddress.trim()) errors.streetAddress = "Street address is required";
  if (!form.city.trim()) errors.city = "City must be selected";
  if (!form.postalCode.trim()) errors.postalCode = "Postal code is required";
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
  const errors: StepErrors = {};
  const images = mediaItems.filter((item) => item.mediaType === "image").length;
  const videos = mediaItems.filter((item) => item.mediaType === "video").length;
  const panoramas = mediaItems.filter((item) => item.mediaType === "panorama").length;
  if (images > MAX_IMAGES) errors.media = `Maximum ${MAX_IMAGES} images allowed`;
  if (videos > MAX_VIDEOS) errors.media = `Maximum ${MAX_VIDEOS} videos allowed`;
  if (panoramas > MAX_PANORAMAS) errors.media = `Only ${MAX_PANORAMAS} panorama image is allowed`;
  if (form.matterportUrl.trim() && form.matterportEmbed.trim()) {
    errors.matterport = "Use either a Matterport link or iframe embed, not both";
  }
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
      ? "border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:ring-teal-200"
      : "border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:ring-teal-200",
  ].join(" ");
}

function InlineError({ message }: { message?: string }) {
  void message;
  return null;
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
  const [showPanoramaModal, setShowPanoramaModal] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [panoramaHint, setPanoramaHint] = useState("");
  const didHydrateDraft = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const panoramaInputRef = useRef<HTMLInputElement | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const imageCount = mediaItems.filter((item) => item.mediaType === "image").length;
  const videoCount = mediaItems.filter((item) => item.mediaType === "video").length;
  const panoramaCount = mediaItems.filter((item) => item.mediaType === "panorama").length;
  const panoramaItem = mediaItems.find((item) => item.mediaType === "panorama") ?? null;
  const offerBadge = buildSpecialOfferBadge(form);

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
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [mediaItems]);

  useEffect(() => {
    if (!showPanoramaModal) {
      stopCameraPreview();
      setCameraError("");
    }
  }, [showPanoramaModal]);

  async function startCameraPreview() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraReady(false);
      return;
    }

    try {
      setCameraError("");
      setCameraReady(false);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = stream;
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        await cameraVideoRef.current.play().catch(() => undefined);
      }
      setCameraReady(true);
    } catch (error) {
      setCameraReady(false);
      setCameraError(error instanceof Error ? error.message : "Unable to start camera preview.");
    }
  }

  function stopCameraPreview() {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }
    setCameraReady(false);
  }

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

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
        if (target.mediaType === "panorama") {
          setPanoramaHint("");
        }
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

  async function addPanoramaFile(file: File | null) {
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(extension)) {
      setStepErrors((prev) => ({ ...prev, media: "360 panorama must be an image file (jpg, png, webp, heic)" }));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setStepErrors((prev) => ({ ...prev, media: "Panorama image must be 20MB or smaller" }));
      return;
    }

    let probeImage: HTMLImageElement;
    try {
      probeImage = await loadImageElement(file);
    } catch {
      setStepErrors((prev) => ({
        ...prev,
        media: "This file cannot be read for 360 view. Export the panorama as JPG/PNG/WebP and upload again.",
      }));
      return;
    }

    const ratio = probeImage.naturalWidth / Math.max(1, probeImage.naturalHeight);
    if (ratio < 1.6 || ratio > 2.4) {
      setPanoramaHint("Tip: This image is not a wide panorama, so it will not feel like Google 360. Use phone Panorama mode for full room view.");
    } else {
      setPanoramaHint("");
    }

    let panoramaSource = file;
    try {
      panoramaSource = await optimizePanoramaFile(file);
    } catch (error) {
      console.warn("Panorama pre-processing skipped:", error);
    }

    setStepErrors((prev) => ({ ...prev, media: undefined }));
    setGlobalError("");
    const panoramaFile = buildPanoramaFile(panoramaSource);
    const panoramaItem: MediaItem = {
      id: `${panoramaFile.name}-${panoramaFile.lastModified}-${Math.random().toString(36).slice(2)}`,
      file: panoramaFile,
      previewUrl: URL.createObjectURL(panoramaFile),
      mediaType: "panorama",
    };

    setMediaItems((prev) => {
      const existingPanoramas = prev.filter((item) => item.mediaType === "panorama");
      existingPanoramas.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      return [...prev.filter((item) => item.mediaType !== "panorama"), panoramaItem];
    });
    setShowPanoramaModal(false);
    stopCameraPreview();
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
          city: form.city,
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
          matterport_url: form.matterportUrl.trim() || null,
          matterport_embed: form.matterportEmbed.trim() || null,
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
      setPanoramaHint("");
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
            {step === 0 && "Required: title, property type, street address, city, and postal code."}
            {step === 1 && "Required: beds, baths, square feet, rent, deposit, and furnishing."}
            {step === 2 && "Optional promotional offers that make the property stand out."}
            {step === 3 && "Optional amenities. Select all that apply."}
            {step === 4 && "Upload images, videos, and a 360 panorama tour."}
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

              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Street address</label>
                <input
                  value={form.streetAddress}
                  onChange={(event) => updateForm("streetAddress", event.target.value)}
                  placeholder="123 Main St, Unit 4A"
                  className={inputClass(Boolean(stepErrors.streetAddress))}
                />
                <InlineError message={stepErrors.streetAddress} />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">City</label>
                <select value={form.city} onChange={(event) => updateForm("city", event.target.value)} className={inputClass(Boolean(stepErrors.city))}>
                  <option value="">Select city</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                <InlineError message={stepErrors.city} />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Postal code</label>
                <input
                  value={form.postalCode}
                  onChange={(event) => updateForm("postalCode", event.target.value.toUpperCase())}
                  placeholder="M5S 1A1"
                  className={inputClass(Boolean(stepErrors.postalCode))}
                />
                <InlineError message={stepErrors.postalCode} />
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
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Create 360° Room Tour</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Use the guided mobile flow to capture or upload one panorama image for the room tour.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPanoramaModal(true)}
                    className="rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-600"
                  >
                    Create 360° Room Tour
                  </button>
                  {panoramaCount > 0 && (
                    <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                      Panorama attached
                    </span>
                  )}
                </div>
              </div>

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
                <p className="mt-1 text-xs text-slate-400">Up to {MAX_IMAGES} images and {MAX_VIDEOS} videos. Panorama is uploaded from the 360 tour flow.</p>
              </div>
              <InlineError message={stepErrors.media} />

              {mediaItems.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                    <span>{imageCount} image(s)</span>
                    <span>{videoCount} video(s)</span>
                    <span>{panoramaCount} panorama</span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {mediaItems.map((item) => (
                      <div key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <div className="relative aspect-[4/3] bg-slate-100">
                          {item.mediaType === "image" ? (
                            <img src={item.previewUrl} alt={item.file.name} className="h-full w-full object-cover" />
                          ) : item.mediaType === "panorama" ? (
                            <>
                              <img src={item.previewUrl} alt={item.file.name} className="h-full w-full object-cover" />
                              <div className="absolute left-3 top-3 rounded-full bg-slate-900/75 px-2.5 py-1 text-xs font-semibold text-white">
                                360 Tour
                              </div>
                            </>
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

              {panoramaItem && (
                <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">Interactive 360° Preview</p>
                  <p className="text-xs text-slate-500">Drag left or right with mouse, or swipe on mobile, to look around the whole room.</p>
                  {panoramaHint && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                      {panoramaHint}
                    </div>
                  )}
                  <Viewer360 src={panoramaItem.previewUrl} className="border-slate-100" />
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
                        <p className="mt-1 text-sm text-slate-500">{[form.streetAddress, form.city, form.postalCode].filter(Boolean).join(", ") || "Address pending"}</p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-2xl font-extrabold text-slate-900">{form.monthlyRent ? `$${Number(form.monthlyRent).toLocaleString()}` : "$0"}<span className="text-base font-medium text-slate-400">/mo</span></p>
                        <p className="mt-1 text-xs font-medium text-slate-500">{form.bedrooms || "-"} bd · {form.bathrooms || "-"} ba · {form.squareFeet || "-"} sq ft</p>
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
                        <p className="mt-1 text-sm font-medium text-slate-700">{imageCount} images, {videoCount} videos, {panoramaCount} panorama</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Availability</p>
                        <p className="mt-1 text-sm font-medium text-slate-700">{form.availableFrom || "Not set"} · {form.leaseDurationMonths} months</p>
                      </div>
                    </div>

                    {panoramaItem && (
                      <div className="space-y-2 border-t border-slate-100 pt-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">360 Room Tour</p>
                        <Viewer360 src={panoramaItem.previewUrl} className="border-slate-100" />
                      </div>
                    )}
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

      {showPanoramaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-lg font-bold text-slate-900">Create 360° Room Tour</h4>
                <p className="mt-1 text-sm text-slate-500">
                  Use the preview below as a guide, then capture the final panorama using your phone camera and upload it here.
                </p>
              </div>
              <button type="button" onClick={() => setShowPanoramaModal(false)} className="text-sm font-semibold text-slate-500 hover:text-slate-700">
                Close
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
                <div className="relative aspect-video">
                  <video ref={cameraVideoRef} muted playsInline className="h-full w-full object-cover" />
                  {!cameraReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 px-4 text-center text-sm font-medium text-white">
                      Camera preview is optional. On iPhone, use the upload button below to open the camera or photo library directly.
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">How to capture the panorama</p>
                  <ol className="mt-3 space-y-2">
                    <li>1. Open your phone camera.</li>
                    <li>2. Switch to Panorama mode.</li>
                    <li>3. Slowly capture the room from one corner to the other.</li>
                    <li>4. Upload the panorama image here (wide 2:1 format works best).</li>
                  </ol>
                </div>

                {cameraError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {cameraError}
                  </div>
                )}

                <input
                  ref={panoramaInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                  capture="environment"
                  className="hidden"
                  onChange={(event) => {
                    const selectedFile = event.target.files?.[0] ?? null;
                    event.target.value = "";
                    void addPanoramaFile(selectedFile);
                  }}
                />

                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => panoramaInputRef.current?.click()}
                    className="rounded-xl bg-teal-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-600"
                  >
                    Open Camera / Upload Panorama
                  </button>
                  <button
                    type="button"
                    onClick={() => void startCameraPreview()}
                    className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
                  >
                    Start Optional Live Preview
                  </button>
                </div>

                {panoramaItem && (
                  <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Panorama</p>
                    <Viewer360 src={panoramaItem.previewUrl} className="border-slate-100" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
