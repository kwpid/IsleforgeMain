import { useGameStore } from '@/lib/gameStore';
import { cn } from '@/lib/utils';

export function FloatingNumbers() {
  const floatingNumbers = useGameStore((s) => s.floatingNumbers);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {floatingNumbers.map((num) => (
        <div
          key={num.id}
          className={cn(
            'absolute pixel-text text-sm animate-float-up',
            num.color
          )}
          style={{
            left: num.x,
            top: num.y,
          }}
        >
          {num.value}
        </div>
      ))}
    </div>
  );
}
