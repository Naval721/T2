import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import {
  Star,
  Zap,
  Crown,
  Building2,
  Coins,
  Gift,
  Info,
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-y-auto p-6">
        {/* Header containing Title, Description, and Current Balance */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
          <div>
            <DialogTitle className="text-2xl font-bold tracking-tight text-black">
              Buy Points
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 mt-1">
              Choose a package to request points — added manually within 24 hours of payment.
            </DialogDescription>
          </div>
          <div className="flex items-center space-x-3 bg-gray-50 border border-gray-100 px-4 py-2 rounded-xl shrink-0">
            <Coins className="h-5 w-5 text-black" />
            <div>
              <p className="text-xs text-gray-500 font-medium">Current Balance</p>
              <p className="text-lg font-bold text-black">{formatPoints(currentPoints)} points</p>
            </div>
          </div>
        </div>

        {/* Points Packages */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4">
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
                  <div className="absolute top-0 right-0 bg-black text-white px-3 py-0.5 rounded-bl-lg text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1">
                    <Star className="w-2.5 h-2.5 fill-white" />
                    <span>Popular</span>
                  </div>
                )}

                <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Header: Icon & Name */}
                    <div className="flex items-center space-x-2.5 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                        {plan.id === 'basic' && <Zap className="w-4 h-4 text-black" />}
                        {plan.id === 'professional' && <Crown className="w-4 h-4 text-black" />}
                        {plan.id === 'enterprise' && <Building2 className="w-4 h-4 text-black" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm leading-tight">{plan.name}</h4>
                        <p className="text-[11px] text-gray-500 leading-normal">{plan.description}</p>
                      </div>
                    </div>

                    {/* Price and Points display */}
                    <div className="border-t border-b border-gray-50 py-3 my-3 space-y-1">
                      {isEnterprise ? (
                        <div>
                          <p className="text-2xl font-extrabold text-black">Custom</p>
                          <p className="text-xs text-gray-500">Contact for pricing</p>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-extrabold text-black">
                              {formatPoints(totalPoints)} <span className="text-xs font-normal text-gray-500">points</span>
                            </span>
                            <span className="text-sm font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                              {formatCurrency(plan.price)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                            <span>{plan.value}</span>
                            {plan.bonusPoints !== undefined && plan.bonusPoints > 0 && (
                              <span className="text-emerald-600 font-semibold flex items-center">
                                <Gift className="w-3 h-3 mr-0.5 shrink-0" />
                                +{plan.bonusPoints} bonus
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Features List */}
                    <ul className="space-y-1.5 text-xs text-gray-600">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start space-x-1.5">
                          <span className="text-black font-bold text-[10px] leading-tight shrink-0">✓</span>
                          <span className="leading-tight">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Mail Options Action Button */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        className={`w-full font-semibold text-xs py-2 h-9 mt-4 ${
                          plan.popular
                            ? 'bg-black text-white hover:bg-gray-800'
                            : 'bg-white text-black border border-gray-200 hover:bg-gray-50'
                        }`}
                        variant={plan.popular ? 'default' : 'outline'}
                      >
                        <Mail className="w-3.5 h-3.5 mr-1.5" />
                        {isEnterprise ? 'Contact Sales' : 'Request Purchase'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="w-[220px]">
                      <DropdownMenuItem onClick={() => openGmail(plan)} className="cursor-pointer flex items-center py-2 text-xs">
                        <Mail className="w-3.5 h-3.5 mr-2 text-red-500" />
                        <span>Open in Gmail (Web)</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openOutlook(plan)} className="cursor-pointer flex items-center py-2 text-xs">
                        <Mail className="w-3.5 h-3.5 mr-2 text-blue-500" />
                        <span>Open in Outlook (Web)</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openDefaultMail(plan)} className="cursor-pointer flex items-center py-2 text-xs">
                        <Mail className="w-3.5 h-3.5 mr-2 text-gray-600" />
                        <span>Open Default Mail App</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={copyEmail} className="cursor-pointer flex items-center py-2 text-xs">
                        <span className="w-3.5 h-3.5 mr-2 font-bold text-center text-[10px] text-gray-500 border border-gray-300 rounded leading-none flex items-center justify-center">📋</span>
                        <span>Copy Email Address</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Sleek, compact footer with info */}
        <div className="mt-4 pt-4 border-t border-gray-100 text-[11px] text-gray-500 space-y-2">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 justify-center sm:justify-start items-center">
              <span className="font-semibold text-gray-700 flex items-center">
                <Info className="w-3.5 h-3.5 mr-1 text-gray-400 shrink-0" />
                Point Costs:
              </span>
              <span>Front: 1 pt</span>
              <span>•</span>
              <span>Back: 1 pt</span>
              <span>•</span>
              <span>Sleeve: 1 pt/ea</span>
              <span>•</span>
              <span>Collar: 1 pt</span>
            </div>
            <div className="text-center sm:text-right text-gray-600">
              <span className="font-semibold text-black">700 pts</span> handles export of <span className="font-semibold text-black">~175 full jerseys</span> (front + back + 2 sleeves)
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
