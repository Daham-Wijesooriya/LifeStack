import { forwardRef, type ComponentRef } from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { cn } from '@/lib/cn';

export type TextVariant = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';
export type TextColor = 'primary' | 'secondary' | 'muted' | 'danger' | 'success' | 'onPrimary';
export type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: TextColor;
  weight?: TextWeight;
}

const VARIANT_STYLES: Record<TextVariant, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
};

const COLOR_STYLES: Record<TextColor, string> = {
  primary: 'text-text-primary',
  secondary: 'text-text-secondary',
  muted: 'text-text-muted',
  danger: 'text-danger',
  success: 'text-success',
  onPrimary: 'text-primary-text',
};

const WEIGHT_STYLES: Record<TextWeight, string> = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

/** Themed replacement for RN's `<Text>` — use this everywhere instead, so typography/color tokens stay consistent. */
export const Text = forwardRef<ComponentRef<typeof RNText>, TextProps>(function Text(
  { variant = 'base', color = 'primary', weight = 'normal', className, ...props },
  ref,
) {
  return (
    <RNText
      ref={ref}
      className={cn(VARIANT_STYLES[variant], COLOR_STYLES[color], WEIGHT_STYLES[weight], className)}
      {...props}
    />
  );
});
