import type { StickyColor } from '../types';

export const COLOR_BG: Record<StickyColor, string> = {
  yellow: 'bg-sticky-yellow',
  pink: 'bg-sticky-pink',
  blue: 'bg-sticky-blue',
  green: 'bg-sticky-green',
  purple: 'bg-sticky-purple',
  orange: 'bg-sticky-orange',
  gray: 'bg-sticky-gray',
};

export const COLOR_DOT: Record<StickyColor, string> = {
  yellow: 'bg-yellow-300',
  pink: 'bg-pink-300',
  blue: 'bg-blue-300',
  green: 'bg-green-300',
  purple: 'bg-purple-300',
  orange: 'bg-orange-300',
  gray: 'bg-gray-300',
};

export const ALL_COLORS: StickyColor[] = [
  'yellow',
  'pink',
  'blue',
  'green',
  'purple',
  'orange',
  'gray',
];
