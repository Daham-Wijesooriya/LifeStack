import { Card, Text } from '@/components/ui';

export interface StatCardProps {
  value: string;
  label: string;
  valueColor?: 'primary' | 'success' | 'danger';
}

export function StatCard({ value, label, valueColor = 'primary' }: StatCardProps) {
  return (
    <Card className="flex-1 items-center gap-xs">
      <Text variant="lg" weight="bold" color={valueColor}>
        {value}
      </Text>
      <Text variant="sm" color="secondary">
        {label}
      </Text>
    </Card>
  );
}
