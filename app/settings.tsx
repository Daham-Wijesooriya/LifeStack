import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Button, Card, Text } from '@/components/ui';
import { checkForAppUpdate, downloadUpdate, getCurrentAppVersion, type UpdateInfo } from '@/lib/updates';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme, type ThemePreference } from '@/theme/ThemeProvider';

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'LKR', 'INR', 'AUD', 'JPY', 'CAD'];

export default function SettingsScreen() {
  const theme = useTheme();
  const currency = useSettingsStore((state) => state.currency);
  const setCurrency = useSettingsStore((state) => state.setCurrency);
  const setThemePreference = useSettingsStore((state) => state.setThemePreference);

  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);

  function applyThemePreference(preference: ThemePreference) {
    theme.setPreference(preference);
    void setThemePreference(preference);
  }

  async function handleCheckForUpdates() {
    setCheckingUpdate(true);
    setUpdateStatus(null);
    try {
      const update = await checkForAppUpdate();
      if (!update) {
        setUpdateStatus('No releases found on GitHub yet.');
        setUpdateInfo(null);
      } else if (update.isUpdateAvailable) {
        setUpdateInfo(update);
        setUpdateStatus(null);
      } else {
        setUpdateInfo(update);
        setUpdateStatus(`You are on the latest version (v${update.currentVersion}).`);
      }
    } catch {
      setUpdateStatus('Could not reach GitHub Releases. Please check your network connection.');
    } finally {
      setCheckingUpdate(false);
    }
  }

  useEffect(() => {
    void handleCheckForUpdates();
  }, []);

  const currentVersion = getCurrentAppVersion();

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-lg p-lg">
      <Card className="gap-sm">
        <Text weight="semibold">Theme</Text>
        <View className="flex-row gap-sm">
          {THEME_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={theme.preference === option.value ? 'primary' : 'outline'}
              size="sm"
              onPress={() => applyThemePreference(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </View>
      </Card>

      <Card className="gap-xs">
        <Text weight="semibold">Currency</Text>
        {CURRENCY_OPTIONS.map((code) => (
          <Pressable
            key={code}
            onPress={() => void setCurrency(code)}
            accessibilityRole="radio"
            accessibilityState={{ checked: currency === code }}
            className="flex-row items-center justify-between py-sm"
          >
            <Text>{code}</Text>
            {currency === code ? <Ionicons name="checkmark" size={18} color={theme.colors.primary} /> : null}
          </Pressable>
        ))}
      </Card>

      <Card className="gap-md">
        <View className="flex-row items-center justify-between">
          <Text weight="semibold">App Version & Updates</Text>
          <Text variant="sm" color="secondary">
            v{currentVersion}
          </Text>
        </View>

        {updateInfo?.isUpdateAvailable ? (
          <View className="gap-xs rounded-lg border border-primary/30 bg-primary/10 p-md">
            <View className="flex-row items-center gap-xs">
              <Ionicons name="arrow-up-circle" size={20} color={theme.colors.primary} />
              <Text weight="semibold" className="text-primary">
                New Version Available: v{updateInfo.latestVersion}
              </Text>
            </View>
            {updateInfo.releaseNotes ? (
              <Text variant="xs" color="secondary" numberOfLines={4}>
                {updateInfo.releaseNotes}
              </Text>
            ) : null}
            <View className="mt-xs">
              <Button
                variant="primary"
                size="sm"
                onPress={() => void downloadUpdate(updateInfo)}
                leftIcon={<Ionicons name="download-outline" size={16} color="#FFFFFF" />}
              >
                Download Update APK
              </Button>
            </View>
          </View>
        ) : null}

        {updateStatus ? (
          <Text variant="sm" color="secondary">
            {updateStatus}
          </Text>
        ) : null}

        <Button
          variant="outline"
          size="sm"
          loading={checkingUpdate}
          onPress={() => void handleCheckForUpdates()}
          leftIcon={<Ionicons name="cloud-download-outline" size={16} color={theme.colors.textPrimary} />}
        >
          Check for Updates
        </Button>
      </Card>
    </ScrollView>
  );
}
