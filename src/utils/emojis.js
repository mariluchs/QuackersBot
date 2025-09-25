// src/utils/emojis.js
// ▶️ Replace these IDs if they change in your server
const IDs = {
  QuackersHappy: '1420500091629867169',
  QuackersSad:   '1420500108356882442',
  QuackersSip:   '1420508415003852810', // feeding emoji
  QuackersPet:   '1420505252473340105', // pet emoji
};

// Unicode fallbacks if the custom emoji isn't available
const F = {
  happy: '🙂',
  sad:   '😔',
  feed:  '🍞',
  pet:   '🐾',
  duck:  '🐤',
};

export const EMOJIS = {
  mood: {
    happy: IDs.QuackersHappy ? `<:QuackersHappy:${IDs.QuackersHappy}>` : F.happy,
    sad:   IDs.QuackersSad   ? `<:QuackersSad:${IDs.QuackersSad}>`     : F.sad,
  },
  feed: IDs.QuackersSip ? `<:QuackersSip:${IDs.QuackersSip}>` : F.feed,
  pet:  IDs.QuackersPet ? `<:QuackersPet:${IDs.QuackersPet}>` : F.pet,
  duck: F.duck, // simple duck symbol
};
