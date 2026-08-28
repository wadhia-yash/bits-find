import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, shadow, spacing } from '../theme';
import { Button, Card, Notice } from '../components/ui';
import { signInDemoUser } from '../services/auth';
import { useApp } from '../store/AppContext';

const DEMO_ACCOUNTS: { uid: string; label: string }[] = [
  { uid: 'u_ishita', label: 'Ishita Rao · Pilani (has open requests)' },
  { uid: 'u_aarav', label: 'Aarav Mehta · Pilani (has a pending match)' },
  { uid: 'u_meera', label: 'Meera Nair · Goa (different campus)' },
];

/**
 * Welcome / sign in.
 *
 * The proof of concept has no accounts: pick a seeded student and the whole
 * lost-and-found loop can be walked on one device.
 */
export function SignInScreen() {
  const { setUser } = useApp();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function handleDemoAccount(uid: string) {
    setBusy(uid);
    setError('');
    try {
      setUser(await signInDemoUser(uid));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open the demo account.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.brandBlock}>
          <View style={styles.logo}>
            <Ionicons name="search" size={30} color="#FFFFFF" />
          </View>
          <Text style={styles.brand}>BTS Find</Text>
          <Text style={styles.tagline}>
            Campus lost &amp; found for BITSians. Report what you lost, let a
            finder respond, and get it back.
          </Text>
        </View>

        <Card>
          <Text style={styles.cardTitle}>Sign in</Text>
          <Text style={styles.cardBody}>
            This is an early proof of concept, so there are no accounts to create
            yet. Pick a demo student below and walk through the whole
            lost-and-found flow.
          </Text>
        </Card>

        <Text style={styles.demoHeading}>Demo accounts</Text>
        <Text style={styles.demoBody}>
          Mock data, reloaded fresh on every launch. Nothing is stored and
          nothing leaves the device.
        </Text>

        {error ? <Notice tone="warn">{error}</Notice> : null}

        <View style={{ gap: spacing.sm }}>
          {DEMO_ACCOUNTS.map((account) => (
            <Button
              key={account.uid}
              label={account.label}
              variant="secondary"
              loading={busy === account.uid}
              onPress={() => handleDemoAccount(account.uid)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  brandBlock: { alignItems: 'center', paddingVertical: spacing.xl },
  logo: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadow,
    shadowOpacity: 0.2,
  },
  brand: { ...font.display, marginBottom: spacing.sm },
  tagline: { ...font.body, color: colors.textMuted, textAlign: 'center', lineHeight: 21 },
  cardTitle: { ...font.h2, marginBottom: spacing.xs },
  cardBody: { ...font.caption, lineHeight: 19 },
  demoHeading: { ...font.h3, marginTop: spacing.xl, marginBottom: spacing.xs },
  demoBody: { ...font.caption, lineHeight: 19, marginBottom: spacing.md },
});
