import { forwardRef, type ComponentRef, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text as RNText, type PressableProps } from 'react-native';

import { cn } from '@/lib/cn';
import { useTheme } from '@/theme/ThemeProvider';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'dangerOutline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary: 'bg-primary active:opacity-80',
  secondary: 'bg-surface-alt active:opacity-80',
  outline: 'border border-border bg-transparent active:opacity-70',
  ghost: 'bg-transparent active:opacity-60',
  danger: 'bg-danger active:opacity-80',
  dangerOutline: 'border border-danger bg-transparent active:opacity-70',
};

// Not every variant's label uses a Text color token (danger's background is
// fixed-saturation red in both themes, so plain white reads reliably on it
// either way — not worth a dedicated "on-danger" token for one case).
const VARIANT_TEXT_STYLES: Record<ButtonVariant, string> = {
  primary: 'text-primary-text',
  secondary: 'text-text-primary',
  outline: 'text-text-primary',
  ghost: 'text-primary',
  danger: 'text-white',
  dangerOutline: 'text-danger',
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'rounded-md px-md py-xs',
  md: 'rounded-md px-lg py-sm',
  lg: 'rounded-lg px-xl py-md',
};

const SIZE_TEXT_STYLES: Record<ButtonSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

/**
 * Renders its label with plain RN `Text`, not the `Text` primitive —
 * size/variant here already fully determine typography, so composing `Text`
 * would just mean overriding its own default variant/color on every call.
 */
export const Button = forwardRef<ComponentRef<typeof Pressable>, ButtonProps>(function Button(
  { children, variant = 'primary', size = 'md', loading = false, disabled, leftIcon, rightIcon, className, ...props },
  ref,
) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  // Mirrors VARIANT_TEXT_STYLES above (ActivityIndicator takes a color, not
  // a className). Danger is fixed white, not colors.primaryText — that
  // token flips dark/light per theme, but danger's red background needs a
  // light foreground in *both* themes.
  const spinnerColor: string =
    variant === 'primary'
      ? colors.primaryText
      : variant === 'danger'
        ? '#FFFFFF'
        : variant === 'ghost'
          ? colors.primary
          : variant === 'dangerOutline'
            ? colors.danger
            : colors.textPrimary;

  return (
    <Pressable
      ref={ref}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      className={cn(
        'flex-row items-center justify-center gap-sm',
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        isDisabled && 'opacity-50',
        className,
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <>
          {leftIcon}
          <RNText className={cn('font-medium', VARIANT_TEXT_STYLES[variant], SIZE_TEXT_STYLES[size])}>
            {children}
          </RNText>
          {rightIcon}
        </>
      )}
    </Pressable>
  );
});
