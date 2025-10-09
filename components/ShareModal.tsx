import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Platform, Alert, FlatList } from 'react-native';
import { X, MessageCircle, Users, Send } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { lightTheme, darkTheme } from '@/constants/theme';

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  itemId: string;
  itemType: 'report' | 'phrase';
  itemTitle: string;
}

interface ChatUser {
  id: string;
  name: string;
  email: string;
  isOnline: boolean;
  lastSeen?: Date;
}

const mockChatUsers: ChatUser[] = [
  { id: '1', name: 'Ana García', email: 'ana.garcia@email.com', isOnline: true },
  { id: '2', name: 'Carlos López', email: 'carlos.lopez@email.com', isOnline: false, lastSeen: new Date(Date.now() - 300000) },
  { id: '3', name: 'María Rodríguez', email: 'maria.rodriguez@email.com', isOnline: true },
  { id: '4', name: 'Juan Pérez', email: 'juan.perez@email.com', isOnline: false, lastSeen: new Date(Date.now() - 3600000) },
];

export const ShareModal: React.FC<ShareModalProps> = ({ 
  visible, 
  onClose, 
  itemId, 
  itemType, 
  itemTitle 
}) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showChatUsers, setShowChatUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { shareItem, isAuthenticated, signIn, user } = useAuth();
  const { settings } = useApp();
  const theme = settings?.theme === 'dark' ? darkTheme : lightTheme;

  const filteredUsers = mockChatUsers.filter(chatUser =>
    chatUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chatUser.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleShare = async (targetEmail?: string) => {
    if (!isAuthenticated) {
      signIn();
      return;
    }

    const emailToUse = targetEmail || recipientEmail;
    if (!emailToUse.includes('@')) {
      if (Platform.OS === 'web') {
        alert('Por favor selecciona un usuario válido');
      } else {
        Alert.alert('Error', 'Por favor selecciona un usuario válido');
      }
      return;
    }

    setIsLoading(true);
    try {
      const success = await shareItem({
        itemId,
        itemType,
        recipientEmail: emailToUse,
        message: message.trim() || `${user?.name || 'Un usuario'} te ha compartido: "${itemTitle}"`,
      });

      if (success) {
        if (Platform.OS === 'web') {
          alert(`${itemType === 'report' ? 'Informe' : 'Frase'} compartido exitosamente en el chat`);
        } else {
          Alert.alert('Éxito', `${itemType === 'report' ? 'Informe' : 'Frase'} compartido exitosamente en el chat`);
        }
        setRecipientEmail('');
        setMessage('');
        setShowChatUsers(false);
        setSearchQuery('');
        onClose();
      }
    } catch (error) {
      console.error('Error sharing item:', error);
      if (Platform.OS === 'web') {
        alert('Error al compartir el elemento');
      } else {
        Alert.alert('Error', 'Error al compartir el elemento');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const selectUser = (chatUser: ChatUser) => {
    setRecipientEmail(chatUser.email);
    setShowChatUsers(false);
  };

  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 60) {
      return `Hace ${minutes} min`;
    } else {
      return `Hace ${hours}h`;
    }
  };

  const renderUser = ({ item }: { item: ChatUser }) => (
    <TouchableOpacity 
      style={[styles.userItem, { backgroundColor: theme.surface, borderColor: theme.outline }]}
      onPress={() => selectUser(item)}
    >
      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <View>
            <Text style={[styles.userName, { color: theme.onSurface }]}>
              {item.name}
            </Text>
            <Text style={[styles.userEmail, { color: theme.outline }]}>
              {item.email}
            </Text>
          </View>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: item.isOnline ? '#4CAF50' : theme.outline },
          ]} />
        </View>
        {!item.isOnline && item.lastSeen && (
          <Text style={[styles.lastSeen, { color: theme.outline }]}>
            {formatLastSeen(item.lastSeen)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: theme.background }]}>
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: `${theme.primary}20` }]}>
              <MessageCircle size={24} color={theme.primary} />
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color={theme.outline} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.title, { color: theme.onSurface }]}>Compartir en Chat</Text>
          <Text style={[styles.itemTitle, { color: theme.outline }]} numberOfLines={2}>
            {itemType === 'report' ? 'Informe' : 'Frase'}: &ldquo;{itemTitle}&rdquo;
          </Text>

          {showChatUsers ? (
            <View style={styles.chatUsersContainer}>
              <View style={[styles.searchContainer, { backgroundColor: theme.surface }]}>
                <Users color={theme.outline} size={20} />
                <TextInput
                  style={[styles.searchInput, { color: theme.onSurface }]}
                  placeholder="Buscar usuarios..."
                  placeholderTextColor={theme.outline}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <View style={styles.usersListContainer}>
                <FlatList
                  data={filteredUsers}
                  renderItem={renderUser}
                  keyExtractor={(item) => item.id}
                  style={styles.usersList}
                  showsVerticalScrollIndicator={false}
                />
              </View>
              <TouchableOpacity
                style={[styles.backButton, { backgroundColor: theme.surface }]}
                onPress={() => setShowChatUsers(false)}
              >
                <Text style={[styles.backButtonText, { color: theme.onSurface }]}>Volver</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.selectUserButton, { backgroundColor: theme.surface, borderColor: theme.outline }]}
                onPress={() => setShowChatUsers(true)}
                disabled={isLoading}
              >
                <Users size={20} color={theme.primary} style={styles.inputIcon} />
                <Text style={[styles.selectUserText, { color: recipientEmail ? theme.onSurface : theme.outline }]}>
                  {recipientEmail ? recipientEmail : 'Seleccionar usuario del chat'}
                </Text>
              </TouchableOpacity>

              <View style={[styles.inputContainer, { borderColor: theme.outline, backgroundColor: theme.surface }]}>
                <MessageCircle size={20} color={theme.outline} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.messageInput, { color: theme.onSurface }]}
                  placeholder="Mensaje opcional"
                  placeholderTextColor={theme.outline}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  editable={!isLoading}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.shareButton,
                  { backgroundColor: (!recipientEmail.includes('@') || isLoading) ? theme.outline : theme.primary }
                ]}
                onPress={() => handleShare()}
                disabled={!recipientEmail.includes('@') || isLoading}
              >
                <Send size={16} color="#FFFFFF" style={styles.sendIcon} />
                <Text style={styles.shareButtonText}>
                  {isLoading ? 'Enviando...' : 'Enviar al Chat'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {!isAuthenticated && (
            <Text style={[styles.loginNote, { color: '#FF6B6B' }]}>
              Necesitas iniciar sesión para compartir elementos
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 16,
    marginBottom: 24,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  chatUsersContainer: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  usersListContainer: {
    height: 200,
    marginBottom: 16,
  },
  usersList: {
    flex: 1,
  },
  userItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
  },
  userEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  lastSeen: {
    fontSize: 12,
    marginTop: 4,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  selectUserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  selectUserText: {
    flex: 1,
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  messageInput: {
    minHeight: 60,
  },
  shareButton: {
    flexDirection: 'row',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  sendIcon: {
    marginRight: 8,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loginNote: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 18,
  },
});