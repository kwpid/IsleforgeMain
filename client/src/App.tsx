import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GameNotifications } from "@/components/GameNotifications";
import { ItemAcquisitionPopup } from "@/components/ItemAcquisitionPopup";
import NotFound from "@/pages/not-found";
import Game from "@/pages/Game";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Game} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={0} skipDelayDuration={0}>
        <Toaster />
        <GameNotifications />
        <ItemAcquisitionPopup />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
