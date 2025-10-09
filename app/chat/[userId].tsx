import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send, ArrowLeft } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { lightTheme, darkTheme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalSearchParams, router } from 'expo-router';
import { Stack } from 'expo-router';

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  isOwn: boolean;
}

interface ChatUser {
  id: string;
  name: string;
  email: string;
  isOnline: boolean;
  lastSeen?: Date;
}

const mockUsers: ChatUser[] = [
  { 
    id: '1', 
    name: 'Ana García', 
    email: 'ana.garcia@email.com',
    isOnline: true,
  },
  { 
    id: '2', 
    name: 'Carlos López', 
    email: 'carlos.lopez@email.com',
    isOnline: false, 
    lastSeen: new Date(Date.now() - 300000),
  },
  { 
    id: '3', 
    name: 'María Rodríguez', 
    email: 'maria.rodriguez@email.com',
    isOnline: true,
  },
  { 
    id: '4', 
    name: 'Juan Pérez', 
    email: 'juan.perez@email.com',
    isOnline: false, 
    lastSeen: new Date(Date.now() - 3600000),
  },
];

const mockConversations: { [key: string]: ChatMessage[] } = {
  '1': [
    {
      id: '1',
      userId: '1',
      userName: 'Ana García',
      message: 'Excelente, yo también estoy interesada.',
      timestamp: new Date(Date.now() - 3000000),
      isOwn: false,
    },
    {
      id: '2',
      userId: 'current',
      userName: 'Tú',
      message: '¿Te interesa algún tipo específico de informe?',
      timestamp: new Date(Date.now() - 2700000),
      isOwn: true,
    },
  ],
  '2': [
    {
      id: '1',
      userId: '2',
      userName: 'Carlos López',
      message: '¡Hola! ¿Alguien tiene informes sobre productividad?',
      timestamp: new Date(Date.now() - 3600000),
      isOwn: false,
    },
    {
      id: '2',
      userId: 'current',
      userName: 'Tú',
      message: 'Sí, tengo varios. Te los puedo compartir.',
      timestamp: new Date(Date.now() - 3300000),
      isOwn: true,
    },
  ],
};

export default function IndividualChatScreen() {
  const { settings } = useApp();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const theme = settings?.theme === 'dark' ? darkTheme : lightTheme;
  const { userId } = useLocalSearchParams<{ userId: string }>();
  
  const chatUser = mockUsers.find(u => u.id === userId);
  const [messages, setMessages] = useState<ChatMessage[]>(mockConversations[userId || ''] || []);
  const [newMessage, setNewMessage] = useState<string>('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        userId: 'current',
        userName: user?.name || 'Tú',
        message: newMessage.trim(),
        timestamp: new Date(),
        isOwn: true,
      };
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[
      styles.messageContainer,
      item.isOwn ? styles.ownMessage : styles.otherMessage,
    ]}>
      <View style={[
        styles.messageBubble,
        {
          backgroundColor: item.isOwn ? theme.primary : theme.surface,
          borderColor: theme.outline,
        },
      ]}>
        <Text style={[
          styles.messageText,
          { color: item.isOwn ? '#FFFFFF' : theme.onSurface },
        ]}>
          {item.message}
        </Text>
        
        <Text style={[
          styles.timestamp,
          { color: item.isOwn ? 'rgba(255,255,255,0.7)' : theme.outline },
        ]}>
          {formatTime(item.timestamp)}
        </Text>
      </View>
    </View>
  );

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loginPrompt}>
          <Text style={[styles.loginText, { color: theme.onSurface }]}>
            Inicia sesión para chatear
          </Text>
        </View>
      </View>
    );
  }

  if (!chatUser) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loginPrompt}>
          <Text style={[styles.loginText, { color: theme.onSurface }]}>
            Usuario no encontrado
          </Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{
          title: chatUser.name,
          headerShown: true,
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.onSurface,
          headerTitleStyle: { color: theme.onSurface },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color={theme.onSurface} />
            </TouchableOpacity>
          ),
        }} 
      />
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.outline }]}>
                  Inicia una conversación con {chatUser.name}
                </Text>
              </View>
            }
          />
          
          <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderTopColor: theme.outline }]}>
            <TextInput
              style={[
                styles.messageInput,
                {
                  backgroundColor: theme.background,
                  color: theme.onSurface,
                  borderColor: theme.outline,
                },
              ]}
              placeholder="Escribe un mensaje..."
              placeholderTextColor={theme.outline}
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor: newMessage.trim() ? theme.primary : theme.outline,
                },
              ]}
              onPress={sendMessage}
              disabled={!newMessage.trim()}
            >
              <Send color="#FFFFFF" size={20} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loginText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  messageContainer: {
    marginVertical: 4,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});