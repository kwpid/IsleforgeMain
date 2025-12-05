import { useState, useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '@/lib/gameStore';
import { getItemById, ALL_ITEMS } from '@/lib/items';
import { formatNumber } from '@/lib/gameTypes';
import { cn } from '@/lib/utils';
import { X, Terminal } from 'lucide-react';

interface DevConsoleProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ConsoleMessage {
  type: 'input' | 'output' | 'error' | 'success';
  content: string;
}

export function DevConsole({ isOpen, onClose }: DevConsoleProps) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<ConsoleMessage[]>([
    { type: 'output', content: 'Developer Console v1.0' },
    { type: 'output', content: 'Type "help" for available commands.' },
  ]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  
  const setCoins = useGameStore((s) => s.setCoins);
  const addXp = useGameStore((s) => s.addXp);
  const setUniversalPoints = useGameStore((s) => s.setUniversalPoints);
  const addItemToInventory = useGameStore((s) => s.addItemToInventory);
  const addItemToStorage = useGameStore((s) => s.addItemToStorage);
  const player = useGameStore((s) => s.player);
  const storage = useGameStore((s) => s.storage);
  const inventory = useGameStore((s) => s.inventory);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [history]);

  const addMessage = useCallback((type: ConsoleMessage['type'], content: string) => {
    setHistory(prev => [...prev, { type, content }]);
  }, []);

  const executeCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;
    
    addMessage('input', `> ${trimmed}`);
    setCommandHistory(prev => [...prev, trimmed]);
    setHistoryIndex(-1);
    
    const parts = trimmed.toLowerCase().split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);
    
    switch (command) {
      case 'help':
        addMessage('output', 'Available commands:');
        addMessage('output', '  spawn <item_id> [amount] - Add items to inventory');
        addMessage('output', '  give <item_id> [amount] - Add items to storage');
        addMessage('output', '  cash <amount> - Set coins to amount');
        addMessage('output', '  xp <amount> - Add experience points');
        addMessage('output', '  up <amount> - Set Universal Points to amount');
        addMessage('output', '  items - List all item IDs');
        addMessage('output', '  status - Show player status');
        addMessage('output', '  clear - Clear console');
        addMessage('output', '  help - Show this help message');
        break;
        
      case 'spawn':
      case 'give': {
        if (args.length === 0) {
          addMessage('error', `Usage: ${command} <item_id> [amount]`);
          break;
        }
        
        const itemId = args[0];
        const amount = parseInt(args[1]) || 1;
        const item = getItemById(itemId);
        
        if (!item) {
          addMessage('error', `Item not found: ${itemId}`);
          addMessage('output', 'Use "items" to see available item IDs');
          break;
        }
        
        if (amount <= 0 || amount > 9999) {
          addMessage('error', 'Amount must be between 1 and 9999');
          break;
        }
        
        let success: boolean;
        if (command === 'spawn') {
          success = addItemToInventory(itemId, amount);
        } else {
          success = addItemToStorage(itemId, amount);
        }
        
        if (success) {
          addMessage('success', `Added ${amount}x ${item.name} to ${command === 'spawn' ? 'inventory' : 'storage'}`);
        } else {
          addMessage('error', `Failed to add items. ${command === 'spawn' ? 'Inventory' : 'Storage'} may be full.`);
        }
        break;
      }
      
      case 'cash':
      case 'coins':
      case 'money': {
        if (args.length === 0) {
          addMessage('error', 'Usage: cash <amount>');
          break;
        }
        
        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount < 0 || amount > 999999999) {
          addMessage('error', 'Amount must be between 0 and 999,999,999');
          break;
        }
        
        setCoins(amount);
        addMessage('success', `Set coins to ${amount.toLocaleString()}`);
        break;
      }
      
      case 'xp':
      case 'exp':
      case 'experience': {
        if (args.length === 0) {
          addMessage('error', 'Usage: xp <amount>');
          break;
        }
        
        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount <= 0 || amount > 999999999) {
          addMessage('error', 'Amount must be between 1 and 999,999,999');
          break;
        }
        
        addXp(amount);
        addMessage('success', `Added ${amount.toLocaleString()} XP`);
        break;
      }
      
      case 'up':
      case 'universalpoints':
      case 'points': {
        if (args.length === 0) {
          addMessage('error', 'Usage: up <amount>');
          break;
        }
        
        const amount = parseFloat(args[0]);
        if (isNaN(amount) || amount < 0 || amount > 999999999) {
          addMessage('error', 'Amount must be between 0 and 999,999,999');
          break;
        }
        
        setUniversalPoints(amount);
        addMessage('success', `Set Universal Points to ${amount.toLocaleString()}`);
        break;
      }
      
      case 'items':
      case 'list': {
        addMessage('output', `Available items (${ALL_ITEMS.length} total):`);
        const groupedItems: Record<string, string[]> = {};
        
        ALL_ITEMS.forEach(item => {
          const type = item.type;
          if (!groupedItems[type]) {
            groupedItems[type] = [];
          }
          groupedItems[type].push(item.id);
        });
        
        Object.entries(groupedItems).forEach(([type, ids]) => {
          addMessage('output', `  [${type}]: ${ids.join(', ')}`);
        });
        break;
      }
      
      case 'status':
      case 'stats': {
        addMessage('output', '--- Player Status ---');
        addMessage('output', `  Level: ${player.level}`);
        addMessage('output', `  XP: ${player.xp}/${player.xpToNextLevel}`);
        addMessage('output', `  Coins: ${player.coins.toLocaleString()}`);
        addMessage('output', `  Universal Points: U$${formatNumber(player.universalPoints)}`);
        addMessage('output', `  Inventory: ${inventory.items.length}/${inventory.maxSlots} slots`);
        addMessage('output', `  Storage: ${storage.items.reduce((a, i) => a + i.quantity, 0)}/${storage.capacity} items`);
        break;
      }
      
      case 'clear':
      case 'cls': {
        setHistory([
          { type: 'output', content: 'Console cleared.' },
        ]);
        break;
      }
      
      default:
        addMessage('error', `Unknown command: ${command}`);
        addMessage('output', 'Type "help" for available commands.');
    }
    
    setInput('');
  }, [addMessage, setCoins, addXp, setUniversalPoints, addItemToInventory, addItemToStorage, player, inventory, storage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 
          ? commandHistory.length - 1 
          : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex >= 0) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        }
      }
    } else if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'y' || e.key === 'Y') {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        onClose();
      }
    }
  }, [input, executeCommand, commandHistory, historyIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
      <div 
        className="dev-console w-full max-w-2xl h-96 flex flex-col rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-primary/50 bg-primary/10">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            <span className="text-primary text-sm font-mono">Developer Console</span>
          </div>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-close-console"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div 
          ref={outputRef}
          className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-sm"
        >
          {history.map((msg, i) => (
            <div 
              key={i}
              className={cn(
                'whitespace-pre-wrap break-all',
                msg.type === 'input' && 'text-primary',
                msg.type === 'output' && 'text-muted-foreground',
                msg.type === 'error' && 'text-destructive',
                msg.type === 'success' && 'text-green-400'
              )}
            >
              {msg.content}
            </div>
          ))}
        </div>
        
        <div className="flex items-center border-t border-primary/50 bg-black/50">
          <span className="text-primary pl-3 font-mono">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="dev-console-input flex-1 bg-transparent border-none outline-none px-2 py-3 text-foreground text-sm"
            placeholder="Enter command..."
            autoComplete="off"
            spellCheck={false}
            data-testid="input-dev-console"
          />
        </div>
      </div>
    </div>
  );
}
