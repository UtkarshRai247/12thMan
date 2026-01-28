import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/theme/ThemeProvider';
import { Text } from '@/src/components/Text';
import { userRepository } from '@/src/lib/domain/userRepository';
import { mockTeams } from '@/src/data/mock/teams';

const CLUBS = mockTeams.map((team) => team.name);

export default function OnboardingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [selectedClub, setSelectedClub] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!userName.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }
    if (!selectedClub) {
      Alert.alert('Error', 'Please select a club');
      return;
    }

    setIsSaving(true);
    try {
      const savedUser = await userRepository.saveUser({
        userName: userName.trim(),
        userClub: selectedClub,
      });
      
      // Verify the user was actually saved
      const verifiedUser = await userRepository.getCurrentUser();
      if (!verifiedUser || verifiedUser.userName !== userName.trim()) {
        throw new Error('Failed to verify user was saved');
      }
      
      // Small delay to ensure storage is fully persisted
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
      console.error('Error saving user:', error);
      setIsSaving(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text variant="h1" style={styles.title}>
          Welcome to 12thMan
        </Text>
        <Text variant="body" style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>
          Set up your profile to start rating matches
        </Text>
      </View>

      <View
        style={[
          styles.section,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text variant="title" style={styles.label}>
          Username
        </Text>
        <TextInput
          value={userName}
          onChangeText={setUserName}
          placeholder="Enter your username"
          placeholderTextColor={theme.colors.textTertiary}
          style={[
            styles.input,
            {
              color: theme.colors.text,
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            },
          ]}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View
        style={[
          styles.section,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text variant="title" style={styles.label}>
          Your Club
        </Text>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.clubSelector}
          contentContainerStyle={styles.clubSelectorContent}
        >
          {CLUBS.map((club) => (
            <TouchableOpacity
              key={club}
              onPress={() => setSelectedClub(club)}
              style={[
                styles.clubOption,
                {
                  backgroundColor:
                    selectedClub === club
                      ? theme.colors.accent
                      : theme.colors.surfaceElevated,
                  borderColor:
                    selectedClub === club ? theme.colors.accent : theme.colors.border,
                },
              ]}
            >
              <Text
                variant="body"
                style={{
                  color: selectedClub === club ? '#FFFFFF' : theme.colors.text,
                  fontWeight: selectedClub === club ? '600' : '400',
                }}
              >
                {club}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity
        onPress={handleSave}
        disabled={isSaving || !userName.trim() || !selectedClub}
        style={[
          styles.saveButton,
          {
            backgroundColor:
              isSaving || !userName.trim() || !selectedClub
                ? theme.colors.textTertiary
                : theme.colors.accent,
          },
        ]}
      >
        <Text variant="body" style={{ color: '#FFFFFF', fontWeight: '600' }}>
          {isSaving ? 'Saving...' : 'Get Started'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    marginBottom: 12,
    textAlign: 'center',
  },
  section: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  label: {
    marginBottom: 12,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    fontSize: 16,
  },
  clubSelector: {
    marginTop: 8,
    maxHeight: 200,
  },
  clubSelectorContent: {
    gap: 8,
  },
  clubOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
});
