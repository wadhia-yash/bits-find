import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font, radius, spacing } from '../theme';
import { Button, Card, Divider, Field, Input, Notice, SectionHeading } from '../components/ui';
import { useApp } from '../store/AppContext';
import { ADMIN_DESKS, CAMPUSES } from '../types';
import { initials } from '../utils/format';
import * as backend from '../services/backend';
import { features, PHASE, PHASE_META, phaseCaption } from '../config/phase';

/** PRD §6 — Profile: campus, contact consent, notification preference, sign out. */
export function ProfileScreen() {
  const { user, items, matches, updateProfile, signOut } = useApp();
  const [phone, setPhone] = useState(user?.phoneOptional ?? '');
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const campus = CAMPUSES.find((c) => c.id === user.campusId);
  const myRequests = items.filter((i) => i.ownerId === user.uid);
  const returned = myRequests.filter((i) => i.status === 'RETURNED').length;
  const myFinds = matches.filter((m) => m.finderId === user.uid).length;

  async function savePhone() {
    const trimmed = phone.trim();
    if (trimmed && !/^[+\d][\d\s-]{7,}$/.test(trimmed)) {
      Alert.alert('Check the number', 'Enter a valid phone number, or leave it blank.');
      return;
    }
    setSaving(true);
    await updateProfile({ phoneOptional: trimmed || undefined });
    setSaving(false);
    Alert.alert('Saved', 'Your contact preference has been updated.');
  }

  function handleResetDemo() {
    Alert.alert(
      'Reset demo data?',
      'This clears every request, match and account stored on this device and signs you out.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await backend.demoData.reset();
            await signOut();
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.headerTitle}>Profile</Text>

        <View style={styles.phasePill}>
          <Text style={styles.phasePillText}>
            {PHASE_META[PHASE].label} · {PHASE_META[PHASE].name}
          </Text>
        </View>

        <Card style={{ marginTop: spacing.md }}>
          <View style={styles.identity}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(user.name)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{user.name}</Text>
              <Text style={styles.email}>{user.email}</Text>
              <View style={styles.verifiedRow}>
                <Text style={styles.verified}>✓ Verified · {campus?.label}</Text>
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

        {features.contactConsent ? (
          <>
            <SectionHeading>Contact consent</SectionHeading>
            <Card>
              <Text style={styles.body}>
                Your number is never shown on the feed or in a notification. It is
                shared only with a finder whose match you have accepted.
              </Text>
              <Field label="Phone number (optional)" hint="Leave blank to stay in-app only.">
                <Input
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+91 XXXXX XXXXX"
                  keyboardType="phone-pad"
                  inputMode="tel"
                  accessibilityLabel="Optional phone number"
                />
              </Field>
              <Button label="Save contact preference" onPress={savePhone} loading={saving} />
            </Card>
          </>
        ) : null}

        {features.notificationPrefs ? (
          <>
            <SectionHeading>Notifications</SectionHeading>
            <Card>
              <ToggleRow
                title="Campus alerts"
                body="Get a privacy-safe push when someone on your campus reports a lost item."
                value={user.notificationPrefs.campusAlerts}
                onValueChange={(v) =>
                  updateProfile({
                    notificationPrefs: { ...user.notificationPrefs, campusAlerts: v },
                  })
                }
              />
              <Divider />
              <ToggleRow
                title="Match updates"
                body="Get notified when someone responds to your request, or when an owner verifies your match."
                value={user.notificationPrefs.matchUpdates}
                onValueChange={(v) =>
                  updateProfile({
                    notificationPrefs: { ...user.notificationPrefs, matchUpdates: v },
                  })
                }
              />
            </Card>
          </>
        ) : null}

        {features.adminHandover ? (
          <>
            <SectionHeading>BITS Admin Department</SectionHeading>
            <Card>
              <Text style={styles.body}>
                Official handover and collection point for your campus:
              </Text>
              <Text style={styles.desk}>{ADMIN_DESKS[user.campusId]}</Text>
            </Card>
          </>
        ) : null}

        <SectionHeading>Privacy</SectionHeading>
        <Notice tone="info">
          BTS Find is campus-scoped. You can only see and be seen by verified
          students of {campus?.label}.
          {features.campusAlerts
            ? ' Alert previews never contain phone numbers, ID numbers or claim proof.'
            : ' A match detail is visible only to the owner and the finder who sent it.'}
        </Notice>

        <Button label="Sign out" variant="secondary" onPress={signOut} style={{ marginTop: spacing.sm }} />
        {backend.demoData.supported ? (
          <Button
            label="Reset demo data"
            variant="danger"
            onPress={handleResetDemo}
            style={{ marginTop: spacing.sm }}
          />
        ) : null}

        <Text style={styles.version}>
          BTS Find · v1.0 · {phaseCaption()} ·{' '}
          {backend.isFirebase
            ? 'Firebase'
            : features.persistence === 'memory'
              ? 'in-memory mock data'
              : 'on-device pilot'}
        </Text>
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

function ToggleRow({
  title,
  body,
  value,
  onValueChange,
}: {
  title: string;
  body: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1, paddingRight: spacing.md }}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleBody}>{body}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        accessibilityLabel={title}
        trackColor={{ true: colors.navy, false: colors.border }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  headerTitle: { ...font.h1 },
  phasePill: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.blueSoft,
  },
  phasePillText: { fontSize: 11, fontWeight: '800', color: colors.navy, letterSpacing: 0.3 },
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
  verifiedRow: { flexDirection: 'row', marginTop: 6 },
  verified: {
    ...font.caption,
    color: colors.green,
    fontWeight: '700',
    backgroundColor: colors.greenSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  stats: { flexDirection: 'row' },
  statValue: { ...font.h2 },
  statLabel: { ...font.caption, marginTop: 2 },
  body: { ...font.caption, lineHeight: 19, marginBottom: spacing.md },
  desk: { ...font.body, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  toggleTitle: { ...font.h3, fontSize: 14 },
  toggleBody: { ...font.caption, marginTop: 2, lineHeight: 18 },
  version: { ...font.caption, color: colors.textFaint, textAlign: 'center', marginTop: spacing.xl },
});
