import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  colors,
  font,
  gradients,
  radius,
  shadow,
  shadowLifted,
  spacing,
  TOUCH_TARGET,
} from '../theme';
import { Button, Card, Chip, ChipRow, EmptyState, Input, SectionHeading } from '../components/ui';
import { ItemCard } from '../components/ItemCard';
import { useApp } from '../store/AppContext';
import { CAMPUSES, CAMPUS_ZONES, CATEGORIES, Category, ItemStatus } from '../types';
import { relativeTime } from '../utils/format';
import { CATEGORY_ICON } from '../utils/icons';
import { features } from '../config/phase';

type DateWindow = 'ANY' | '24H' | '7D';

const STATUS_FILTERS: { id: ItemStatus | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'All active' },
  { id: 'OPEN', label: 'Open' },
  { id: 'CLAIM_PENDING', label: 'Claim pending' },
  { id: 'RETURNED', label: 'Returned' },
  { id: 'EXPIRED', label: 'Expired' },
];

/** PRD §6 — Home / Lost requests: search, filters, cards, Report Lost Item CTA. */
export function HomeScreen({ navigation }: any) {
  const { user, items, alerts, unreadAlerts, markAlertsRead, refresh } = useApp();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const [zone, setZone] = useState<string | null>(null);
  const [status, setStatus] = useState<ItemStatus | 'ALL'>('ALL');
  const [dateWindow, setDateWindow] = useState<DateWindow>('ANY');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const campusLabel = CAMPUSES.find((c) => c.id === user?.campusId)?.label ?? '';
  const zones = user ? CAMPUS_ZONES[user.campusId] : [];

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cutoff =
      dateWindow === '24H'
        ? Date.now() - 86400000
        : dateWindow === '7D'
          ? Date.now() - 7 * 86400000
          : null;

    return items
      // Cancelled requests never appear in the feed for anyone.
      .filter((i) => i.status !== 'HIDDEN')
      // Default feed hides resolved and expired requests (success criterion #37).
      .filter((i) => (status === 'ALL' ? i.status === 'OPEN' || i.status === 'CLAIM_PENDING' : i.status === status))
      .filter((i) => (category ? i.category === category : true))
      .filter((i) => (zone ? i.lastSeenZone === zone : true))
      .filter((i) => (cutoff ? new Date(i.lostAt).getTime() >= cutoff : true))
      .filter((i) =>
        q
          ? i.title.toLowerCase().includes(q) ||
            i.description.toLowerCase().includes(q) ||
            i.category.toLowerCase().includes(q) ||
            i.lastSeenZone.toLowerCase().includes(q)
          : true,
      );
  }, [items, query, category, zone, status, dateWindow]);

  const activeFilterCount =
    (category ? 1 : 0) + (zone ? 1 : 0) + (status !== 'ALL' ? 1 : 0) + (dateWindow !== 'ANY' ? 1 : 0);

  function clearFilters() {
    setCategory(null);
    setZone(null);
    setStatus('ALL');
    setDateWindow('ANY');
  }

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.campusRow}>
            <Ionicons name="school" size={13} color={colors.blue} />
            <Text style={styles.campus}>{campusLabel}</Text>
          </View>
          <Text style={styles.headerTitle}>Lost requests</Text>
        </View>

        {features.campusAlerts ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Campus alerts, ${unreadAlerts} unread`}
            onPress={() => {
              setAlertsOpen(true);
              markAlertsRead();
            }}
            style={styles.bell}
            hitSlop={8}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.navy} />
            {unreadAlerts > 0 ? (
              <View style={styles.bellDot}>
                <Text style={styles.bellDotText}>{unreadAlerts > 9 ? '9+' : unreadAlerts}</Text>
              </View>
            ) : null}
          </Pressable>
        ) : null}
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
        {features.advancedFilters ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Filters, ${activeFilterCount} active`}
            onPress={() => setFiltersOpen(true)}
            style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}
          >
            <Ionicons name="options-outline" size={17} color={colors.text} />
            <Text style={styles.filterButtonText}>Filters</Text>
            {activeFilterCount > 0 ? (
              <View style={styles.filterCount}>
                <Text style={styles.filterCountText}>{activeFilterCount}</Text>
              </View>
            ) : null}
          </Pressable>
        ) : null}
      </View>

      {features.statusFilters ? (
        <View style={{ paddingLeft: spacing.lg, paddingBottom: spacing.sm }}>
          <ChipRow>
            {STATUS_FILTERS.map((s) => (
              <Chip
                key={s.id}
                label={s.label}
                selected={status === s.id}
                onPress={() => setStatus(s.id)}
              />
            ))}
          </ChipRow>
        </View>
      ) : null}

      <FlatList
        data={visible}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        refreshControl={
          features.pullToRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
        renderItem={({ item }) => (
          <ItemCard
            item={item}
            mine={item.ownerId === user?.uid}
            onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon={activeFilterCount ? 'funnel-outline' : 'search-outline'}
            title="Nothing here yet"
            body={
              activeFilterCount
                ? 'No lost request matches these filters. Try clearing them.'
                : query
                  ? 'No lost request matches that search. Try a different word.'
                  : features.campusAlerts
                    ? 'No open lost requests on your campus right now. Lost something? Report it and the campus gets alerted.'
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
          styles.fabShell,
          features.polishedUi && shadowLifted,
          pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
        ]}
      >
        {features.polishedUi ? (
          <LinearGradient
            colors={gradients.cta}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fab}
          >
            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
            <Text style={styles.fabText}>Report lost item</Text>
          </LinearGradient>
        ) : (
          <View style={[styles.fab, styles.fabFlat]}>
            <Text style={styles.fabText}>Report lost item</Text>
          </View>
        )}
      </Pressable>

      {/* ------------------------------------------------------- filters */}
      <Modal visible={filtersOpen && features.advancedFilters} animationType="slide" transparent onRequestClose={() => setFiltersOpen(false)}>
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Filters</Text>

            <SectionHeading>Category</SectionHeading>
            <ChipRow>
              {CATEGORIES.map((c) => (
                <Chip
                  key={c}
                  label={c}
                  icon={CATEGORY_ICON[c].name}
                  selected={category === c}
                  onPress={() => setCategory(category === c ? null : c)}
                />
              ))}
            </ChipRow>

            <SectionHeading>Last seen location</SectionHeading>
            <ChipRow>
              {zones.map((z) => (
                <Chip
                  key={z}
                  label={z}
                  icon="location-outline"
                  selected={zone === z}
                  onPress={() => setZone(zone === z ? null : z)}
                />
              ))}
            </ChipRow>

            <SectionHeading>Lost within</SectionHeading>
            <View style={styles.rowWrap}>
              {(
                [
                  ['ANY', 'Any time'],
                  ['24H', 'Last 24 hours'],
                  ['7D', 'Last 7 days'],
                ] as [DateWindow, string][]
              ).map(([id, label]) => (
                <Chip key={id} label={label} selected={dateWindow === id} onPress={() => setDateWindow(id)} />
              ))}
            </View>

            <View style={styles.sheetActions}>
              <Button label="Clear all" variant="secondary" onPress={clearFilters} style={{ flex: 1 }} />
              <Button label="Show results" onPress={() => setFiltersOpen(false)} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* -------------------------------------------------------- alerts */}
      <Modal visible={alertsOpen && features.campusAlerts} animationType="slide" transparent onRequestClose={() => setAlertsOpen(false)}>
        <View style={styles.sheetBackdrop}>
          <View style={[styles.sheet, { maxHeight: '75%' }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Campus alerts</Text>
            <Text style={styles.sheetSubtitle}>
              Previews never include phone numbers, ID numbers or claim proof.
            </Text>

            <FlatList
              data={alerts}
              keyExtractor={(a) => a.id}
              ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
              ListEmptyComponent={
                <EmptyState
                  icon="notifications-off-outline"
                  title="No alerts yet"
                  body="Campus alerts for new lost requests will appear here."
                />
              }
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={item.title}
                  onPress={() => {
                    setAlertsOpen(false);
                    navigation.navigate('ItemDetail', { itemId: item.itemId });
                  }}
                >
                  <Card style={{ padding: spacing.md }}>
                    <View style={styles.alertRow}>
                      <View style={styles.alertDot}>
                        <Ionicons name="megaphone-outline" size={15} color={colors.blue} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.alertTitle}>{item.title}</Text>
                        <Text style={styles.alertBody}>{item.body}</Text>
                        <Text style={styles.alertTime}>{relativeTime(item.createdAt)}</Text>
                      </View>
                    </View>
                  </Card>
                </Pressable>
              )}
            />

            <Button label="Close" variant="secondary" onPress={() => setAlertsOpen(false)} style={{ marginTop: spacing.md }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  campusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  campus: { ...font.caption, color: colors.blue, fontWeight: '700', letterSpacing: 0.2 },
  headerTitle: { ...font.display, marginTop: 1 },
  bell: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  bellDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDotText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },

  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  filterButton: {
    minHeight: TOUCH_TARGET + 4,
    flexShrink: 0,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterButtonActive: { borderColor: colors.navy, backgroundColor: colors.blueSoft },
  filterButtonText: { fontSize: 14, fontWeight: '700', color: colors.text },
  filterCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterCountText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },

  list: { paddingHorizontal: spacing.lg, paddingBottom: 110 },

  fabShell: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    borderRadius: radius.lg,
  },
  fab: {
    minHeight: 54,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  fabFlat: { backgroundColor: colors.navy },
  fabText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.1 },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(16,24,40,0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  sheetTitle: { ...font.h2 },
  sheetSubtitle: { ...font.caption, marginTop: 2, marginBottom: spacing.md },
  sheetActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },

  alertRow: { flexDirection: 'row', gap: spacing.md },
  alertDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: { ...font.h3, fontSize: 14 },
  alertBody: { ...font.caption, marginTop: 2, lineHeight: 18 },
  alertTime: { ...font.caption, color: colors.textFaint, marginTop: spacing.sm },
});
