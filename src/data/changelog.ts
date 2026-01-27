// Changelog Data
// Version history for What's New modal

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  description: string;
  features: string[];
  improvements?: string[];
  fixes?: string[];
}

export const changelog: ChangelogEntry[] = [
  {
    version: '2.0.0',
    date: '2026-01-27',
    title: 'Advanced Features Pack',
    description: 'Major update with PWA support, price intelligence, and personal dashboard.',
    features: [
      'PWA support with offline mode',
      'Price Intelligence module (/analizler)',
      'Personal Dashboard (/benim)',
      'Command Palette (Cmd+K)',
      'Deal score and outlier detection',
    ],
    improvements: [
      'Enhanced data pipeline with precomputed stats',
      'Improved search with Fuse.js fuzzy matching',
      'Better error handling with Error Boundary',
    ],
  },
  {
    version: '1.5.0',
    date: '2026-01-15',
    title: 'Toyota & Hyundai Support',
    description: 'Added two new brands to the platform.',
    features: [
      'Toyota brand support',
      'Hyundai brand support',
    ],
    improvements: [
      'Improved brand logo display',
      'Better mobile responsiveness',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-01-01',
    title: 'Initial Release',
    description: 'First release of the price list platform.',
    features: [
      'Price list viewing',
      'Vehicle comparison',
      'Favorites management',
      'Price tracking',
      'Statistics and charts',
      'PDF export',
    ],
  },
];

// Get the latest version
export const latestVersion = changelog[0]?.version || '1.0.0';

// Get changelog for a specific version
export const getChangelog = (version: string): ChangelogEntry | undefined => {
  return changelog.find((entry) => entry.version === version);
};
