import { contextBridge } from 'electron'
import crypto from 'node:crypto'
import fs from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import zlib from 'node:zlib'
import { pathToFileURL } from 'node:url'
import type {
  AgentPetApi,
  InstalledPet,
  PetDownloadProgress,
  PetSearchItem,
  PetSearchResponse,
} from '../common/types'

const PETDEX_ORIGIN = 'https://petdex.dev'
const PETDEX_SEARCH_URL = `${PETDEX_ORIGIN}/api/pets/search`
const TRUSTED_ASSET_HOST = 'assets.petdex.dev'
const STORAGE_DIRECTORY_NAME = 'tinker-agent-pet'
const MAX_RESPONSE_BYTES = 12 * 1024 * 1024
const MAX_ZIP_ENTRIES = 32
const MAX_PET_JSON_BYTES = 64 * 1024
const MAX_SPRITESHEET_BYTES = 10 * 1024 * 1024
const MAX_SOUND_BYTES = 3 * 1024 * 1024
const MAX_TOTAL_UNCOMPRESSED_BYTES = MAX_PET_JSON_BYTES + MAX_SPRITESHEET_BYTES
const PREVIEW_ASSET_CACHE_LIMIT = 24

const previewAssetCache = new Map<string, Promise<string>>()

function assertSafeSlug(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/.test(value)
  ) {
    throw new Error('Invalid pet slug')
  }
  return value
}

function assertPackageId(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Invalid pet.json id')
  const packageId = value.trim()
  if (
    !packageId ||
    packageId.length > 120 ||
    /[\u0000-\u001f\u007f]/.test(packageId)
  ) {
    throw new Error('Invalid pet.json id')
  }
  return packageId
}

function assertTrustedAssetUrl(value: unknown): URL {
  if (typeof value !== 'string') throw new Error('Missing asset URL')
  const url = new URL(value)
  if (
    url.protocol !== 'https:' ||
    url.hostname !== TRUSTED_ASSET_HOST ||
    url.username ||
    url.password
  ) {
    throw new Error('Untrusted asset URL')
  }
  return url
}

async function getStorageRoot(): Promise<string> {
  const root = path.join(homedir(), '.tinker', STORAGE_DIRECTORY_NAME)
  fs.mkdirSync(root, { recursive: true })
  return root
}

async function getPetsRoot(): Promise<string> {
  const root = path.join(await getStorageRoot(), 'pets')
  fs.mkdirSync(root, { recursive: true })
  return root
}

async function requestBuffer(
  input: string | URL,
  onProgress?: (progress: PetDownloadProgress) => void,
  maxBytes = MAX_RESPONSE_BYTES,
): Promise<Buffer> {
  const url = input instanceof URL ? input : new URL(input)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20_000)
  try {
    const response = await fetch(url, {
      headers: {
        Accept:
          'application/json, application/zip, audio/mpeg, image/webp, image/png, */*',
        Referer: `${PETDEX_ORIGIN}/`,
        'User-Agent': 'Tinker Agent Pet/1.0',
      },
      redirect: 'follow',
      signal: controller.signal,
    })
    if (!response.ok)
      throw new Error(`Petdex request failed (${response.status})`)

    const finalUrl = new URL(response.url)
    if (
      ![PETDEX_ORIGIN, `https://${TRUSTED_ASSET_HOST}`].includes(
        finalUrl.origin,
      )
    ) {
      throw new Error('Redirected to an untrusted host')
    }

    const totalHeader = Number(response.headers.get('content-length'))
    const totalBytes =
      Number.isFinite(totalHeader) && totalHeader > 0 ? totalHeader : null
    onProgress?.({
      receivedBytes: 0,
      totalBytes,
      percent: totalBytes ? 0 : null,
    })

    if (!response.body) {
      const buffer = Buffer.from(await response.arrayBuffer())
      if (buffer.length > maxBytes)
        throw new Error('Download exceeds size limit')
      onProgress?.({
        receivedBytes: buffer.length,
        totalBytes,
        percent: totalBytes
          ? Math.min(100, Math.round((buffer.length / totalBytes) * 100))
          : null,
      })
      return buffer
    }

    const reader = response.body.getReader()
    const chunks: Buffer[] = []
    let receivedBytes = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      receivedBytes += value.byteLength
      if (receivedBytes > maxBytes)
        throw new Error('Download exceeds size limit')
      chunks.push(Buffer.from(value))
      onProgress?.({
        receivedBytes,
        totalBytes,
        percent: totalBytes
          ? Math.min(100, Math.round((receivedBytes / totalBytes) * 100))
          : null,
      })
    }
    return Buffer.concat(chunks)
  } finally {
    clearTimeout(timer)
  }
}

