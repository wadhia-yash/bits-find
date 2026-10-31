import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, spacing } from '../theme';
import { Button, Chip, ChipRow, Field, Input, Notice, SectionHeading } from '../components/ui';
import { useApp } from '../store/AppContext';
import {
  CAMPUS_ZONES,
  CATEGORIES,
  Category,
  ContactMode,
  CONTACT_MODES,
  SENSITIVE_CATEGORIES,
} from '../types';
import { CATEGORY_ICON } from '../utils/icons';
import { features } from '../config/phase';

type WhenOption = 'HOUR' | 'TODAY' | 'YESTERDAY' | 'WEEK';

const WHEN_OPTIONS: { id: WhenOption; label: string; hoursAgo: number }[] = [
  { id: 'HOUR', label: 'Within an hour', hoursAgo: 1 },
  { id: 'TODAY', label: 'Earlier today', hoursAgo: 8 },
  { id: 'YESTERDAY', label: 'Yesterday', hoursAgo: 24 },
  { id: 'WEEK', label: 'Earlier this week', hoursAgo: 96 },
];

/**
 * PRD §6 — Report lost item. Kept to one screen with chip pickers so a useful
 * request can be filed in under 60 seconds (goal #5).
 */
export function ReportLostScreen({ navigation }: any) {
  const { user, createLostRequest } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const [zone, setZone] = useState<string | null>(null);
  const [when, setWhen] = useState<WhenOption>('TODAY');
  const [contactMode, setContactMode] = useState<ContactMode>('IN_APP');
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const zones = user ? CAMPUS_ZONES[user.campusId] : [];
  const isSensitive = useMemo(
    () => (category ? SENSITIVE_CATEGORIES.includes(category) : false),
    [category],
  );

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to attach an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      // Client-side compression — PRD §7.1 (image storage) and NFR #29.
      quality: 0.5,
    });
    if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (title.trim().length < 4) next.title = 'Give the item a short, recognisable name.';
    if (!category) next.category = 'Pick a category.';
    if (!zone) next.zone = 'Pick where you last saw it.';
    if (description.trim().length < 10) {
      next.description = 'Add a detail or two so a finder can recognise it.';
    }
    if (contactMode === 'PHONE' && !user?.phoneOptional) {
      next.contact = 'Add a phone number in your profile first, or choose in-app contact.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setBusy(true);
    try {
      const hoursAgo = WHEN_OPTIONS.find((w) => w.id === when)!.hoursAgo;
      const lostAt = new Date(Date.now() - hoursAgo * 3600000).toISOString();

      const published = await createLostRequest({
        title: title.trim(),
        description: description.trim(),
        category: category!,
        lastSeenZone: zone!,
        lostAt,
        contactMode,
        imageUrlOptional: imageUri,
      });

      const photoDropped = !!imageUri && !published.imageUrlOptional;

      Alert.alert(
        'Lost request published',
        (features.campusAlerts
          ? 'One privacy-safe alert has been sent to your campus. You will be notified when someone reports a match.'
          : 'Your request is now on the campus feed. A finder can respond to it right away.') +
          (photoDropped
            ? '\n\nThe photo could not be uploaded, so the request was published without it. Everything else was saved.'
            : ''),
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
            hint={
              features.advancedFilters
                ? 'Used for search, filters and the campus alert preview.'
                : 'Used for search, and shown on the feed card.'
            }
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

          {isSensitive && features.sensitiveItemWarning ? (
            <Notice tone="warn" title="Sensitive item">
              ID cards and bank cards can be posted without a photo. If you do
              attach one, cover the ID number, card number and any QR code first.
            </Notice>
          ) : null}

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
                <Chip key={w.id} label={w.label} selected={when === w.id} onPress={() => setWhen(w.id)} />
              ))}
            </View>
          </Field>

          {features.photos ? (
            <Field
              label="Photo"
              hint={
                isSensitive
                  ? 'Optional — and best left out for ID cards and bank cards.'
                  : 'Optional, but a photo makes a match far more likely.'
              }
            >
              {imageUri ? (
                <View>
                  <Image source={{ uri: imageUri }} style={styles.preview} />
                  <Button
                    label="Remove photo"
                    variant="danger"
                    onPress={() => setImageUri(undefined)}
                    style={{ marginTop: spacing.sm }}
                  />
                </View>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Add a photo"
                  onPress={pickPhoto}
                  style={styles.photoDrop}
                >
                  <Ionicons name="camera-outline" size={26} color={colors.blue} style={styles.photoDropIcon} />
                  <Text style={styles.photoDropText}>Add a photo</Text>
                </Pressable>
              )}
            </Field>
          ) : null}

          {features.contactModes ? (
            <>
              <SectionHeading>How should a finder reach you?</SectionHeading>
              <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
                {CONTACT_MODES.map((m) => {
                  const selected = contactMode === m.id;
                  return (
                    <Pressable
                      key={m.id}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`${m.label}. ${m.hint}`}
                      onPress={() => setContactMode(m.id)}
                      style={[styles.radioRow, selected && styles.radioRowSelected]}
                    >
                      <View style={[styles.radio, selected && styles.radioOn]}>
                        {selected ? <View style={styles.radioDot} /> : null}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.radioLabel}>{m.label}</Text>
                        <Text style={styles.radioHint}>{m.hint}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
              {errors.contact ? <Text style={styles.error}>{errors.contact}</Text> : null}
            </>
          ) : null}

          {features.campusAlerts ? (
            <Notice tone="info" title="What the campus sees">
              The alert shows only the item name, category and approximate
              location. Your contact details stay hidden until you accept a match.
            </Notice>
          ) : (
            <Notice tone="info" title="What everyone sees">
              The feed shows only the item name, category and approximate
              location. Finders reply to you inside the app.
            </Notice>
          )}

          <Button
            label={features.campusAlerts ? 'Publish and alert my campus' : 'Publish lost request'}
            onPress={handleSubmit}
            loading={busy}
          />
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
  preview: { width: '100%', height: 190, borderRadius: radius.md, backgroundColor: colors.greySoft },
  photoDrop: {
    height: 110,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoDropIcon: { marginBottom: 6 },
  photoDropText: { ...font.label, color: colors.blue },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 56,
  },
  radioRowSelected: { borderColor: colors.navy, backgroundColor: colors.blueSoft },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.navy },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.navy },
  radioLabel: { ...font.h3, fontSize: 14 },
  radioHint: { ...font.caption, marginTop: 1 },
  error: { ...font.caption, color: colors.red, marginBottom: spacing.md },
});
