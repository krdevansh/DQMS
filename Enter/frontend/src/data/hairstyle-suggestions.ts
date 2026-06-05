import { HairstyleSuggestion } from '@/types';

export const hairstyleSuggestions: HairstyleSuggestion[] = [
  {
    id: '1',
    name: 'Textured Crop',
    description: 'A modern short hairstyle with textured top and faded sides. Low maintenance and works great with natural waves.',
    imageUrl: 'https://images.unsplash.com/photo-1596728325488-58c87691e9af?w=400&h=300&fit=crop&crop=face',
    faceShapes: ['oval', 'square', 'oblong'],
    gender: ['male'],
    tags: ['short', 'low-maintenance', 'trendy'],
    link: 'https://www.pinterest.com/search/pins/?q=textured+crop+hairstyle+men',
    minAge: 16,
    maxAge: 40,
  },
  {
    id: '2',
    name: 'Layered Lob',
    description: 'Shoulder-length cut with soft layers for movement and volume. Flattering for most face shapes.',
    imageUrl: 'https://images.unsplash.com/photo-1597225244661-46e83e4e9498?w=400&h=300&fit=crop&crop=face',
    faceShapes: ['oval', 'round', 'heart', 'diamond'],
    gender: ['female'],
    tags: ['medium-length', 'layers', 'versatile'],
    link: 'https://www.pinterest.com/search/pins/?q=layered+lob+hairstyle+women',
    minAge: 18,
    maxAge: 55,
  },
  {
    id: '3',
    name: 'Pompadour Fade',
    description: 'Classic voluminous top with a modern fade on the sides and back. Bold and stylish.',
    imageUrl: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=400&h=300&fit=crop&crop=face',
    faceShapes: ['oval', 'square', 'oblong'],
    gender: ['male'],
    tags: ['voluminous', 'classic', 'bold'],
    link: 'https://www.pinterest.com/search/pins/?q=pompadour+fade+hairstyle+men',
    minAge: 18,
    maxAge: 50,
  },
  {
    id: '4',
    name: 'Curly Shag',
    description: 'Bouncy layers that enhance natural curls with a retro-inspired shag silhouette.',
    imageUrl: 'https://images.unsplash.com/photo-1605980776566-0486c3ac7617?w=400&h=300&fit=crop&crop=face',
    faceShapes: ['oval', 'round', 'heart'],
    gender: ['female'],
    tags: ['curly', 'layered', 'retro'],
    link: 'https://www.pinterest.com/search/pins/?q=curly+shag+hairstyle+women',
    minAge: 16,
    maxAge: 45,
  },
  {
    id: '5',
    name: 'Buzz Cut',
    description: 'Ultra-short uniform cut. The ultimate low-maintenance style that never goes out of fashion.',
    imageUrl: 'https://images.unsplash.com/photo-1615873968403-89e068629265?w=400&h=300&fit=crop&crop=face',
    faceShapes: ['oval', 'square', 'round', 'heart', 'diamond', 'oblong'],
    gender: ['male', 'female', 'non-binary'],
    tags: ['short', 'minimal', 'bold'],
    link: 'https://www.pinterest.com/search/pins/?q=buzz+cut+hairstyle',
    minAge: 10,
    maxAge: 80,
  },
];

export const faceShapeLabels: Record<string, string> = {
  oval: 'Oval',
  round: 'Round',
  square: 'Square',
  heart: 'Heart',
  diamond: 'Diamond',
  oblong: 'Oblong',
};

export function getSuggestionsForProfile(
  faceShape?: string,
  gender?: string,
  age?: number
): HairstyleSuggestion[] {
  let filtered = hairstyleSuggestions;

  if (faceShape) {
    filtered = filtered.filter((h) => h.faceShapes.includes(faceShape as any));
  }

  if (gender) {
    filtered = filtered.filter((h) => h.gender.includes(gender as any));
  } else {
    filtered = [];
  }

  if (age) {
    filtered = filtered.filter((h) => {
      if (h.minAge !== undefined && age < h.minAge) return false;
      if (h.maxAge !== undefined && age > h.maxAge) return false;
      return true;
    });
  }

  return filtered.slice(0, 5);
}
