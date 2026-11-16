// Mock data for the Beli proposal prototype. Everything here is fake demo content.

/** Prefix for files in /public so they resolve under a GitHub Pages sub-path. */
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export type Sentiment = "liked" | "fine" | "disliked";

export type Restaurant = {
  id: string;
  name: string;
  price: string;
  cuisines: string[];
  hood: string;
  city: string;
  photo: string; // path in /public
  friendScore: number;
  recScore: number;
  tags: string[];
  hours: string;
};

export type Friend = {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  been: number;
  streak: number;
  homeCity: string;
  /** You follow them. */
  following: boolean;
  /** They follow you. Blending needs both. */
  followsYou: boolean;
};

export type RankedEntry = {
  restaurantId: string;
  sentiment: Sentiment;
  score: number;
  // "compare" = classic head-to-head bracket, "manual" = user typed/slid the score
  method: "compare" | "manual";
  visitedAt: string; // ISO date
};

const r = (
  id: string,
  name: string,
  price: string,
  cuisines: string[],
  hood: string,
  photo: number,
  friendScore: number,
  recScore: number,
  tags: string[],
  hours = "Open · Closes 10:00 PM"
): Restaurant => ({
  id,
  name,
  price,
  cuisines,
  hood,
  city: "Ann Arbor, MI",
  photo: `${BASE}/food/f${photo}.jpg`,
  friendScore,
  recScore,
  tags,
  hours,
});

