import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Star,
  Zap,
  Crown,
  Building2,
  Coins,
  Gift,
  Mail
} from 'lucide-react'
import { POINTS_PLANS, calculateTotalPoints, formatPoints, formatCurrency } from '@/types/points'

interface PointsPurchaseProps {
  isOpen: boolean
  onClose: () => void
  currentPoints: number
}

const SUPPORT_EMAIL = 'alexxzzx4839@outlook.com'

export const PointsPurchase = ({ isOpen, onClose, currentPoints }: PointsPurchaseProps) => {
  const [selectedPlanForMail, setSelectedPlanForMail] = useState<typeof POINTS_PLANS[0] | null>(null)

  const getEmailParams = (plan: typeof POINTS_PLANS[0]) => {
    const subject = `Points Purchase Request — ${plan.name}`
    const body = `Hi,\n\nI'd like to purchase the ${plan.name} (${formatCurrency(plan.price)} — ${formatPoints(calculateTotalPoints(plan))} points).\n\nPlease let me know the next steps.\n\nThank you!`
    return { subject, body }
  }

  const openGmail = (plan: typeof POINTS_PLANS[0]) => {
    const { subject, body } = getEmailParams(plan)
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&to=${SUPPORT_EMAIL}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
      '_blank'
    )
  }

  const openOutlook = (plan: typeof POINTS_PLANS[0]) => {
    const { subject, body } = getEmailParams(plan)
    window.open(
      `https://outlook.live.com/mail/0/deeplink/compose?to=${SUPPORT_EMAIL}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
      '_blank'
    )
  }

  const openDefaultMail = (plan: typeof POINTS_PLANS[0]) => {
    const { subject, body } = getEmailParams(plan)
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const copyEmail = () => {
    navigator.clipboard.writeText(SUPPORT_EMAIL)
    toast.success("Support email copied to clipboard")
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl p-5 overflow-hidden">
          {/* Header containing Title, Description, and Current Balance */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-3">
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-black">
                Buy Points
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-0.5">
                Choose a package to request points — added manually within 24 hours of payment.
              </DialogDescription>
            </div>
            <div className="flex items-center space-x-2 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg shrink-0 text-xs">
              <Coins className="h-4 w-4 text-black animate-pulse" />
              <div>
                <p className="text-[10px] text-gray-400 font-medium leading-none">Current Balance</p>
                <p className="font-bold text-black leading-tight mt-0.5">{formatPoints(currentPoints)} points</p>
              </div>
            </div>
          </div>

          {/* Points Packages */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
            {POINTS_PLANS.map((plan) => {
              const totalPoints = calculateTotalPoints(plan)
              const isEnterprise = plan.id === 'enterprise'

              return (
                <Card
                  key={plan.id}
                  className={`relative overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-lg ${
                    plan.popular ? 'border-2 border-black shadow-sm' : 'border border-gray-100'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-black text-white px-2 py-0.5 rounded-bl-lg text-[9px] font-bold uppercase tracking-wider flex items-center space-x-0.5">
                      <Star className="w-2.5 h-2.5 fill-white" />
                      <span>Popular</span>
                    </div>
                  )}

                  <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      {/* Header: Icon & Name */}
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                          {plan.id === 'basic' && <Zap className="w-3.5 h-3.5 text-black" />}
                          {plan.id === 'professional' && <Crown className="w-3.5 h-3.5 text-black" />}
                          {plan.id === 'enterprise' && <Building2 className="w-3.5 h-3.5 text-black" />}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-xs leading-tight">{plan.name}</h4>
                          <p className="text-[10px] text-gray-400 leading-none mt-0.5">{plan.description}</p>
                        </div>
                      </div>

                      {/* Price and Points display */}
                      <div className="border-t border-b border-gray-50 py-2 my-2">
                        {isEnterprise ? (
                          <div>
                            <p className="text-xl font-extrabold text-black">Custom</p>
                            <p className="text-[10px] text-gray-500">Contact for pricing</p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-baseline justify-between">
                              <span className="text-xl font-extrabold text-black">
                                {formatPoints(totalPoints)} <span className="text-[10px] font-normal text-gray-400">pts</span>
                              </span>
                              <span className="text-xs font-semibold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded">
                                {formatCurrency(plan.price)}
                              </span>
                            </div>
                            {plan.bonusPoints !== undefined && plan.bonusPoints > 0 && (
                              <p className="text-[10px] text-emerald-600 font-semibold flex items-center leading-none">
                                <Gift className="w-2.5 h-2.5 mr-0.5 shrink-0" />
                                +{plan.bonusPoints} bonus included
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Compact feature highlights */}
                      <div className="text-[10px] text-gray-500 leading-normal min-h-[30px] flex items-center">
                        {plan.id === 'basic' && "Standard fonts, 450 DPI exports, and support."}
                        {plan.id === 'professional' && "Access to premium templates, prior support, and extended fonts."}
                        {plan.id === 'enterprise' && "Dedicated support, custom templates, and volume discounts."}
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button
                      onClick={() => setSelectedPlanForMail(plan)}
                      className={`w-full font-semibold text-xs py-1.5 h-8 mt-2 ${
                        plan.popular
                          ? 'bg-black text-white hover:bg-gray-800'
                          : 'bg-white text-black border border-gray-200 hover:bg-gray-50'
                      }`}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      <Mail className="w-3.5 h-3.5 mr-1.5" />
                      {isEnterprise ? 'Contact Sales' : 'Request Purchase'}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Sleek, single-line footer with info */}
          <div className="mt-3 pt-3 border-t border-gray-100 text-[10px] text-gray-400 flex flex-col sm:flex-row sm:justify-between items-center gap-1.5">
            <div>
              <span className="font-semibold text-gray-500">Point Costs:</span> Front/Back/Sleeve/Collar: 1 pt each.
            </div>
            <div>
              700 pts handles export of <span className="font-semibold text-gray-600">~175 full jerseys</span> (front + back + 2 sleeves)
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Choice Modal for Email Services */}
      <Dialog open={!!selectedPlanForMail} onOpenChange={() => setSelectedPlanForMail(null)}>
        <DialogContent className="sm:max-w-md p-5 overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-black flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Choose Email Client
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Select how you would like to compose the request email for the <span className="font-semibold text-black">{selectedPlanForMail?.name}</span> package.
            </DialogDescription>
          </DialogHeader>

          {selectedPlanForMail && (
            <div className="grid grid-cols-1 gap-2.5 mt-3">
              <Button
                onClick={() => {
                  openGmail(selectedPlanForMail)
                  setSelectedPlanForMail(null)
                }}
                className="w-full justify-start text-left bg-white text-black border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all py-5 h-auto"
              >
                <span className="text-base mr-2.5">🔴</span>
                <div>
                  <p className="font-bold text-xs">Gmail</p>
                  <p className="text-[10px] text-gray-400 font-normal mt-0.5">Compose in Gmail web app</p>
                </div>
              </Button>

              <Button
                onClick={() => {
                  openOutlook(selectedPlanForMail)
                  setSelectedPlanForMail(null)
                }}
                className="w-full justify-start text-left bg-white text-black border border-gray-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all py-5 h-auto"
              >
                <span className="text-base mr-2.5">🔵</span>
                <div>
                  <p className="font-bold text-xs">Outlook</p>
                  <p className="text-[10px] text-gray-400 font-normal mt-0.5">Compose in Outlook web app</p>
                </div>
              </Button>

              <Button
                onClick={() => {
                  openDefaultMail(selectedPlanForMail)
                  setSelectedPlanForMail(null)
                }}
                className="w-full justify-start text-left bg-white text-black border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all py-5 h-auto"
              >
                <span className="text-base mr-2.5">✉️</span>
                <div>
                  <p className="font-bold text-xs">Default Mail Client</p>
                  <p className="text-[10px] text-gray-400 font-normal mt-0.5">Open Mail, Outlook, or Thunderbird</p>
                </div>
              </Button>

              <div className="relative my-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-white px-2 text-gray-400">Or Copy Details</span>
                </div>
              </div>

              <Button
                onClick={() => {
                  copyEmail()
                  setSelectedPlanForMail(null)
                }}
                variant="outline"
                className="w-full justify-start text-left bg-white text-black border border-gray-200 hover:bg-gray-50 transition-all py-5 h-auto"
              >
                <span className="text-base mr-2.5">📋</span>
                <div>
                  <p className="font-bold text-xs">Copy Support Email</p>
                  <p className="text-[10px] text-gray-400 font-normal mt-0.5">{SUPPORT_EMAIL}</p>
                </div>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
