import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font, radius, spacing } from '../theme';
import { Button, Card, Divider, Notice, SectionHeading } from '../components/ui';
import { useApp } from '../store/AppContext';
import { CAMPUSES } from '../types';
import { initials } from '../utils/format';

/** Profile: who you are, what you have posted, and sign out. */
export function ProfileScreen() {
  const { user, items, matches, signOut } = useApp();

  if (!user) return null;

  const campus = CAMPUSES.find((c) => c.id === user.campusId);
  const myRequests = items.filter((i) => i.ownerId === user.uid);
  const returned = myRequests.filter((i) => i.status === 'RETURNED').length;
  const myFinds = matches.filter((m) => m.finderId === user.uid).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.headerTitle}>Profile</Text>

        <Card style={{ marginTop: spacing.md }}>
          <View style={styles.identity}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(user.name)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{user.name}</Text>
              <Text style={styles.email}>{user.email}</Text>
              <View style={styles.campusRow}>
                <Text style={styles.campusTag}>{campus?.label}</Text>
              </View>
            </View>
          </View>

          <Divider />

          <View style={styles.stats}>
            <Stat value={myRequests.length} label="Requests" />
            <Stat value={returned} label="Returned" />
            <Stat value={myFinds} label="Items found" />
          </View>
        </Card>

        <SectionHeading>Privacy</SectionHeading>
        <Notice tone="info">
          BTS Find is campus-scoped. You can only see and be seen by students of{' '}
          {campus?.label}. A match detail is visible only to the owner and the
          finder who sent it.
        </Notice>

        <Button
          label="Sign out"
          variant="secondary"
          onPress={signOut}
          style={{ marginTop: spacing.sm }}
        />

        <Text style={styles.version}>BTS Find · proof of concept · mock data</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  headerTitle: { ...font.h1 },
  identity: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  name: { ...font.h2, fontSize: 18 },
  email: { ...font.caption, marginTop: 1 },
  campusRow: { flexDirection: 'row', marginTop: 6 },
  campusTag: {
    ...font.caption,
    color: colors.navy,
    fontWeight: '700',
    backgroundColor: colors.blueSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  stats: { flexDirection: 'row' },
  statValue: { ...font.h2 },
  statLabel: { ...font.caption, marginTop: 2 },
  version: { ...font.caption, color: colors.textFaint, textAlign: 'center', marginTop: spacing.xl },
});