export const restaurants: Restaurant[] = [
  r("spencer", "Spencer", "$$$", ["New American", "Wine Bar"], "Kerrytown", 3, 9.1, 9.3, ["Date Night", "Small Plates", "Wine"]),
  r("miss-kim", "Miss Kim", "$$", ["Korean"], "Kerrytown", 11, 8.8, 9.0, ["Dinner", "Vegetarian Friendly", "Cocktails"]),
  r("zingermans", "Zingerman's Delicatessen", "$$", ["Deli", "Sandwiches"], "Kerrytown", 9, 9.0, 8.9, ["Lunch", "Iconic", "Outdoor Seating"]),
  r("frita", "Frita Batidos", "$$", ["Cuban", "Burgers"], "Downtown", 10, 8.9, 8.7, ["Casual", "Late Night", "Milkshakes"]),
  r("mani", "Mani Osteria & Bar", "$$$", ["Italian", "Pizza"], "Downtown", 1, 8.6, 8.8, ["Date Night", "Pasta", "Wood Fired"]),
  r("aventura", "Aventura", "$$$", ["Spanish", "Tapas"], "Downtown", 4, 8.4, 8.5, ["Tapas", "Paella", "Groups"]),
  r("slurping", "Slurping Turtle", "$$", ["Japanese", "Ramen"], "Downtown", 12, 8.0, 8.1, ["Ramen", "Casual", "Groups"]),
  r("tomukun", "Tomukun Noodle Bar", "$$", ["Korean", "Noodles"], "State Street", 2, 8.2, 8.3, ["Noodles", "Late Night", "Casual"]),
  r("pacific-rim", "Pacific Rim by Kana", "$$$$", ["Pan Asian", "Fine Dining"], "Downtown", 3, 8.7, 8.6, ["Special Occasion", "Seafood"]),
  r("savas", "Sava's", "$$", ["American", "Brunch"], "State Street", 8, 7.6, 7.4, ["Brunch", "Groups", "Cocktails"]),
  r("jolly", "Jolly Pumpkin", "$$", ["Pizza", "Brewery"], "Main Street", 1, 7.9, 7.8, ["Beer", "Truffle Fries", "Rooftop"]),
  r("blank-slate", "Blank Slate Creamery", "$", ["Ice Cream", "Dessert"], "Old West Side", 5, 9.2, 9.1, ["Dessert", "Seasonal"], "Open · Closes 11:00 PM"),
  r("roos", "RoosRoast Coffee", "$", ["Coffee Shop"], "Downtown", 7, 8.5, 8.4, ["Coffee", "Study Spot"], "Open · Closes 6:00 PM"),
  r("chelas", "Chela's", "$", ["Mexican", "Tacos"], "South U", 10, 8.1, 8.0, ["Tacos", "Quick Bite"]),
  r("ricewood", "Ricewood", "$$", ["BBQ", "Pacific Islander"], "Packard", 9, 8.9, 8.8, ["Lunch Only", "Brisket"], "Closed · Opens 11:00 AM"),
  r("lunch-room", "Detroit Street Filling Station", "$$", ["Vegan", "American"], "Kerrytown", 6, 8.0, 7.9, ["Vegan", "Patio"]),
  r("juicy", "Juicy Kitchen", "$$", ["Brunch", "Cafe"], "West Side", 8, 8.3, 8.2, ["Brunch", "Bakery"], "Closed · Opens 8:00 AM"),
  r("echelon", "Echelon Kitchen & Bar", "$$$$", ["New American", "Wood Fired"], "Main Street", 4, 9.0, 9.2, ["Special Occasion", "Tasting Menu"]),
  r("isalita", "Isalita", "$$", ["Mexican", "Cocktails"], "Downtown", 11, 7.8, 7.7, ["Margaritas", "Groups", "Late Night"]),
  r("dimo", "Dimo's Deli & Donuts", "$", ["Donuts", "Deli"], "West Side", 5, 8.4, 8.3, ["Breakfast", "Donuts"], "Closed · Opens 6:00 AM"),
  r("bao-boys", "Bao Boys", "$", ["Taiwanese", "Bao"], "Downtown", 12, 8.2, 8.4, ["Quick Bite", "Bao"]),
  r("cardamom", "Cardamom", "$$", ["Indian"], "North Campus", 2, 8.6, 8.5, ["Dinner", "Vegetarian Friendly"]),
  r("york", "York Food & Drink", "$$", ["Wine Bar", "Sandwiches"], "Packard", 6, 8.3, 8.2, ["Patio", "Wine", "Coffee"]),
  r("first-bite", "First Bite", "$$", ["Healthy", "Bowls"], "Main Street", 7, 7.5, 7.6, ["Lunch", "Bowls"]),

  // Out of town, so a blend can be pointed at more than one city.
  ...[
    r("via-carota", "Via Carota", "$$$", ["Italian"], "West Village", 1, 9.2, 9.3, ["Date Night", "Pasta", "Walk In"]),
    r("thai-diner", "Thai Diner", "$$", ["Thai"], "Nolita", 2, 8.8, 8.9, ["Brunch", "Casual", "Groups"]),
    r("lucali", "Lucali", "$$", ["Pizza"], "Carroll Gardens", 10, 9.3, 9.2, ["Pizza", "BYOB", "Cash Only"]),
    r("cho-dang-gol", "Cho Dang Gol", "$$", ["Korean"], "Koreatown", 11, 8.7, 8.8, ["Tofu", "Dinner", "Groups"]),
    r("russ", "Russ & Daughters Cafe", "$$", ["Deli", "Brunch"], "Lower East Side", 9, 8.9, 8.8, ["Bagels", "Iconic", "Brunch"]),
    r("win-son", "Win Son", "$$", ["Taiwanese"], "Williamsburg", 12, 8.6, 8.7, ["Dinner", "Casual", "Cocktails"]),
    r("dhamaka", "Dhamaka", "$$$", ["Indian"], "Lower East Side", 6, 9.0, 9.1, ["Dinner", "Spicy", "Groups"]),
    r("raku", "Raku", "$$", ["Japanese", "Noodles"], "East Village", 3, 8.7, 8.6, ["Udon", "Casual", "Walk In"]),
    r("levain", "Levain Bakery", "$", ["Bakery", "Dessert"], "Upper West Side", 5, 8.8, 8.7, ["Cookies", "Quick Bite"]),
  ].map((x) => ({ ...x, city: "New York, NY" })),
  ...[
    r("girl-goat", "Girl & the Goat", "$$$", ["New American", "Small Plates"], "West Loop", 4, 9.0, 9.1, ["Dinner", "Small Plates", "Groups"]),
    r("pequods", "Pequod's Pizza", "$$", ["Pizza"], "Lincoln Park", 1, 8.9, 8.8, ["Deep Dish", "Casual", "Late Night"]),
    r("lula", "Lula Cafe", "$$", ["New American", "Brunch"], "Logan Square", 8, 8.8, 8.9, ["Brunch", "Seasonal", "Patio"]),
    r("sun-wah", "Sun Wah BBQ", "$$", ["Chinese", "BBQ"], "Uptown", 9, 8.7, 8.6, ["Duck", "Groups", "BYOB"]),
    r("birrieria", "Birrieria Zaragoza", "$", ["Mexican", "Tacos"], "Archer Heights", 10, 9.1, 9.0, ["Birria", "Lunch", "Casual"]),
    r("kasama", "Kasama", "$$$", ["Filipino", "Bakery"], "Ukrainian Village", 7, 9.2, 9.3, ["Breakfast", "Pastries", "Tasting Menu"]),
  ].map((x) => ({ ...x, city: "Chicago, IL" })),
  ...[
    r("selden", "Selden Standard", "$$$", ["New American", "Small Plates"], "Midtown", 4, 9.0, 9.1, ["Dinner", "Wood Fired", "Cocktails"]),
    r("buddys", "Buddy's Pizza", "$$", ["Pizza"], "Conant Street", 1, 8.6, 8.5, ["Detroit Style", "Casual", "Groups"]),
    r("flowers", "Flowers of Vietnam", "$$", ["Vietnamese"], "Southwest", 12, 8.9, 9.0, ["Dinner", "Cocktails"]),
    r("sister-pie", "Sister Pie", "$", ["Bakery", "Dessert"], "West Village", 5, 8.8, 8.9, ["Pie", "Breakfast"]),
  ].map((x) => ({ ...x, city: "Detroit, MI" })),
  ...[
    r("bestia", "Bestia", "$$$", ["Italian"], "Arts District", 1, 9.1, 9.2, ["Dinner", "Pasta", "Date Night"]),
    r("sonoratown", "Sonoratown", "$", ["Mexican", "Tacos"], "Downtown", 10, 9.0, 9.0, ["Tacos", "Quick Bite"]),
    r("parks-bbq", "Park's BBQ", "$$$", ["Korean", "BBQ"], "Koreatown", 11, 8.9, 9.0, ["Groups", "Dinner"]),
    r("sqirl", "Sqirl", "$$", ["Brunch", "Cafe"], "Silver Lake", 8, 8.5, 8.6, ["Brunch", "Bowls"]),
  ].map((x) => ({ ...x, city: "Los Angeles, CA" })),
];

