import Constants from 'expo-constants';
import * as Linking from 'expo-linking';

export const GITHUB_OWNER = 'Daham-Wijesooriya';
export const GITHUB_REPO = 'LifeStack';

export interface UpdateInfo {
  currentVersion: string;
  latestVersion: string;
  isUpdateAvailable: boolean;
  releaseName: string;
  releaseNotes: string;
  releaseUrl: string;
  apkDownloadUrl: string | null;
  publishedAt: string;
}

/**
 * Normalizes and compares two semantic version strings (e.g. "v1.2.0" and "1.1.9").
 * Returns:
 *   1 if v1 > v2
 *  -1 if v1 < v2
 *   0 if v1 === v2
 */
export function compareSemver(v1: string, v2: string): number {
  const clean1 = v1.replace(/^v/, '').trim();
  const clean2 = v2.replace(/^v/, '').trim();

  const parts1 = clean1.split('.').map((p) => parseInt(p, 10) || 0);
  const parts2 = clean2.split('.').map((p) => parseInt(p, 10) || 0);

  const length = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < length; i++) {
    const num1 = parts1[i] ?? 0;
    const num2 = parts2[i] ?? 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

export function getCurrentAppVersion(): string {
  return Constants.expoConfig?.version ?? '1.0.0';
}

/**
 * Checks GitHub Releases API for the latest published release.
 */
export async function checkForAppUpdate(): Promise<UpdateInfo | null> {
  const currentVersion = getCurrentAppVersion();
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'LifeStack-App',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // No releases found yet on the repository
        return null;
      }
      throw new Error(`GitHub API returned status ${response.status}`);
    }

    const data = await response.json();
    const tag = (data.tag_name ?? '').toString();
    const latestVersion = tag.replace(/^v/, '') || tag;

    // Locate the .apk asset in the release assets
    const apkAsset = Array.isArray(data.assets)
      ? data.assets.find((asset: { name?: string; browser_download_url?: string }) =>
          typeof asset.name === 'string' && asset.name.toLowerCase().endsWith('.apk'),
        )
      : null;

    const isUpdateAvailable = compareSemver(latestVersion, currentVersion) > 0;

    return {
      currentVersion,
      latestVersion,
      isUpdateAvailable,
      releaseName: data.name ?? tag,
      releaseNotes: data.body ?? '',
      releaseUrl: data.html_url ?? `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases`,
      apkDownloadUrl: apkAsset?.browser_download_url ?? null,
      publishedAt: data.published_at ?? '',
    };
  } catch (error) {
    console.warn('Failed to check for app updates:', error);
    throw error;
  }
}

/**
 * Opens either the direct APK download URL or the GitHub release page.
 */
export async function downloadUpdate(update: UpdateInfo): Promise<void> {
  const targetUrl = update.apkDownloadUrl || update.releaseUrl;
  await Linking.openURL(targetUrl);
}