function parseJsonBuffer(buffer: Buffer, label: string): unknown {
  try {
    return JSON.parse(buffer.toString('utf8'))
  } catch {
    throw new Error(`${label} is not valid JSON`)
  }
}

function normalizePet(value: unknown): PetSearchItem {
  if (!value || typeof value !== 'object') throw new Error('Invalid pet data')
  const pet = value as Record<string, unknown>
  const slug = assertSafeSlug(pet.slug)
  const zipUrl = assertTrustedAssetUrl(pet.zipUrl).toString()
  const spritesheetPath = assertTrustedAssetUrl(pet.spritesheetPath).toString()
  const displayName =
    typeof pet.displayName === 'string' ? pet.displayName.trim() : ''
  if (!displayName || displayName.length > 120)
    throw new Error(`Invalid name for ${slug}`)
  const spriteVersionNumber = pet.spriteVersionNumber === 2 ? 2 : 1
  const kind =
    pet.kind === 'creature' || pet.kind === 'object' || pet.kind === 'character'
      ? pet.kind
      : 'creature'
  const submittedBy =
    pet.submittedBy && typeof pet.submittedBy === 'object'
      ? (pet.submittedBy as Record<string, unknown>)
      : {}
  const metrics =
    pet.metrics && typeof pet.metrics === 'object'
      ? (pet.metrics as Record<string, unknown>)
      : {}
  return {
    slug,
    displayName,
    description:
      typeof pet.description === 'string' ? pet.description.slice(0, 1000) : '',
    spritesheetPath,
    zipUrl,
    soundUrl:
      typeof pet.soundUrl === 'string'
        ? assertTrustedAssetUrl(pet.soundUrl).toString()
        : undefined,
    featured: pet.featured === true,
    kind,
    vibes: Array.isArray(pet.vibes)
      ? pet.vibes.filter((item: unknown) => typeof item === 'string')
      : [],
    tags: Array.isArray(pet.tags)
      ? pet.tags.filter((item: unknown) => typeof item === 'string')
      : [],
    dominantColor:
      typeof pet.dominantColor === 'string' ? pet.dominantColor : undefined,
    submittedBy: {
      name:
        typeof submittedBy.name === 'string'
          ? submittedBy.name.slice(0, 120)
          : 'Petdex creator',
      imageUrl:
        typeof submittedBy.imageUrl === 'string'
          ? submittedBy.imageUrl
          : undefined,
    },
    previewUrl: `https://${TRUSTED_ASSET_HOST}/pets/${slug}/preview.webp`,
    spriteVersionNumber,
    dexNumber: Number.isFinite(pet.dexNumber)
      ? Number(pet.dexNumber)
      : undefined,
    metrics: {
      installCount: Number.isFinite(metrics.installCount)
        ? Number(metrics.installCount)
        : 0,
      likeCount: Number.isFinite(metrics.likeCount)
        ? Number(metrics.likeCount)
        : 0,
      zipDownloadCount: Number.isFinite(metrics.zipDownloadCount)
        ? Number(metrics.zipDownloadCount)
        : 0,
    },
  }
}

