import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, spacing } from '../theme';
import { EmptyState, Input } from '../components/ui';
import { ItemCard } from '../components/ItemCard';
import { useApp } from '../store/AppContext';
import { CAMPUSES } from '../types';

/** Home / lost requests: the campus feed, a keyword search, and the report CTA. */
export function HomeScreen({ navigation }: any) {
  const { user, items } = useApp();
  const [query, setQuery] = useState('');

  const campusLabel = CAMPUSES.find((c) => c.id === user?.campusId)?.label ?? '';

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();

    return items
      // Resolved requests leave the feed and live on in My activity.
      .filter((i) => i.status === 'OPEN' || i.status === 'CLAIM_PENDING')
      .filter((i) =>
        q
          ? i.title.toLowerCase().includes(q) ||
            i.description.toLowerCase().includes(q) ||
            i.category.toLowerCase().includes(q) ||
            i.lastSeenZone.toLowerCase().includes(q)
          : true,
      );
  }, [items, query]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.campusRow}>
          <Ionicons name="school" size={13} color={colors.blue} />
          <Text style={styles.campus}>{campusLabel}</Text>
        </View>
        <Text style={styles.headerTitle}>Lost requests</Text>
      </View>

      <View style={styles.searchRow}>
        <Input
          value={query}
          onChangeText={setQuery}
          placeholder="Search item, category or location"
          icon="search-outline"
          wrapperStyle={{ flex: 1 }}
          accessibilityLabel="Search lost requests"
          returnKeyType="search"
        />
      </View>

      <FlatList
        data={visible}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ItemCard
            item={item}
            mine={item.ownerId === user?.uid}
            onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title="Nothing here yet"
            body={
              query
                ? 'No lost request matches that search. Try a different word.'
                : 'No open lost requests on your campus right now. Lost something? Report it and it shows up here.'
            }
          />
        }
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Report a lost item"
        onPress={() => navigation.navigate('ReportLost')}
        style={({ pressed }) => [
          styles.fab,
          pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
        ]}
      >
        <Text style={styles.fabText}>Report lost item</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  campusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  campus: { ...font.caption, color: colors.blue, fontWeight: '700', letterSpacing: 0.2 },
  headerTitle: { ...font.display, marginTop: 1 },

  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },

  list: { paddingHorizontal: spacing.lg, paddingBottom: 110 },

  fab: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    minHeight: 54,
    borderRadius: radius.lg,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.1 },
});
