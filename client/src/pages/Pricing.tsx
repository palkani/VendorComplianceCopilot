import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { PLAN_LIMITS } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import type { Organization } from "@shared/schema";

export default function Pricing() {
  const { user, isAuthenticated } = useAuth();
  
  const { data: organization } = useQuery<Organization>({
    queryKey: ["/api/organization"],
    enabled: isAuthenticated && !!user,
  });

  const handleSelectPlan = async (plan: 'free' | 'pro' | 'pro_plus') => {
    if (plan === 'free') {
      // Free plan - no payment needed
      window.location.href = "/";
      return;
    }

    // Redirect to checkout for paid plans
    window.location.href = `/api/create-checkout-session?plan=${plan}`;
  };

  const currentPlan = organization?.plan || 'free';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select the perfect plan for your vendor compliance tracking needs. Upgrade or downgrade anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Plan */}
          <Card className={currentPlan === 'free' ? 'border-primary' : ''}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{PLAN_LIMITS.free.name}</CardTitle>
                  <CardDescription>Perfect for trying out the platform</CardDescription>
                </div>
                {currentPlan === 'free' && (
                  <Badge variant="default" data-testid="badge-current-plan-free">Current</Badge>
                )}
              </div>
              <div className="mt-4">
                <span className="text-4xl font-bold" data-testid="text-price-free">${PLAN_LIMITS.free.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {PLAN_LIMITS.free.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant={currentPlan === 'free' ? 'secondary' : 'outline'}
                disabled={currentPlan === 'free'}
                onClick={() => handleSelectPlan('free')}
                data-testid="button-select-plan-free"
              >
                {currentPlan === 'free' ? 'Current Plan' : 'Get Started'}
              </Button>
            </CardFooter>
          </Card>

          {/* Pro Plan */}
          <Card className={currentPlan === 'pro' ? 'border-primary' : 'border-2'}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{PLAN_LIMITS.pro.name}</CardTitle>
                  <CardDescription>For small compliance teams</CardDescription>
                </div>
                {currentPlan === 'pro' && (
                  <Badge variant="default" data-testid="badge-current-plan-pro">Current</Badge>
                )}
              </div>
              <div className="mt-4">
                <span className="text-4xl font-bold" data-testid="text-price-pro">${PLAN_LIMITS.pro.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {PLAN_LIMITS.pro.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant={currentPlan === 'pro' ? 'secondary' : 'default'}
                disabled={currentPlan === 'pro'}
                onClick={() => handleSelectPlan('pro')}
                data-testid="button-select-plan-pro"
              >
                {currentPlan === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
              </Button>
            </CardFooter>
          </Card>

          {/* Pro Plus Plan */}
          <Card className={currentPlan === 'pro_plus' ? 'border-primary' : ''}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{PLAN_LIMITS.pro_plus.name}</CardTitle>
                  <CardDescription>For growing enterprises</CardDescription>
                </div>
                {currentPlan === 'pro_plus' && (
                  <Badge variant="default" data-testid="badge-current-plan-pro-plus">Current</Badge>
                )}
              </div>
              <div className="mt-4">
                <span className="text-4xl font-bold" data-testid="text-price-pro-plus">${PLAN_LIMITS.pro_plus.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {PLAN_LIMITS.pro_plus.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant={currentPlan === 'pro_plus' ? 'secondary' : 'default'}
                disabled={currentPlan === 'pro_plus'}
                onClick={() => handleSelectPlan('pro_plus')}
                data-testid="button-select-plan-pro-plus"
              >
                {currentPlan === 'pro_plus' ? 'Current Plan' : 'Upgrade to Pro Plus'}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-16 text-center text-sm text-muted-foreground">
          <p>All plans include secure authentication, data encryption, and 24/7 platform availability.</p>
          <p className="mt-2">Need a custom enterprise plan? <a href="mailto:sales@example.com" className="text-primary hover:underline">Contact us</a></p>
        </div>
      </div>
    </div>
  );
}