async function searchPets(
  params: {
    query?: string
    sort?: string
    cursor?: number
    limit?: number
    kinds?: string[]
    vibes?: string[]
  } = {},
): Promise<PetSearchResponse> {
  const query =
    typeof params.query === 'string' ? params.query.trim().slice(0, 120) : ''
  const cursor =
    Number.isInteger(params.cursor) && (params.cursor as number) >= 0
      ? (params.cursor as number)
      : 0
  const limit = Number.isInteger(params.limit)
    ? Math.min(Math.max(params.limit as number, 1), 48)
    : 24
  const sort = ['installed', 'recent', 'popular', 'alpha', 'curated'].includes(
    params.sort || '',
  )
    ? (params.sort as string)
    : query
      ? 'curated'
      : 'installed'

  const url = new URL(PETDEX_SEARCH_URL)
  if (query) url.searchParams.set('q', query)
  url.searchParams.set('sort', sort)
  url.searchParams.set('cursor', String(cursor))
  url.searchParams.set('limit', String(limit))
  if (Array.isArray(params.kinds) && params.kinds.length) {
    url.searchParams.set('kinds', params.kinds.join(','))
  }
  if (Array.isArray(params.vibes) && params.vibes.length) {
    url.searchParams.set('vibes', params.vibes.join(','))
  }

  const response = parseJsonBuffer(
    await requestBuffer(url),
    'Petdex search',
  ) as Record<string, unknown>
  if (
    !response ||
    typeof response !== 'object' ||
    !Array.isArray(response.pets)
  ) {
    throw new Error('Invalid Petdex search response')
  }
  return {
    pets: response.pets.map(normalizePet),
    nextCursor: Number.isInteger(response.nextCursor)
      ? (response.nextCursor as number)
      : null,
    total: Number.isFinite(response.total as number)
      ? (response.total as number)
      : response.pets.length,
    searchMode:
      typeof response.searchMode === 'string' ? response.searchMode : 'all',
    facets:
      response.facets && typeof response.facets === 'object'
        ? (response.facets as Record<string, unknown>)
        : {},
  }
}

function readImageDimensions(
  image: Buffer,
  fileName: string,
): { width: number; height: number } {
  if (fileName.endsWith('.png')) {
    if (
      image.length < 24 ||
      image.toString('hex', 0, 8) !== '89504e470d0a1a0a'
    ) {
      throw new Error('Invalid spritesheet.png header')
    }
    return { width: image.readUInt32BE(16), height: image.readUInt32BE(20) }
  }
  if (
    image.length < 30 ||
    image.toString('ascii', 0, 4) !== 'RIFF' ||
    image.toString('ascii', 8, 12) !== 'WEBP'
  ) {
    throw new Error('Invalid spritesheet.webp header')
  }
  const kind = image.toString('ascii', 12, 16)
  if (kind === 'VP8X') {
    return {
      width: 1 + image.readUIntLE(24, 3),
      height: 1 + image.readUIntLE(27, 3),
    }
  }
  if (kind === 'VP8 ') {
    if (image.toString('hex', 23, 26) !== '9d012a')
      throw new Error('Invalid VP8 header')
    return {
      width: image.readUInt16LE(26) & 0x3fff,
      height: image.readUInt16LE(28) & 0x3fff,
    }
  }
  if (kind === 'VP8L') {
    if (image[20] !== 0x2f) throw new Error('Invalid VP8L header')
    const bits = image.readUInt32LE(21)
    return {
      width: 1 + (bits & 0x3fff),
      height: 1 + ((bits >> 14) & 0x3fff),
    }
  }
  throw new Error('Unsupported WebP format')
}

async function loadPreviewAsset(value: string): Promise<string> {
  const url = assertTrustedAssetUrl(value)
  const pathname = url.pathname.toLowerCase()
  const fileName = pathname.endsWith('.png')
    ? 'preview.png'
    : pathname.endsWith('.webp')
      ? 'preview.webp'
      : null
  if (!fileName) throw new Error('Unsupported preview format')

  const cacheKey = url.toString()
  const cached = previewAssetCache.get(cacheKey)
  if (cached) return cached

  const pending = requestBuffer(url)
    .then((buffer) => {
      readImageDimensions(buffer, fileName)
      const mimeType = fileName.endsWith('.png') ? 'image/png' : 'image/webp'
      return `data:${mimeType};base64,${buffer.toString('base64')}`
    })
    .catch((error) => {
      previewAssetCache.delete(cacheKey)
      throw error
    })
  previewAssetCache.set(cacheKey, pending)

  if (previewAssetCache.size > PREVIEW_ASSET_CACHE_LIMIT) {
    const oldestKey = previewAssetCache.keys().next().value
    if (oldestKey && oldestKey !== cacheKey) previewAssetCache.delete(oldestKey)
  }
  return pending
}

function findEndOfCentralDirectory(archive: Buffer): number {
  const minimumOffset = Math.max(0, archive.length - 65_557)
  for (let offset = archive.length - 22; offset >= minimumOffset; offset -= 1) {
    if (archive.readUInt32LE(offset) === 0x06054b50) return offset
  }
  throw new Error('Downloaded file is not a valid ZIP')
}

