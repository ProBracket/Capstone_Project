const blockedTopics = {
  santa: [
    "santa",
    "santa claus",
    "kris kringle",
    "father christmas",
    "saint nicholas",
    "st nicholas",
  ],

  toothFairy: [
    "tooth fairy",
    "toothfairy",
  ],

  easterBunny: [
    "easter bunny",
    "easter rabbit",
    "easter hare"
  ],
  mythicalCharacters: [
    "leprechaun",
    "leprechauns",
    "elf on the shelf",
  ],
  religion: [
  "god",
  "jesus",
  "christ",
  "christianity",
  "christian",

  "allah",
  "islam",
  "muslim",

  "judaism",
  "jewish",

  "hindu",
  "hinduism",

  "buddha",
  "buddhism",

  "sikh",
  "sikhism",

],
adultTopics: [
  "sexual",
  "intercourse",
  "porn",
  "pornography",
  "nude",
  "naked",
  "xxx",
],

profanity: [
  "fuck",
  "fucking",
  "fucked",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "crap",
],
personalInformation: [
  "my address",
  "where i live",
  "my phone number",
]

};

export function isMessageAllowed(
  message: string
) {
  const lower = message.toLowerCase();

  return !Object.values(blockedTopics).some(
    (topicTerms) =>
      topicTerms.some((term) =>
        lower.includes(term)
      )
  );
}
