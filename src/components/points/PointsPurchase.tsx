import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  Coins,
  Building2,
  TrendingUp,
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

const SUPPORT_EMAIL = 'support@jerseyartist.com'

export const PointsPurchase = ({ isOpen, onClose, currentPoints }: PointsPurchaseProps) => {

  const getEmailParams = (plan: typeof POINTS_PLANS[0]) => {
    const subject = `Points Purchase Request — ${plan.name}`
    const body = `Hi,\n\nI'd like to purchase the ${plan.name} (${formatCurrency(plan.price)} — ${formatPoints(calculateTotalPoints(plan))} points).\n\nPlease let me know the next steps.\n\nThank you!`
    return { subject, body }
  }

  const openGmail = (plan: typeof POINTS_PLANS[0]) => {
    const { subject, body } = getEmailParams(plan)
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${SUPPORT_EMAIL}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank')
  }

  const openOutlook = (plan: typeof POINTS_PLANS[0]) => {
    const { subject, body } = getEmailParams(plan)
    window.open(`https://outlook.live.com/mail/0/deeplink/compose?to=${SUPPORT_EMAIL}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank')
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
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold tracking-tight text-black">
            Buy Points
          </DialogTitle>
          <DialogDescription className="text-lg">
            Choose a package and we'll get you set up — points are added manually by our team.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Contact notice */}
          <Alert className="bg-amber-50 border-amber-200">
            <Mail className="h-5 w-5 text-amber-600" />
            <AlertDescription className="text-amber-800 text-sm">
              <span className="font-semibold">How it works: </span>
              Click "Request Purchase" to email our team. We'll add points manually within 24 hours of payment.
            </AlertDescription>
          </Alert>

          {/* Current Balance */}
          <Alert className="bg-gray-50 border-gray-200 flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <Coins className="h-6 w-6 text-black" />
              <div>
                <p className="font-semibold text-black text-sm">Current Balance</p>
                <p className="text-2xl font-bold text-black">{formatPoints(currentPoints)} points</p>
              </div>
            </div>
          </Alert>
        </div>

        {/* Points Packages */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
          {POINTS_PLANS.map((plan) => {
            const totalPoints = calculateTotalPoints(plan)
            const isEnterprise = plan.id === 'enterprise'

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${plan.popular ? 'border-2 border-black shadow-lg' : 'border border-gray-200'}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-black text-white px-4 py-1 rounded-bl-lg text-sm font-semibold">
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3" />
                      <span>Most Popular</span>
                    </div>
                  </div>
                )}

                <CardHeader className="text-center pb-2 pt-4">
                  <div className="mx-auto w-12 h-12 bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-center mb-2">
                    {plan.id === 'basic' && <Zap className="w-6 h-6 text-black" />}
                    {plan.id === 'professional' && <Crown className="w-6 h-6 text-black" />}
                    {plan.id === 'enterprise' && <Building2 className="w-6 h-6 text-black" />}
                  </div>
                  <CardTitle className="text-lg tracking-tight">{plan.name}</CardTitle>
                  <CardDescription className="text-xs text-gray-500">{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 pb-4">
                  {/* Price */}
                  <div className="text-center">
                    {isEnterprise ? (
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-gray-900">Custom</p>
                        <p className="text-xs text-gray-600">Contact for pricing</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-3xl font-bold text-black tracking-tight">
                          {formatCurrency(plan.price)}
                        </p>
                        {plan.bonusPoints && plan.bonusPoints > 0 && (
                          <Badge variant="outline" className="border-gray-200 bg-white text-black font-semibold text-[10px] py-0">
                            <Gift className="w-3 h-3 mr-1" />
                            +{plan.bonusPoints} bonus points
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Points */}
                  {!isEnterprise && (
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <div className="text-center">
                        <p className="text-xs font-medium text-gray-500 mb-1">You Get</p>
                        <p className="text-2xl font-bold text-black">{formatPoints(totalPoints)}</p>
                        <p className="text-[10px] text-gray-500 mt-0">points</p>
                        {plan.value && (
                          <p className="text-[10px] text-gray-500 mt-1">{plan.value}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Features */}
                  <div className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start space-x-2">
                        <span className="text-black mt-0.5 flex-shrink-0">✓</span>
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Contact Button */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        className={`w-full font-semibold ${plan.popular
                          ? 'bg-black text-white hover:bg-gray-800'
                          : 'bg-white text-black border border-gray-300 hover:bg-gray-50'
                          }`}
                        variant={plan.popular ? 'default' : 'outline'}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        {isEnterprise ? 'Contact Sales' : 'Request Purchase'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="w-[200px]">
                      <DropdownMenuItem onClick={() => openGmail(plan)} className="cursor-pointer">
                        Open in Gmail
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openOutlook(plan)} className="cursor-pointer">
                        Open in Outlook
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openDefaultMail(plan)} className="cursor-pointer">
                        Open Default Mail App
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={copyEmail} className="cursor-pointer">
                        Copy Email Address
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {/* Point Costs Info */}
          <Alert className="bg-gray-50 border-gray-200">
            <Info className="h-5 w-5 text-black" />
            <AlertDescription className="text-black">
              <p className="font-semibold mb-2">Point Costs:</p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                <div>• Front Image: 1 point</div>
                <div>• Back Image: 1 point</div>
                <div>• Sleeve: 1 point each</div>
                <div>• Collar: 1 point each</div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Example Calculations */}
          <Alert className="bg-gray-50 border border-black shadow-sm">
            <TrendingUp className="h-5 w-5 text-black" />
            <AlertDescription className="text-black">
              <p className="font-semibold mb-2">What You Can Do:</p>
              <div className="text-xs space-y-1">
                <p>With <strong>700 points</strong>: ~175 full jerseys (front + back + 2 sleeves)</p>
                <p>With <strong>2,200 points</strong>: ~550 full jerseys (front + back + 2 sleeves)</p>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  )
}
