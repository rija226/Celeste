const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;

// cards.image_url cuva samo kratko ime fajla (npr. "mars_full_disk"), bez
// ekstenzije i bez punog URL-a -- puni javni Storage URL se sastavlja ovdje.
// Slike se organizuju po slug-u decka, format .webp (vidi vodic-slike.md).
export function getCardImageUrl(deckSlug: string, imageName: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/card-images/${deckSlug}/${imageName}.webp`;
}
