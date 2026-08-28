import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, spacing } from '../theme';
import { Badge, Button, Card, Divider, Notice, SectionHeading } from '../components/ui';
import { useApp } from '../store/AppContext';
import { Match } from '../types';
import { fullDateTime, relativeTime, STATUS_META } from '../utils/format';

/** Lost request detail: the details, the status, and "I found this item". */
export function ItemDetailScreen({ route, navigation }: any) {
  const { itemId } = route.params;
  const { user, items, matchesForItem, respondToMatch, confirmReturned } = useApp();

  const item = items.find((i) => i.id === itemId);

  // Campus scoping means a different-campus request simply is not in the store.
  if (!item || !user) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.notFound}>
          <Ionicons
            name="lock-closed-outline"
            size={42}
            color={colors.textFaint}
            style={styles.notFoundIcon}
          />
          <Text style={styles.notFoundTitle}>Not available</Text>
          <Text style={styles.notFoundBody}>
            This lost request either does not exist or belongs to another campus.
            BTS Find only shows posts from your own campus.
          </Text>
          <Button
            label="Back to feed"
            onPress={() => navigation.goBack()}
            style={{ marginTop: spacing.lg }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const isOwner = item.ownerId === user.uid;
  const status = STATUS_META[item.status];
  const matches = matchesForItem(item);
  const myMatch = matches.find((m) => m.finderId === user.uid);
  const canRespond =
    !isOwner && (item.status === 'OPEN' || item.status === 'CLAIM_PENDING') && !myMatch;

  function handleReject(match: Match) {
    Alert.alert('Reject this match?', 'The finder will be told it was not your item.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: () =>
          respondToMatch(match.id, false).catch((e) => Alert.alert('Error', e.message)),
      },
    ]);
  }

  function handleConfirmReturn(match: Match) {
    Alert.alert(
      'Confirm you got it back?',
      'This closes the request. It leaves the feed and stays in My activity.',
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

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.badgeRow}>
          <Badge label={status.label} fg={status.fg} bg={status.bg} />
        </View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>
          {item.category} · reported by {isOwner ? 'you' : item.ownerName}{' '}
          {relativeTime(item.createdAt)}
        </Text>

        <Card style={{ marginTop: spacing.lg }}>
          <Text style={styles.description}>{item.description}</Text>
          <Divider />
          <Detail label="Last seen near" value={item.lastSeenZone} />
          <Detail label="Last seen at" value={fullDateTime(item.lostAt)} />
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
            <MatchCard match={myMatch} viewer="finder" />
            {myMatch.status === 'PENDING' ? (
              <Notice tone="warn">Waiting for the owner to verify your match.</Notice>
            ) : null}
            {myMatch.status === 'REJECTED' ? (
              <Notice tone="warn">The owner said this was not their item.</Notice>
            ) : null}
            {myMatch.status === 'ACCEPTED' ? (
              <Notice tone="success" title="Match accepted">
                Arrange the handover with the owner. They will confirm once they
                have it.
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
                  No one has reported a match yet. Responses from finders show up
                  here.
                </Text>
              </Card>
            ) : null}

            {matches.map((m) => (
              <View key={m.id} style={{ marginBottom: spacing.md }}>
                <MatchCard match={m} viewer="owner" />

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
                  <Button
                    label="Confirm item returned"
                    onPress={() => handleConfirmReturn(m)}
                    style={{ marginTop: spacing.sm }}
                  />
                ) : null}
              </View>
            ))}
          </>
        ) : null}

        {item.status === 'RETURNED' ? (
          <Notice tone="success" title="Closed">
            This item was returned to its owner. The request stays in My activity
            for the record.
          </Notice>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function MatchCard({ match, viewer }: { match: Match; viewer: 'owner' | 'finder' }) {
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
        <Text style={styles.time}>{relativeTime(match.createdAt)}</Text>
      </View>

      <Text style={styles.matchWho}>
        {viewer === 'owner' ? `${match.finderName} says:` : 'You wrote:'}
      </Text>
      <Text style={styles.matchText}>“{match.matchText}”</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  badgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  time: { ...font.caption, color: colors.textFaint },
  title: { ...font.h1, fontSize: 23, marginTop: spacing.md },
  subtitle: { ...font.caption, marginTop: 4 },
  description: { ...font.body, lineHeight: 22 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  detailLabel: { ...font.caption, flexShrink: 0 },
  detailValue: { ...font.caption, color: colors.text, fontWeight: '600', flex: 1, textAlign: 'right' },
  matchWho: { ...font.label, marginTop: spacing.md },
  matchText: { ...font.body, fontStyle: 'italic', marginTop: 4, lineHeight: 21 },
  matchActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  mutedBody: { ...font.caption, lineHeight: 19 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  notFoundIcon: { marginBottom: spacing.md },
  notFoundTitle: { ...font.h2, marginBottom: spacing.sm },
  notFoundBody: { ...font.caption, textAlign: 'center', lineHeight: 20 },
});
