import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Pressable, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { askKoda, generateKodaIntroduction } from '../utils/koda-ai';
import { saveChatMessage, getChatHistory } from '../utils/chat-service';
import { useAuth } from '../utils/AuthContext';
import { Screen, Chip, IconCircle, LoadingView, useColors } from '../components/ui';
import { SPACING, RADIUS, TYPE } from '../utils/theme';

const SUGGESTIONS = [
  'Build me a simple morning routine',
  'Can I use retinol with vitamin C?',
  'How do I calm a breakout fast?',
  'Which SPF for oily skin?',
];

const intro = () => ({ role: 'assistant', content: generateKodaIntroduction(), timestamp: new Date().toISOString() });

export default function KodaScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const [messages, setMessages] = useState([intro()]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
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
        setMessages([intro(), ...result.data]);
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
    if (user?.id) saveChatMessage(user.id, userMessage);

    let reply;
    try {
      const response = await askKoda(content, history);
      reply = response.error
        ? { role: 'assistant', content: response.message || 'Sorry, something went wrong.', timestamp: new Date().toISOString(), error: true }
        : response;
    } catch (error) {
      reply = { role: 'assistant', content: 'Oops! Connection issue. Please try again.', timestamp: new Date().toISOString(), error: true };
    }

    setMessages(prev => [...prev, reply]);
    // Error bubbles stay local so they never get replayed to the API.
    if (user?.id && !reply.error) saveChatMessage(user.id, reply);
    setLoading(false);
    scrollToBottom();
  };

  if (initialLoading) return <LoadingView label="Loading your chat…" />;

  const showSuggestions = messages.length <= 1 && !loading;

  const renderItem = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.row, isUser ? styles.rowUser : styles.rowKoda]}>
        {!isUser ? <IconCircle name="sparkles" size={30} /> : null}
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
          <Text style={[styles.time, { color: isUser ? colors.onPrimary : colors.muted }]}>
            {new Date(item.timestamp || item.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  const canSend = inputText.trim().length > 0 && !loading;

  return (
    <Screen scroll={false} keyboard title="Koda" subtitle="Your AI skin coach" contentStyle={{ paddingHorizontal: 0 }}>
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
                <IconCircle name="sparkles" size={30} />
                <View style={[styles.bubble, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              </View>
            ) : null}
            {showSuggestions ? (
              <View style={styles.suggestions}>
                {SUGGESTIONS.map(s => (
                  <Chip key={s} label={s} onPress={() => send(s)} />
                ))}
              </View>
            ) : null}
          </>
        }
      />

      <View style={[styles.composer, { borderTopColor: colors.border, backgroundColor: colors.bg }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          placeholder="Ask Koda anything…"
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
          accessibilityLabel="Send"
          style={[styles.send, { backgroundColor: colors.primary, opacity: canSend ? 1 : 0.4 }]}
        >
          <Ionicons name="arrow-up" size={20} color={colors.onPrimary} />
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.lg, gap: SPACING.md },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm },
  rowUser: { justifyContent: 'flex-end' },
  rowKoda: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: RADIUS.lg },
  time: { fontSize: 10, marginTop: 4, opacity: 0.7, alignSelf: 'flex-end' },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.sm },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderTopWidth: StyleSheet.hairlineWidth },
  input: { flex: 1, maxHeight: 120, minHeight: 44, borderRadius: 22, borderWidth: 1, paddingHorizontal: SPACING.lg, paddingTop: 12, paddingBottom: 12, fontSize: 15 },
  send: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
