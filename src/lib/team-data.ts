// Challenge definitions (plain data, safe to import on the server).
export type Challenge = {
  id: string;
  title: string;
  blurb: string;
  medal: string; // short serif text inside the medallion
  restaurantIds: string[];
  daysLeft: number;
  joinedFriendIds: string[]; // friends already in it (social proof on the hub)
};

export const challenges: Challenge[] = [
  {
    id: "kerrytown-crawl",
    title: "Kerrytown Crawl",
    blurb: "Six spots in and around the market. Bring your people.",
    medal: "KC",
    restaurantIds: ["spencer", "miss-kim", "zingermans", "lunch-room", "blank-slate", "roos"],
    daysLeft: 12,
    joinedFriendIds: ["maya", "priya", "judy"],
  },
  {
    id: "noodle-november",
    title: "Noodle November",
    blurb: "Five bowls, thirty days. Slurping encouraged.",
    medal: "NN",
    restaurantIds: ["tomukun", "slurping", "miss-kim", "bao-boys", "cardamom"],
    daysLeft: 18,
    joinedFriendIds: ["andrew", "eliot"],
  },
  {
    id: "sweet-tooth-trio",
    title: "Sweet Tooth Trio",
    blurb: "Three dessert stops. Split everything.",
    medal: "ST",
    restaurantIds: ["blank-slate", "dimo", "juicy"],
    daysLeft: 9,
    joinedFriendIds: ["kate"],
  },
  {
    id: "main-street-passport",
    title: "Main Street Passport",
    blurb: "Stamp your way down Main Street, one table at a time.",
    medal: "MS",
    restaurantIds: ["echelon", "jolly", "first-bite", "mani", "aventura"],
    daysLeft: 40,
    joinedFriendIds: ["judy", "kate", "sam", "eliot"],
  },
];

