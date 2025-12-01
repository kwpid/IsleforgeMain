import { create } from 'zustand';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'coin' | 'xp' | 'item';

export interface GameNotification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  icon?: string;
  duration?: number;
}

interface NotificationStore {
  notifications: GameNotification[];
  addNotification: (notification: Omit<GameNotification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  
  addNotification: (notification) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: GameNotification = {
      ...notification,
      id,
      duration: notification.duration ?? 3000,
    };
    
    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));
    
    setTimeout(() => {
      get().removeNotification(id);
    }, newNotification.duration);
  },
  
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
  
  clearAll: () => {
    set({ notifications: [] });
  },
}));

export function useGameNotifications() {
  const { addNotification } = useNotificationStore();
  
  return {
    notify: addNotification,
    success: (title: string, message?: string) => 
      addNotification({ type: 'success', title, message }),
    error: (title: string, message?: string) => 
      addNotification({ type: 'error', title, message }),
    warning: (title: string, message?: string) => 
      addNotification({ type: 'warning', title, message }),
    info: (title: string, message?: string) => 
      addNotification({ type: 'info', title, message }),
    coin: (amount: number, message?: string) => 
      addNotification({ 
        type: 'coin', 
        title: `+${amount.toLocaleString()} Coins`, 
        message,
        icon: 'coin',
      }),
    xp: (amount: number, message?: string) => 
      addNotification({ 
        type: 'xp', 
        title: `+${amount} XP`, 
        message,
        icon: 'xp',
      }),
    item: (itemName: string, quantity: number, icon?: string) => 
      addNotification({ 
        type: 'item', 
        title: `+${quantity} ${itemName}`, 
        icon,
      }),
  };
}
