import type { Area, Branch, OrganizationConfig } from '../../types';

/** Builds "Screen 1", "Screen 2"... with a format for each, e.g. ['2D', 'IMAX']. */
function screens(branchId: string, formats: string[]): Area[] {
  return formats.map((format, i) => ({
    id: `${branchId}-s${i + 1}`,
    label: `Screen ${i + 1}`,
    format,
  }));
}

/** Places that every branch has and that are not a screen. */
function commonAreas(branchId: string): Area[] {
  return ['Lobby', 'Food counter', 'Restrooms', 'Parking', 'Box office'].map((label) => ({
    id: `${branchId}-${label.toLowerCase().replace(/\s+/g, '-')}`,
    label,
  }));
}

function branch(id: string, label: string, formats: string[]): Branch {
  return { id, label, areas: [...screens(id, formats), ...commonAreas(id)] };
}

/**
 * Silverscreen Cinemas: a made-up cinema chain used for the demo.
 * Not a real company.
 */
export const silverscreen: OrganizationConfig = {
  id: 'silverscreen',
  name: 'Silverscreen Cinemas',
  terms: {
    branch: 'Branch',
    branches: 'Branches',
    area: 'Screen / area',
    desk: 'Guest services',
    format: 'Screen format',
  },
  categories: ['Phone', 'Wallet / Cards', 'Keys', 'Earbuds & Chargers', 'Bag', 'Clothing', 'Spectacles', "Kids' items", 'Other'],
  branches: [
    branch('mumbai-andheri', 'Mumbai · Andheri', ['2D', '3D', 'IMAX', 'Dolby Atmos', '2D', '4DX']),
    branch('delhi-saket', 'Delhi · Saket', ['2D', '3D', 'IMAX', '2D', 'Dolby Atmos']),
    branch('bengaluru-koramangala', 'Bengaluru · Koramangala', ['2D', '3D', '4DX', 'Dolby Atmos', '2D']),
    branch('pune-viman-nagar', 'Pune · Viman Nagar', ['2D', '3D', '2D', 'IMAX']),
  ],
  mock: {
    itemCount: 96,
    categoryWeights: {
      Phone: 22,
      'Wallet / Cards': 16,
      Keys: 12,
      'Earbuds & Chargers': 15,
      Bag: 8,
      Clothing: 9,
      Spectacles: 7,
      "Kids' items": 6,
      Other: 5,
    },
    titles: {
      Phone: ['Black smartphone', 'Phone with blue case', 'White smartphone'],
      'Wallet / Cards': ['Brown leather wallet', 'Card holder', 'Black wallet'],
      Keys: ['Car key with fob', 'Bunch of house keys', 'Bike key'],
      'Earbuds & Chargers': ['Wireless earbuds case', 'Phone charger', 'Power bank'],
      Bag: ['Small sling bag', 'Backpack', 'Tote bag'],
      Clothing: ['Grey hoodie', 'Denim jacket', 'Scarf'],
      Spectacles: ['Black-frame glasses', 'Sunglasses'],
      "Kids' items": ['Soft toy', 'Water bottle', 'Small jacket'],
      Other: ['Umbrella', 'Water bottle', 'Notebook'],
    },
    branchWeights: {
      'mumbai-andheri': 34,
      'delhi-saket': 26,
      'bengaluru-koramangala': 24,
      'pune-viman-nagar': 12,
    },
  },
};
