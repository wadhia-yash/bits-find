/**
 * Shared UI primitives. Every pressable here meets the 44pt touch target and
 * carries an accessibility role/label (NFR #31).
 */

import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  colors,
  font,
  radius,
  shadow,
  shadowLifted,
  spacing,
  TOUCH_TARGET,
} from '../theme';

type IonName = keyof typeof Ionicons.glyphMap;

/* ---------------------------------------------------------------- Button */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: IonName;
  style?: ViewStyle;
}) {
  const isOff = disabled || loading;

  const palette: Record<Exclude<ButtonVariant, 'primary'>, { bg: string; fg: string; border: string }> = {
    secondary: { bg: colors.surface, fg: colors.navy, border: colors.borderStrong },
    ghost: { bg: 'transparent', fg: colors.blue, border: 'transparent' },
    danger: { bg: colors.redSoft, fg: colors.red, border: colors.redSoft },
  };

  const inner = (fg: string) =>
    loading ? (
      <ActivityIndicator color={fg} />
    ) : (
      <View style={styles.buttonInner}>
        {icon ? <Ionicons name={icon} size={17} color={fg} /> : null}
        <Text style={[styles.buttonLabel, { color: fg }]}>{label}</Text>
      </View>
    );

  // The primary action is a solid navy fill; everything else stays outlined, so
  // there is never more than one obvious next step on a screen.
  if (variant === 'primary') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: !!isOff }}
        onPress={onPress}
        disabled={isOff}
        style={({ pressed }) => [
          styles.buttonShell,
          pressed && !isOff && { opacity: 0.9, transform: [{ scale: 0.995 }] },
          isOff && { opacity: 0.45 },
          style,
        ]}
      >
        <View style={[styles.button, { backgroundColor: colors.navy }]}>
          {inner('#FFFFFF')}
        </View>
      </Pressable>
    );
  }

  const p = palette[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!isOff }}
      onPress={onPress}
      disabled={isOff}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: p.bg, borderColor: p.border, borderWidth: 1 },
        pressed && !isOff && { opacity: 0.85 },
        isOff && { opacity: 0.45 },
        style,
      ]}
    >
      {inner(p.fg)}
    </Pressable>
  );
}

/* ----------------------------------------------------------------- Field */

export function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? <Text style={{ color: colors.red }}> *</Text> : null}
      </Text>
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
      {children}
      {error ? (
        <View style={styles.fieldErrorRow}>
          <Ionicons name="alert-circle" size={13} color={colors.red} />
          <Text style={styles.fieldError}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

/**
 * `wrapperStyle` exists because an icon forces a wrapping View: layout props
 * like flex have to land on that wrapper, not on the TextInput, or the field
 * sizes to its content and pushes its neighbours off screen.
 */
export function Input(
  props: TextInputProps & { invalid?: boolean; icon?: IonName; wrapperStyle?: ViewStyle },
) {
  const { invalid, icon, wrapperStyle, style, ...rest } = props;

  const field = (
    <TextInput
      placeholderTextColor={colors.textFaint}
      {...rest}
      style={[
        styles.input,
        icon ? { paddingLeft: 42 } : null,
        rest.multiline && { height: 118, textAlignVertical: 'top', paddingTop: spacing.md },
        invalid && { borderColor: colors.red, backgroundColor: colors.redSoft },
        style,
      ]}
    />
  );

  if (!icon) return field;
  return (
    <View style={wrapperStyle}>
      {field}
      <View style={styles.inputIcon} pointerEvents="none">
        <Ionicons name={icon} size={18} color={colors.textFaint} />
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ Chip */

export function Chip({
  label,
  selected,
  onPress,
  icon,
  tone = 'default',
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IonName;
  tone?: 'default' | 'muted';
}) {
  const fg = selected ? '#FFFFFF' : colors.text;
  const content = (
    <View
      style={[
        styles.chip,
        selected && { backgroundColor: colors.navy, borderColor: colors.navy },
        tone === 'muted' && !selected && { backgroundColor: colors.greySoft },
      ]}
    >
      {icon ? <Ionicons name={icon} size={14} color={fg} /> : null}
      <Text style={[styles.chipLabel, { color: fg }]}>{label}</Text>
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
    >
      {content}
    </Pressable>
  );
}

export function ChipRow({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.lg, paddingVertical: 2 }}
    >
      {children}
    </ScrollView>
  );
}

/* ------------------------------------------------------------------ Card */

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Badge({
  label,
  fg,
  bg,
  icon,
}: {
  label: string;
  fg: string;
  bg: string;
  icon?: IonName;
}) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      {icon ? <Ionicons name={icon} size={11} color={fg} /> : null}
      <Text style={[styles.badgeLabel, { color: fg }]}>{label}</Text>
    </View>
  );
}

