import type { ComponentType } from 'react';
import type { PageProps } from './components';

/** One page of the admin panel. The list of these lives in src/routes.tsx. */
export interface AppRoute {
  /** Web address, e.g. "/items". */
  path: string;
  /** Text in the sidebar. */
  label: string;
  /** Heading at the top of the page. */
  title: string;
  /** Line under the heading. */
  subtitle: string;
  component: ComponentType<PageProps>;
}
