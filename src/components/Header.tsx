import { useState } from "react";
import { User, LogOut, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/auth/AuthModal";
import { UserDashboard } from "@/components/auth/UserDashboard";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { GxLogo } from "@/components/ui/GxLogo";

export const Header = () => {
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserDashboard, setShowUserDashboard] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setShowUserDashboard(false);
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-black flex items-center justify-center transition-transform group-hover:scale-105 border-2 border-black shadow-[2px_2px_0px_0px_rgba(100,100,100,1)]">
              <GxLogo className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-black tracking-tight">GxDrip</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/design" className="text-gray-600 hover:text-black transition">
              Designer
            </Link>
            <Link to="/pricing" className="text-gray-600 hover:text-black transition">
              Pricing
            </Link>
          </nav>

          {/* Auth Section */}
          <div className="flex items-center gap-3">
            {authLoading ? (
              <Button disabled variant="ghost" className="text-gray-400">
                <div className="w-4 h-4 mr-2 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                Loading...
              </Button>
            ) : user ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => setShowUserDashboard(true)}
                  className="text-gray-700 hover:text-black hover:bg-gray-50"
                >
                  <User className="w-4 h-4 mr-2" />
                  {profile?.full_name || 'Account'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-gray-600 hover:text-black hover:bg-gray-50 mb-[2px]"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setShowAuthModal(true)}
                className="bg-black text-white hover:bg-gray-800"
              >
                Sign in
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* User Dashboard */}
      {user && (
        <Dialog open={showUserDashboard} onOpenChange={setShowUserDashboard}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <UserDashboard onClose={() => setShowUserDashboard(false)} />
          </DialogContent>
        </Dialog>
      )}
    </header>
  );
};