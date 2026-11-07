/**
 * Every organization the admin panel knows about.
 * To add another business (a theme park, say): create its config file next to
 * silverscreen.ts and add it to this list. The panel adapts by itself.
 */

import type { OrganizationConfig } from '../../types';
import { silverscreen } from './silverscreen';

export const ORGANIZATIONS: OrganizationConfig[] = [silverscreen];
