import {
  siDiscord,
  siReddit,
  siLinkedin,
  siTiktok,
  siInstagram,
  type SimpleIcon,
  siTelegram,
  siX,
  siWhatsapp,
  siFacebook,
  siSnapchat,
  siTwitch,
  siRoblox,
  siSteam,
  siEpicgames,
  siYoutube,
  siNetflix,
  siAmazonprime,
  siHbo,
  siAppletv,
  siSpotify,
  siCrunchyroll,
  siDribbble,
  siBehance,
  siDeviantart,
  siFigma,
  siCoursera,
  siUdemy,
  siEdx,
  siKhanacademy,
  siDuolingo,
  siStrava,
  siNike,
  siWikidata,
  siMedium,
  siQuora,
  siStackoverflow,
  siGithub,
  siCnn,
  siNewyorktimes,
  siNotion,
  siTrello,
  siAsana,
  siSlack,
  siCoinbase,
  siTarget,
  siWalmart,
  siEtsy,
  siEbay,
  siRobinhood,
  siAmazon,
  siDoordash,
  siUbereats,
  siInstacart,
  siAirbnb,
  siExpedia,
  siTripadvisor,
  siGoogle,
  siMessenger,
  siTumblr,
  siThreads,
  siPinterest,
  siVimeo,
  siRumble,
  siRakuten,
  siAliexpress,
} from "simple-icons";

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
  icon?: SimpleIcon;
  order?: number;
  enabled?: boolean;
  groupId?: string;
  defaultKey?: string;
  defaultDeleted?: boolean;
}