/** Every city that has restaurants, in a stable order. */
export const cities = Array.from(new Set(restaurants.map((x) => x.city)));
export const cityName = (city: string) => city.split(",")[0];

export const restaurantById = (id: string) =>
  restaurants.find((x) => x.id === id) ?? restaurants[0];

export const me: Friend = {
  id: "me",
  name: "You",
  handle: "@you",
  avatar: `${BASE}/avatars/a47.jpg`,
  been: 11,
  streak: 3,
  homeCity: "Ann Arbor, MI",
  following: false,
  followsYou: false,
};

export const friends: Friend[] = [
  { id: "maya", name: "Maya", handle: "@mayaeats", avatar: `${BASE}/avatars/a5.jpg`, been: 143, streak: 12, homeCity: "Ann Arbor, MI", following: true, followsYou: true },
  { id: "eliot", name: "Eliot", handle: "@eliotfrost", avatar: `${BASE}/avatars/a12.jpg`, been: 88, streak: 4, homeCity: "Ann Arbor, MI", following: true, followsYou: true },
  { id: "judy", name: "Judy", handle: "@judy", avatar: `${BASE}/avatars/a9.jpg`, been: 312, streak: 31, homeCity: "Ann Arbor, MI", following: true, followsYou: true },
  { id: "andrew", name: "Andrew", handle: "@andrewm", avatar: `${BASE}/avatars/a52.jpg`, been: 57, streak: 2, homeCity: "Ann Arbor, MI", following: true, followsYou: true },
  { id: "priya", name: "Priya", handle: "@priyak", avatar: `${BASE}/avatars/a16.jpg`, been: 201, streak: 9, homeCity: "Ann Arbor, MI", following: true, followsYou: true },
  { id: "sam", name: "Sam", handle: "@samwich", avatar: `${BASE}/avatars/a60.jpg`, been: 34, streak: 1, homeCity: "Ann Arbor, MI", following: true, followsYou: false },
  { id: "kate", name: "Kate", handle: "@katehsia", avatar: `${BASE}/avatars/a32.jpg`, been: 120, streak: 6, homeCity: "New York, NY", following: true, followsYou: true },
];