function readZipEntry(
  archive: Buffer,
  entry: {
    compressedSize: number
    uncompressedSize: number
    compressionMethod: number
    localHeaderOffset: number
  },
): Buffer {
  const offset = entry.localHeaderOffset
  if (
    offset + 30 > archive.length ||
    archive.readUInt32LE(offset) !== 0x04034b50
  ) {
    throw new Error('ZIP local header corrupted')
  }
  const nameLength = archive.readUInt16LE(offset + 26)
  const extraLength = archive.readUInt16LE(offset + 28)
  const dataStart = offset + 30 + nameLength + extraLength
  const dataEnd = dataStart + entry.compressedSize
  if (dataEnd > archive.length) throw new Error('ZIP entry incomplete')
  const compressed = archive.subarray(dataStart, dataEnd)
  let output: Buffer
  try {
    output =
      entry.compressionMethod === 0
        ? Buffer.from(compressed)
        : zlib.inflateRawSync(compressed, {
            maxOutputLength: entry.uncompressedSize,
          })
  } catch {
    throw new Error('ZIP decompression failed')
  }
  if (output.length !== entry.uncompressedSize)
    throw new Error('ZIP size mismatch')
  return output
}

function readPetArchive(archive: Buffer): {
  petJson: Buffer
  spritesheet: Buffer
  spritesheetFileName: string
} {
  const eocdOffset = findEndOfCentralDirectory(archive)
  const entryCount = archive.readUInt16LE(eocdOffset + 10)
  const centralDirectoryOffset = archive.readUInt32LE(eocdOffset + 16)
  if (entryCount < 2 || entryCount > MAX_ZIP_ENTRIES)
    throw new Error('Unexpected ZIP entry count')

  let cursor = centralDirectoryOffset
  let totalUncompressedBytes = 0
  const selectedEntries = new Map<
    string,
    {
      compressedSize: number
      uncompressedSize: number
      compressionMethod: number
      localHeaderOffset: number
    }
  >()

  for (let index = 0; index < entryCount; index += 1) {
    if (
      cursor + 46 > archive.length ||
      archive.readUInt32LE(cursor) !== 0x02014b50
    ) {
      throw new Error('ZIP central directory corrupted')
    }
    const flags = archive.readUInt16LE(cursor + 8)
    const compressionMethod = archive.readUInt16LE(cursor + 10)
    const compressedSize = archive.readUInt32LE(cursor + 20)
    const uncompressedSize = archive.readUInt32LE(cursor + 24)
    const nameLength = archive.readUInt16LE(cursor + 28)
    const extraLength = archive.readUInt16LE(cursor + 30)
    const commentLength = archive.readUInt16LE(cursor + 32)
    const localHeaderOffset = archive.readUInt32LE(cursor + 42)
    const fileName = archive
      .subarray(cursor + 46, cursor + 46 + nameLength)
      .toString('utf8')
    const normalizedName = fileName.replace(/\\/g, '/')
    const baseName = path.posix.basename(normalizedName)

    if (
      normalizedName.startsWith('/') ||
      normalizedName.split('/').includes('..') ||
      normalizedName.includes('\0')
    ) {
      throw new Error('ZIP contains unsafe paths')
    }
    if ((flags & 0x1) !== 0) throw new Error('Encrypted ZIP not supported')
    if (![0, 8].includes(compressionMethod))
      throw new Error('Unsupported ZIP compression')
    totalUncompressedBytes += uncompressedSize
    if (totalUncompressedBytes > MAX_TOTAL_UNCOMPRESSED_BYTES) {
      throw new Error('ZIP exceeds uncompressed size limit')
    }

    if (
      ['pet.json', 'spritesheet.webp', 'spritesheet.png'].includes(baseName)
    ) {
      if (selectedEntries.has(baseName))
        throw new Error(`Duplicate ${baseName} in ZIP`)
      selectedEntries.set(baseName, {
        compressedSize,
        uncompressedSize,
        compressionMethod,
        localHeaderOffset,
      })
    }
    cursor += 46 + nameLength + extraLength + commentLength
  }

  const petEntry = selectedEntries.get('pet.json')
  const spriteName = selectedEntries.has('spritesheet.webp')
    ? 'spritesheet.webp'
    : selectedEntries.has('spritesheet.png')
      ? 'spritesheet.png'
      : null
  if (!petEntry || !spriteName)
    throw new Error('ZIP missing pet.json or spritesheet')
  if (petEntry.uncompressedSize > MAX_PET_JSON_BYTES)
    throw new Error('pet.json too large')
  const spriteEntry = selectedEntries.get(spriteName)!
  if (spriteEntry.uncompressedSize > MAX_SPRITESHEET_BYTES) {
    throw new Error('Spritesheet too large')
  }

  return {
    petJson: readZipEntry(archive, petEntry),
    spritesheet: readZipEntry(archive, spriteEntry),
    spritesheetFileName: spriteName,
  }
}

