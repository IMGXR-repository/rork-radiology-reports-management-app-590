import { Tabs } from 'expo-router';
import { FileText, Settings as SettingsIcon, MessageCircle, Mic, Sun, Star, RefreshCcw } from 'lucide-react-native';
import React from 'react';
import { useApp } from '@/contexts/AppContext';
import { lightTheme, darkTheme } from '@/constants/theme';

export default function TabLayout() {
  const { settings } = useApp();
  const theme = settings && settings.theme === 'dark' ? darkTheme : lightTheme;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.outline,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.outline,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="recording"
        options={{
          title: 'RAD IA-1',
          tabBarIcon: ({ color, size }) => <Sun color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="radia-2"
        options={{
          title: 'RAD-2',
          tabBarIcon: ({ color, size }) => <Star color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="dictaphone"
        options={{
          title: 'Grabación',
          tabBarIcon: ({ color, size }) => <Mic color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'PREDEF',
          tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="iterate"
        options={{
          title: 'Iterar',
          tabBarIcon: ({ color, size }) => <RefreshCcw color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="ai-chat"
        options={{
          title: 'Chat IA',
          tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Mensajes',
          tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, size }) => <SettingsIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="create-report-tab"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="phrases"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="productivity"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="backup-management"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}