export const SITE_CATEGORIES: SiteCategory[] = [
  {
    name: "Entertainment",
    enabled: true,
    key: "entertainment-group",
    icon: "🎥",
  },
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
  "entertainment-group": [
    { id: "youtube", name: "YouTube", url: "youtube.com", icon: siYoutube },
    { id: "netflix", name: "Netflix", url: "netflix.com", icon: siNetflix },
    {
      id: "primevideo",
      name: "Prime Video",
      url: "primevideo.com",
      icon: siAmazonprime,
    },
    {
      id: "disneyplus",
      name: "Disney+",
      url: "disneyplus.com",
      icon: undefined,
    },
    { id: "vimeo", name: "Vimeo", url: "vimeo.com", icon: siVimeo },
    { id: "hulu", name: "Hulu", url: "hulu.com", icon: undefined },
    { id: "hbo-max", name: "HBO Max", url: "max.com", icon: siHbo },
    { id: "rumble", name: "Rumble", url: "rumble.com", icon: siRumble },
    {
      id: "spotify-web",
      name: "Spotify Web",
      url: "open.spotify.com",
      icon: siSpotify,
    },
    { id: "apple-tv", name: "Apple TV+", url: "tv.apple.com", icon: siAppletv },
    {
      id: "crunchyroll",
      name: "Crunchyroll",
      url: "crunchyroll.com",
      icon: siCrunchyroll,
    },
  ],
  "social-group": [
    {
      id: "facebook",
      name: "Facebook",
      url: "facebook.com",
      icon: siFacebook,
    },
    {
      id: "instagram",
      name: "Instagram",
      url: "instagram.com",
      icon: siInstagram,
    },
    {
      id: "tiktok",
      name: "TikTok",
      url: "tiktok.com",
      icon: siTiktok,
    },
    {
      id: "messenger",
      name: "Messenger",
      url: "messenger.com",
      icon: siMessenger,
    },
    { id: "x", name: "X", url: "x.com", icon: siX },
    { id: "linkedin", name: "LinkedIn", url: "linkedin.com", icon: siLinkedin },
    { id: "reddit", name: "Reddit", url: "reddit.com", icon: siReddit },
    { id: "discord", name: "Discord", url: "discord.com", icon: siDiscord },
    {
      id: "whatsapp",
      name: "WhatsApp",
      url: "web.whatsapp.com",
      icon: siWhatsapp,
    },
    {
      id: "telegram",
      name: "Telegram",
      url: "web.telegram.org",
      icon: siTelegram,
    },
    {
      id: "pinterest",
      name: "Pinterest",
      url: "pinterest.com",
      icon: siPinterest,
    },
    {
      id: "tumblr",
      name: "Tumblr",
      url: "tumblr.com",
      icon: siTumblr,
    },
    {
      id: "threads",
      name: "Threads",
      url: "threads.net",
      icon: siThreads,
    },
    { id: "snapchat", name: "Snapchat", url: "snapchat.com", icon: siSnapchat },
  ],
  "games-group": [
    { id: "steam", name: "Steam", url: "steampowered.com", icon: siSteam },
    {
      id: "epic-games",
      name: "Epic Games",
      url: "epicgames.com",
      icon: siEpicgames,
    },
    { id: "roblox", name: "Roblox", url: "roblox.com", icon: siRoblox },
    { id: "twitch", name: "Twitch", url: "twitch.tv", icon: siTwitch },
  ],
  "creativity-group": [
    { id: "behance", name: "Behance", url: "behance.net", icon: siBehance },
    {
      id: "dribbble",
      name: "Dribbble",
      url: "dribbble.com",
      icon: siDribbble,
    },
    {
      id: "deviantart",
      name: "DeviantArt",
      url: "deviantart.com",
      icon: siDeviantart,
    },
    { id: "figma", name: "Figma", url: "figma.com", icon: siFigma },
  ],
  "education-group": [
    {
      id: "coursera",
      name: "Coursera",
      url: "coursera.org",
      icon: siCoursera,
    },
    { id: "udemy", name: "Udemy", url: "udemy.com", icon: siUdemy },
    {
      id: "khan-academy",
      name: "Khan Academy",
      url: "khanacademy.org",
      icon: siKhanacademy,
    },
    { id: "edx", name: "edX", url: "edx.org", icon: siEdx },
    {
      id: "duolingo",
      name: "Duolingo",
      url: "duolingo.com",
      icon: siDuolingo,
    },
  ],
  "health-fitness-group": [
    { id: "strava", name: "Strava", url: "strava.com", icon: siStrava },
    {
      id: "nike-training-club",
      name: "Nike Training Club",
      url: "nike.com/training",
      icon: siNike,
    },
  ],
  "information-group": [
    {
      id: "wikipedia",
      name: "Wikipedia",
      url: "wikipedia.org",
      icon: siWikidata,
    },
    { id: "medium", name: "Medium", url: "medium.com", icon: siMedium },
    { id: "quora", name: "Quora", url: "quora.com", icon: siQuora },
    {
      id: "stackoverflow",
      name: "Stack Overflow",
      url: "stackoverflow.com",
      icon: siStackoverflow,
    },
    { id: "github", name: "GitHub", url: "github.com", icon: siGithub },
    { id: "cnn", name: "CNN", url: "cnn.com", icon: siCnn },
    { id: "bbc", name: "BBC", url: "bbc.com", icon: undefined },
    {
      id: "new-york-times",
      name: "New York Times",
      url: "nytimes.com",
      icon: siNewyorktimes,
    },
  ],
  "productivity-finance-group": [
    { id: "notion", name: "Notion", url: "notion.so", icon: siNotion },
    { id: "trello", name: "Trello", url: "trello.com", icon: siTrello },
    { id: "asana", name: "Asana", url: "asana.com", icon: siAsana },
    { id: "slack", name: "Slack", url: "slack.com", icon: siSlack },
    {
      id: "coinbase",
      name: "Coinbase",
      url: "coinbase.com",
      icon: siCoinbase,
    },
    {
      id: "robinhood",
      name: "Robinhood",
      url: "robinhood.com",
      icon: siRobinhood,
    },
  ],
  "shopping-food-group": [
    { id: "amazon", name: "Amazon", url: "amazon.*", icon: siAmazon },
    { id: "ebay", name: "eBay", url: "ebay.*", icon: siEbay },
    { id: "etsy", name: "Etsy", url: "etsy.com", icon: siEtsy },
    { id: "walmart", name: "Walmart", url: "walmart.com", icon: siWalmart },
    { id: "target", name: "Target", url: "target.com", icon: siTarget },
    {
      id: "doordash",
      name: "DoorDash",
      url: "doordash.com",
      icon: siDoordash,
    },
    {
      id: "ubereats",
      name: "Uber Eats",
      url: "ubereats.com",
      icon: siUbereats,
    },
    {
      id: "instacart",
      name: "Instacart",
      url: "instacart.com",
      icon: siInstacart,
    },
    {
      id: "rakuten",
      name: "Rakuten",
      url: "rakuten.com",
      icon: siRakuten,
    },
    {
      id: "aliexpress",
      name: "AliExpress",
      url: "aliexpress.com",
      icon: siAliexpress,
    },
  ],
  "travel-group": [
    { id: "airbnb", name: "Airbnb", url: "airbnb.com", icon: siAirbnb },
    { id: "expedia", name: "Expedia", url: "expedia.com", icon: siExpedia },
    {
      id: "tripadvisor",
      name: "TripAdvisor",
      url: "tripadvisor.com",
      icon: siTripadvisor,
    },
    {
      id: "google-flights",
      name: "Google Flights",
      url: "flights.google.com",
      icon: siGoogle,
    },
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