function validatePetSound(sound: Buffer): Buffer {
  const hasId3Header =
    sound.length >= 3 && sound.toString('ascii', 0, 3) === 'ID3'
  const hasFrameSync =
    sound.length >= 2 && sound[0] === 0xff && (sound[1]! & 0xe0) === 0xe0
  if (
    !sound.length ||
    sound.length > MAX_SOUND_BYTES ||
    (!hasId3Header && !hasFrameSync)
  ) {
    throw new Error('Invalid pet sound file')
  }
  return sound
}

async function downloadPetSound(soundUrl?: string): Promise<Buffer | null> {
  if (!soundUrl) return null
  try {
    return validatePetSound(
      await requestBuffer(
        assertTrustedAssetUrl(soundUrl),
        undefined,
        MAX_SOUND_BYTES,
      ),
    )
  } catch (error) {
    console.warn('[tinker-agent-pet] optional sound download failed', error)
    return null
  }
}

function validatePetFiles(
  petJsonBuffer: Buffer,
  spritesheet: Buffer,
  spritesheetFileName: string,
  catalogPet: PetSearchItem,
): Record<string, unknown> {
  const petJson = parseJsonBuffer(petJsonBuffer, 'pet.json') as Record<
    string,
    unknown
  >
  if (!petJson || typeof petJson !== 'object')
    throw new Error('Invalid pet.json')
  const packageId = assertPackageId(petJson.id)
  const spriteVersionNumber =
    petJson.spriteVersionNumber == null
      ? 1
      : Number(petJson.spriteVersionNumber)
  if (spriteVersionNumber !== 1 && spriteVersionNumber !== 2) {
    throw new Error('Invalid sprite version')
  }

  const expectedHeight = spriteVersionNumber === 2 ? 208 * 11 : 208 * 9
  const dimensions = readImageDimensions(spritesheet, spritesheetFileName)
  if (dimensions.width !== 192 * 8 || dimensions.height !== expectedHeight) {
    throw new Error(`Spritesheet must be 1536×${expectedHeight}`)
  }
  return {
    slug: catalogPet.slug,
    packageId,
    displayName: catalogPet.displayName,
    description: catalogPet.description,
    spriteVersionNumber,
    spritesheetFileName,
    soundFileName: null,
    sourceZipUrl: catalogPet.zipUrl,
    installedAt: new Date().toISOString(),
  }
}

async function publishInstalledPet(
  metadata: Record<string, unknown>,
  spritesheet: Buffer,
  sound: Buffer | null,
): Promise<InstalledPet> {
  const petsRoot = await getPetsRoot()
  const finalDirectory = path.join(petsRoot, String(metadata.slug))
  const temporaryDirectory = path.join(
    petsRoot,
    `.${metadata.slug}.install-${crypto.randomUUID()}`,
  )
  const backupDirectory = path.join(
    petsRoot,
    `.${metadata.slug}.backup-${crypto.randomUUID()}`,
  )
  await fs.promises.mkdir(temporaryDirectory, { recursive: true })
  try {
    metadata.soundFileName = sound ? 'sound.mp3' : null
    const writes = [
      fs.promises.writeFile(
        path.join(temporaryDirectory, 'pet.json'),
        JSON.stringify(metadata, null, 2),
        'utf8',
      ),
      fs.promises.writeFile(
        path.join(temporaryDirectory, String(metadata.spritesheetFileName)),
        spritesheet,
      ),
    ]
    if (sound) {
      writes.push(
        fs.promises.writeFile(
          path.join(temporaryDirectory, 'sound.mp3'),
          sound,
        ),
      )
    }
    await Promise.all(writes)

    const hasExisting = fs.existsSync(finalDirectory)
    if (hasExisting) await fs.promises.rename(finalDirectory, backupDirectory)
    try {
      await fs.promises.rename(temporaryDirectory, finalDirectory)
    } catch (error) {
      if (hasExisting && fs.existsSync(backupDirectory)) {
        await fs.promises.rename(backupDirectory, finalDirectory)
      }
      throw error
    }
    if (fs.existsSync(backupDirectory)) {
      await fs.promises.rm(backupDirectory, { recursive: true, force: true })
    }
    return metadata as unknown as InstalledPet
  } finally {
    await fs.promises.rm(temporaryDirectory, { recursive: true, force: true })
  }
}

