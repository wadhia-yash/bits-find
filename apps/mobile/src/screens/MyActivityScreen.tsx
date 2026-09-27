import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, spacing } from '../theme';
import { Badge, Button, Card, EmptyState } from '../components/ui';
import { useApp } from '../store/AppContext';
import { ADMIN_DESKS, Item, Match } from '../types';
import { relativeTime, STATUS_META } from '../utils/format';
import { features } from '../config/phase';

type Tab = 'LOST' | 'FOUND';

/** PRD §6 — My activity: my lost requests, found matches, handover status, confirm Returned. */
export function MyActivityScreen({ navigation }: any) {
  const { user, items, matches, confirmReturned, markAdminCollected } = useApp();
  const [tab, setTab] = useState<Tab>('LOST');

  const myRequests = useMemo(
    () => items.filter((i) => i.ownerId === user?.uid),
    [items, user],
  );

  const myFinds = useMemo(
    () =>
      matches
        .filter((m) => m.finderId === user?.uid)
        .map((m) => ({ match: m, item: items.find((i) => i.id === m.itemId) }))
        .filter((row): row is { match: Match; item: Item } => !!row.item),
    [matches, items, user],
  );

  const pendingForMe = useMemo(
    () =>
      matches.filter(
        (m) =>
          m.status === 'PENDING' &&
          myRequests.some((i) => i.id === m.itemId),
      ).length,
    [matches, myRequests],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My activity</Text>
        {pendingForMe > 0 ? (
          <Text style={styles.headerNote}>
            {pendingForMe} match{pendingForMe > 1 ? 'es' : ''} waiting for your verification
          </Text>
        ) : null}
      </View>

      <View style={styles.tabs}>
        <TabButton label={`My lost requests (${myRequests.length})`} active={tab === 'LOST'} onPress={() => setTab('LOST')} />
        <TabButton label={`Items I found (${myFinds.length})`} active={tab === 'FOUND'} onPress={() => setTab('FOUND')} />
      </View>

      {tab === 'LOST' ? (
        <FlatList
          data={myRequests}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="document-text-outline"
              title="No lost requests yet"
              body="When you report something you lost, it shows up here with its match and handover status."
            />
          }
          renderItem={({ item }) => {
            const status = STATUS_META[item.status];
            const itemMatches = matches.filter((m) => m.itemId === item.id);
            const accepted = itemMatches.find((m) => m.status === 'ACCEPTED');
            const pending = itemMatches.filter((m) => m.status === 'PENDING');

            return (
              <Card style={{ marginBottom: spacing.md }}>
                <View style={styles.cardHead}>
                  <Badge label={status.label} fg={status.fg} bg={status.bg} />
                  <Text style={styles.time}>{relativeTime(item.createdAt)}</Text>
                </View>

                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardMeta}>
                  {item.category} · near {item.lastSeenZone}
                </Text>

                {pending.length > 0 ? (
                  <Text style={styles.callout}>
                    {pending.length} match{pending.length > 1 ? 'es' : ''} waiting for you to verify
                  </Text>
                ) : null}

                {accepted ? (
                  <View style={styles.handoverBox}>
                    <Text style={styles.handoverLabel}>
                      {accepted.handoverMode === 'DIRECT'
                        ? 'Direct handover'
                        : 'Collect from BITS Admin'}
                    </Text>
                    <Text style={styles.handoverBody}>
                      {accepted.handoverMode === 'DIRECT'
                        ? `Arrange pickup with ${accepted.finderName}.`
                        : accepted.adminDropoffStatus === 'COLLECTED'
                          ? 'Collected from the Admin Department.'
                          : ADMIN_DESKS[item.campusId]}
                    </Text>

                    {features.adminCollectionTracking &&
                    accepted.handoverMode === 'ADMIN' &&
                    accepted.adminDropoffStatus === 'SUBMITTED' ? (
                      <Button
                        label="I collected it from Admin"
                        variant="secondary"
                        onPress={() =>
                          markAdminCollected(accepted.id).catch((e) => Alert.alert('Error', e.message))
                        }
                        style={{ marginTop: spacing.sm }}
                      />
                    ) : null}

                    <Button
                      label="Confirm item returned"
                      onPress={() =>
                        Alert.alert('Confirm return?', 'This closes the request for good.', [
                          { text: 'Not yet', style: 'cancel' },
                          {
                            text: 'Yes, returned',
                            onPress: () =>
                              confirmReturned(item.id, accepted.id).catch((e) =>
                                Alert.alert('Error', e.message),
                              ),
                          },
                        ])
                      }
                      style={{ marginTop: spacing.sm }}
                    />
                  </View>
                ) : null}

                <Button
                  label="Open request"
                  variant="ghost"
                  onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
                  style={{ marginTop: spacing.sm }}
                />
              </Card>
            );
          }}
        />
      ) : (
        <FlatList
          data={myFinds}
          keyExtractor={(row) => row.match.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="hand-left-outline"
              title="No finds yet"
              body="Respond to a lost request with “I found this item” and it will be tracked here."
            />
          }
          renderItem={({ item: row }) => {
            const tone =
              row.match.status === 'ACCEPTED' || row.match.status === 'COMPLETED'
                ? { fg: colors.green, bg: colors.greenSoft }
                : row.match.status === 'REJECTED'
                  ? { fg: colors.red, bg: colors.redSoft }
                  : { fg: colors.amber, bg: colors.amberSoft };

            return (
              <Card style={{ marginBottom: spacing.md }}>
                <View style={styles.cardHead}>
                  <Badge
                    label={
                      row.match.status === 'PENDING'
                        ? 'Awaiting owner'
                        : row.match.status.charAt(0) + row.match.status.slice(1).toLowerCase()
                    }
                    fg={tone.fg}
                    bg={tone.bg}
                  />
                  <Text style={styles.time}>{relativeTime(row.match.createdAt)}</Text>
                </View>

                <Text style={styles.cardTitle}>{row.item.title}</Text>
                <Text style={styles.cardMeta}>
                  {row.match.handoverMode === 'DIRECT'
                    ? 'Direct handover to owner'
                    : `Submitted to BITS Admin · ${
                        row.match.adminDropoffStatus === 'COLLECTED'
                          ? 'collected by owner'
                          : 'awaiting collection'
                      }`}
                </Text>

                <Button
                  label="Open request"
                  variant="ghost"
                  onPress={() => navigation.navigate('ItemDetail', { itemId: row.item.id })}
                  style={{ marginTop: spacing.sm }}
                />
              </Card>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.tab, active && styles.tabActive]}
    >
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  headerTitle: { ...font.h1 },
  headerNote: { ...font.caption, color: colors.amber, fontWeight: '600', marginTop: 2 },
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  tabActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  tabLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  tabLabelActive: { color: '#FFFFFF' },

  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { ...font.h3, marginTop: spacing.sm },
  cardMeta: { ...font.caption, marginTop: 2, lineHeight: 18 },
  time: { ...font.caption, color: colors.textFaint },
  callout: {
    ...font.caption,
    color: colors.amber,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  handoverBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  handoverLabel: { ...font.label, color: colors.text },
  handoverBody: { ...font.caption, marginTop: 2, lineHeight: 18 },
});
