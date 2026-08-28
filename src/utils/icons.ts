import { Ionicons } from '@expo/vector-icons';
import { Category, ItemStatus } from '../types';
import { colors } from '../theme';

type IonName = keyof typeof Ionicons.glyphMap;

/**
 * One icon and tint per category. Giving each category a consistent colour lets
 * the feed be scanned by shape and hue before any text is read.
 */
export const CATEGORY_ICON: Record<Category, { name: IonName; fg: string; bg: string }> = {
  'ID Card': { name: 'card-outline', fg: colors.red, bg: colors.redSoft },
  'Wallet / Cards': { name: 'wallet-outline', fg: colors.red, bg: colors.redSoft },
  Electronics: { name: 'headset-outline', fg: colors.blue, bg: colors.blueSoft },
  Keys: { name: 'key-outline', fg: colors.amber, bg: colors.amberSoft },
  'Books / Notes': { name: 'book-outline', fg: colors.purple, bg: colors.purpleSoft },
  Bag: { name: 'bag-handle-outline', fg: colors.green, bg: colors.greenSoft },
  Bottle: { name: 'water-outline', fg: colors.blue, bg: colors.blueSoft },
  Clothing: { name: 'shirt-outline', fg: colors.purple, bg: colors.purpleSoft },
  Other: { name: 'cube-outline', fg: colors.grey, bg: colors.greySoft },
};

export const STATUS_ICON: Record<ItemStatus, IonName> = {
  OPEN: 'radio-button-on-outline',
  CLAIM_PENDING: 'time-outline',
  RETURNED: 'checkmark-circle-outline',
};
