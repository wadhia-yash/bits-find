import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';
import { Button, Chip, ChipRow, Field, Input, Notice } from '../components/ui';
import { useApp } from '../store/AppContext';
import { CAMPUS_ZONES, CATEGORIES, Category } from '../types';
import { CATEGORY_ICON } from '../utils/icons';

type WhenOption = 'HOUR' | 'TODAY' | 'YESTERDAY' | 'WEEK';

const WHEN_OPTIONS: { id: WhenOption; label: string; hoursAgo: number }[] = [
  { id: 'HOUR', label: 'Within an hour', hoursAgo: 1 },
  { id: 'TODAY', label: 'Earlier today', hoursAgo: 8 },
  { id: 'YESTERDAY', label: 'Yesterday', hoursAgo: 24 },
  { id: 'WEEK', label: 'Earlier this week', hoursAgo: 96 },
];

/**
 * Report lost item. Kept to one screen with chip pickers so a useful request
 * can be filed in under a minute.
 */
export function ReportLostScreen({ navigation }: any) {
  const { user, createLostRequest } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const [zone, setZone] = useState<string | null>(null);
  const [when, setWhen] = useState<WhenOption>('TODAY');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const zones = user ? CAMPUS_ZONES[user.campusId] : [];

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (title.trim().length < 4) next.title = 'Give the item a short, recognisable name.';
    if (!category) next.category = 'Pick a category.';
    if (!zone) next.zone = 'Pick where you last saw it.';
    if (description.trim().length < 10) {
      next.description = 'Add a detail or two so a finder can recognise it.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setBusy(true);
    try {
      const hoursAgo = WHEN_OPTIONS.find((w) => w.id === when)!.hoursAgo;

      await createLostRequest({
        title: title.trim(),
        description: description.trim(),
        category: category!,
        lastSeenZone: zone!,
        lostAt: new Date(Date.now() - hoursAgo * 3600000).toISOString(),
      });

      Alert.alert(
        'Lost request published',
        'Your request is now on the campus feed. A finder can respond to it right away.',
        [{ text: 'Done', onPress: () => navigation.goBack() }],
      );
    } catch (e) {
      Alert.alert('Could not publish', e instanceof Error ? e.message : 'Please try again.');
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
          <Field label="What did you lose?" required error={errors.title}>
            <Input
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Blue spiral notebook"
              invalid={!!errors.title}
              accessibilityLabel="Item name"
              maxLength={80}
            />
          </Field>

          <Field
            label="Category"
            required
            error={errors.category}
            hint="Used for search, and shown on the feed card."
          >
            <ChipRow>
              {CATEGORIES.map((c) => (
                <Chip
                  key={c}
                  label={c}
                  icon={CATEGORY_ICON[c].name}
                  selected={category === c}
                  onPress={() => setCategory(c)}
                />
              ))}
            </ChipRow>
          </Field>

          <Field
            label="Description"
            required
            hint="Colour, marks, stickers, what was inside — anything only the owner would know."
            error={errors.description}
          >
            <Input
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the item so a finder can recognise it"
              multiline
              invalid={!!errors.description}
              accessibilityLabel="Item description"
              maxLength={500}
            />
          </Field>

          <Field label="Last seen near" required error={errors.zone}>
            <ChipRow>
              {zones.map((z) => (
                <Chip
                  key={z}
                  label={z}
                  icon="location-outline"
                  selected={zone === z}
                  onPress={() => setZone(z)}
                />
              ))}
            </ChipRow>
          </Field>

          <Field label="When did you lose it?" required>
            <View style={styles.rowWrap}>
              {WHEN_OPTIONS.map((w) => (
                <Chip
                  key={w.id}
                  label={w.label}
                  selected={when === w.id}
                  onPress={() => setWhen(w.id)}
                />
              ))}
            </View>
          </Field>

          <Notice tone="info" title="What everyone sees">
            The feed shows only the item name, category and approximate location.
            Finders reply to you inside the app.
          </Notice>

          <Button label="Publish lost request" onPress={handleSubmit} loading={busy} />
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
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
