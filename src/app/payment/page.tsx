'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import { Check, CreditCard, Zap, Shield, Star, Building, ChevronRight, Lock, AlertCircle, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 29,
    annualPrice: 24,
    color: 'brand',
    icon: Zap,
    features: ['2,500 contacts', '5,000 emails/month', 'Basic scheduling', 'Email composer', 'Delivery logs'],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 79,
    annualPrice: 66,
    color: 'purple',
    icon: Star,
    popular: true,
    features: ['10,000 contacts', '25,000 emails/month', 'Advanced batch scheduling', 'Day/hour subject control', 'Priority support', 'API access'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 199,
    annualPrice: 166,
    color: 'orange',
    icon: Building,
    features: ['Unlimited contacts', 'Unlimited emails', 'Custom scheduling rules', 'Dedicated support', 'SLA guarantee', 'Custom integrations'],
  },
];

type CheckoutStep = 'plans' | 'checkout' | 'processing' | 'success' | 'failed';

function PlanCard({ plan, current, billingCycle, onSelect }: any) {
  const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
  const isCurrentPlan = current === plan.id;
  const Icon = plan.icon;

  return (
    <div className={`card p-6 flex flex-col relative transition-all hover:border-brand-600/50 ${plan.popular ? 'border-brand-600/50 bg-brand-950/20' : ''}`}>
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 bg-brand-600 text-white text-xs font-semibold rounded-full shadow-lg">Most Popular</span>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-brand-600/20`}>
          <Icon className="w-4 h-4 text-brand-400" />
        </div>
        <div>
          <div className="font-bold text-white">{plan.name}</div>
          {isCurrentPlan && <div className="text-xs text-green-400">Current plan</div>}
        </div>
      </div>

      <div className="mb-5">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-white">${price}</span>
          <span className="text-[#5a5a72] text-sm">/mo</span>
        </div>
        {billingCycle === 'annual' && (
          <div className="text-xs text-green-400 mt-0.5">Save ${(plan.monthlyPrice - plan.annualPrice) * 12}/year</div>
        )}
      </div>

      <ul className="space-y-2 mb-6 flex-1">
        {plan.features.map((f: string) => (
          <li key={f} className="flex items-center gap-2 text-sm text-[#c8c8e0]">
            <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSelect(plan)}
        disabled={isCurrentPlan}
        className={`w-full justify-center ${isCurrentPlan ? 'btn-secondary opacity-50 cursor-default' : 'btn-primary'}`}
      >
        {isCurrentPlan ? 'Current Plan' : `Get ${plan.name}`}
        {!isCurrentPlan && <ChevronRight className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

function CheckoutForm({ plan, billingCycle, onBack, onSuccess, onFail }: any) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [useFailScenario, setUseFailScenario] = useState(false);

  const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const txRes: any = await paymentApi.checkout({ planId: plan.id, billingCycle });
      const txId = txRes.data.transactionId;
      const processRes: any = await paymentApi.process(txId, {
        cardNumber: useFailScenario ? '4000 0000 0000 0000' : cardNumber,
        expiry,
        cvv,
        cardholderName,
        scenario: useFailScenario ? 'failure' : 'success',
      });
      return processRes.data;
    },
    onSuccess: (data) => {
      if (data.status === 'success') onSuccess(data);
      else onFail(data);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const formatCard = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  };

  return (
    <div className="max-w-md mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-[#8b8baa] hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to plans
      </button>

      <div className="card p-6 mb-5">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold">{plan.name} Plan</span>
          <span className="font-bold text-xl">${price}<span className="text-sm text-[#5a5a72]">/mo</span></span>
        </div>
        <div className="text-xs text-[#5a5a72] capitalize">{billingCycle} billing</div>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <CreditCard className="w-4 h-4 text-brand-400" />
          <span className="font-semibold">Payment Details</span>
          <span className="ml-auto flex items-center gap-1 text-xs text-[#5a5a72]">
            <Lock className="w-3 h-3" /> Demo Mode
          </span>
        </div>

        {/* Demo notice */}
        <div className="p-3 mb-5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
          <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
          This is a <strong>demo payment interface</strong>. No real charges are made.
          Use any card number. Use <code className="bg-amber-900/40 px-1 rounded">4000 0000 0000 0000</code> to simulate failure.
        </div>

        <div className="space-y-4">
          <div>
            <label className="input-label">Cardholder Name</label>
            <input
              className="input"
              placeholder="John Smith"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
            />
          </div>
          <div>
            <label className="input-label">Card Number</label>
            <input
              className="input font-mono"
              placeholder="4242 4242 4242 4242"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCard(e.target.value))}
              maxLength={19}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Expiry</label>
              <input
                className="input font-mono"
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                maxLength={5}
              />
            </div>
            <div>
              <label className="input-label">CVV</label>
              <input
                className="input font-mono"
                placeholder="123"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
              />
            </div>
          </div>

          {/* Failure scenario toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useFailScenario}
              onChange={(e) => setUseFailScenario(e.target.checked)}
              className="rounded accent-red-500"
            />
            <span className="text-xs text-[#8b8baa]">Simulate payment failure (demo)</span>
          </label>
        </div>

        <button
          onClick={() => checkoutMutation.mutate()}
          disabled={checkoutMutation.isPending || !cardholderName || !cardNumber}
          className="btn-primary w-full justify-center mt-5"
        >
          {checkoutMutation.isPending ? (
            <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
          ) : (
            <><Lock className="w-4 h-4" /> Pay ${price}/month</>
          )}
        </button>

        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-[#5a5a72]">
          <Shield className="w-3.5 h-3.5" /> SSL Secured
        </div>
      </div>
    </div>
  );
}

function ResultScreen({ success, data, onReset }: any) {
  const Icon = success ? CheckCircle : XCircle;
  return (
    <div className="max-w-md mx-auto text-center">
      <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${success ? 'bg-green-500/10 border-2 border-green-500/30' : 'bg-red-500/10 border-2 border-red-500/30'}`}>
        <Icon className={`w-10 h-10 ${success ? 'text-green-400' : 'text-red-400'}`} />
      </div>
      <h2 className="text-2xl font-bold mb-2">{success ? 'Payment Successful!' : 'Payment Failed'}</h2>
      <p className="text-[#8b8baa] mb-8">
        {success
          ? `You've been upgraded to the ${data.planName} plan. All features are now unlocked.`
          : data.message || 'Your card was declined. Please check your details and try again.'}
      </p>
      {success && (
        <div className="card p-4 mb-6 text-left">
          <div className="text-xs text-[#5a5a72] uppercase tracking-wide mb-2">Access Granted</div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>{data.planName} Plan — all features active</span>
          </div>
        </div>
      )}
      <button onClick={onReset} className={success ? 'btn-primary' : 'btn-secondary'}>
        {success ? 'Go to Dashboard' : 'Try Again'}
      </button>
    </div>
  );
}

export default function PaymentPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [step, setStep] = useState<CheckoutStep>('plans');
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [resultData, setResultData] = useState<any>(null);

  const { data: historyData } = useQuery({
    queryKey: ['payment-history'],
    queryFn: () => paymentApi.history(),
  });

  const history = (historyData as any)?.data?.transactions || [];

  const handleSelectPlan = (plan: any) => {
    setSelectedPlan(plan);
    setStep('checkout');
  };

  const handleSuccess = (data: any) => {
    setResultData(data);
    setStep('success');
    qc.invalidateQueries({ queryKey: ['auth'] });
  };

  const handleFail = (data: any) => {
    setResultData(data);
    setStep('failed');
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Billing & Plans</h1>
        <p className="text-[#8b8baa] text-sm mt-1">
          Current plan: <span className="text-brand-400 font-semibold capitalize">{user?.subscriptionTier || 'Free'}</span>
        </p>
      </div>

      {step === 'plans' && (
        <>
          {/* Billing cycle toggle */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <span className={`text-sm ${billingCycle === 'monthly' ? 'text-white' : 'text-[#5a5a72]'}`}>Monthly</span>
            <button
              onClick={() => setBillingCycle(s => s === 'monthly' ? 'annual' : 'monthly')}
              className={`relative w-11 h-6 rounded-full transition-colors ${billingCycle === 'annual' ? 'bg-brand-600' : 'bg-[#252535]'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${billingCycle === 'annual' ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
            </button>
            <span className={`text-sm ${billingCycle === 'annual' ? 'text-white' : 'text-[#5a5a72]'}`}>
              Annual <span className="text-green-400 text-xs ml-1">Save 20%</span>
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {PLANS.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                current={user?.subscriptionTier}
                billingCycle={billingCycle}
                onSelect={handleSelectPlan}
              />
            ))}
          </div>

          {/* Transaction history */}
          {history.length > 0 && (
            <div className="card">
              <div className="px-5 py-4 border-b border-[#252535]">
                <h2 className="font-semibold">Transaction History</h2>
              </div>
              <div className="divide-y divide-[#1e1e2a]">
                {history.map((tx: any) => (
                  <div key={tx.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className={`w-2 h-2 rounded-full ${tx.status === 'success' ? 'bg-green-400' : 'bg-red-400'}`} />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{tx.plan_name} Plan</div>
                      <div className="text-xs text-[#5a5a72] capitalize">{tx.billing_cycle} · {tx.status}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">${(tx.amount_cents / 100).toFixed(2)}</div>
                      {tx.card_last_four && (
                        <div className="text-xs text-[#5a5a72]">•••• {tx.card_last_four}</div>
                      )}
                    </div>
                    <div className="text-xs text-[#5a5a72]">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {step === 'checkout' && selectedPlan && (
        <CheckoutForm
          plan={selectedPlan}
          billingCycle={billingCycle}
          onBack={() => setStep('plans')}
          onSuccess={handleSuccess}
          onFail={handleFail}
        />
      )}

      {(step === 'success' || step === 'failed') && (
        <ResultScreen
          success={step === 'success'}
          data={resultData}
          onReset={() => setStep('plans')}
        />
      )}
    </div>
  );
}
