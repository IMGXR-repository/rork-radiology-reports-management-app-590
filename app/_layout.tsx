import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet, View, Text, ActivityIndicator } from "react-native";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LoginModal } from "@/components/LoginModal";
import { PinModal } from "@/components/PinModal";
import { QRSyncModal } from "@/components/QRSyncModal";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { 
    user,
    isLoading,
    isAuthenticated,
    userSyncCode,
    showLoginModal, 
    setShowLoginModal, 
    showPinModal,
    showQRSyncModal,
    handleLogin,
    handleRegister,
    handlePinSuccess,
    handlePinClose,
    handleQRSyncClose,
    resetPassword,
    handleGoogleSignIn,
    handleAppleSignIn
  } = useAuth();

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <>
      {isAuthenticated ? (
        <Stack screenOptions={{ headerBackTitle: "Atrás" }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        </Stack>
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Acceso requerido</Text>
        </View>
      )}
      
      <LoginModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onResetPassword={resetPassword}
        onGoogleSignIn={handleGoogleSignIn}
        onAppleSignIn={handleAppleSignIn}
      />
      
      {user && user.isRegistered && (
        <PinModal
          visible={showPinModal}
          onClose={handlePinClose}
          onSuccess={handlePinSuccess}
          expectedPin={user.pin}
          userName={user.name}
        />
      )}
      
      <QRSyncModal
        visible={showQRSyncModal}
        onClose={handleQRSyncClose}
        userSyncCode={userSyncCode}
        userName={user?.name}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppProvider>
          <GestureHandlerRootView style={styles.container}>
            <RootLayoutNav />
          </GestureHandlerRootView>
        </AppProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}