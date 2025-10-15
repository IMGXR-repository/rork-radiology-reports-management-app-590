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
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send, Users, FileText, MessageSquare, Plus, UserPlus, Settings, X, Heart, Briefcase, Coffee, Star, Edit3, Trash2, Check, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { lightTheme, darkTheme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { SharedItem } from '@/types';
import { router } from 'expo-router';

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  isOwn: boolean;
  sharedItem?: SharedItem;
}

interface ChatUser {
  id: string;
  name: string;
  email: string;
  isOnline: boolean;
  lastSeen?: Date;
  avatar?: string;
  groups: ContactGroup[];
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount?: number;
}

interface ContactGroup {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  isOnline: boolean;
  mutualConnections?: number;
}

const defaultContactGroups: ContactGroup[] = [
  { id: 'friends', name: 'Amigos', icon: 'heart', color: '#FF6B6B' },
  { id: 'work', name: 'Trabajo', icon: 'briefcase', color: '#4ECDC4' },
  { id: 'family', name: 'Familia', icon: 'heart', color: '#45B7D1' },
  { id: 'colleagues', name: 'Colegas', icon: 'coffee', color: '#96CEB4' },
  { id: 'favorites', name: 'Favoritos', icon: 'star', color: '#FFEAA7' },
];

const availableColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
];

const availableIcons = [
  { name: 'heart', component: Heart },
  { name: 'briefcase', component: Briefcase },
  { name: 'coffee', component: Coffee },
  { name: 'star', component: Star },
  { name: 'users', component: Users },
];

const mockUsers: ChatUser[] = [
  { 
    id: '1', 
    name: 'Ana García', 
    email: 'ana.garcia@email.com',
    isOnline: true,
    groups: [defaultContactGroups[0], defaultContactGroups[4]],
    lastMessage: 'Perfecto, nos vemos entonces',
    lastMessageTime: new Date(Date.now() - 300000),
    unreadCount: 2
  },
  { 
    id: '2', 
    name: 'Carlos López', 
    email: 'carlos.lopez@email.com',
    isOnline: false, 
    lastSeen: new Date(Date.now() - 300000),
    groups: [defaultContactGroups[1]],
    lastMessage: '¡Gracias por la información!',
    lastMessageTime: new Date(Date.now() - 3600000),
  },
  { 
    id: '3', 
    name: 'María Rodríguez', 
    email: 'maria.rodriguez@email.com',
    isOnline: true,
    groups: [defaultContactGroups[0], defaultContactGroups[3]],
    lastMessage: 'https://www.instagram.com/reel/...',
    lastMessageTime: new Date(Date.now() - 7200000),
    unreadCount: 1
  },
  { 
    id: '4', 
    name: 'Juan Pérez', 
    email: 'juan.perez@email.com',
    isOnline: false, 
    lastSeen: new Date(Date.now() - 3600000),
    groups: [defaultContactGroups[2]],
    lastMessage: 'Llamada perdida',
    lastMessageTime: new Date(Date.now() - 14400000),
  },
];

const mockSearchResults: UserSearchResult[] = [
  { id: '5', name: 'Laura Martín', email: 'laura.martin@email.com', isOnline: true, mutualConnections: 3 },
  { id: '6', name: 'Diego Ruiz', email: 'diego.ruiz@email.com', isOnline: false, mutualConnections: 1 },
  { id: '7', name: 'Sofia Herrera', email: 'sofia.herrera@email.com', isOnline: true, mutualConnections: 5 },
  { id: '8', name: 'Miguel Torres', email: 'miguel.torres@email.com', isOnline: false, mutualConnections: 2 },
];

const mockMessages: ChatMessage[] = [
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
  {
    id: '3',
    userId: '1',
    userName: 'Ana García',
    message: 'Excelente, yo también estoy interesada.',
    timestamp: new Date(Date.now() - 3000000),
    isOwn: false,
  },
];

