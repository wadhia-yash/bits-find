import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font, spacing } from '../theme';
import { Button, Card, Field, Input, Notice } from '../components/ui';
import { useApp } from '../store/AppContext';

/**
 * I found this item — the private match detail that only the owner sees.
 * A handover is arranged directly between the two of them.
 */
export function IFoundThisScreen({ route, navigation }: any) {
  const { itemId } = route.params;
  const { user, items, submitMatch } = useApp();

  const item = items.find((i) => i.id === itemId);
  const [matchText, setMatchText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!item || !user) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <Card style={{ margin: spacing.xl }}>
          <Text style={font.h3}>This request is no longer available.</Text>
          <Button
            label="Go back"
            onPress={() => navigation.goBack()}
            style={{ marginTop: spacing.lg }}
          />
        </Card>
      </SafeAreaView>
    );
  }

  async function handleSubmit() {
    if (matchText.trim().length < 12) {
      setError('Add a bit more detail so the owner can verify it is really their item.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await submitMatch({ itemId: item!.id, matchText: matchText.trim() });

      Alert.alert(
        'Match sent',
        'The owner has been notified. Once they verify it, you can arrange the handover.',
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

          <Notice tone="info" title="Direct handover">
            Once the owner verifies your match, the two of you arrange the
            handover in person.
          </Notice>

          <Notice tone="warn" title="Stay safe">
            Never share your room number, ID number or bank details here. Meet the
            owner in a public campus spot.
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
});
