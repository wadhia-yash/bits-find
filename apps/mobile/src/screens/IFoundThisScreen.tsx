import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, spacing } from '../theme';
import { Button, Card, Field, Input, Notice } from '../components/ui';
import { useApp } from '../store/AppContext';
import { ADMIN_DESKS, HandoverMode } from '../types';
import { features } from '../config/phase';

/**
 * PRD §6 — I found this item: private match details plus the handover choice
 * (direct to owner vs submit to the BITS Admin Department).
 */
export function IFoundThisScreen({ route, navigation }: any) {
  const { itemId } = route.params;
  const { user, items, submitMatch } = useApp();

  const item = items.find((i) => i.id === itemId);
  const [matchText, setMatchText] = useState('');
  const [mode, setMode] = useState<HandoverMode>('DIRECT');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!item || !user) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={{ padding: spacing.xl }}>
          <Text style={font.h3}>This request is no longer available.</Text>
          <Button label="Go back" onPress={() => navigation.goBack()} style={{ marginTop: spacing.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  const desk = ADMIN_DESKS[item.campusId];

  async function handleSubmit() {
    if (matchText.trim().length < 12) {
      setError('Add a bit more detail so the owner can verify it is really their item.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await submitMatch({
        itemId: item!.id,
        matchText: matchText.trim(),
        handoverMode: mode,
        adminLocation: mode === 'ADMIN' ? desk : undefined,
      });

      Alert.alert(
        'Match sent',
        features.adminHandover && mode === 'ADMIN'
          ? `The owner has been notified. Please submit the item to the ${desk} so they can collect it safely.`
          : 'The owner has been notified. Once they verify it, you can arrange the handover.',
        [{ text: 'Done', onPress: () => navigation.goBack() }],
      );
    } catch (e) {
      Alert.alert('Could not send', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Card style={{ marginBottom: spacing.lg }}>
            <Text style={styles.eyebrow}>Responding to</Text>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemMeta}>
              {item.category} · last seen near {item.lastSeenZone} · posted by {item.ownerName}
            </Text>
          </Card>

          <Field
            label="Private match detail"
            required
            hint="Only the owner sees this. Mention something the description does not spell out."
            error={error || undefined}
          >
            <Input
              value={matchText}
              onChangeText={(t) => {
                setMatchText(t);
                setError('');
              }}
              placeholder="e.g. Found it near the second-floor reading table. There is a maths sticker inside the cover."
              multiline
              invalid={!!error}
              accessibilityLabel="Private match detail"
              maxLength={400}
            />
          </Field>

          {features.adminHandover ? (
            <>
              <Text style={styles.sectionLabel}>How do you want to hand it over?</Text>

              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected: mode === 'DIRECT' }}
                accessibilityLabel="Direct to owner"
                onPress={() => setMode('DIRECT')}
                style={[styles.option, mode === 'DIRECT' && styles.optionSelected]}
              >
                <Ionicons name="people-outline" size={22} color={colors.navy} style={styles.optionIcon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>Direct to owner</Text>
                  <Text style={styles.optionBody}>
                    You meet the owner yourself once they verify the item is theirs.
                    Fastest, and best for low-value everyday items.
                  </Text>
                </View>
              </Pressable>

              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected: mode === 'ADMIN' }}
                accessibilityLabel="Submit to BITS Admin Department"
                onPress={() => setMode('ADMIN')}
                style={[styles.option, mode === 'ADMIN' && styles.optionSelected]}
              >
                <Ionicons name="business-outline" size={22} color={colors.navy} style={styles.optionIcon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>Submit to BITS Admin Department</Text>
                  <Text style={styles.optionBody}>
                    Drop the item at {desk}. The owner collects it from there. Best
                    for ID cards, wallets, phones and anything valuable.
                  </Text>
                </View>
              </Pressable>

              {mode === 'ADMIN' ? (
                <Notice tone="info" title="Drop-off point">
                  {desk}
                </Notice>
              ) : null}
            </>
          ) : (
            <Notice tone="info" title="Direct handover">
              Once the owner verifies your match, the two of you arrange the
              handover in person.
            </Notice>
          )}

          <Notice tone="warn" title="Stay safe">
            {features.adminHandover
              ? 'Never share your room number, ID number or bank details here. Meet in a public campus spot, or use the Admin Department option.'
              : 'Never share your room number, ID number or bank details here. Meet the owner in a public campus spot.'}
          </Notice>

          <Button label="Send match to owner" onPress={handleSubmit} loading={busy} />
          <Button
            label="Cancel"
            variant="ghost"
            onPress={() => navigation.goBack()}
            style={{ marginTop: spacing.sm }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  eyebrow: { ...font.caption, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '700' },
  itemTitle: { ...font.h2, fontSize: 18, marginTop: 4 },
  itemMeta: { ...font.caption, marginTop: 4, lineHeight: 18 },
  sectionLabel: { ...font.label, color: colors.text, marginBottom: spacing.sm },
  option: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  optionSelected: { borderColor: colors.navy, backgroundColor: colors.blueSoft },
  optionIcon: { marginTop: 1 },
  optionTitle: { ...font.h3, fontSize: 14, marginBottom: 2 },
  optionBody: { ...font.caption, lineHeight: 18 },
});
