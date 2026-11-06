/**
 * All navigation is defined here. To add a page:
 *   1. build the page in src/pages/
 *   2. add one entry to ROUTES below
 * The sidebar and the page headings update automatically.
 */

import { Handovers } from './pages/Handovers';
import { LostItems } from './pages/LostItems';
import { Overview } from './pages/Overview';
import type { AppRoute } from './types';

export const ROUTES: AppRoute[] = [
  {
    path: '/',
    label: 'Overview',
    title: 'Recovery overview',
    subtitle: 'How well lost items are finding their way home',
    component: Overview,
  },
  {
    path: '/items',
    label: 'Lost items',
    title: 'Lost items',
    subtitle: 'Every request, with its current status',
    component: LostItems,
  },
  {
    path: '/handovers',
    label: 'Handovers',
    title: 'Handovers',
    subtitle: 'Items handed in to staff for safekeeping',
    component: Handovers,
  },
];
