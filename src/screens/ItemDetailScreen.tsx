import React from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, spacing } from '../theme';
import { Badge, Button, Card, Divider, Notice, SectionHeading } from '../components/ui';
import { useApp } from '../store/AppContext';
import { ADMIN_DESKS, CONTACT_MODES, Match } from '../types';
import { daysLeft, fullDateTime, relativeTime, STATUS_META } from '../utils/format';
import { features } from '../config/phase';

/** PRD §6 — Lost request detail: details, status, contact preference, I Found This Item. */
export function ItemDetailScreen({ route, navigation }: any) {
  const { itemId } = route.params;
  const { user, items, handovers, matchesForItem, respondToMatch, markAdminCollected, confirmReturned, cancelLostRequest } =
    useApp();

  const item = items.find((i) => i.id === itemId);

  // Campus scoping means a different-campus request simply is not in the store.
  if (!item || !user) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.notFound}>
          <Ionicons name="lock-closed-outline" size={42} color={colors.textFaint} style={styles.notFoundIcon} />
          <Text style={styles.notFoundTitle}>Not available</Text>
          <Text style={styles.notFoundBody}>
            This lost request either does not exist or belongs to another campus.
            BTS Find only shows posts from your own campus.
          </Text>
          <Button label="Back to feed" onPress={() => navigation.goBack()} style={{ marginTop: spacing.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  const isOwner = item.ownerId === user.uid;
  const status = STATUS_META[item.status];
  const matches = matchesForItem(item);
  const myMatch = matches.find((m) => m.finderId === user.uid);
  const acceptedMatch = matches.find((m) => m.status === 'ACCEPTED');
  const contactLabel = CONTACT_MODES.find((c) => c.id === item.contactMode)?.label ?? 'In-app only';
  const canRespond = !isOwner && (item.status === 'OPEN' || item.status === 'CLAIM_PENDING') && !myMatch;

  /**
   * Contact details unlock only once the owner accepts a match, and only for
   * the two people involved — PRD §7.3 rule 25.
   */
  const contactUnlocked =
    !!acceptedMatch && (isOwner || acceptedMatch.finderId === user.uid);

  function handleReject(match: Match) {
    Alert.alert('Reject this match?', 'The finder will be told it was not your item.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: () => respondToMatch(match.id, false).catch((e) => Alert.alert('Error', e.message)),
      },
    ]);
  }

  function handleConfirmReturn(match: Match) {
    Alert.alert(
      'Confirm you got it back?',
      'This closes the request. It leaves the feed and stays in My Activity.',
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Yes, returned',
          onPress: () =>
            confirmReturned(item!.id, match.id).catch((e) => Alert.alert('Error', e.message)),
        },
      ],
    );
  }

  function handleCancel() {
    Alert.alert('Cancel this request?', 'It will be removed from the campus feed.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Cancel request',
        style: 'destructive',
        onPress: () =>
          cancelLostRequest(item!.id)
            .then(() => navigation.goBack())
            .catch((e) => Alert.alert('Error', e.message)),
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {item.imageUrlOptional ? (
          <Image source={{ uri: item.imageUrlOptional }} style={styles.hero} />
        ) : null}

        <View style={styles.badgeRow}>
          <Badge label={status.label} fg={status.fg} bg={status.bg} />
          {item.status === 'OPEN' && features.expirySweep ? (
            <Text style={styles.expiry}>Expires in {daysLeft(item.expiresAt)} days</Text>
          ) : null}
        </View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>
          {item.category} · reported by {isOwner ? 'you' : item.ownerName} {relativeTime(item.createdAt)}
        </Text>

        <Card style={{ marginTop: spacing.lg }}>
          <Text style={styles.description}>{item.description}</Text>
          <Divider />
          <Detail label="Last seen near" value={item.lastSeenZone} />
          <Detail label="Last seen at" value={fullDateTime(item.lostAt)} />
          <Detail
            label="Contact preference"
            value={
              !features.contactUnlock
                ? contactLabel
                : contactUnlocked
                  ? item.contactMode === 'PHONE'
                    ? item.ownerName + ' · ' + (usersPhone(item.ownerId, user) ?? 'phone not set')
                    : item.contactMode === 'EMAIL'
                      ? contactLabel + ' (shared in My Activity)'
                      : contactLabel
                  : `${contactLabel} — shared after the owner accepts a match`
            }
          />
        </Card>

        {/* ------------------------------------------------- finder actions */}
        {canRespond ? (
          <>
            <Notice tone="info" title="Found something like this?">
              Send a private detail only the real finder would know. The owner
              sees it; nobody else on campus does.
            </Notice>
            <Button
              label="I found this item"
              onPress={() => navigation.navigate('IFoundThis', { itemId: item.id })}
            />
          </>
        ) : null}

        {myMatch && !isOwner ? (
          <>
            <SectionHeading>Your response</SectionHeading>
            <MatchCard match={myMatch} campusDesk={ADMIN_DESKS[item.campusId]} viewer="finder" />
            {myMatch.status === 'PENDING' ? (
              <Notice tone="warn">Waiting for the owner to verify your match.</Notice>
            ) : null}
            {myMatch.status === 'REJECTED' ? (
              <Notice tone="warn">
                The owner said this was not their item. If you still have it,
                please submit it to the {ADMIN_DESKS[item.campusId]}.
              </Notice>
            ) : null}
            {myMatch.status === 'ACCEPTED' ? (
              <Notice tone="success" title="Match accepted">
                {myMatch.handoverMode === 'ADMIN'
                  ? `Hand the item to the ${ADMIN_DESKS[item.campusId]} if you have not already. The owner collects it from there.`
                  : 'Arrange the handover with the owner. They will confirm once they have it.'}
              </Notice>
            ) : null}
          </>
        ) : null}

        {/* -------------------------------------------------- owner actions */}
        {isOwner ? (
          <>
            <SectionHeading>
              Match responses {matches.length ? `(${matches.length})` : ''}
            </SectionHeading>

            {matches.length === 0 ? (
              <Card>
                <Text style={styles.mutedBody}>
                  {features.campusAlerts
                    ? 'No one has reported a match yet. Your campus has been alerted — you will get a notification the moment someone responds.'
                    : 'No one has reported a match yet. Responses from finders show up here.'}
                </Text>
              </Card>
            ) : null}

            {matches.map((m) => (
              <View key={m.id} style={{ marginBottom: spacing.md }}>
                <MatchCard match={m} campusDesk={ADMIN_DESKS[item.campusId]} viewer="owner" />

                {m.status === 'PENDING' ? (
                  <View style={styles.matchActions}>
                    <Button
                      label="Not mine"
                      variant="secondary"
                      onPress={() => handleReject(m)}
                      style={{ flex: 1 }}
                    />
                    <Button
                      label="This is mine"
                      onPress={() =>
                        respondToMatch(m.id, true).catch((e) => Alert.alert('Error', e.message))
                      }
                      style={{ flex: 1 }}
                    />
                  </View>
                ) : null}

                {m.status === 'ACCEPTED' ? (
                  <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
                    {features.adminCollectionTracking &&
                    m.handoverMode === 'ADMIN' &&
                    m.adminDropoffStatus === 'SUBMITTED' ? (
                      <>
                        <Notice tone="info" title="Collect from the Admin Department">
                          {ADMIN_DESKS[item.campusId]}
                        </Notice>
                        <Button
                          label="I collected it from Admin"
                          variant="secondary"
                          onPress={() =>
                            markAdminCollected(m.id).catch((e) => Alert.alert('Error', e.message))
                          }
                        />
                      </>
                    ) : null}
                    <Button label="Confirm item returned" onPress={() => handleConfirmReturn(m)} />
                  </View>
                ) : null}
              </View>
            ))}

            {features.cancelRequest &&
            (item.status === 'OPEN' || item.status === 'CLAIM_PENDING') ? (
              <Button
                label="Cancel this request"
                variant="danger"
                onPress={handleCancel}
                style={{ marginTop: spacing.lg }}
              />
            ) : null}
          </>
        ) : null}

        {item.status === 'RETURNED' ? (
          <Notice tone="success" title="Closed">
            This item was returned to its owner. The request stays in My Activity
            for the record.
          </Notice>
        ) : null}

        {item.status === 'EXPIRED' ? (
          <Notice tone="warn" title="Expired">
            This request went unresolved for 14 days and was closed automatically.
          </Notice>
        ) : null}

        {handovers.filter((h) => h.itemId === item.id && h.mode === 'ADMIN').length > 0 && isOwner ? (
          <Text style={styles.footnote}>
            Admin drop-off point: {ADMIN_DESKS[item.campusId]}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Phone is only ever read for the signed-in user; other users' numbers stay server-side. */
function usersPhone(ownerId: string, viewer: { uid: string; phoneOptional?: string }) {
  return ownerId === viewer.uid ? viewer.phoneOptional : undefined;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function MatchCard({
  match,
  campusDesk,
  viewer,
}: {
  match: Match;
  campusDesk: string;
  viewer: 'owner' | 'finder';
}) {
  const statusTone: Record<Match['status'], { label: string; fg: string; bg: string }> = {
    PENDING: { label: 'Awaiting owner', fg: colors.amber, bg: colors.amberSoft },
    ACCEPTED: { label: 'Accepted', fg: colors.green, bg: colors.greenSoft },
    REJECTED: { label: 'Rejected', fg: colors.red, bg: colors.redSoft },
    COMPLETED: { label: 'Completed', fg: colors.green, bg: colors.greenSoft },
  };
  const tone = statusTone[match.status];

  return (
    <Card>
      <View style={styles.badgeRow}>
        <Badge label={tone.label} fg={tone.fg} bg={tone.bg} />
        <Text style={styles.expiry}>{relativeTime(match.createdAt)}</Text>
      </View>

      <Text style={styles.matchWho}>
        {viewer === 'owner' ? `${match.finderName} says:` : 'You wrote:'}
      </Text>
      <Text style={styles.matchText}>“{match.matchText}”</Text>

      <Divider />
      <Detail
        label="Handover"
        value={
          match.handoverMode === 'DIRECT'
            ? 'Direct to owner'
            : `Submitted to BITS Admin — ${campusDesk}`
        }
      />
      {match.handoverMode === 'ADMIN' ? (
        <Detail
          label="Admin status"
          value={match.adminDropoffStatus === 'COLLECTED' ? 'Collected by owner' : 'Waiting for collection'}
        />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  hero: {
    width: '100%',
    height: 210,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.greySoft,
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  expiry: { ...font.caption, color: colors.textFaint },
  title: { ...font.h1, fontSize: 23, marginTop: spacing.md },
  subtitle: { ...font.caption, marginTop: 4 },
  description: { ...font.body, lineHeight: 22 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.lg, marginBottom: spacing.sm },
  detailLabel: { ...font.caption, flexShrink: 0 },
  detailValue: { ...font.caption, color: colors.text, fontWeight: '600', flex: 1, textAlign: 'right' },
  matchWho: { ...font.label, marginTop: spacing.md },
  matchText: { ...font.body, fontStyle: 'italic', marginTop: 4, lineHeight: 21 },
  matchActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  mutedBody: { ...font.caption, lineHeight: 19 },
  footnote: { ...font.caption, color: colors.textFaint, marginTop: spacing.lg, textAlign: 'center' },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  notFoundIcon: { marginBottom: spacing.md },
  notFoundTitle: { ...font.h2, marginBottom: spacing.sm },
  notFoundBody: { ...font.caption, textAlign: 'center', lineHeight: 20 },
});
