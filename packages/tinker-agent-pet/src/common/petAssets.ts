export const TRUSTED_ASSET_HOST = 'assets.petdex.dev'

export function defaultPetPreviewUrl(slug: string) {
  return `https://${TRUSTED_ASSET_HOST}/pets/${slug}/preview.webp`
}
