import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Item } from '../types';
import { colors, font, radius, shadow, spacing } from '../theme';
import { relativeTime, STATUS_META } from '../utils/format';
import { CATEGORY_ICON, STATUS_ICON } from '../utils/icons';
import { Badge, IconTile } from './ui';

/**
 * Feed row for one Lost Item Request. Shows only what the alert preview is
 * allowed to show — title, category, zone, status — never contact details.
 *
 * When there is no photo the category icon stands in, so the row still reads at
 * a glance and the feed keeps a steady rhythm.
 */
export function ItemCard({
  item,
  onPress,
  mine,
}: {
  item: Item;
  onPress: () => void;
  mine?: boolean;
}) {
  const status = STATUS_META[item.status];
  const cat = CATEGORY_ICON[item.category];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${item.category}, last seen near ${item.lastSeenZone}, status ${status.label}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.row}>
        {item.imageUrlOptional ? (
          <Image source={{ uri: item.imageUrlOptional }} style={styles.thumb} />
        ) : (
          <IconTile name={cat.name} fg={cat.fg} bg={cat.bg} size={58} />
        )}

        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
            {mine ? (
              <View style={styles.mineTag}>
                <Text style={styles.mineTagText}>You</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={13} color={colors.textFaint} />
            <Text style={styles.meta} numberOfLines={1}>
              {item.category} · {item.lastSeenZone}
            </Text>
          </View>

          <View style={styles.footer}>
            <Badge
              label={status.label}
              fg={status.fg}
              bg={status.bg}
              icon={STATUS_ICON[item.status]}
            />
            <Text style={styles.time}>{relativeTime(item.createdAt)}</Text>
          </View>
        </View>

        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textFaint}
          style={styles.chevron}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow,
  },
  cardPressed: { opacity: 0.92, transform: [{ scale: 0.994 }] },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  thumb: { width: 58, height: 58, borderRadius: 16, backgroundColor: colors.greySoft },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  title: { ...font.h3, flex: 1, lineHeight: 21 },
  mineTag: {
    backgroundColor: colors.blueSoft,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  mineTagText: { fontSize: 10, fontWeight: '800', color: colors.navy },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  meta: { ...font.caption, flex: 1 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  time: { ...font.caption, color: colors.textFaint },
  chevron: { alignSelf: 'center' },
});
