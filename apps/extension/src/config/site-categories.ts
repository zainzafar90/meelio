export interface SiteCategory {
  name: string;
  enabled: boolean;
  key: string;
  icon: string;
}

export interface Site {
  id: string;
  url: string;
  name: string;
  order: number;
  enabled: boolean;
  groupId: string;
  defaultKey: string;
  defaultDeleted: boolean;
}

export const SITE_CATEGORIES: SiteCategory[] = [
  {
    name: "Social",
    enabled: true,
    key: "social-group",
    icon: "💬",
  },
  {
    name: "Games",
    enabled: true,
    key: "games-group",
    icon: "🚀",
  },
  {
    name: "Entertainment",
    enabled: true,
    key: "entertainment-group",
    icon: "🍿",
  },
  {
    name: "Creativity",
    enabled: false,
    key: "creativity-group",
    icon: "🎨",
  },
  {
    name: "Education",
    enabled: false,
    key: "education-group",
    icon: "🌍",
  },
  {
    name: "Health & Fitness",
    enabled: false,
    key: "health-fitness-group",
    icon: "🏃",
  },
  {
    name: "Information & Reading",
    enabled: true,
    key: "information-group",
    icon: "📚",
  },
  {
    name: "Productivity & Finance",
    enabled: false,
    key: "productivity-finance-group",
    icon: "💼",
  },
  {
    name: "Shopping & Food",
    enabled: true,
    key: "shopping-food-group",
    icon: "🛍️",
  },
  {
    name: "Travel",
    enabled: false,
    key: "travel-group",
    icon: "✈️",
  },
];

export const SITE_LIST = {
  "social-group": [
    { name: "Facebook", url: "facebook.com" },
    { name: "Instagram", url: "instagram.com" },
    { name: "TikTok", url: "tiktok.com" },
    { name: "Twitter", url: "twitter.com" },
    { name: "LinkedIn", url: "linkedin.com" },
    { name: "Reddit", url: "reddit.com" },
    { name: "Discord", url: "discord.com" },
    { name: "WhatsApp", url: "web.whatsapp.com" },
    { name: "Telegram", url: "web.telegram.org" },
    { name: "BeReal", url: "bereal.com" },
    { name: "Snapchat", url: "snapchat.com" },
  ],
  "games-group": [
    { name: "Steam", url: "steampowered.com" },
    { name: "Epic Games", url: "epicgames.com" },
    { name: "Roblox", url: "roblox.com" },
    { name: "Minecraft", url: "minecraft.net" },
    { name: "Chess.com", url: "chess.com" },
    { name: "Itch.io", url: "itch.io" },
    { name: "Twitch", url: "twitch.tv" },
  ],
  "entertainment-group": [
    { name: "YouTube", url: "youtube.com" },
    { name: "Netflix", url: "netflix.com" },
    { name: "Disney+", url: "disneyplus.com" },
    { name: "Prime Video", url: "primevideo.com" },
    { name: "Hulu", url: "hulu.com" },
    { name: "HBO Max", url: "max.com" },
    { name: "Spotify Web", url: "open.spotify.com" },
    { name: "Apple TV+", url: "tv.apple.com" },
    { name: "Crunchyroll", url: "crunchyroll.com" },
  ],
  "creativity-group": [
    { name: "Behance", url: "behance.net" },
    { name: "Dribbble", url: "dribbble.com" },
    { name: "DeviantArt", url: "deviantart.com" },
    { name: "Canva", url: "canva.com" },
    { name: "Figma", url: "figma.com" },
  ],
  "education-group": [
    { name: "Coursera", url: "coursera.org" },
    { name: "Udemy", url: "udemy.com" },
    { name: "Khan Academy", url: "khanacademy.org" },
    { name: "edX", url: "edx.org" },
    { name: "Duolingo", url: "duolingo.com" },
    { name: "Brilliant", url: "brilliant.org" },
  ],
  "health-fitness-group": [
    { name: "MyFitnessPal", url: "myfitnesspal.com" },
    { name: "Strava", url: "strava.com" },
    { name: "Nike Training Club", url: "nike.com/training" },
    { name: "Fitbod", url: "fitbod.me" },
    { name: "Calm", url: "calm.com" },
  ],
  "information-group": [
    { name: "Wikipedia", url: "wikipedia.org" },
    { name: "Medium", url: "medium.com" },
    { name: "Quora", url: "quora.com" },
    { name: "Stack Overflow", url: "stackoverflow.com" },
    { name: "GitHub", url: "github.com" },
    { name: "CNN", url: "cnn.com" },
    { name: "BBC", url: "bbc.com" },
    { name: "New York Times", url: "nytimes.com" },
  ],
  "productivity-finance-group": [
    { name: "Notion", url: "notion.so" },
    { name: "Trello", url: "trello.com" },
    { name: "Asana", url: "asana.com" },
    { name: "Slack", url: "slack.com" },
    { name: "Microsoft Teams", url: "teams.microsoft.com" },
    { name: "Coinbase", url: "coinbase.com" },
    { name: "Robinhood", url: "robinhood.com" },
  ],
  "shopping-food-group": [
    { name: "Amazon", url: "amazon.*" },
    { name: "eBay", url: "ebay.*" },
    { name: "Etsy", url: "etsy.com" },
    { name: "Walmart", url: "walmart.com" },
    { name: "Target", url: "target.com" },
    { name: "DoorDash", url: "doordash.com" },
    { name: "Uber Eats", url: "ubereats.com" },
    { name: "Instacart", url: "instacart.com" },
  ],
  "travel-group": [
    { name: "Booking.com", url: "booking.com" },
    { name: "Airbnb", url: "airbnb.com" },
    { name: "Expedia", url: "expedia.com" },
    { name: "TripAdvisor", url: "tripadvisor.com" },
    { name: "Google Flights", url: "flights.google.com" },
    { name: "Kayak", url: "kayak.com" },
  ],
};

// Helper function to convert the site list into the required format with IDs
export function generateSiteConfigs() {
  return Object.entries(SITE_LIST).reduce((acc, [groupId, sites]) => {
    const siteConfigs = sites.map((site, index) => ({
      id: Math.random().toString(36).substring(2, 15),
      url: site.url,
      name: site.name,
      order: sites.length - 1 - index,
      enabled: true,
      groupId,
      defaultKey: `${site.name.toLowerCase().replace(/\s+/g, "-")}-website`,
      defaultDeleted: false,
    }));
    return {
      ...acc,
      ...Object.fromEntries(siteConfigs.map((config) => [config.id, config])),
    };
  }, {});
}
