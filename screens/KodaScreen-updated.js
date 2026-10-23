import React, { useState, useEffect, useRef, useCallback } from 'react';
import { syncSoon } from '../utils/journey';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, TextInput, FlatList, Pressable, ActivityIndicator, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { askKoda, generateKodaIntroduction, getKodaQuota } from '../utils/koda-ai';
import { getSituation } from '../utils/emergency-plans';
import { useLanguage } from '../utils/LanguageContext';
import { useSkinProfile } from '../utils/useSkinProfile';
import { saveChatMessage, getChatHistory } from '../utils/chat-service';
import { isDiscreet } from '../utils/privacy';
import { useAuth } from '../utils/AuthContext';
import { Screen, Chip, IconCircle, LoadingView, useColors } from '../components/ui';
import { SPACING, RADIUS, TYPE } from '../utils/theme';
import { track } from '../utils/analytics';

const SUGGESTIONS = [
  'Build me a simple morning routine',
  'Can I use retinol with vitamin C?',
  'How do I calm a breakout fast?',
  'Which SPF for oily skin?',
];

const intro = (t) => ({ role: 'assistant', content: t(generateKodaIntroduction()), timestamp: new Date().toISOString() });

export default function KodaScreen({ route, navigation }) {
  const colors = useColors();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const profile = useSkinProfile(user?.id);
  const [messages, setMessages] = useState([intro(t)]);
  const [inputText, setInputText] = useState('');

  // Opened from Home's "Why?": start with the question typed in, ready to send.
  const prefill = route?.params?.prefill;
  // Opened from another flow (routine builder): show a back arrow to it, and
  // forget it once the user leaves so the Koda tab opens normally next time.
  const returnTo = route?.params?.returnTo;
  useFocusEffect(
    useCallback(() => () => {
      if (navigation?.getState?.()) navigation.setParams({ returnTo: undefined, prefill: undefined });
    }, [navigation])
  );
  useEffect(() => {
    if (prefill) setInputText(prefill);
  }, [prefill]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  // Free users: 3 questions a week, back every Monday. null = unknown/unlimited.
  const [quota, setQuota] = useState(null);
  useFocusEffect(useCallback(() => { getKodaQuota().then(q => q && setQuota(q)); }, [user?.id]));
  const limited = quota && !quota.unlimited;
  const outOfQuestions = limited && quota.left <= 0;
  const listRef = useRef(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!user?.id) {
        setInitialLoading(false);
        return;
      }
      const result = await getChatHistory(user.id, 50);
      if (active && result.success && result.data?.length > 0) {
        setMessages([intro(t), ...result.data]);
      }
      if (active) setInitialLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, [user?.id]);

  const scrollToBottom = () => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);

  const send = async (text) => {
    const content = (text ?? inputText).trim();
    if (!content || loading) return;
    setInputText('');

    const userMessage = { role: 'user', content, timestamp: new Date().toISOString() };
    const history = messages;
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    scrollToBottom();
    // Discreet mode: Koda conversations aren't kept.
    const keep = user?.id && !(await isDiscreet(user.id));
    if (keep) saveChatMessage(user.id, userMessage);
    track('koda_message'); // only that a message was sent, never its content

    let reply;
    try {
      const response = await askKoda(content, history, language, profile);
      if (response.error === 'weekly_limit') {
        // No error bubble: the gentle card below takes over.
        setQuota(q => ({ ...(q || {}), unlimited: false, left: 0, resetsAt: response.resetsAt }));
        setLoading(false);
        return;
      }
      reply = response.error
        ? { role: 'assistant', content: t(response.message) || t('Sorry, something went wrong.'), timestamp: new Date().toISOString(), error: true }
        : response;
      if (!response.error && typeof response.left === 'number') setQuota(q => ({ ...(q || {}), unlimited: false, left: response.left }));
    } catch (error) {
      reply = { role: 'assistant', content: t('Oops! Connection issue. Please try again.'), timestamp: new Date().toISOString(), error: true };
    }

    setMessages(prev => [...prev, reply]);
    // Error bubbles stay local so they never get replayed to the API.
    if (user?.id && !reply.error) { if (keep) saveChatMessage(user.id, reply); syncSoon(user.id, 2000); }
    setLoading(false);
    scrollToBottom();
  };

  if (initialLoading) return <LoadingView label={t('Loading your chat…')} />;

  const showSuggestions = messages.length <= 1 && !loading;

  const renderItem = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.row, isUser ? styles.rowUser : styles.rowKoda]}>
        {!isUser ? <IconCircle name="koda" size={30} /> : null}
        <View
          style={[
            styles.bubble,
            isUser
              ? { backgroundColor: colors.primary, borderBottomRightRadius: 6 }
              : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth, borderBottomLeftRadius: 6 },
            item.error && { backgroundColor: colors.dangerSoft, borderColor: colors.dangerSoft },
          ]}
        >
          <Text style={[TYPE.body, { color: isUser ? colors.onPrimary : item.error ? colors.danger : colors.text }]}>{item.content}</Text>
          {!isUser && item.plan && getSituation(item.plan) ? (
            <Pressable
              onPress={() => navigation.navigate('Emergency', { situation: item.plan, openedAt: Date.now() })}
              style={({ pressed }) => [styles.planButton, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
            >
              <Ionicons name="medkit-outline" size={16} color={colors.onPrimary} />
              <Text style={[TYPE.caption, { color: colors.onPrimary, fontWeight: '700', flexShrink: 1 }]}>
                {t('Start the 7-day plan')} · {t(getSituation(item.plan).title)}
              </Text>
            </Pressable>
          ) : null}
          <Text style={[styles.time, { color: isUser ? colors.onPrimary : colors.muted }]}>
            {new Date(item.timestamp || item.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  const canSend = inputText.trim().length > 0 && !loading;

  return (
    <Screen scroll={false} keyboard back={!!returnTo} title="Koda" subtitle={t('Your AI skin coach')} contentStyle={{ paddingHorizontal: 0 }}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item, idx) => `${item.id || item.timestamp}-${idx}`}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onContentSizeChange={scrollToBottom}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        ListFooterComponent={
          <>
            {loading ? (
              <View style={[styles.row, styles.rowKoda]}>
                <IconCircle name="koda" size={30} />
                <View style={[styles.bubble, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              </View>
            ) : null}
            {showSuggestions ? (
              <View style={styles.suggestions}>
                {SUGGESTIONS.map(s => (
                  <Chip key={s} label={t(s)} onPress={() => send(t(s))} />
                ))}
              </View>
            ) : null}
          </>
        }
      />

      {outOfQuestions ? (
        <View style={[styles.outCard, { borderTopColor: colors.border, backgroundColor: colors.bg }]}>
          <Text style={[TYPE.bodyStrong, { color: colors.text, textAlign: 'center' }]}>{t("You've used your {n} free questions this week 🌸", { n: quota.limit || 3 })}</Text>
          <Text style={[TYPE.caption, { color: colors.textSecondary, textAlign: 'center', marginTop: 4, lineHeight: 18 }]}>
            {t('Koda will be back for you on Monday, with {n} new free questions.', { n: quota.limit || 3 })}{'\n'}{t('Want to keep chatting now? Premium gives you Koda every day.')}
          </Text>
          <Pressable onPress={() => navigation.navigate('Premium')}
            style={({ pressed }) => [styles.unlock, { opacity: pressed ? 0.85 : 1 }]}>
            <Ionicons name="diamond" size={15} color="#E2C6DA" />
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>{t('Unlock Koda with Premium')}</Text>
          </Pressable>
          <Text style={[TYPE.caption, { color: colors.muted, textAlign: 'center', marginTop: SPACING.sm }]}>{t('See you Monday 👋')}</Text>
        </View>
      ) : (
      <>
      {limited ? (
        <Text style={[styles.quotaLine, { color: quota.left === 1 ? colors.primary : colors.muted }]}>
          {quota.left === 1
            ? t('This is your last free question this week. Make it count! 💬')
            : quota.left >= (quota.limit || 3)
              ? t('Every Monday, you get {n} free questions with Koda 🌸', { n: quota.limit || 3 })
              : t('{n} free questions left this week · back to {limit} on Monday', { n: quota.left, limit: quota.limit || 3 })}
        </Text>
      ) : null}
      <View style={[styles.composer, { borderTopColor: colors.border, backgroundColor: colors.bg }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          placeholder={t('Ask Koda anything…')}
          placeholderTextColor={colors.muted}
          value={inputText}
          onChangeText={setInputText}
          multiline
          editable={!loading}
        />
        <Pressable
          onPress={() => send()}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel={t('Send')}
          style={[styles.send, { backgroundColor: colors.primary, opacity: canSend ? 1 : 0.4 }]}
        >
          <Ionicons name="arrow-up" size={20} color={colors.onPrimary} />
        </Pressable>
      </View>
      </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.lg, gap: SPACING.md },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm },
  quotaLine: { fontSize: 12, textAlign: 'center', paddingHorizontal: SPACING.xl, paddingTop: SPACING.sm },
  outCard: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: SPACING.lg },
  unlock: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 999, backgroundColor: '#33202E', marginTop: SPACING.lg },
  rowUser: { justifyContent: 'flex-end' },
  rowKoda: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: RADIUS.lg },
  time: { fontSize: 10, marginTop: 4, opacity: 0.7, alignSelf: 'flex-end' },
  planButton: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, marginTop: 10, alignSelf: 'flex-start' },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.sm },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderTopWidth: StyleSheet.hairlineWidth },
  input: { flex: 1, maxHeight: 120, minHeight: 44, borderRadius: 22, borderWidth: 1, paddingHorizontal: SPACING.lg, paddingTop: 12, paddingBottom: 12, fontSize: 15 },
  send: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
