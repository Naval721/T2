import { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/ErrorBoundary";
import Footer from "@/components/Footer";
import { Loader2 } from "lucide-react";
import "@/utils/debug"; // Check environment variables
import { lazyWithRetry } from "@/lib/lazy";

// Lazy load pages for better performance
const OnboardingPage = lazyWithRetry(() => import("./pages/OnboardingPage").then(m => ({ default: m.OnboardingPage })));
const Index = lazyWithRetry(() => import("./pages/Index"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const Pricing = lazyWithRetry(() => import("./pages/Pricing"));
const Contact = lazyWithRetry(() => import("./pages/Contact"));
const Privacy = lazyWithRetry(() => import("./pages/Privacy"));
const Terms = lazyWithRetry(() => import("./pages/Terms"));
const Refund = lazyWithRetry(() => import("./pages/Refund"));
const Shipping = lazyWithRetry(() => import("./pages/Shipping"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Loading component — black/white to match app theme
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="text-center">
      <Loader2 className="w-12 h-12 animate-spin text-black mx-auto mb-4" />
      <p className="font-mono text-sm uppercase tracking-widest text-gray-500">Loading...</p>
    </div>
  </div>
);

// Inner layout that can access useLocation
const AppRoutes = () => {
  const location = useLocation();
  // Hide global footer on design page (it handles its own step-based footer display)
  const hideFooter = location.pathname === "/design";

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<OnboardingPage />} />
        <Route path="/design" element={<Index />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/refund" element={<Refund />} />
        <Route path="/shipping" element={<Shipping />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!hideFooter && <Footer />}
    </Suspense>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
