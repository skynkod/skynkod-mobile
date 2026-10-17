import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { askKoda, generateKodaIntroduction } from '../utils/koda-ai';

const COLORS = {
  background: '#F7F1F5',
  primary: '#B283AC',
  secondary: '#7A3E76',
  text: '#14121A',
  muted: '#9B97A0',
  border: '#E8E1ED',
  card: '#FFFFFF',
};

export default function KodaScreen() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: generateKodaIntroduction(), timestamp: new Date().toISOString() },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    setInputText('');

    setMessages(prev => [
      ...prev,
      { role: 'user', content: userMessage, timestamp: new Date().toISOString() },
    ]);

    setLoading(true);

    try {
      const response = await askKoda(userMessage, messages);

      if (response.error) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: response.message || 'Sorry, something went wrong.',
            timestamp: new Date().toISOString(),
            error: true,
          },
        ]);
      } else {
        setMessages(prev => [...prev, response]);
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Oops! Connection issue. Please check your internet and API key.',
          timestamp: new Date().toISOString(),
          error: true,
        },
      ]);
    }

    setLoading(false);
    scrollToBottom();
  };

  const MessageBubble = ({ message }) => {
    const isUser = message.role === 'user';

    return (
      <View style={[styles.messageBubbleContainer, isUser ? styles.userContainer : styles.assistantContainer]}>
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
            message.error && styles.errorBubble,
          ]}
        >
          <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
            {message.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>✨ Koda - Your AI Skin Coach</Text>
        <Text style={styles.subtitle}>Ask me anything about your skin</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, idx) => idx.toString()}
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={styles.messagesContainer}
        scrollEnabled={true}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Ask Koda..."
            value={inputText}
            onChangeText={setInputText}
            placeholderTextColor={COLORS.muted}
            multiline
            maxHeight={80}
          />
          <TouchableOpacity
            style={[styles.sendButton, loading && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={loading || !inputText.trim()}
          >
            <Text style={styles.sendButtonText}>{loading ? '⏳' : '→'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  messagesContainer: { paddingHorizontal: 16, paddingVertical: 12 },
  messageBubbleContainer: { marginVertical: 6 },
  userContainer: { alignItems: 'flex-end' },
  assistantContainer: { alignItems: 'flex-start' },
  messageBubble: { maxWidth: '80%', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  userBubble: { backgroundColor: COLORS.primary },
  assistantBubble: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  errorBubble: { backgroundColor: '#FFEBEE', borderColor: '#F44336' },
  messageText: { fontSize: 14, lineHeight: 20 },
  userText: { color: '#FFF' },
  assistantText: { color: COLORS.text },
  inputContainer: { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.background },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  input: { flex: 1, backgroundColor: COLORS.card, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { fontSize: 20, fontWeight: 'bold' },
});