export default function ChatScreen() {
  const { settings } = useApp();
  const { user, getSharedItemsReceived } = useAuth();
  const insets = useSafeAreaInsets();
  const theme = settings?.theme === 'dark' ? darkTheme : lightTheme;
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [newMessage, setNewMessage] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showUsers, setShowUsers] = useState<boolean>(true);
  const [showUserSearch, setShowUserSearch] = useState<boolean>(false);
  const [showGroupManager, setShowGroupManager] = useState<boolean>(false);
  const [selectedGroup, setSelectedGroup] = useState<ContactGroup | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [contacts, setContacts] = useState<ChatUser[]>(mockUsers);
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>(defaultContactGroups);
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<ContactGroup | null>(null);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>(availableColors[0]);
  const [selectedIcon, setSelectedIcon] = useState<string>('heart');
  const [showContactAssignment, setShowContactAssignment] = useState<boolean>(false);
  const [selectedCategoryForAssignment, setSelectedCategoryForAssignment] = useState<ContactGroup | null>(null);
  const [showContactGroups, setShowContactGroups] = useState<boolean>(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (user) {
      const receivedItems = getSharedItemsReceived();
      const newSharedMessages = receivedItems
        .filter(item => !messages.some(msg => msg.sharedItem?.id === item.id))
        .map(item => ({
          id: `shared-${item.id}`,
          userId: item.sharedBy,
          userName: item.sharedWith.split('@')[0],
          message: item.message || `Te han compartido un ${item.type === 'report' ? 'informe' : 'frase'}`,
          timestamp: new Date(item.sharedAt),
          isOwn: false,
          sharedItem: item,
        }));
      
      if (newSharedMessages.length > 0) {
        setMessages(prev => [...prev, ...newSharedMessages]);
      }
    }
  }, [user, getSharedItemsReceived, messages]);

  const filteredUsers = contacts.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = selectedGroup ? user.groups.some(g => g.id === selectedGroup.id) : true;
    return matchesSearch && matchesGroup;
  });

  const searchResults = mockSearchResults.filter(user =>
    user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  const groupedUsers = contactGroups.map(group => ({
    group,
    users: contacts.filter(user => user.groups.some(g => g.id === group.id)),
    count: contacts.filter(user => user.groups.some(g => g.id === group.id)).length
  }));

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

  const handleAddSharedItem = async (sharedItem: SharedItem) => {
    try {
      if (sharedItem.type === 'report') {
        const success = await addReportFromShared(sharedItem.itemId);
        if (success) {
          if (Platform.OS === 'web') {
            alert('Informe agregado exitosamente a tu colección');
          } else {
            Alert.alert('Éxito', 'Informe agregado exitosamente a tu colección');
          }
        }
      } else {
        const success = await addPhraseFromShared(sharedItem.itemId);
        if (success) {
          if (Platform.OS === 'web') {
            alert('Frase agregada exitosamente a tu colección');
          } else {
            Alert.alert('Éxito', 'Frase agregada exitosamente a tu colección');
          }
        }
      }
    } catch (error) {
      console.error('Error adding shared item:', error);
      if (Platform.OS === 'web') {
        alert('Error al agregar el elemento');
      } else {
        Alert.alert('Error', 'Error al agregar el elemento');
      }
    }
  };

  const addReportFromShared = async (itemId: string): Promise<boolean> => {
    console.log('Adding shared report:', itemId);
    return true;
  };

  const addPhraseFromShared = async (itemId: string): Promise<boolean> => {
    console.log('Adding shared phrase:', itemId);
    return true;
  };

  const addUserToContacts = (userResult: UserSearchResult, selectedGroups: ContactGroup[]) => {
    const newContact: ChatUser = {
      id: userResult.id,
      name: userResult.name,
      email: userResult.email,
      isOnline: userResult.isOnline,
      groups: selectedGroups,
    };
    
    setContacts(prev => [...prev, newContact]);
    setShowUserSearch(false);
    setUserSearchQuery('');
    
    if (Platform.OS === 'web') {
      alert(`${userResult.name} agregado a tus contactos`);
    } else {
      Alert.alert('Éxito', `${userResult.name} agregado a tus contactos`);
    }
  };



  const createCategory = () => {
    if (newCategoryName.trim()) {
      const newCategory: ContactGroup = {
        id: Date.now().toString(),
        name: newCategoryName.trim(),
        icon: selectedIcon,
        color: selectedColor,
      };
      setContactGroups(prev => [...prev, newCategory]);
      resetCategoryForm();
      setShowCategoryModal(false);
      
      if (Platform.OS === 'web') {
        alert(`Categoría "${newCategory.name}" creada exitosamente`);
      } else {
        Alert.alert('Éxito', `Categoría "${newCategory.name}" creada exitosamente`);
      }
    }
  };

  const updateCategory = () => {
    if (editingCategory && newCategoryName.trim()) {
      const updatedCategory: ContactGroup = {
        ...editingCategory,
        name: newCategoryName.trim(),
        icon: selectedIcon,
        color: selectedColor,
      };
      
      setContactGroups(prev => prev.map(cat => 
        cat.id === editingCategory.id ? updatedCategory : cat
      ));
      
      // Update contacts with the new category info
      setContacts(prev => prev.map(user => ({
        ...user,
        groups: user.groups.map(group => 
          group.id === editingCategory.id ? updatedCategory : group
        )
      })));
      
      resetCategoryForm();
      setShowCategoryModal(false);
      
      if (Platform.OS === 'web') {
        alert(`Categoría "${updatedCategory.name}" actualizada exitosamente`);
      } else {
        Alert.alert('Éxito', `Categoría "${updatedCategory.name}" actualizada exitosamente`);
      }
    }
  };

  const deleteCategory = (categoryId: string) => {
    const category = contactGroups.find(cat => cat.id === categoryId);
    if (!category) return;
    
    const confirmDelete = () => {
      // Remove category from all contacts
      setContacts(prev => prev.map(user => ({
        ...user,
        groups: user.groups.filter(group => group.id !== categoryId)
      })));
      
      // Remove category from list
      setContactGroups(prev => prev.filter(cat => cat.id !== categoryId));
      
      if (Platform.OS === 'web') {
        alert(`Categoría "${category.name}" eliminada exitosamente`);
      } else {
        Alert.alert('Éxito', `Categoría "${category.name}" eliminada exitosamente`);
      }
    };
    
    if (Platform.OS === 'web') {
      if (confirm(`¿Estás seguro de que deseas eliminar la categoría "${category.name}"?`)) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        'Confirmar eliminación',
        `¿Estás seguro de que deseas eliminar la categoría "${category.name}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: confirmDelete }
        ]
      );
    }
  };

  const resetCategoryForm = () => {
    setNewCategoryName('');
    setSelectedColor(availableColors[0]);
    setSelectedIcon('heart');
    setEditingCategory(null);
  };

  const openEditCategory = (category: ContactGroup) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setSelectedColor(category.color);
    setSelectedIcon(category.icon);
    setShowCategoryModal(true);
  };

  const openCreateCategory = () => {
    resetCategoryForm();
    setShowCategoryModal(true);
  };

  const toggleContactInCategory = (userId: string, categoryId: string) => {
    setContacts(prev => prev.map(user => {
      if (user.id === userId) {
        const hasCategory = user.groups.some(g => g.id === categoryId);
        const category = contactGroups.find(cat => cat.id === categoryId);
        
        if (hasCategory) {
          return {
            ...user,
            groups: user.groups.filter(g => g.id !== categoryId)
          };
        } else if (category) {
          return {
            ...user,
            groups: [...user.groups, category]
          };
        }
      }
      return user;
    }));
  };

  const toggleContactGroupsVisibility = () => {
    setShowContactGroups(!showContactGroups);
  };

  const selectGroupFilter = (groupId: string) => {
    const group = contactGroups.find(g => g.id === groupId);
    setSelectedGroup(selectedGroup?.id === groupId ? null : group || null);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const formatChatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days === 0) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Ayer';
    } else if (days < 7) {
      return date.toLocaleDateString('es-ES', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    }
  };

  const getInitials = (name: string) => {
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
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
        {!item.isOwn && (
          <Text style={[styles.userName, { color: theme.primary }]}>
            {item.userName}
          </Text>
        )}
        <Text style={[
          styles.messageText,
          { color: item.isOwn ? '#FFFFFF' : theme.onSurface },
        ]}>
          {item.message}
        </Text>
        
        {item.sharedItem && (
          <View style={[
            styles.sharedItemContainer,
            { backgroundColor: item.isOwn ? 'rgba(255,255,255,0.1)' : theme.background, borderColor: theme.outline }
          ]}>
            <View style={styles.sharedItemHeader}>
              {item.sharedItem.type === 'report' ? (
                <FileText size={16} color={item.isOwn ? '#FFFFFF' : theme.primary} />
              ) : (
                <MessageSquare size={16} color={item.isOwn ? '#FFFFFF' : theme.primary} />
              )}
              <Text style={[
                styles.sharedItemType,
                { color: item.isOwn ? '#FFFFFF' : theme.onSurface }
              ]}>
                {item.sharedItem.type === 'report' ? 'Informe' : 'Frase'} Compartido
              </Text>
            </View>
            <Text style={[
              styles.sharedItemId,
              { color: item.isOwn ? 'rgba(255,255,255,0.8)' : theme.outline }
            ]}>
              ID: {item.sharedItem.itemId}
            </Text>
            {!item.isOwn && (
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: theme.primary }]}
                onPress={() => handleAddSharedItem(item.sharedItem!)}
              >
                <Plus size={14} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Agregar a mi colección</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        <Text style={[
          styles.timestamp,
          { color: item.isOwn ? 'rgba(255,255,255,0.7)' : theme.outline },
        ]}>
          {formatTime(item.timestamp)}
        </Text>
      </View>
    </View>
  );

  const renderUser = ({ item }: { item: ChatUser }) => (
    <TouchableOpacity 
      style={[
        styles.chatItem,
        { backgroundColor: theme.background },
      ]}
      onPress={() => router.push(`/chat/${item.id}`)}
    >
      <View style={[styles.avatarContainer, { backgroundColor: theme.primary + '20' }]}>
        <Text style={[styles.avatarText, { color: theme.primary }]}>
          {getInitials(item.name)}
        </Text>
        {item.isOnline && (
          <View style={[styles.onlineBadge, { backgroundColor: '#4CAF50' }]} />
        )}
      </View>
      
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={[styles.chatName, { color: theme.onSurface }]} numberOfLines={1}>
            {item.name}
          </Text>
          {item.lastMessageTime && (
            <Text style={[styles.chatTime, { color: theme.outline }]}>
              {formatChatTime(item.lastMessageTime)}
            </Text>
          )}
        </View>
        
        <View style={styles.chatFooter}>
          <Text 
            style={[
              styles.lastMessageText, 
              { color: item.unreadCount ? theme.onSurface : theme.outline },
              item.unreadCount && { fontWeight: '600' }
            ]} 
            numberOfLines={1}
          >
            {item.lastMessage || 'Sin mensajes'}
          </Text>
          {item.unreadCount && item.unreadCount > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
              <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSearchResult = ({ item }: { item: UserSearchResult }) => (
    <TouchableOpacity 
      style={[
        styles.searchResultItem,
        { backgroundColor: theme.surface, borderColor: theme.outline },
      ]}
      onPress={() => {
        // Show group selection modal for this user
        Alert.alert(
          'Agregar Contacto',
          `¿Deseas agregar a ${item.name} a tus contactos?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Agregar', 
              onPress: () => addUserToContacts(item, [contactGroups[0]]) // Default to friends
            }
          ]
        );
      }}
    >
      <View style={styles.searchResultInfo}>
        <View style={styles.searchResultHeader}>
          <View style={styles.userMainInfo}>
            <Text style={[styles.userName, { color: theme.onSurface }]}>
              {item.name}
            </Text>
            <Text style={[styles.userEmail, { color: theme.outline }]}>
              {item.email}
            </Text>
          </View>
          <View style={styles.searchResultActions}>
            <View style={[
              styles.statusIndicator,
              { backgroundColor: item.isOnline ? '#4CAF50' : theme.outline },
            ]} />
            <UserPlus size={20} color={theme.primary} />
          </View>
        </View>
        
        {item.mutualConnections && item.mutualConnections > 0 && (
          <Text style={[styles.mutualConnections, { color: theme.outline }]}>
            {item.mutualConnections} conexiones en común
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderGroupFilter = ({ group, count }: { group: ContactGroup, count: number }) => {
    const isSelected = selectedGroup?.id === group.id;
    
    return (
      <TouchableOpacity
        key={group.id}
        style={[
          styles.groupFilterChip,
          {
            backgroundColor: isSelected ? group.color : theme.surface,
            borderColor: isSelected ? group.color : theme.outline,
          },
        ]}
        onPress={() => selectGroupFilter(group.id)}
      >
        <View style={[styles.groupFilterIcon, { backgroundColor: group.color + '20' }]}>
          <Text style={[styles.groupFilterIconText, { color: group.color }]}>
            {group.name.charAt(0)}
          </Text>
        </View>
        <Text
          style={[
            styles.groupFilterText,
            { color: isSelected ? '#FFFFFF' : theme.onSurface },
          ]}
          numberOfLines={1}
        >
          {group.name}
        </Text>
        <Text
          style={[
            styles.groupFilterCount,
            { color: isSelected ? 'rgba(255,255,255,0.8)' : theme.outline },
          ]}
        >
          {count}
        </Text>
      </TouchableOpacity>
    );
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loginPrompt}>
          <Text style={[styles.loginText, { color: theme.onSurface }]}>
            Inicia sesión para chatear con otros usuarios
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.outline, paddingTop: insets.top }]}>
        <Text style={[styles.headerTitle, { color: theme.onSurface }]}>Chat</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: showUsers ? theme.primary : 'transparent' }]}
            onPress={() => {
              setShowUsers(!showUsers);
              setShowGroupManager(false);
            }}
          >
            <Users color={showUsers ? '#FFFFFF' : theme.primary} size={20} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: showGroupManager ? theme.primary : 'transparent' }]}
            onPress={() => {
              setShowGroupManager(!showGroupManager);
              setShowUsers(false);
            }}
          >
            <Settings color={showGroupManager ? '#FFFFFF' : theme.primary} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {showUsers ? (
        <View style={styles.usersSection}>
          <ScrollView style={styles.groupsList} showsVerticalScrollIndicator={false}>
            <View style={styles.groupsSectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.onSurface, marginVertical: 0 }]}>Grupos de Contactos</Text>
              <TouchableOpacity
                style={[styles.toggleGroupsButton, { backgroundColor: theme.surface, borderColor: theme.outline }]}
                onPress={toggleContactGroupsVisibility}
              >
                {showContactGroups ? (
                  <ChevronUp size={16} color={theme.primary} />
                ) : (
                  <ChevronDown size={16} color={theme.primary} />
                )}
                <Text style={[styles.toggleGroupsText, { color: theme.primary }]}>
                  {showContactGroups ? 'Ocultar' : 'Mostrar'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {showContactGroups && (
              <View style={[styles.groupFiltersContainer, { backgroundColor: theme.surfaceVariant }]}>
                <View style={styles.groupFiltersGrid}>
                  {groupedUsers.map(({ group, count }) => renderGroupFilter({ group, count }))}
                </View>
                {selectedGroup && (
                  <TouchableOpacity
                    style={[styles.clearFiltersButton, { backgroundColor: theme.outline + '20' }]}
                    onPress={() => setSelectedGroup(null)}
                  >
                    <Text style={[styles.clearFiltersText, { color: theme.outline }]}>
                      Mostrar todos los contactos
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            
            <View style={[styles.searchContainer, { backgroundColor: theme.surfaceVariant, borderColor: 'transparent' }]}>
              <TextInput
                style={[styles.searchInput, { color: theme.onSurface }]}
                placeholder="Buscar por nombre..."
                placeholderTextColor={theme.outline}
                value={searchQuery}
                onChangeText={setSearchQuery}
                underlineColorAndroid="transparent"
              />
            </View>
            
            <Text style={[styles.sectionTitle, { color: theme.onSurface, marginTop: 8 }]}>
              {selectedGroup ? `Contactos en ${selectedGroup.name}` : 'Todos los Contactos'}
            </Text>
            <View style={styles.contactsListContainer}>
              {filteredUsers.map(user => (
                <View key={user.id}>
                  {renderUser({ item: user })}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      ) : showGroupManager ? (
        <View style={styles.groupManagerSection}>
          <View style={styles.groupManagerHeader}>
            <Text style={[styles.sectionTitle, { color: theme.onSurface, marginVertical: 0 }]}>Gestionar Categorías</Text>
            <TouchableOpacity
              style={[styles.createCategoryButton, { backgroundColor: theme.primary }]}
              onPress={openCreateCategory}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.createCategoryText}>Nueva</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.groupManagerList} showsVerticalScrollIndicator={false}>
            {contactGroups.map(group => {
              const contactCount = contacts.filter(u => u.groups.some(g => g.id === group.id)).length;

              
              return (
                <View key={group.id} style={[styles.groupManagerItem, { backgroundColor: theme.surface, borderColor: theme.outline }]}>
                  <View style={styles.groupManagerHeaderButton}>
                    <View style={styles.groupManagerLeft}>
                      <View style={[styles.groupIcon, { backgroundColor: group.color + '20' }]}>
                        <Text style={[styles.groupIconText, { color: group.color }]}>
                          {group.name.charAt(0)}
                        </Text>
                      </View>
                      <View style={styles.groupManagerInfo}>
                        <Text style={[styles.groupName, { color: theme.onSurface }]}>
                          {group.name}
                        </Text>
                        <Text style={[styles.groupDescription, { color: theme.outline }]}>
                          {contactCount} contactos
                        </Text>
                      </View>
                    </View>
                    <View style={styles.groupManagerActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.primary + '20' }]}
                        onPress={() => {
                          setSelectedCategoryForAssignment(group);
                          setShowContactAssignment(true);
                        }}
                      >
                        <UserPlus size={16} color={theme.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.primary + '20' }]}
                        onPress={() => openEditCategory(group)}
                      >
                        <Edit3 size={16} color={theme.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#FF6B6B20' }]}
                        onPress={() => deleteCategory(group.id)}
                      >
                        <Trash2 size={16} color="#FF6B6B" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
      
      {/* Category Creation/Edit Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          resetCategoryForm();
          setShowCategoryModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.onSurface }]}>
                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  resetCategoryForm();
                  setShowCategoryModal(false);
                }}
              >
                <X size={24} color={theme.outline} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.onSurface }]}>Nombre de la categoría</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      backgroundColor: theme.background,
                      color: theme.onSurface,
                      borderColor: theme.outline,
                    },
                  ]}
                  placeholder="Ej: Compañeros de trabajo"
                  placeholderTextColor={theme.outline}
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  maxLength={30}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.onSurface }]}>Color</Text>
                <View style={styles.colorGrid}>
                  {availableColors.map(color => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        selectedColor === color && styles.selectedColorOption,
                      ]}
                      onPress={() => setSelectedColor(color)}
                    >
                      {selectedColor === color && (
                        <Check size={16} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.onSurface }]}>Icono</Text>
                <View style={styles.iconGrid}>
                  {availableIcons.map(({ name, component: IconComponent }) => (
                    <TouchableOpacity
                      key={name}
                      style={[
                        styles.iconOption,
                        { backgroundColor: theme.background, borderColor: theme.outline },
                        selectedIcon === name && { backgroundColor: selectedColor + '20', borderColor: selectedColor },
                      ]}
                      onPress={() => setSelectedIcon(name)}
                    >
                      <IconComponent 
                        size={20} 
                        color={selectedIcon === name ? selectedColor : theme.outline} 
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: theme.outline + '20' }]}
                onPress={() => {
                  resetCategoryForm();
                  setShowCategoryModal(false);
                }}
              >
                <Text style={[styles.cancelButtonText, { color: theme.outline }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.saveButton,
                  { backgroundColor: newCategoryName.trim() ? theme.primary : theme.outline },
                ]}
                onPress={editingCategory ? updateCategory : createCategory}
                disabled={!newCategoryName.trim()}
              >
                <Text style={styles.saveButtonText}>
                  {editingCategory ? 'Actualizar' : 'Crear'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Contact Assignment Modal */}
      <Modal
        visible={showContactAssignment}
        transparent
        animationType="slide"
        onRequestClose={() => setShowContactAssignment(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.onSurface }]}>
                Asignar a &quot;{selectedCategoryForAssignment?.name}&quot;
              </Text>
              <TouchableOpacity onPress={() => setShowContactAssignment(false)}>
                <X size={24} color={theme.outline} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {contacts.map(contact => {
                const isInCategory = selectedCategoryForAssignment ? 
                  contact.groups.some(g => g.id === selectedCategoryForAssignment.id) : false;
                
                return (
                  <TouchableOpacity
                    key={contact.id}
                    style={[
                      styles.assignmentContactItem,
                      { backgroundColor: theme.background, borderColor: theme.outline },
                      isInCategory && { backgroundColor: theme.primary + '10', borderColor: theme.primary },
                    ]}
                    onPress={() => {
                      if (selectedCategoryForAssignment) {
                        toggleContactInCategory(contact.id, selectedCategoryForAssignment.id);
                      }
                    }}
                  >
                    <View style={styles.assignmentContactInfo}>
                      <Text style={[styles.assignmentContactName, { color: theme.onSurface }]}>
                        {contact.name}
                      </Text>
                      <Text style={[styles.assignmentContactEmail, { color: theme.outline }]}>
                        {contact.email}
                      </Text>
                    </View>
                    <View style={[
                      styles.assignmentCheckbox,
                      { borderColor: theme.outline },
                      isInCategory && { backgroundColor: theme.primary, borderColor: theme.primary },
                    ]}>
                      {isInCategory && <Check size={16} color="#FFFFFF" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: theme.primary }]}
                onPress={() => setShowContactAssignment(false)}
              >
                <Text style={styles.saveButtonText}>Listo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
  },
  closeSearchButton: {
    padding: 4,
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
  usersSection: {
    flex: 1,
  },
  searchSection: {
    flex: 1,
  },
  groupManagerSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 40,
    paddingHorizontal: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    backgroundColor: 'transparent',
  },
  usersList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchResultsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  groupsList: {
    flex: 1,
  },
  groupsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  toggleGroupsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  toggleGroupsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  groupManagerList: {
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  userMainInfo: {
    flex: 1,
  },
  userEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  userGroups: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  groupChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  groupChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
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
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  sharedItemContainer: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  sharedItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  sharedItemType: {
    fontSize: 14,
    fontWeight: '500',
  },
  sharedItemId: {
    fontSize: 12,
    marginBottom: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  searchResultItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchResultActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mutualConnections: {
    fontSize: 12,
    marginTop: 4,
  },
  groupSection: {
    marginBottom: 8,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
  },
  groupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  groupIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupIconText: {
    fontSize: 14,
    fontWeight: '600',
  },
  groupName: {
    fontSize: 16,
    fontWeight: '500',
  },
  groupCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  groupHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  groupFiltersContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },

  groupFiltersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  groupFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    width: '31%',
  },
  groupFilterIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupFilterIconText: {
    fontSize: 10,
    fontWeight: '600',
  },
  groupFilterText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  groupFilterCount: {
    fontSize: 11,
    fontWeight: '500',
  },
  clearFiltersButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  clearFiltersText: {
    fontSize: 12,
    fontWeight: '500',
  },

  groupManagerItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  groupManagerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  groupManagerInfo: {
    flex: 1,
  },
  groupDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  groupManagerHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  createCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  createCategoryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  groupManagerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  groupManagerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColorOption: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    marginRight: 6,
  },
  saveButton: {
    marginLeft: 6,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  assignmentContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  assignmentContactInfo: {
    flex: 1,
  },
  assignmentContactName: {
    fontSize: 16,
    fontWeight: '500',
  },
  assignmentContactEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  assignmentCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactsListContainer: {
    paddingHorizontal: 0,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chatContent: {
    flex: 1,
    gap: 4,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  chatTime: {
    fontSize: 12,
    marginLeft: 8,
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessageText: {
    fontSize: 14,
    flex: 1,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});