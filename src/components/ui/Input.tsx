import { forwardRef, type ComponentRef, type ReactNode } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { cn } from '@/lib/cn';
import { useTheme } from '@/theme/ThemeProvider';

import { Text } from './Text';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  /** className for the outer wrapper (label + field + helper text); `className` itself still targets the text input. */
  containerClassName?: string;
}

export const Input = forwardRef<ComponentRef<typeof TextInput>, InputProps>(function Input(
  { label, error, helperText, leftIcon, rightIcon, containerClassName, className, accessibilityLabel, ...props },
  ref,
) {
  const { colors } = useTheme();

  return (
    <View className={cn('gap-xs', containerClassName)}>
      {label ? (
        <Text variant="sm" weight="medium" color="secondary">
          {label}
        </Text>
      ) : null}
      <View
        className={cn(
          'flex-row items-center gap-sm rounded-md border bg-surface px-md py-sm',
          error ? 'border-danger' : 'border-border',
        )}
      >
        {leftIcon}
        <TextInput
          ref={ref}
          accessibilityLabel={accessibilityLabel ?? label}
          placeholderTextColor={colors.textMuted}
          className={cn('flex-1 text-base text-text-primary', className)}
          {...props}
        />
        {rightIcon}
      </View>
      {error ? (
        <Text variant="sm" color="danger">
          {error}
        </Text>
      ) : helperText ? (
        <Text variant="sm" color="muted">
          {helperText}
        </Text>
      ) : null}
    </View>
  );
});
