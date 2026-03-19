import { supabase } from "@/lib/supabaseClient";
import type {
  CreateLandlordListingInput,
  LandlordListingRecord,
  LandlordListingWithCover,
  ListingMediaRecord,
  ListingPhotoRecord,
} from "@/types/listing";

const listingPhotoBucket = "listing-photos";
const propertyMediaBucket = "property-media";

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function createLandlordListing(
  landlordId: string,
  input: CreateLandlordListingInput,
  mediaFiles: File[],
  onUploadProgress?: (message: string) => void,
): Promise<LandlordListingRecord> {
  const { data: listing, error: listingError } = await supabase
    .from("landlord_listings")
    .insert({
      landlord_id: landlordId,
      ...input,
    })
    .select("*")
    .single();

  if (listingError || !listing) {
    throw new Error(listingError?.message ?? "Failed to create listing.");
  }

  if (mediaFiles.length > 0) {
    const mediaRows: Array<Pick<ListingMediaRecord, "listing_id" | "landlord_id" | "storage_path" | "media_type" | "sort_order">> = [];
    let panoramaPath: string | null = null;
    for (let index = 0; index < mediaFiles.length; index += 1) {
      const file = mediaFiles[index];
      const mediaType = file.type.startsWith("video/")
        ? "video"
        : file.name.includes("__panorama__")
          ? "panorama"
          : "image";
      const folder = mediaType === "video" ? "videos" : mediaType === "panorama" ? "panorama" : "images";
      const path = `${listing.id}/${folder}/${Date.now()}-${index}-${sanitizeFileName(file.name)}`;
      onUploadProgress?.(`Uploading ${mediaType} ${index + 1} of ${mediaFiles.length}...`);
      const { error: uploadError } = await supabase.storage
        .from(propertyMediaBucket)
        .upload(path, file, { upsert: false, contentType: file.type || undefined });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      mediaRows.push({
        listing_id: listing.id,
        landlord_id: landlordId,
        storage_path: path,
        media_type: mediaType,
        sort_order: index,
      });

      if (mediaType === "panorama" && !panoramaPath) {
        panoramaPath = path;
      }
    }

    const { error: mediaInsertError } = await supabase.from("listing_media").insert(mediaRows);
    if (mediaInsertError) {
      throw new Error(mediaInsertError.message);
    }

    if (panoramaPath) {
      const { error: panoramaUpdateError } = await supabase
        .from("landlord_listings")
        .update({ tour_360_storage_path: panoramaPath })
        .eq("id", listing.id)
        .eq("landlord_id", landlordId);

      if (panoramaUpdateError) {
        throw new Error(panoramaUpdateError.message);
      }
    }
  }

  return listing as LandlordListingRecord;
}

export async function getLandlordListings(landlordId: string): Promise<LandlordListingWithCover[]> {
  const { data, error } = await supabase
    .from("landlord_listings")
    .select("*, listing_media(id, storage_path, media_type, sort_order), listing_photos(id, storage_path, sort_order)")
    .eq("landlord_id", landlordId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const mapped = (data ?? []) as Array<
    LandlordListingRecord & {
      listing_media?: Array<Pick<ListingMediaRecord, "id" | "storage_path" | "media_type" | "sort_order">>;
      listing_photos?: Array<Pick<ListingPhotoRecord, "id" | "storage_path" | "sort_order">>;
    }
  >;

  const withCover = await Promise.all(
    mapped.map(async (listing) => {
      const media = [...(listing.listing_media ?? [])].sort((a, b) => a.sort_order - b.sort_order);
      const legacyPhotos = [...(listing.listing_photos ?? [])].sort((a, b) => a.sort_order - b.sort_order);
      const images = media.filter((item) => item.media_type === "image");
      const videos = media.filter((item) => item.media_type === "video");
      const panoramas = media.filter((item) => item.media_type === "panorama");
      const panoramaPath = listing.tour_360_storage_path ?? panoramas[0]?.storage_path ?? null;
      const firstPhoto = images[0] ?? legacyPhotos[0];
      let coverUrl: string | null = null;
      let panoramaUrl: string | null = null;

      if (firstPhoto?.storage_path) {
        const bucket = "media_type" in firstPhoto ? propertyMediaBucket : listingPhotoBucket;
        const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(firstPhoto.storage_path, 3600);
        coverUrl = signed?.signedUrl ?? null;
      }

      if (panoramaPath) {
        const { data: signedPanorama } = await supabase.storage.from(propertyMediaBucket).createSignedUrl(panoramaPath, 3600);
        panoramaUrl = signedPanorama?.signedUrl ?? null;
      }

      const specialOfferBadge = listing.featured_listing
        ? "Featured Property"
        : listing.discount_percentage
          ? `First ${listing.discount_duration_months ?? 1} month${(listing.discount_duration_months ?? 1) > 1 ? "s" : ""} ${listing.discount_percentage}% off`
          : listing.limited_time_offer_title;

      return {
        ...listing,
        cover_photo_url: coverUrl,
        photo_count: images.length || legacyPhotos.length,
        video_count: videos.length,
        media_count: media.length || legacyPhotos.length,
        special_offer_badge: specialOfferBadge ?? null,
        tour_360_storage_path: panoramaPath,
        tour_360_url: panoramaUrl,
      } satisfies LandlordListingWithCover;
    }),
  );

  return withCover;
}

export async function deleteLandlordListing(landlordId: string, listingId: string): Promise<void> {
  const { data: photos } = await supabase
    .from("listing_photos")
    .select("storage_path")
    .eq("listing_id", listingId)
    .eq("landlord_id", landlordId);

  const paths = (photos ?? [])
    .map((photo) => photo.storage_path as string)
    .filter(Boolean);

  const { data: media } = await supabase
    .from("listing_media")
    .select("storage_path")
    .eq("listing_id", listingId)
    .eq("landlord_id", landlordId);

  const mediaPaths = (media ?? [])
    .map((item) => item.storage_path as string)
    .filter(Boolean);

  if (paths.length > 0) {
    const { error: removeError } = await supabase.storage.from(listingPhotoBucket).remove(paths);
    if (removeError) {
      throw new Error(removeError.message);
    }
  }

  if (mediaPaths.length > 0) {
    const { error: removeMediaError } = await supabase.storage.from(propertyMediaBucket).remove(mediaPaths);
    if (removeMediaError) {
      throw new Error(removeMediaError.message);
    }
  }

  const { error } = await supabase
    .from("landlord_listings")
    .delete()
    .eq("id", listingId)
    .eq("landlord_id", landlordId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateLandlordListing(
  landlordId: string,
  listingId: string,
  updates: Partial<CreateLandlordListingInput>,
): Promise<LandlordListingRecord> {
  const { data, error } = await supabase
    .from("landlord_listings")
    .update(updates)
    .eq("id", listingId)
    .eq("landlord_id", landlordId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update listing.");
  }

  return data as LandlordListingRecord;
}
