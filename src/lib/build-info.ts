// Build information to help with cache invalidation
export const BUILD_TIMESTAMP = Date.now().toString()
export const BUILD_VERSION = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || BUILD_TIMESTAMP

export function getBuildInfo() {
  return {
    timestamp: BUILD_TIMESTAMP,
    version: BUILD_VERSION,
    date: new Date().toISOString()
  }
}
