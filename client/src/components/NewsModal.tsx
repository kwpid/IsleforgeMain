import { useState, useEffect, useCallback } from 'react';
import { NEWS_ARTICLES, NewsArticle, ArticleTag, getUnreadArticles } from '@/lib/newsData';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Newspaper, Wrench, Sparkles, Calendar } from 'lucide-react';

const STORAGE_KEY = 'isleforge-read-articles';

function getReadArticles(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function markArticlesAsRead(articleIds: string[]): void {
  try {
    const current = getReadArticles();
    const updated = Array.from(new Set([...current, ...articleIds]));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    console.error('Failed to save read articles');
  }
}

interface NewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onArticlesRead?: () => void;
}

const TAG_CONFIG: Record<ArticleTag, { icon: typeof Newspaper; color: string }> = {
  Update: { icon: Sparkles, color: 'bg-primary text-primary-foreground' },
  Fixes: { icon: Wrench, color: 'bg-orange-500 text-white dark:bg-orange-600' },
  News: { icon: Newspaper, color: 'bg-accent text-accent-foreground' },
};

function renderMarkdown(content: string): JSX.Element[] {
  const lines = content.split('\n');
  const elements: JSX.Element[] = [];
  let listItems: string[] = [];
  let inList = false;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
          {listItems.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
          ))}
        </ul>
      );
      listItems = [];
    }
    inList = false;
  };

  const formatInline = (text: string): string => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>');
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      flushList();
      const altText = imageMatch[1];
      const imageSrc = imageMatch[2];
      elements.push(
        <div key={`img-${i}`} className="my-4 pixel-border border-border overflow-hidden rounded-md">
          <img 
            src={imageSrc} 
            alt={altText || 'News image'}
            className="w-full h-auto object-cover"
            style={{ imageRendering: 'pixelated' }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
      );
      continue;
    }

    if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h1 key={i} className="pixel-text text-lg text-foreground mb-4">
          {trimmed.slice(2)}
        </h1>
      );
    } else if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={i} className="pixel-text text-sm text-foreground mb-3 mt-4">
          {trimmed.slice(3)}
        </h2>
      );
    } else if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={i} className="pixel-text-sm text-foreground mb-2 mt-3">
          {trimmed.slice(4)}
        </h3>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      inList = true;
      listItems.push(trimmed.slice(2));
    } else if (/^\d+\.\s/.test(trimmed)) {
      inList = true;
      listItems.push(trimmed.replace(/^\d+\.\s/, ''));
    } else if (trimmed === '') {
      flushList();
    } else {
      flushList();
      elements.push(
        <p
          key={i}
          className="text-muted-foreground mb-3 font-sans text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }}
        />
      );
    }
  }

  flushList();
  return elements;
}

function ArticleCard({
  article,
  isSelected,
  onClick,
}: {
  article: NewsArticle;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={cn(
        "pixel-border p-3 cursor-pointer hover-elevate active-elevate-2 overflow-visible transition-colors",
        isSelected ? "border-primary bg-primary/10" : "border-card-border bg-card"
      )}
      onClick={onClick}
      data-testid={`article-${article.id}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="pixel-text-sm text-[10px] text-foreground line-clamp-2">{article.title}</h3>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {article.tags.map((tag) => {
          const config = TAG_CONFIG[tag];
          const Icon = config.icon;
          return (
            <Badge
              key={tag}
              variant="secondary"
              className={cn("pixel-text-sm text-[7px] gap-1", config.color)}
            >
              <Icon className="w-3 h-3" />
              {tag}
            </Badge>
          );
        })}
      </div>
      <div className="flex items-center gap-1 mt-2 text-muted-foreground">
        <Calendar className="w-3 h-3" />
        <span className="pixel-text-sm text-[8px]">{article.date}</span>
      </div>
    </div>
  );
}

export function NewsModal({ isOpen, onClose, onArticlesRead }: NewsModalProps) {
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | ArticleTag>('all');

  const filteredArticles = activeTab === 'all'
    ? NEWS_ARTICLES
    : NEWS_ARTICLES.filter((a) => a.tags.includes(activeTab));

  useEffect(() => {
    if (isOpen && !selectedArticle && filteredArticles.length > 0) {
      setSelectedArticle(filteredArticles[0]);
    }
  }, [isOpen, selectedArticle, filteredArticles]);

  const handleClose = useCallback(() => {
    const allIds = NEWS_ARTICLES.map((a) => a.id);
    markArticlesAsRead(allIds);
    onArticlesRead?.();
    setSelectedArticle(null);
    onClose();
  }, [onClose, onArticlesRead]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 pixel-border border-border">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="pixel-text text-lg flex items-center gap-2">
            <Newspaper className="w-5 h-5" />
            News & Updates
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 min-h-0">
          <div className="w-72 border-r border-border flex flex-col">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as 'all' | ArticleTag)}
              className="flex flex-col h-full"
            >
              <TabsList className="flex-shrink-0 m-2 h-auto flex-wrap gap-1">
                <TabsTrigger value="all" className="pixel-text-sm text-[8px]">
                  All
                </TabsTrigger>
                <TabsTrigger value="Update" className="pixel-text-sm text-[8px]">
                  Updates
                </TabsTrigger>
                <TabsTrigger value="Fixes" className="pixel-text-sm text-[8px]">
                  Fixes
                </TabsTrigger>
                <TabsTrigger value="News" className="pixel-text-sm text-[8px]">
                  News
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 px-2 pb-2">
                <div className="space-y-2">
                  {filteredArticles.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      isSelected={selectedArticle?.id === article.id}
                      onClick={() => setSelectedArticle(article)}
                    />
                  ))}
                  {filteredArticles.length === 0 && (
                    <p className="text-center text-muted-foreground pixel-text-sm text-[10px] py-8">
                      No articles in this category
                    </p>
                  )}
                </div>
              </ScrollArea>
            </Tabs>
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            {selectedArticle ? (
              <>
                <div className="px-6 py-4 border-b border-border flex-shrink-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {selectedArticle.tags.map((tag) => {
                      const config = TAG_CONFIG[tag];
                      const Icon = config.icon;
                      return (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className={cn("pixel-text-sm text-[8px] gap-1", config.color)}
                        >
                          <Icon className="w-3 h-3" />
                          {tag}
                        </Badge>
                      );
                    })}
                    <span className="pixel-text-sm text-[9px] text-muted-foreground flex items-center gap-1 ml-auto">
                      <Calendar className="w-3 h-3" />
                      {selectedArticle.date}
                    </span>
                  </div>
                </div>
                <ScrollArea className="flex-1 px-6 py-4">
                  <article className="prose prose-sm dark:prose-invert max-w-none">
                    {renderMarkdown(selectedArticle.content)}
                  </article>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground pixel-text-sm">Select an article to read</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex justify-end">
          <Button onClick={handleClose} className="pixel-text-sm" data-testid="button-close-news">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function useNewsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    const readArticles = getReadArticles();
    const unread = getUnreadArticles(readArticles);
    setHasUnread(unread.length > 0);

    if (unread.length > 0) {
      setIsOpen(true);
    }
  }, []);

  const openNews = useCallback(() => setIsOpen(true), []);
  const closeNews = useCallback(() => setIsOpen(false), []);
  const markAllRead = useCallback(() => setHasUnread(false), []);

  return {
    isOpen,
    hasUnread,
    openNews,
    closeNews,
    markAllRead,
  };
}
