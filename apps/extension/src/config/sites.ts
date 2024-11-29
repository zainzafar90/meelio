export interface BlockedSite {
  text: string
  reminder: string
  author: string
  theme: string
  buttonText: string
  mainEmoji: string
}

export const DEFAULT_SITES: BlockedSite[] = [
  {
    text: "Your Target\nIsn't Social Media",
    reminder: "You miss 100% of the shots you don't take.",
    author: "Wayne Gretzky",
    theme: "red",
    buttonText: "Fire!",
    mainEmoji: "🎯"
  },
  {
    text: "Trees Over\nSocial Media",
    reminder: "Time spent amongst trees is never wasted time.",
    author: "Katrina Mayer",
    theme: "green",
    buttonText: "Forest On",
    mainEmoji: "🌲"
  },
  {
    text: "Create Now\nScroll Later",
    reminder: "Art requires uninterrupted attention.",
    author: "Creative Mind",
    theme: "purple",
    buttonText: "Create",
    mainEmoji: "🎨"
  },
  {
    text: "Run Your Race\nNot Your Feed",
    reminder: "Progress happens outside your comfort zone.",
    author: "Peak Performance",
    theme: "teal",
    buttonText: "Sprint",
    mainEmoji: "🏃"
  },
  {
    text: "Shine Bright\nOffline",
    reminder: "Stars don't need likes to sparkle.",
    author: "Stellar Focus",
    theme: "amber",
    buttonText: "Glow",
    mainEmoji: "⭐"
  }
]