async function installPet(
  value: PetSearchItem,
  onProgress?: (progress: PetDownloadProgress) => void,
): Promise<InstalledPet> {
  const pet = normalizePet(value)
  const archive = await requestBuffer(
    assertTrustedAssetUrl(pet.zipUrl),
    onProgress,
  )
  const files = readPetArchive(archive)
  const metadata = validatePetFiles(
    files.petJson,
    files.spritesheet,
    files.spritesheetFileName,
    pet,
  )
  const sound = await downloadPetSound(pet.soundUrl)
  const installed = await publishInstalledPet(
    metadata,
    files.spritesheet,
    sound,
  )
  void requestBuffer(`${PETDEX_ORIGIN}/install/${pet.slug}`).catch(
    () => undefined,
  )
  return installed
}

async function readInstalledPet(slug: string): Promise<InstalledPet> {
  const safeSlug = assertSafeSlug(slug)
  const metadataPath = path.join(await getPetsRoot(), safeSlug, 'pet.json')
  const metadata = parseJsonBuffer(
    await fs.promises.readFile(metadataPath),
    'local pet.json',
  ) as InstalledPet
  if (!metadata || typeof metadata !== 'object' || metadata.slug !== safeSlug) {
    throw new Error('Invalid local pet metadata')
  }
  return metadata
}

async function listInstalledPets(): Promise<InstalledPet[]> {
  const petsRoot = await getPetsRoot()
  const entries = await fs.promises.readdir(petsRoot, { withFileTypes: true })
  const pets: InstalledPet[] = []
  for (const entry of entries) {
    if (!entry.isDirectory() || !/^[a-z0-9]/.test(entry.name)) continue
    try {
      const pet = await readInstalledPet(entry.name)
      pets.push({
        ...pet,
        spritesheetUrl: pathToFileURL(
          path.join(petsRoot, pet.slug, pet.spritesheetFileName),
        ).toString(),
        soundUrl: pet.soundFileName
          ? pathToFileURL(
              path.join(petsRoot, pet.slug, pet.soundFileName),
            ).toString()
          : null,
      })
    } catch {}
  }
  return pets.sort((left, right) =>
    String(right.installedAt).localeCompare(String(left.installedAt)),
  )
}

async function uninstallPet(slug: string): Promise<void> {
  const safeSlug = assertSafeSlug(slug)
  await fs.promises.rm(path.join(await getPetsRoot(), safeSlug), {
    recursive: true,
    force: true,
  })
}

async function getPetWindowPayload(slug: string) {
  const pet = await readInstalledPet(slug)
  const petsRoot = await getPetsRoot()
  const spritesheetPath = path.join(petsRoot, pet.slug, pet.spritesheetFileName)
  await fs.promises.access(spritesheetPath, fs.constants.R_OK)
  const soundPath = pet.soundFileName
    ? path.join(petsRoot, pet.slug, pet.soundFileName)
    : null
  if (soundPath) await fs.promises.access(soundPath, fs.constants.R_OK)
  return {
    pet,
    spritesheetUrl: pathToFileURL(spritesheetPath).toString(),
    soundUrl: soundPath ? pathToFileURL(soundPath).toString() : null,
  }
}

const api: AgentPetApi = {
  searchPets,
  loadPreviewAsset,
  listInstalledPets,
  installPet,
  uninstallPet,
  getPetWindowPayload,
}

contextBridge.exposeInMainWorld('agentPet', api)

declare global {
  const agentPet: typeof api
}
