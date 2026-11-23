// src/server/geminiMaps.ts
import { GoogleGenAI } from '@google/genai';
import { getAllUsers } from '../db/users.ts';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface GroundingPlace {
  title?: string;
  uri?: string;
  snippet?: string;
}

export async function getPersonalizedMapSuggestions(
  currentUid: string,
  userLocation: { latitude?: number; longitude?: number; city?: string },
  userInterests?: string
) {
  try {
    const lat = userLocation.latitude ?? 37.7749;
    const lng = userLocation.longitude ?? -122.4194;
    const city = userLocation.city || 'your area';
    const interests = userInterests || 'tech, coffee, creative arts, outdoor activities';

    // Query Gemini 4 Hydrogen with Google Maps Grounding
    const prompt = `I am using Pingit, a social media app where people connect via real-time database pings.
Based on the location near ${city} (lat: ${lat}, lng: ${lng}), identify 3-5 popular local community spots, coffee shops with great work vibes, tech meetup hubs, or outdoor hangout spots where locals with interests in "${interests}" gather.
Explain briefly why each place is a great spot to meet friends or ping fellow locals.`;

    const config: any = {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: {
            latitude: lat,
            longitude: lng,
          },
        },
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config,
    });

    const aiText = response.text || '';

    // Extract Google Maps grounding chunks as required by the Google Maps grounding guidelines
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const places: GroundingPlace[] = [];

    for (const chunk of groundingChunks as any[]) {
      if (chunk.maps) {
        places.push({
          title: chunk.maps.title || 'View on Google Maps',
          uri: chunk.maps.uri || '',
          snippet: chunk.maps.placeAnswerSources?.reviewSnippets?.[0] || '',
        });
      }
    }

    // Retrieve database community users (excluding current user)
    const communityUsers = await getAllUsers(currentUid);

    // Calculate match scores based on interests and location
    const matchedUsers = communityUsers.map((u) => {
      let score = 50;
      const userInterestsList = (u.interests || '').toLowerCase().split(',').map((s) => s.trim());
      const myInterestsList = interests.toLowerCase().split(',').map((s) => s.trim());

      const shared = userInterestsList.filter((item) =>
        myInterestsList.some((my) => my.includes(item) || item.includes(my))
      );
      score += shared.length * 15;

      if (u.city && city && (u.city.toLowerCase().includes(city.toLowerCase()) || city.toLowerCase().includes(u.city.toLowerCase()))) {
        score += 25;
      }

      return {
        ...u,
        compatibilityScore: Math.min(99, score),
        sharedInterests: shared,
        suggestedMeetingPlace: places.length > 0 ? places[Math.floor(Math.random() * places.length)] : null,
      };
    });

    // Sort by compatibility score
    matchedUsers.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    return {
      aiInsight: aiText,
      groundedPlaces: places,
      suggestions: matchedUsers.slice(0, 6),
    };
  } catch (error) {
    console.error('Failed to get Maps personalized suggestions:', error);
    // Provide graceful fallback
    const communityUsers = await getAllUsers(currentUid);
    return {
      aiInsight: 'Discover fellow community members nearby to ping and connect with over shared interests and local hangouts!',
      groundedPlaces: [
        {
          title: 'Nearby Community Hubs',
          uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(userLocation.city || 'cafes and coworking')}`,
          snippet: 'Explore local cafes and hubs on Google Maps',
        },
      ],
      suggestions: communityUsers.slice(0, 6).map((u) => ({
        ...u,
        compatibilityScore: 82,
        sharedInterests: ['tech', 'coffee'],
        suggestedMeetingPlace: null,
      })),
    };
  }
}