export const friendById = (id: string) =>
  id === "me" ? me : friends.find((f) => f.id === id) ?? friends[0];

// Each friend's own scores for restaurants (used by friend score and blend).
export const friendRatings: Record<string, Record<string, number>> = {
  maya: { spencer: 9.4, "miss-kim": 9.1, mani: 8.2, frita: 7.9, "blank-slate": 9.6, slurping: 6.8, echelon: 9.3, ricewood: 9.0, aventura: 8.8, roos: 8.1, cardamom: 8.9, "bao-boys": 8.5, savas: 6.2, "via-carota": 9.5, "cho-dang-gol": 9.0, "win-son": 8.9, dhamaka: 8.4, russ: 8.2, levain: 7.6 },
  eliot: { zingermans: 9.5, frita: 9.2, jolly: 8.4, chelas: 8.6, tomukun: 8.0, savas: 7.8, isalita: 8.1, ricewood: 9.3, dimo: 8.8, mani: 7.4, "blank-slate": 8.9, pequods: 9.4, "sun-wah": 9.0, birrieria: 9.2, lula: 8.3, "girl-goat": 8.1, buddys: 9.1, selden: 8.7 },
  judy: { spencer: 9.0, echelon: 9.6, "pacific-rim": 9.1, mani: 9.0, aventura: 8.5, "miss-kim": 8.4, zingermans: 8.7, york: 8.6, juicy: 8.2, frita: 8.3, roos: 9.0, cardamom: 8.0, bestia: 9.4, "parks-bbq": 9.0, selden: 9.2 },
  // Andrew has not been anywhere you have: the "nothing in common" case for Blend.
  andrew: { chelas: 8.9, "bao-boys": 8.7, ricewood: 9.1, roos: 8.0, dimo: 8.6, cardamom: 7.9, "lunch-room": 7.2, york: 8.4, sonoratown: 9.3, "parks-bbq": 8.8, birrieria: 9.0 },
  priya: { cardamom: 9.4, "miss-kim": 9.2, "lunch-room": 8.8, spencer: 8.9, "blank-slate": 9.3, juicy: 8.6, "first-bite": 8.0, aventura: 7.9, tomukun: 8.1, roos: 8.7 },
  sam: { zingermans: 9.1, dimo: 9.0, frita: 8.6, savas: 8.0, jolly: 7.7, chelas: 8.2 },
  kate: { echelon: 9.1, spencer: 9.3, mani: 8.7, "pacific-rim": 8.8, york: 8.9, "blank-slate": 9.0, aventura: 8.6, juicy: 8.4, "via-carota": 9.4, lucali: 9.5, "thai-diner": 8.7, raku: 8.9, russ: 9.0, dhamaka: 8.8, levain: 8.0 },
};

