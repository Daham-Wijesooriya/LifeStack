import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { Button, Card, Text } from '@/components/ui';
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

  function applyThemePreference(preference: ThemePreference) {
    theme.setPreference(preference);
    void setThemePreference(preference);
  }

  return (
    <View className="flex-1 gap-lg bg-background p-lg">
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
    </View>
  );
}