/** Square icon tile used for category art on cards. */
export function IconTile({
  name,
  fg,
  bg,
  size = 56,
}: {
  name: IonName;
  fg: string;
  bg: string;
  size?: number;
}) {
  return (
    <View
      style={[
        styles.iconTile,
        { width: size, height: size, backgroundColor: bg, borderRadius: size * 0.28 },
      ]}
    >
      <Ionicons name={name} size={size * 0.46} color={fg} />
    </View>
  );
}

/* -------------------------------------------------------------- Feedback */

export function Notice({
  tone = 'info',
  title,
  children,
}: {
  tone?: 'info' | 'warn' | 'success';
  title?: string;
  children: React.ReactNode;
}) {
  const palette = {
    info: { bg: colors.blueSoft, fg: colors.navy, bar: colors.blue, icon: 'information-circle' as IonName },
    warn: { bg: colors.amberSoft, fg: colors.amber, bar: colors.amber, icon: 'warning' as IonName },
    success: { bg: colors.greenSoft, fg: colors.green, bar: colors.green, icon: 'checkmark-circle' as IonName },
  }[tone];

  return (
    <View style={[styles.notice, { backgroundColor: palette.bg, borderLeftColor: palette.bar }]}>
      <Ionicons name={palette.icon} size={16} color={palette.bar} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        {title ? (
          <Text style={[styles.noticeTitle, { color: palette.fg }]}>{title}</Text>
        ) : null}
        <Text style={[styles.noticeBody, { color: palette.fg }]}>{children}</Text>
      </View>
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  body,
}: {
  icon: IonName;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIconRing}>
        <Ionicons name={icon} size={30} color={colors.blue} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionHeading}>{children}</Text>;
}

export function Divider() {
  return <View style={styles.divider} />;
}

/* ---------------------------------------------------------------- styles */

const styles = StyleSheet.create({
  buttonShell: { borderRadius: radius.md },
  button: {
    minHeight: TOUCH_TARGET + 4,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  buttonInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  buttonLabel: { fontSize: 15, fontWeight: '700', letterSpacing: 0.1 },

  fieldLabel: { ...font.label, marginBottom: spacing.xs, color: colors.text },
  fieldHint: { ...font.caption, marginBottom: spacing.sm, lineHeight: 17 },
  fieldErrorRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: spacing.xs },
  fieldError: { ...font.caption, color: colors.red, flex: 1 },

  input: {
    minHeight: TOUCH_TARGET + 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    color: colors.text,
  },
  inputIcon: { position: 'absolute', left: 14, top: 0, bottom: 0, justifyContent: 'center' },

  chip: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipLabel: { fontSize: 13, fontWeight: '600' },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadow,
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  badgeLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },

  iconTile: { alignItems: 'center', justifyContent: 'center' },

  notice: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  noticeTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  noticeBody: { fontSize: 13, lineHeight: 19 },

  empty: { alignItems: 'center', paddingVertical: spacing.xxl * 1.4, paddingHorizontal: spacing.xl },
  emptyIconRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: { ...font.h3, marginBottom: spacing.xs, textAlign: 'center' },
  emptyBody: { ...font.caption, textAlign: 'center', lineHeight: 19 },

  sectionHeading: {
    ...font.label,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.textFaint,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },

  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.lg },
});

export { shadowLifted };