// The signed-in user's starting "Been" list. Note the old visit dates on several
// entries: stale memories are the core problem behind the flexible rating proposal.
export const initialRanked: RankedEntry[] = [
  { restaurantId: "spencer", sentiment: "liked", score: 10.0, method: "compare", visitedAt: "2026-10-18" },
  { restaurantId: "miss-kim", sentiment: "liked", score: 9.5, method: "compare", visitedAt: "2024-03-02" },
  { restaurantId: "zingermans", sentiment: "liked", score: 9.1, method: "compare", visitedAt: "2026-09-06" },
  { restaurantId: "frita", sentiment: "liked", score: 8.6, method: "compare", visitedAt: "2023-11-11" },
  { restaurantId: "blank-slate", sentiment: "liked", score: 8.1, method: "compare", visitedAt: "2026-07-21" },
  { restaurantId: "mani", sentiment: "liked", score: 7.7, method: "compare", visitedAt: "2024-01-14" },
  { restaurantId: "tomukun", sentiment: "liked", score: 7.2, method: "compare", visitedAt: "2025-02-08" },
  { restaurantId: "slurping", sentiment: "fine", score: 6.6, method: "compare", visitedAt: "2023-09-30" },
  { restaurantId: "jolly", sentiment: "fine", score: 5.5, method: "compare", visitedAt: "2025-05-17" },
  { restaurantId: "savas", sentiment: "fine", score: 4.4, method: "compare", visitedAt: "2024-10-05" },
  { restaurantId: "isalita", sentiment: "disliked", score: 3.3, method: "compare", visitedAt: "2025-08-23" },
  // A summer in New York: gives blends a second city where you have opinions.
  { restaurantId: "via-carota", sentiment: "liked", score: 9.3, method: "manual", visitedAt: "2026-06-14" },
  { restaurantId: "russ", sentiment: "liked", score: 8.8, method: "manual", visitedAt: "2026-06-28" },
  { restaurantId: "thai-diner", sentiment: "liked", score: 8.3, method: "manual", visitedAt: "2026-07-05" },
];

export type FeedItem = {
  id: string;
  friendId: string;
  verb: "ranked" | "bookmarked";
  restaurantId: string;
  score?: number;
  withNames?: string;
  visits?: number;
  photos?: string[];
  notes?: string;
  likes: number;
  comments: number;
  bookmarks: number;
  when: string;
};

export const feed: FeedItem[] = [
  { id: "f1", friendId: "judy", verb: "ranked", restaurantId: "echelon", score: 9.6, withNames: "Eliot", visits: 1, photos: [`${BASE}/food/f4.jpg`, `${BASE}/food/f3.jpg`, `${BASE}/food/f5.jpg`], notes: "The wood fired everything here is unreal. Get the bread service, the carrots, and whatever fish they have that night. We also loved the", likes: 124, comments: 2, bookmarks: 620, when: "2 hours ago" },
  { id: "f2", friendId: "maya", verb: "bookmarked", restaurantId: "pacific-rim", likes: 8, comments: 0, bookmarks: 41, when: "13 hours ago" },
  { id: "f3", friendId: "maya", verb: "ranked", restaurantId: "miss-kim", score: 9.1, visits: 3, photos: [`${BASE}/food/f11.jpg`, `${BASE}/food/f12.jpg`], notes: "Tteokbokki forever. Third visit and it keeps getting better.", likes: 37, comments: 4, bookmarks: 96, when: "Yesterday" },
  { id: "f4", friendId: "andrew", verb: "ranked", restaurantId: "chelas", score: 8.9, visits: 5, likes: 19, comments: 1, bookmarks: 33, when: "Yesterday" },
  { id: "f5", friendId: "priya", verb: "ranked", restaurantId: "cardamom", score: 9.4, withNames: "Kate", visits: 2, photos: [`${BASE}/food/f2.jpg`, `${BASE}/food/f9.jpg`, `${BASE}/food/f6.jpg`], notes: "Best saag paneer in town and the naan comes out blistered and hot.", likes: 52, comments: 6, bookmarks: 140, when: "2 days ago" },
];

export const fmtScore = (n: number) => (n >= 10 ? "10.0" : n.toFixed(1));

export const scoreTone = (n: number): Sentiment =>
  n >= 6.7 ? "liked" : n >= 3.4 ? "fine" : "disliked";

export const timeAgo = (iso: string, now = new Date("2026-11-12")) => {
  const days = Math.round((now.getTime() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  if (days < 365) return `${Math.round(days / 30)} months ago`;
  const yrs = days / 365;
  return yrs < 1.5 ? "1 year ago" : `${Math.round(yrs)} years ago`;
};
