import { supabase } from "@/lib/supabaseClient";
import type {
  CreateLandlordListingInput,
  LandlordListingRecord,
  LandlordListingWithCover,
  ListingPhotoRecord,
} from "@/types/listing";

const listingPhotoBucket = "listing-photos";

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function createLandlordListing(
  landlordId: string,
  input: CreateLandlordListingInput,
  photos: File[],
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

  if (photos.length > 0) {
    const photoRows: Array<Pick<ListingPhotoRecord, "listing_id" | "landlord_id" | "storage_path" | "sort_order">> = [];
    for (let index = 0; index < photos.length; index += 1) {
      const file = photos[index];
      const path = `${landlordId}/${listing.id}/${Date.now()}-${index}-${sanitizeFileName(file.name)}`;
      const { error: uploadError } = await supabase.storage
        .from(listingPhotoBucket)
        .upload(path, file, { upsert: false, contentType: file.type || undefined });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      photoRows.push({
        listing_id: listing.id,
        landlord_id: landlordId,
        storage_path: path,
        sort_order: index,
      });
    }

    const { error: photoInsertError } = await supabase.from("listing_photos").insert(photoRows);
    if (photoInsertError) {
      throw new Error(photoInsertError.message);
    }
  }

  return listing as LandlordListingRecord;
}

export async function getLandlordListings(landlordId: string): Promise<LandlordListingWithCover[]> {
  const { data, error } = await supabase
    .from("landlord_listings")
    .select("*, listing_photos(id, storage_path, sort_order)")
    .eq("landlord_id", landlordId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const mapped = (data ?? []) as Array<
    LandlordListingRecord & { listing_photos?: Array<Pick<ListingPhotoRecord, "id" | "storage_path" | "sort_order">> }
  >;

  const withCover = await Promise.all(
    mapped.map(async (listing) => {
      const sorted = [...(listing.listing_photos ?? [])].sort((a, b) => a.sort_order - b.sort_order);
      const firstPhoto = sorted[0];
      let coverUrl: string | null = null;

      if (firstPhoto?.storage_path) {
        const { data: signed } = await supabase.storage.from(listingPhotoBucket).createSignedUrl(firstPhoto.storage_path, 3600);
        coverUrl = signed?.signedUrl ?? null;
      }

      return {
        ...listing,
        cover_photo_url: coverUrl,
        photo_count: sorted.length,
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

  if (paths.length > 0) {
    const { error: removeError } = await supabase.storage.from(listingPhotoBucket).remove(paths);
    if (removeError) {
      throw new Error(removeError.message);
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
