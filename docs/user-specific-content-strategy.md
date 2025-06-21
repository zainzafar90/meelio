# User-Specific Content Strategy

## Overview

This document describes Meelio's approach to delivering personalized daily content (mantras and quotes) that creates variety across users while maintaining consistency for each individual user.

## The Problem

Without user-specific seeding, all users would see identical content on the same day, creating a monotonous experience across the user base. This reduces the perceived value and uniqueness of the application.

## The Solution: Predictable Randomness

We implement a "predictable randomness" system that combines:

1. **Date-based consistency** - Same content for a user throughout the day
2. **User-specific variation** - Different users see different content on the same day
3. **Cross-platform synchronization** - Same content across web and extension for each user

## Implementation Details

### Core Components

#### 1. Seeding Function (`getSeedIndexByDate`)
**Location:** `packages/shared/src/utils/common.utils.ts:76-80`

```typescript
export const getSeedIndexByDate = (totalItems: number) => {
  const dayOfYear = getDayOfYear();
  const seed = getSeedByUser();
  return (dayOfYear + seed) % totalItems;
};
```

**How it works:**
- `getDayOfYear()` returns 1-366 (day of current year)
- `getSeedByUser()` generates a numeric hash from user ID
- Combined seed ensures same user gets same content all day, but different users get different content

#### 2. User Seed Generation (`getSeedByUser`)
**Location:** `packages/shared/src/utils/common.utils.ts:65-69`

```typescript
export const getSeedByUser = () => {
  const { user, guestUser } = useAuthStore.getState();
  const seed = user?.id || guestUser?.id || "default";
  return seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
};
```

**User ID to numeric conversion:**
- Takes user ID string (UUID or guest ID)
- Converts to numeric seed by summing character codes
- Provides deterministic but unique seed per user

#### 3. Content Service (`ContentService`)
**Location:** `packages/shared/src/services/content.service.ts`

**Key methods:**
```typescript
async getTodaysMantra(): Promise<string> {
  await this.ensureMantrasLoaded();
  const seededIndex = getSeedIndexByDate(TOTAL_MANTRAS);
  const mantra = await db.mantras.get(seededIndex);
  return mantra?.text || this.getFallbackMantras()[seededIndex % 10];
}

async getTodaysQuote(): Promise<QuoteData> {
  await this.ensureQuotesLoaded();
  const seededIndex = getSeedIndexByDate(TOTAL_QUOTES);
  const quote = await db.quotes.get(seededIndex);
  // ... return quote or fallback
}
```

### Data Structure

#### Content Files
- **Mantras:** `packages/shared/public/mantras.json` (366 items, IDs 0-365)
- **Quotes:** `packages/shared/public/quotes.json` (366 items, IDs 0-365)

#### JSON Format
```json
[
  { "id": 0, "text": "Live in the moment." },
  { "id": 1, "text": "Embrace each day." },
  // ... 364 more items
]
```

#### Database Storage
- **Dexie tables:** `mantras` and `quotes` in `MeelioDB`
- **Caching:** 24-hour cache duration to minimize API calls
- **Loading strategy:** Bulk load all items, then use seeded lookup

### Data Flow

1. **User opens app** → Auth store populated with user ID
2. **Content requested** → `getSeedIndexByDate(366)` calculates index
3. **Index calculation:** `(dayOfYear + userIdHash) % 366`
4. **Content lookup:** Fetch item at calculated index from Dexie
5. **Fallback:** If not found, use seeded fallback from hardcoded arrays

## Benefits

### User Experience
- **Consistency:** Same content all day for each user
- **Variety:** Different users see different content on same day  
- **Surprise:** Users don't know the content is algorithmically determined
- **Cross-platform sync:** Web and extension show identical content

### Technical Benefits
- **Performance:** Content cached for 24 hours
- **Offline support:** Fallback content always available
- **Scalability:** No server-side personalization needed
- **Deterministic:** Same inputs always produce same outputs

### Business Benefits
- **Engagement:** Unique experience increases perceived value
- **Retention:** Fresh content encourages daily usage
- **Non-monotonous:** Avoids "everyone sees the same thing" problem

## Example Scenarios

### Scenario 1: Two Users on Same Day
- **User A (ID: "user_123abc"):** Sees Mantra #142, Quote #89
- **User B (ID: "user_456def"):** Sees Mantra #201, Quote #156
- **Same day, different content**

### Scenario 2: Same User Across Platforms
- **User A on Web:** Sees Mantra #142
- **User A on Extension:** Sees Mantra #142  
- **Cross-platform consistency maintained**

### Scenario 3: Same User Next Day
- **User A Day 1:** Sees Mantra #142
- **User A Day 2:** Sees Mantra #143 (or different based on year progression)
- **Content evolves daily but remains consistent per day**

## Content Curation

### Mantras (366 items)
- **Theme:** Daily inspiration and mindfulness
- **Length:** Concise, 2-8 words typically
- **Tone:** Positive, motivational, present-tense
- **Examples:** "Live in the moment", "Embrace each day", "Trust the journey"

### Quotes (366 items)  
- **Source:** Well-known authors and thought leaders
- **Theme:** Motivation, wisdom, personal growth
- **Format:** Quote text + author attribution
- **Quality:** Carefully curated for impact and relevance

## Maintenance

### Adding Content
1. Update JSON files with new items
2. Ensure sequential ID numbering (0-365)
3. Update `TOTAL_MANTRAS`/`TOTAL_QUOTES` constants
4. Clear Dexie cache to force reload

### Monitoring
- **Error tracking:** Failed content loads logged to console
- **Fallback usage:** Monitor fallback content usage rates
- **Cache performance:** Track cache hit/miss ratios

## Future Enhancements

### Potential Improvements
- **Seasonal themes:** Adjust content based on time of year
- **Mood tracking:** Adapt content based on user's emotional state
- **Categories:** Allow users to prefer certain types of content
- **Learning:** Adapt to user preferences over time

### Scalability Considerations
- **Content expansion:** System supports any number of items
- **Localization:** Structure supports multiple language versions
- **A/B testing:** Can experiment with different seeding algorithms