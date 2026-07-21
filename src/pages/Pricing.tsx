import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PointsPurchase } from "@/components/points/PointsPurchase";
import { POINTS_PLANS, calculateTotalPoints, formatPoints, formatCurrency } from "@/types/points";
import { Header } from "@/components/Header";
import { AuthModal } from "@/components/auth/AuthModal";

const Pricing = () => {
  const { user, profile } = useAuth();
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();

  const currentPoints = profile?.points_balance || 0;

  const SUPPORT_EMAIL = 'alexxzzx4839@outlook.com';
  const getEmailParams = () => {
    const subject = `Enterprise Pricing Inquiry`;
    const body = `Hi,\n\nI'd like to inquire about Enterprise pricing for GxDrip.\n\nPlease let me know the next steps.\n\nThank you!`;
    return { subject, body };
  };

  const openGmail = () => {
    const { subject, body } = getEmailParams();
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${SUPPORT_EMAIL}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  const openOutlook = () => {
    const { subject, body } = getEmailParams();
    window.open(`https://outlook.live.com/mail/0/deeplink/compose?to=${SUPPORT_EMAIL}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  const openDefaultMail = () => {
    const { subject, body } = getEmailParams();
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const copyEmail = () => {
    navigator.clipboard.writeText(SUPPORT_EMAIL);
    toast.success("Support email copied to clipboard");
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-7xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-black">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Pay once, use forever. No subscriptions. No expiry dates.
          </p>
        </div>

        {/* Current Balance */}
        {user && (
          <div className="max-w-md mx-auto mb-16">
            <Card className="border-2 border-black">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Your balance</p>
                    <p className="text-3xl font-bold text-black">{formatPoints(currentPoints)}</p>
                    <p className="text-sm text-gray-500 mt-1">points available</p>
                  </div>
                  <Button
                    onClick={() => setShowPurchaseDialog(true)}
                    className="bg-black text-white hover:bg-gray-800"
                  >
                    Add more
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {POINTS_PLANS.map((plan) => {
            const totalPoints = calculateTotalPoints(plan);
            const isEnterprise = plan.id === 'enterprise';
            const isProfessional = plan.id === 'professional';

            return (
              <Card
                key={plan.id}
                className={`relative ${isProfessional
                  ? 'border-2 border-black shadow-xl'
                  : 'border border-gray-200'
                  }`}
              >
                {isProfessional && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <Badge className="bg-black text-white px-4 py-1 text-sm">
                      Most popular
                    </Badge>
                  </div>
                )}

                <div className="p-8">
                  {/* Plan Name */}
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-black mb-2">{plan.name}</h3>
                    <p className="text-gray-600">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-8">
                    {isEnterprise ? (
                      <div>
                        <p className="text-4xl font-bold text-black">Custom</p>
                        <p className="text-sm text-gray-600 mt-2">Contact for pricing</p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline">
                          <span className="text-5xl font-bold text-black">{formatCurrency(plan.price)}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <p className="text-2xl font-semibold text-black">{formatPoints(totalPoints)}</p>
                          <p className="text-gray-600">points</p>
                        </div>
                        {plan.bonusPoints && plan.bonusPoints > 0 && (
                          <p className="text-sm text-gray-600 mt-1">
                            Includes {formatPoints(plan.bonusPoints)} bonus
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-4 mb-8">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-black shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  {isEnterprise ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          className={`w-full h-12 text-base bg-white text-black border-2 border-black hover:bg-gray-50`}
                        >
                          Contact sales
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="center" className="w-[200px]">
                        <DropdownMenuItem onClick={openGmail} className="cursor-pointer">
                          Open in Gmail
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={openOutlook} className="cursor-pointer">
                          Open in Outlook
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={openDefaultMail} className="cursor-pointer">
                          Open Default Mail App
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={copyEmail} className="cursor-pointer">
                          Copy Email Address
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button
                      onClick={() => {
                        if (user) {
                          setShowPurchaseDialog(true)
                        } else {
                          setShowAuthModal(true)
                        }
                      }}
                      className={`w-full h-12 text-base ${isProfessional
                        ? 'bg-black text-white hover:bg-gray-800'
                        : 'bg-white text-black border-2 border-black hover:bg-gray-50'
                        }`}
                    >
                      {user ? 'Get started' : 'Sign up to buy'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>

        {/* Export Costs */}
        <div className="max-w-4xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-black mb-8 text-center">Point costs</h2>
          <Card className="border border-gray-200">
            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                  <span className="text-gray-700">Front image</span>
                  <span className="font-semibold text-black">1 point</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                  <span className="text-gray-700">Back image</span>
                  <span className="font-semibold text-black">1 point</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                  <span className="text-gray-700">Sleeve (each)</span>
                  <span className="font-semibold text-black">1 point</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                  <span className="text-gray-700">Collar</span>
                  <span className="font-semibold text-black">1 point</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Full jersey</span>
                  <span className="font-semibold text-black">4 points</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Full jersey + collar</span>
                  <span className="font-semibold text-black">5 points</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-black mb-8 text-center">Frequently asked questions</h2>
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-black mb-2">Do points expire?</h3>
              <p className="text-gray-600">No. Your points never expire. Use them whenever you need.</p>
            </div>
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-black mb-2">Can I get a refund?</h3>
              <p className="text-gray-600">Yes, unused points can be refunded within 30 days of purchase.</p>
            </div>
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-black mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">We accept all major credit cards, debit cards, UPI, and net banking.</p>
            </div>
            <div className="pb-6">
              <h3 className="text-lg font-semibold text-black mb-2">Need a custom package?</h3>
              <p className="text-gray-600">Contact us for enterprise pricing with custom point packages and volume discounts.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Points Purchase Dialog */}
      {user && (
        <PointsPurchase
          isOpen={showPurchaseDialog}
          onClose={() => setShowPurchaseDialog(false)}
          currentPoints={currentPoints}
        />
      )}

      {/* Auth Modal for unauthenticated users clicking a plan CTA */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode="signup"
      />
    </div>
  );
};

export default Pricing;
