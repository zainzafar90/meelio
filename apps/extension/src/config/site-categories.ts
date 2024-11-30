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
  icon: string;
  order?: number;
  enabled?: boolean;
  groupId?: string;
  defaultKey?: string;
  defaultDeleted?: boolean;
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

export const SITE_LIST: Record<string, Site[]> = {
  "social-group": [
    { id: "facebook", name: "Facebook", url: "facebook.com", icon: "💬" },
    { id: "instagram", name: "Instagram", url: "instagram.com", icon: "💬" },
    { id: "tiktok", name: "TikTok", url: "tiktok.com", icon: "💬" },
    { id: "twitter", name: "Twitter", url: "twitter.com", icon: "💬" },
    { id: "linkedin", name: "LinkedIn", url: "linkedin.com", icon: "💬" },
    { id: "reddit", name: "Reddit", url: "reddit.com", icon: "💬" },
    { id: "discord", name: "Discord", url: "discord.com", icon: "💬" },
    { id: "whatsapp", name: "WhatsApp", url: "web.whatsapp.com", icon: "💬" },
    { id: "telegram", name: "Telegram", url: "web.telegram.org", icon: "💬" },
    { id: "bereal", name: "BeReal", url: "bereal.com", icon: "💬" },
    { id: "snapchat", name: "Snapchat", url: "snapchat.com", icon: "💬" },
  ],
  "games-group": [
    { id: "steam", name: "Steam", url: "steampowered.com", icon: "🚀" },
    { id: "epic-games", name: "Epic Games", url: "epicgames.com", icon: "🚀" },
    { id: "roblox", name: "Roblox", url: "roblox.com", icon: "🚀" },
    { id: "minecraft", name: "Minecraft", url: "minecraft.net", icon: "🚀" },
    { id: "chess-com", name: "Chess.com", url: "chess.com", icon: "🚀" },
    { id: "itch-io", name: "Itch.io", url: "itch.io", icon: "🚀" },
    { id: "twitch", name: "Twitch", url: "twitch.tv", icon: "🚀" },
  ],
  "entertainment-group": [
    { id: "youtube", name: "YouTube", url: "youtube.com", icon: "🍿" },
    { id: "netflix", name: "Netflix", url: "netflix.com", icon: "🍿" },
    { id: "disneyplus", name: "Disney+", url: "disneyplus.com", icon: "🍿" },
    {
      id: "primevideo",
      name: "Prime Video",
      url: "primevideo.com",
      icon: "🍿",
    },
    { id: "hulu", name: "Hulu", url: "hulu.com", icon: "🍿" },
    { id: "hbo-max", name: "HBO Max", url: "max.com", icon: "🍿" },
    {
      id: "spotify-web",
      name: "Spotify Web",
      url: "open.spotify.com",
      icon: "🍿",
    },
    { id: "apple-tv", name: "Apple TV+", url: "tv.apple.com", icon: "🍿" },
    {
      id: "crunchyroll",
      name: "Crunchyroll",
      url: "crunchyroll.com",
      icon: "🍿",
    },
  ],
  "creativity-group": [
    { id: "behance", name: "Behance", url: "behance.net", icon: "🎨" },
    { id: "dribbble", name: "Dribbble", url: "dribbble.com", icon: "🎨" },
    { id: "deviantart", name: "DeviantArt", url: "deviantart.com", icon: "🎨" },
    { id: "canva", name: "Canva", url: "canva.com", icon: "🎨" },
    { id: "figma", name: "Figma", url: "figma.com", icon: "🎨" },
  ],
  "education-group": [
    { id: "coursera", name: "Coursera", url: "coursera.org", icon: "🌍" },
    { id: "udemy", name: "Udemy", url: "udemy.com", icon: "🌍" },
    {
      id: "khan-academy",
      name: "Khan Academy",
      url: "khanacademy.org",
      icon: "🌍",
    },
    { id: "edx", name: "edX", url: "edx.org", icon: "🌍" },
    { id: "duolingo", name: "Duolingo", url: "duolingo.com", icon: "🌍" },
    { id: "brilliant", name: "Brilliant", url: "brilliant.org", icon: "🌍" },
  ],
  "health-fitness-group": [
    {
      id: "myfitnesspal",
      name: "MyFitnessPal",
      url: "myfitnesspal.com",
      icon: "🏃",
    },
    { id: "strava", name: "Strava", url: "strava.com", icon: "🏃" },
    {
      id: "nike-training-club",
      name: "Nike Training Club",
      url: "nike.com/training",
      icon: "🏃",
    },
    { id: "fitbod", name: "Fitbod", url: "fitbod.me", icon: "🏃" },
    { id: "calm", name: "Calm", url: "calm.com", icon: "🏃" },
  ],
  "information-group": [
    { id: "wikipedia", name: "Wikipedia", url: "wikipedia.org", icon: "🌍" },
    { id: "medium", name: "Medium", url: "medium.com", icon: "🌍" },
    { id: "quora", name: "Quora", url: "quora.com", icon: "🌍" },
    {
      id: "stackoverflow",
      name: "Stack Overflow",
      url: "stackoverflow.com",
      icon: "🌍",
    },
    { id: "github", name: "GitHub", url: "github.com", icon: "🌍" },
    { id: "cnn", name: "CNN", url: "cnn.com", icon: "🌍" },
    { id: "bbc", name: "BBC", url: "bbc.com", icon: "🌍" },
    {
      id: "new-york-times",
      name: "New York Times",
      url: "nytimes.com",
      icon: "🌍",
    },
  ],
  "productivity-finance-group": [
    { id: "notion", name: "Notion", url: "notion.so", icon: "💼" },
    { id: "trello", name: "Trello", url: "trello.com", icon: "💼" },
    { id: "asana", name: "Asana", url: "asana.com", icon: "💼" },
    { id: "slack", name: "Slack", url: "slack.com", icon: "💼" },
    {
      id: "microsoft-teams",
      name: "Microsoft Teams",
      url: "teams.microsoft.com",
      icon: "💼",
    },
    { id: "coinbase", name: "Coinbase", url: "coinbase.com", icon: "💼" },
    { id: "robinhood", name: "Robinhood", url: "robinhood.com", icon: "💼" },
  ],
  "shopping-food-group": [
    { id: "amazon", name: "Amazon", url: "amazon.*", icon: "🛍️" },
    { id: "ebay", name: "eBay", url: "ebay.*", icon: "🛍️" },
    { id: "etsy", name: "Etsy", url: "etsy.com", icon: "🛍️" },
    { id: "walmart", name: "Walmart", url: "walmart.com", icon: "🛍️" },
    { id: "target", name: "Target", url: "target.com", icon: "🛍️" },
    { id: "doordash", name: "DoorDash", url: "doordash.com", icon: "🛍️" },
    { id: "ubereats", name: "Uber Eats", url: "ubereats.com", icon: "🛍️" },
    { id: "instacart", name: "Instacart", url: "instacart.com", icon: "🛍️" },
  ],
  "travel-group": [
    { id: "booking-com", name: "Booking.com", url: "booking.com", icon: "✈️" },
    { id: "airbnb", name: "Airbnb", url: "airbnb.com", icon: "✈️" },
    { id: "expedia", name: "Expedia", url: "expedia.com", icon: "✈️" },
    {
      id: "tripadvisor",
      name: "TripAdvisor",
      url: "tripadvisor.com",
      icon: "✈️",
    },
    {
      id: "google-flights",
      name: "Google Flights",
      url: "flights.google.com",
      icon: "✈️",
    },
    { id: "kayak", name: "Kayak", url: "kayak.com", icon: "✈️" },
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
