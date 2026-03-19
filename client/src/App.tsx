import { Switch, Route } from "wouter";
import { Suspense, lazy } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";

const Lend = lazy(() => import("@/pages/lend"));
const Deposit = lazy(() => import("@/pages/deposit"));
const Repay = lazy(() => import("@/pages/repay"));
const StabilityPool = lazy(() => import("@/pages/stability-pool"));
const AlurStaking = lazy(() => import("@/pages/alur-staking"));
const Redemptions = lazy(() => import("@/pages/redemptions"));
const Positions = lazy(() => import("@/pages/positions"));
const NotFound = lazy(() => import("@/pages/not-found"));

function Router() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
    <Switch>
      <Route path="/" component={Lend} />
      <Route path="/lend" component={Lend} />
      <Route path="/deposit" component={Deposit} />
      <Route path="/repay" component={Repay} />
      <Route path="/stability-pool" component={StabilityPool} />
      <Route path="/alur-staking" component={AlurStaking} />
      <Route path="/redemptions" component={Redemptions} />
      <Route path="/positions" component={Positions} />
      <Route component={NotFound} />
    </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
