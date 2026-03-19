// Shared face-api utility for facial recognition across the app

let faceapi: typeof import("@vladmandic/face-api") | null = null;
let modelsLoaded = false;
let modelsLoading = false;

export const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1/model";
export const MATCH_THRESHOLD = 0.45;
export const HIGH_CONFIDENCE_THRESHOLD = 0.35;

// Descriptor cache: URL -> Float32Array
const descriptorCache = new Map<string, Float32Array>();

export async function loadModelsOnce() {
  if (modelsLoaded) return;
  if (modelsLoading) {
    while (modelsLoading && !modelsLoaded) {
      await new Promise((r) => setTimeout(r, 200));
    }
    return;
  }
  modelsLoading = true;
  try {
    const mod = await import("@vladmandic/face-api");
    faceapi = mod;
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
  } catch (err) {
    console.error("Failed to load face-api models:", err);
    throw err;
  } finally {
    modelsLoading = false;
  }
}

export function getFaceApi() {
  return faceapi;
}

export function isModelsLoaded() {
  return modelsLoaded;
}

/** Load an image with crossOrigin support for Supabase Storage URLs */
export function loadImageWithCORS(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/** Compute face descriptor from an image source (URL or HTMLImageElement) */
export async function computeDescriptor(
  source: string | HTMLImageElement | HTMLCanvasElement
): Promise<Float32Array | null> {
  if (!faceapi) return null;

  // Check cache for URL sources
  if (typeof source === "string" && descriptorCache.has(source)) {
    return descriptorCache.get(source)!;
  }

  try {
    let input: HTMLImageElement | HTMLCanvasElement;
    if (typeof source === "string") {
      if (source.startsWith("data:")) {
        input = await faceapi.fetchImage(source);
      } else {
        input = await loadImageWithCORS(source);
      }
    } else {
      input = source;
    }

    const detection = await faceapi
      .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) return null;

    // Cache the result for URL sources
    if (typeof source === "string") {
      descriptorCache.set(source, detection.descriptor);
    }

    return detection.descriptor;
  } catch (err) {
    console.error("Error computing descriptor:", err);
    return null;
  }
}

export type FaceCandidate = {
  id: string;
  label: string;
  photoUrl: string;
  descriptor?: Float32Array | null;
};

export type MatchResult = {
  candidate: FaceCandidate;
  distance: number;
  confidence: number;
};

/** Find best match from a list of candidates with pre-computed descriptors */
export function findBestMatch(
  queryDescriptor: Float32Array,
  candidates: FaceCandidate[]
): MatchResult | null {
  if (!faceapi || candidates.length === 0) return null;

  let bestMatch: MatchResult | null = null;

  for (const candidate of candidates) {
    if (!candidate.descriptor) continue;

    const distance = faceapi.euclideanDistance(queryDescriptor, candidate.descriptor);
    const confidence = Math.max(0, Math.min(1, 1 - distance));

    if (distance <= MATCH_THRESHOLD && (!bestMatch || distance < bestMatch.distance)) {
      bestMatch = { candidate, distance, confidence };
    }
  }

  return bestMatch;
}

/** Pre-compute descriptors for a list of candidates, reporting progress */
export async function precomputeDescriptors(
  candidates: FaceCandidate[],
  onProgress?: (done: number, total: number) => void
): Promise<FaceCandidate[]> {
  const withPhotos = candidates.filter((c) => !!c.photoUrl);
  let done = 0;

  for (const candidate of withPhotos) {
    if (!candidate.descriptor) {
      candidate.descriptor = await computeDescriptor(candidate.photoUrl);
    }
    done++;
    onProgress?.(done, withPhotos.length);
  }

  return withPhotos.filter((c) => !!c.descriptor);
}

/** Clear descriptor cache */
export function clearDescriptorCache() {
  descriptorCache.clear();
}
