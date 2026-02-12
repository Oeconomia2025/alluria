import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import Lend from "@/pages/lend";
import Deposit from "@/pages/deposit";
import Repay from "@/pages/repay";
import StabilityPool from "@/pages/stability-pool";
import AlurStaking from "@/pages/alur-staking";
import Redemptions from "@/pages/redemptions";
import Positions from "@/pages/positions";
import Ecosystem from "@/pages/ecosystem";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Lend} />
      <Route path="/lend" component={Lend} />
      <Route path="/deposit" component={Deposit} />
      <Route path="/repay" component={Repay} />
      <Route path="/stability-pool" component={StabilityPool} />
      <Route path="/alur-staking" component={AlurStaking} />
      <Route path="/redemptions" component={Redemptions} />
      <Route path="/positions" component={Positions} />
      <Route path="/ecosystem/:protocol?" component={Ecosystem} />
      <Route component={NotFound} />
    </Switch>
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
