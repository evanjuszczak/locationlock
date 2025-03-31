import { Location } from './types';

// Updated locations to ensure they have Mapillary coverage
const LOCATIONS: Location[] = [
  { lat: 40.7580, lng: -73.9855 }, // Times Square, New York
  { lat: 51.5007, lng: -0.1246 },  // Big Ben, London
  { lat: 35.6586, lng: 139.7454 }, // Shibuya Crossing, Tokyo
  { lat: -33.8568, lng: 151.2153 }, // Sydney Opera House
  { lat: 48.8584, lng: 2.2945 },   // Eiffel Tower, Paris
  { lat: 40.4319, lng: 116.5704 }, // Great Wall of China
  { lat: 41.8902, lng: 12.4922 },  // Colosseum, Rome
  { lat: 37.8199, lng: -122.4783 }, // Golden Gate Bridge
  { lat: -22.9519, lng: -43.2105 }, // Christ the Redeemer, Rio
  { lat: 27.1751, lng: 78.0421 },  // Taj Mahal, India
];

export const getRandomLocation = (): Location => {
  return LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
};