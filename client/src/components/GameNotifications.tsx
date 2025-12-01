import { useNotificationStore, NotificationType } from '@/hooks/useGameNotifications';
import { PixelIcon } from './PixelIcon';
import { cn } from '@/lib/utils';
import { X, Check, AlertTriangle, Info, Coins, Sparkles, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const notificationStyles: Record<NotificationType, { bg: string; border: string; icon: typeof Check }> = {
  success: { bg: 'bg-primary/20', border: 'border-primary', icon: Check },
  error: { bg: 'bg-destructive/20', border: 'border-destructive', icon: X },
  warning: { bg: 'bg-yellow-500/20', border: 'border-yellow-500', icon: AlertTriangle },
  info: { bg: 'bg-blue-500/20', border: 'border-blue-500', icon: Info },
  coin: { bg: 'bg-game-coin/20', border: 'border-game-coin', icon: Coins },
  xp: { bg: 'bg-primary/20', border: 'border-primary', icon: Sparkles },
  item: { bg: 'bg-accent/20', border: 'border-accent', icon: Package },
};

export function GameNotifications() {
  const notifications = useNotificationStore((s) => s.notifications);
  const removeNotification = useNotificationStore((s) => s.removeNotification);

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => {
          const style = notificationStyles[notification.type];
          const IconComponent = style.icon;

          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'pixel-border pointer-events-auto relative overflow-hidden',
                style.bg,
                style.border,
                'p-3 min-w-[200px] max-w-[300px]'
              )}
              data-testid={`notification-${notification.type}`}
            >
              <div className="flex items-start gap-2 relative z-10">
                <div className="flex-shrink-0 mt-0.5">
                  {notification.image ? (
                    <img src={notification.image} alt="" className="w-8 h-8 object-contain pixelated" />
                  ) : notification.icon ? (
                    <PixelIcon icon={notification.icon} size="sm" />
                  ) : (
                    <IconComponent className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="pixel-text-sm text-[9px] text-foreground leading-tight">
                    {notification.title}
                  </p>
                  {notification.message && (
                    <p className="font-sans text-xs text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-close-notification"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {notification.progress && notification.duration && (
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: notification.duration / 1000, ease: "linear" }}
                  className="absolute bottom-0 left-0 h-0.5 bg-foreground/20 z-0"
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
