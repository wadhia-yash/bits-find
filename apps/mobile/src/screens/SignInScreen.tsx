import React, { useState } from 'react';
import {
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
import { LinearGradient } from 'expo-linear-gradient';
import { colors, font, gradients, radius, shadow, spacing } from '../theme';
import { Button, Card, Chip, Field, Input, Notice } from '../components/ui';
import { checkInstitutionalEmail, INSTITUTE_DOMAIN } from '../services/auth';
import { CAMPUSES, CampusId } from '../types';
import * as backend from '../services/backend';
import { useApp } from '../store/AppContext';
import { features, PHASE, PHASE_META } from '../config/phase';

type Mode = 'signin' | 'signup' | 'verify' | 'forgot';

/**
 * PRD §6 — Welcome / Sign in.
 *
 * Everything happens in-app: email + password, no external identity provider
 * and no browser hand-off. The institutional-domain gate runs before the
 * account is created, and the campus is derived from the address.
 */
export function SignInScreen() {
  const { setUser } = useApp();

  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const [pickedCampus, setPickedCampus] = useState<CampusId | null>(null);

  const emailCheck = checkInstitutionalEmail(email);
  const campusLabel = CAMPUSES.find((c) => c.id === emailCheck.campusId)?.label;
  const addressHasNoCampus = emailCheck.ok && !!emailCheck.needsCampusChoice;
  /** Picking a campus by hand is a Phase 3 addition; before that the address must name one. */
  const needsCampusChoice = addressHasNoCampus && features.campusChoice;

  function reset(next: Mode) {
    setMode(next);
    setError('');
    setInfo('');
  }

  async function handleSignIn() {
    setBusy(true);
    setError('');
    setInfo('');
    try {
      setUser(await backend.auth.signIn(email, password));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Sign in failed.';
      if (msg === 'UNVERIFIED') {
        setMode('verify');
        setInfo('Your email is not verified yet. Check your inbox for the link.');
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleSignUp() {
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }
    if (needsCampusChoice && !pickedCampus) {
      setError('Choose the campus you are based at.');
      return;
    }
    if (addressHasNoCampus && !features.campusChoice) {
      setError(
        'Use your campus address (…@pilani / goa / hyderabad / dubai.bits-pilani.ac.in). ' +
          'Support for online and WILP addresses arrives in Phase 3.',
      );
      return;
    }
    setBusy(true);
    setError('');
    try {
      await backend.auth.signUp({
        name,
        email,
        password,
        campusId: pickedCampus ?? undefined,
      });
      setMode('verify');
      setInfo(`We sent a verification link to ${email.trim().toLowerCase()}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the account.');
    } finally {
      setBusy(false);
    }
  }

  async function handleCheckVerified() {
    setBusy(true);
    setError('');
    try {
      const user = await backend.auth.refreshVerification();
      if (user) setUser(user);
      else setError('Not verified yet. Open the link in your email, then tap again.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not check verification.');
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    setBusy(true);
    setError('');
    try {
      await backend.auth.resendVerification();
      setInfo('Verification email sent again. It can take a minute to arrive.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not resend the email.');
    } finally {
      setBusy(false);
    }
  }

  async function handleForgot() {
    setBusy(true);
    setError('');
    try {
      await backend.auth.resetPassword(email);
      setInfo(`Password reset link sent to ${email.trim().toLowerCase()}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send the reset email.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDemoAccount(uid: string) {
    setBusy(true);
    setError('');
    try {
      setUser(await backend.auth.signInDemo(uid));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open the demo account.');
    } finally {
      setBusy(false);
    }
  }

  const emailField = (
    <Field
      label="Institutional email"
      required
      hint={`Example: f20220123@pilani.${INSTITUTE_DOMAIN.replace('bits-pilani.ac.in', 'bits-pilani.ac.in')}`}
    >
      <Input
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          setError('');
        }}
        placeholder="you@pilani.bits-pilani.ac.in"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        inputMode="email"
        accessibilityLabel="Institutional email address"
      />
    </Field>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brandBlock}>
            {features.polishedUi ? (
              <LinearGradient
                colors={gradients.brand}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logo}
              >
                <Ionicons name="search" size={30} color="#FFFFFF" />
              </LinearGradient>
            ) : (
              <View style={[styles.logo, styles.logoFlat]}>
                <Ionicons name="search" size={30} color="#FFFFFF" />
              </View>
            )}
            <Text style={styles.brand}>BTS Find</Text>
            <Text style={styles.tagline}>
              {features.campusAlerts
                ? 'Campus lost & found for BITSians. Report what you lost, get a privacy-safe campus alert, and get it back.'
                : 'Campus lost & found for BITSians. Report what you lost, let a finder respond, and get it back.'}
            </Text>

            {features.polishedUi ? (
              <View style={styles.trustRow}>
                <TrustPill icon="shield-checkmark-outline" label="Verified only" />
                <TrustPill icon="school-outline" label="Campus-scoped" />
                <TrustPill icon="eye-off-outline" label="Privacy-safe" />
              </View>
            ) : null}
          </View>

          {/* ------------------------------------------------------ verify */}
          {mode === 'verify' ? (
            <Card>
              <Text style={styles.cardTitle}>Verify your email</Text>
              <Text style={styles.cardBody}>
                Open the link we sent to your institute inbox, then come back and
                tap the button below. Verification is what proves you are a
                BITSian, so it is required before you can post or browse.
              </Text>

              {info ? <Notice tone="info">{info}</Notice> : null}
              {error ? <Notice tone="warn">{error}</Notice> : null}

              <Button label="I have verified — continue" onPress={handleCheckVerified} loading={busy} />
              <Button
                label="Resend verification email"
                variant="secondary"
                onPress={handleResend}
                style={{ marginTop: spacing.sm }}
              />
              <Button
                label="Back to sign in"
                variant="ghost"
                onPress={() => reset('signin')}
                style={{ marginTop: spacing.sm }}
              />
            </Card>
          ) : null}

          {/* ------------------------------------------------------ forgot */}
          {mode === 'forgot' && backend.auth.supportsPasswordReset ? (
            <Card>
              <Text style={styles.cardTitle}>Reset password</Text>
              <Text style={styles.cardBody}>
                Enter your institutional email and we will send you a reset link.
              </Text>

              {emailField}
              {info ? <Notice tone="success">{info}</Notice> : null}
              {error ? <Notice tone="warn">{error}</Notice> : null}

              <Button
                label="Send reset link"
                onPress={handleForgot}
                loading={busy}
                disabled={!email.trim()}
              />
              <Button
                label="Back to sign in"
                variant="ghost"
                onPress={() => reset('signin')}
                style={{ marginTop: spacing.sm }}
              />
            </Card>
          ) : null}

          {/* --------------------------------------------- sign in / sign up */}
          {!features.accounts ? (
            <Card>
              <Text style={styles.cardTitle}>{PHASE_META[PHASE].label} sign-in</Text>
              <Text style={styles.cardBody}>
                The initial POC has no backend by design, so there are no
                accounts to create yet. Pick a demo student below and walk
                through the whole lost-and-found flow.
              </Text>
            </Card>
          ) : mode === 'signin' || mode === 'signup' ? (
            <Card>
              <View style={styles.switchRow}>
                <SwitchTab
                  label="Sign in"
                  active={mode === 'signin'}
                  onPress={() => reset('signin')}
                />
                <SwitchTab
                  label="Create account"
                  active={mode === 'signup'}
                  onPress={() => reset('signup')}
                />
              </View>

              <Text style={styles.cardBody}>
                Only verified @{INSTITUTE_DOMAIN} accounts can post and browse.
                Your campus is set automatically from your address.
              </Text>

              {mode === 'signup' ? (
                <Field label="Your name" required>
                  <Input
                    value={name}
                    onChangeText={(t) => {
                      setName(t);
                      setError('');
                    }}
                    placeholder="e.g. Aarav Mehta"
                    autoCapitalize="words"
                    accessibilityLabel="Your name"
                    maxLength={50}
                  />
                </Field>
              ) : null}

              {emailField}

              <Field label="Password" required hint={mode === 'signup' ? 'At least 6 characters.' : undefined}>
                <Input
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    setError('');
                  }}
                  placeholder="Your password"
                  secureTextEntry
                  autoCapitalize="none"
                  accessibilityLabel="Password"
                />
              </Field>

              {mode === 'signup' ? (
                <Field label="Confirm password" required>
                  <Input
                    value={confirm}
                    onChangeText={(t) => {
                      setConfirm(t);
                      setError('');
                    }}
                    placeholder="Type it again"
                    secureTextEntry
                    autoCapitalize="none"
                    accessibilityLabel="Confirm password"
                  />
                </Field>
              ) : null}

              {campusLabel ? (
                <Notice tone="success" title="Campus detected">
                  You will be verified as a {campusLabel} student and will only
                  see {campusLabel} posts.
                </Notice>
              ) : null}

              {/*
                Online and WILP addresses carry no campus, so the student picks
                one. It is stored once at sign-up and never editable afterwards.
              */}
              {needsCampusChoice && mode === 'signup' ? (
                <Field
                  label="Which campus are you at?"
                  required
                  hint="Your email does not say, and lost items are only shared within one campus."
                >
                  <View style={styles.campusGrid}>
                    {CAMPUSES.map((c) => (
                      <Chip
                        key={c.id}
                        label={c.label}
                        selected={pickedCampus === c.id}
                        onPress={() => {
                          setPickedCampus(c.id);
                          setError('');
                        }}
                      />
                    ))}
                  </View>
                </Field>
              ) : null}

              {needsCampusChoice && mode === 'signin' ? (
                <Notice tone="info">
                  Your campus was chosen when this account was created.
                </Notice>
              ) : null}

              {addressHasNoCampus && !features.campusChoice ? (
                <Notice tone="warn" title="Campus address needed">
                  This build reads your campus from the address. Use your
                  @pilani / @goa / @hyderabad / @dubai address — online and WILP
                  sign-up arrives in Phase 3.
                </Notice>
              ) : null}

              {error ? <Notice tone="warn">{error}</Notice> : null}
              {info ? <Notice tone="info">{info}</Notice> : null}

              {backend.auth.supportsAccounts ? (
                <>
                  <Button
                    label={mode === 'signin' ? 'Sign in' : 'Create account'}
                    onPress={mode === 'signin' ? handleSignIn : handleSignUp}
                    loading={busy}
                    disabled={
                      !email.trim() ||
                      !password ||
                      (mode === 'signup' && (!name.trim() || !confirm))
                    }
                  />
                  {mode === 'signin' && backend.auth.supportsPasswordReset ? (
                    <Button
                      label="Forgot password?"
                      variant="ghost"
                      onPress={() => reset('forgot')}
                      style={{ marginTop: spacing.sm }}
                    />
                  ) : null}
                </>
              ) : (
                <Notice
                  tone="info"
                  title={
                    features.cloudBackend
                      ? 'Firebase not configured'
                      : `${PHASE_META[PHASE].label} runs on mock data`
                  }
                >
                  {features.cloudBackend
                    ? 'This build is running the local pilot backend, so accounts cannot be created. Add your Firebase config to app.json — see docs/FIREBASE_SETUP.md — or use a demo account below.'
                    : 'The initial POC has no backend by design. Sign in with one of the demo accounts below to walk through the full lost-and-found flow.'}
                </Notice>
              )}
            </Card>
          ) : null}

          {/* ------------------------------------------------ demo accounts */}
          {features.demoAccounts && !backend.auth.supportsAccounts ? (
            <>
              <Text style={styles.demoHeading}>Demo accounts</Text>
              <Text style={styles.demoBody}>
                {features.persistence === 'memory'
                  ? 'Mock data, reloaded fresh on every launch. Nothing is stored and nothing leaves the device.'
                  : 'Pilot build only. Each device keeps its own data until Firebase is connected.'}
              </Text>

              <View style={{ gap: spacing.sm }}>
                <Button
                  label="Ishita Rao · Pilani (has open requests)"
                  variant="secondary"
                  onPress={() => handleDemoAccount('u_ishita')}
                />
                <Button
                  label="Aarav Mehta · Pilani (has a pending match)"
                  variant="secondary"
                  onPress={() => handleDemoAccount('u_aarav')}
                />
                <Button
                  label="Meera Nair · Goa (different campus)"
                  variant="secondary"
                  onPress={() => handleDemoAccount('u_meera')}
                />
              </View>
            </>
          ) : null}
          <Text style={styles.phaseFooter}>
            {PHASE_META[PHASE].label} · {PHASE_META[PHASE].name} — {PHASE_META[PHASE].tagline}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Small reassurance chips under the hero — the three promises the PRD makes. */
function TrustPill({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.trustPill}>
      <Ionicons name={icon} size={13} color={colors.navy} />
      <Text style={styles.trustLabel}>{label}</Text>
    </View>
  );
}

function SwitchTab({
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
      style={[styles.switchTab, active && styles.switchTabActive]}
    >
      <Text style={[styles.switchLabel, active && styles.switchLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  campusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  brandBlock: { alignItems: 'center', paddingVertical: spacing.xl },
  logo: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadow,
    shadowOpacity: 0.2,
  },
  brand: { ...font.display, marginBottom: spacing.sm },
  tagline: { ...font.body, color: colors.textMuted, textAlign: 'center', lineHeight: 21 },
  trustRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  trustPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.blueSoft,
  },
  trustLabel: { fontSize: 11, fontWeight: '700', color: colors.navy },
  cardTitle: { ...font.h2, marginBottom: spacing.xs },
  cardBody: { ...font.caption, lineHeight: 19, marginBottom: spacing.lg },

  switchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    backgroundColor: colors.greySoft,
    borderRadius: radius.md,
    padding: 4,
  },
  switchTab: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  switchTabActive: { backgroundColor: colors.surface },
  switchLabel: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  switchLabelActive: { color: colors.text },

  logoFlat: { backgroundColor: colors.navy },
  phaseFooter: {
    ...font.caption,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 17,
  },
  demoHeading: { ...font.h3, marginTop: spacing.xl, marginBottom: spacing.xs },
  demoBody: { ...font.caption, lineHeight: 19, marginBottom: spacing.md },
});
