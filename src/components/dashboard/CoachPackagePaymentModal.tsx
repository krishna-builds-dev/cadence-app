import { useState } from 'react';

export interface CoachPackage {
  id: 'starter' | 'pro' | 'studio';
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPriceMonthly: number;
  clientLimit: string;
  features: string[];
  popular?: boolean;
}

export const COACH_PACKAGES: CoachPackage[] = [
  {
    id: 'starter',
    name: 'Starter Coach',
    tagline: 'For independent coaches organizing their 1-on-1 practice.',
    monthlyPrice: 49,
    annualPriceMonthly: 39,
    clientLimit: 'Up to 15 Clients',
    features: [
      'Up to 15 Active Clients',
      'Automated Stripe Monthly Retainers',
      'Dedicated Coach Link (cadence.app/you)',
      'Weekly Check-ins & Action Plan Log',
      'Direct Client Messaging & Files',
    ],
  },
  {
    id: 'pro',
    name: 'Pro Coach',
    tagline: 'For full-time coaches ready to scale retention and billing.',
    monthlyPrice: 99,
    annualPriceMonthly: 79,
    clientLimit: 'Up to 50 Clients',
    popular: true,
    features: [
      'Up to 50 Active Clients',
      'Anti-Churn Early Warning Radar',
      'AI 1-on-1 Action Plan Generator',
      'Built-in 1-on-1 Video Telemetry',
      'Smart Failed Payment Recovery',
      '0% Platform Fee (Keep 100%)',
    ],
  },
  {
    id: 'studio',
    name: 'Studio & Teams',
    tagline: 'For high-volume advisory practices and scaling agencies.',
    monthlyPrice: 199,
    annualPriceMonthly: 159,
    clientLimit: 'Unlimited Clients',
    features: [
      'Unlimited Active Clients',
      'Associate & Assistant Coach Accounts',
      'Custom Domain & White-label Branding',
      'White-Glove Spreadsheet Migration',
      'Dedicated Account Manager 24/7',
    ],
  },
];

export interface CoachSubscriptionPayment {
  packageId: string;
  packageName: string;
  billingCycle: 'monthly' | 'annual';
  amount: string;
  paidAt: string;
  paymentMethod: 'card' | 'apple_pay' | 'google_pay' | 'ach';
  cardLast4?: string;
  transactionId: string;
  receiptNumber: string;
  nextBillingDate: string;
}

interface CoachPackagePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPackageId?: 'starter' | 'pro' | 'studio';
  onPaymentSuccess?: (payment: CoachSubscriptionPayment) => void;
}

export default function CoachPackagePaymentModal({
  isOpen,
  onClose,
  initialPackageId = 'pro',
  onPaymentSuccess,
}: CoachPackagePaymentModalProps) {
  const [selectedPkgId, setSelectedPkgId] = useState<'starter' | 'pro' | 'studio'>(initialPackageId);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple_pay' | 'ach'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<CoachSubscriptionPayment | null>(null);

  // Card Form State
  const [cardName, setCardName] = useState('Coach Vance');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('883');
  const [postalCode, setPostalCode] = useState('94103');

  if (!isOpen) return null;

  const currentPkg = COACH_PACKAGES.find((p) => p.id === selectedPkgId) || COACH_PACKAGES[1];
  const unitPrice = billingCycle === 'annual' ? currentPkg.annualPriceMonthly : currentPkg.monthlyPrice;
  const totalBilled = billingCycle === 'annual' ? unitPrice * 12 : unitPrice;

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      const now = new Date();
      const nextMonth = new Date();
      if (billingCycle === 'annual') {
        nextMonth.setFullYear(now.getFullYear() + 1);
      } else {
        nextMonth.setMonth(now.getMonth() + 1);
      }

      const receiptId = `RCP-CAD-${Math.floor(100000 + Math.random() * 900000)}`;
      const txId = `sub_cad_live_${Math.random().toString(36).substring(2, 12)}`;

      const newPayment: CoachSubscriptionPayment = {
        packageId: currentPkg.id,
        packageName: currentPkg.name,
        billingCycle,
        amount: `$${totalBilled}.00`,
        paidAt: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        paymentMethod,
        cardLast4: paymentMethod === 'card' ? '4242' : undefined,
        transactionId: txId,
        receiptNumber: receiptId,
        nextBillingDate: nextMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      };

      // Persist to session
      try {
        sessionStorage.setItem('cadence_coach_subscription', JSON.stringify(newPayment));
      } catch {}

      setIsProcessing(false);
      setPaymentSuccess(newPayment);
      onPaymentSuccess?.(newPayment);
    }, 1300);
  };

  const handleDownloadReceipt = () => {
    if (!paymentSuccess) return;
    const content = `===================================================
CADENCE COACHING PLATFORM — SUBSCRIPTION RECEIPT
===================================================
Receipt Number:  ${paymentSuccess.receiptNumber}
Transaction ID:  ${paymentSuccess.transactionId}
Date:            ${paymentSuccess.paidAt}
Subscriber:      ${cardName} (Coach)
Plan:            ${paymentSuccess.packageName} (${paymentSuccess.billingCycle.toUpperCase()})
Amount Paid:     ${paymentSuccess.amount}
Status:          PAID & AUTHORIZED (Stripe PCI-DSS Vault)
Next Billing:    ${paymentSuccess.nextBillingDate}
Payment Method:  ${paymentSuccess.paymentMethod.toUpperCase()} ${paymentSuccess.cardLast4 ? `(•••• ${paymentSuccess.cardLast4})` : ''}
===================================================
Thank you for powering your coaching practice with Cadence.`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Cadence-Subscription-${paymentSuccess.receiptNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans animate-fadeIn">
      <div className="bg-[#141519] border border-[#292a2e] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#292a2e] flex items-center justify-between bg-[#1a1b20]/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffb4a3]/20 to-[#e85a2b]/20 border border-[#ffb4a3]/40 flex items-center justify-center text-[#ffdad2]">
              <span className="material-symbols-outlined text-[22px]">
                {paymentSuccess ? 'verified' : 'workspace_premium'}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-space font-bold text-[#e3e2e8] flex items-center gap-2">
                <span>{paymentSuccess ? 'Coach Subscription Activated' : 'Select Coach Package & Payment'}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#292a2e] text-[#4edea3] border border-[#4edea3]/30">
                  Stripe Vault
                </span>
              </h3>
              <p className="text-[11px] text-[#958ea0] font-sans">
                {paymentSuccess
                  ? 'Your coach subscription is active and confirmed in Cadence'
                  : 'Choose your practice tier and activate automated coaching features'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#0d0e12] border border-[#292a2e] text-[#958ea0] hover:text-[#e3e2e8] flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        {paymentSuccess ? (
          /* ── SUCCESS RECEIPT VIEW ── */
          <div className="p-6 space-y-5 overflow-y-auto">
            <div className="text-center space-y-2 py-2">
              <div className="w-16 h-16 rounded-full bg-[#4edea3]/15 border border-[#4edea3]/40 text-[#4edea3] flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(78,222,163,0.3)]">
                <span className="material-symbols-outlined text-3xl">verified</span>
              </div>
              <h4 className="text-base font-space font-bold text-[#e3e2e8]">
                {paymentSuccess.packageName} Activated
              </h4>
              <p className="text-xs text-[#958ea0] font-sans max-w-sm mx-auto">
                Your payment has been settled. All pro coach features, client limits, and anti-churn tools are now unlocked.
              </p>
              <div className="text-2xl font-space font-extrabold text-[#4edea3] pt-1">
                {paymentSuccess.amount}
                <span className="text-xs font-sans text-[#958ea0] font-normal"> / {paymentSuccess.billingCycle}</span>
              </div>
            </div>

            {/* Receipt Summary Card */}
            <div className="p-4 rounded-xl bg-[#0d0e12] border border-[#292a2e] space-y-2.5 font-mono text-xs">
              <div className="flex items-center justify-between text-[#958ea0]">
                <span>Coach Plan</span>
                <span className="text-[#e3e2e8] font-space font-bold">{paymentSuccess.packageName}</span>
              </div>
              <div className="flex items-center justify-between text-[#958ea0]">
                <span>Billing Cycle</span>
                <span className="text-[#e3e2e8] uppercase font-sans font-medium">{paymentSuccess.billingCycle}</span>
              </div>
              <div className="flex items-center justify-between text-[#958ea0]">
                <span>Transaction ID</span>
                <span className="text-[#ffdad2]">{paymentSuccess.transactionId}</span>
              </div>
              <div className="flex items-center justify-between text-[#958ea0]">
                <span>Receipt Number</span>
                <span className="text-[#e3e2e8]">{paymentSuccess.receiptNumber}</span>
              </div>
              <div className="flex items-center justify-between text-[#958ea0]">
                <span>Date Paid</span>
                <span className="text-[#e3e2e8]">{paymentSuccess.paidAt}</span>
              </div>
              <div className="flex items-center justify-between text-[#958ea0]">
                <span>Next Renewal</span>
                <span className="text-[#e3e2e8]">{paymentSuccess.nextBillingDate}</span>
              </div>
              <div className="flex items-center justify-between text-[#958ea0] pt-2 border-t border-[#292a2e]/60">
                <span>Stripe Status</span>
                <span className="text-[#4edea3] font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">check_circle</span>
                  ACTIVE (256-Bit Encrypted)
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownloadReceipt}
                className="px-4 py-2 rounded-xl border border-[#292a2e] bg-[#1a1b20] text-xs font-space font-semibold text-[#e3e2e8] hover:bg-[#25262c] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[15px]">download</span>
                <span>Download Receipt</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-[#ffb4a3] text-[#3a0900] hover:bg-[#ffdad2] text-xs font-space font-bold transition-all cursor-pointer shadow-md"
              >
                Continue to Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* ── CHECKOUT FORM VIEW ── */
          <form onSubmit={handleProcessPayment} className="p-5 sm:p-6 space-y-5 overflow-y-auto">
            {/* Package Selector Cards */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-space font-bold uppercase tracking-wider text-[#958ea0]">
                  1. Select Your Coaching Tier
                </span>
                {/* Billing Cycle Toggle */}
                <div className="flex items-center bg-[#0d0e12] p-0.5 rounded-lg border border-[#292a2e] text-[11px] font-space font-semibold">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      billingCycle === 'monthly' ? 'bg-[#ffb4a3] text-[#3a0900]' : 'text-[#958ea0] hover:text-[#e3e2e8]'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('annual')}
                    className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                      billingCycle === 'annual' ? 'bg-[#ffb4a3] text-[#3a0900]' : 'text-[#958ea0] hover:text-[#e3e2e8]'
                    }`}
                  >
                    <span>Annual</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-[#003824] text-[#4edea3]">Save 20%</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {COACH_PACKAGES.map((pkg) => {
                  const isSelected = selectedPkgId === pkg.id;
                  const price = billingCycle === 'annual' ? pkg.annualPriceMonthly : pkg.monthlyPrice;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPkgId(pkg.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#ffb4a3] bg-[#ffb4a3]/10 shadow-[0_0_16px_rgba(255,180,163,0.18)]'
                          : 'border-[#292a2e] bg-[#0d0e12] hover:border-[#4a4855]'
                      }`}
                    >
                      {pkg.popular && (
                        <span className="absolute -top-2 right-3 text-[9px] font-space font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#ffb4a3] text-[#3a0900]">
                          Popular
                        </span>
                      )}

                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-space font-bold text-xs text-[#e3e2e8]">{pkg.name}</span>
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-[#ffb4a3] bg-[#ffb4a3]' : 'border-[#4a4855]'
                          }`}>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#3a0900]" />}
                          </div>
                        </div>

                        <div className="mt-2 flex items-baseline gap-1">
                          <span className="font-space text-xl font-bold text-[#e3e2e8]">${price}</span>
                          <span className="text-[10px] text-[#958ea0] font-sans">/mo</span>
                        </div>

                        <div className="text-[10px] text-[#4edea3] font-mono mt-0.5">{pkg.clientLimit}</div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-[#292a2e]/60 space-y-1">
                        {pkg.features.slice(0, 3).map((f, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[10px] text-[#cbc3d7]">
                            <span className="material-symbols-outlined text-[13px] text-[#4edea3]">check</span>
                            <span className="truncate">{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <span className="text-xs font-space font-bold uppercase tracking-wider text-[#958ea0] block mb-2.5">
                2. Payment Method (Encrypted Stripe Vault)
              </span>

              <div className="grid grid-cols-3 gap-2 text-xs font-space font-semibold">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'border-[#ffb4a3] bg-[#ffb4a3]/10 text-[#ffdad2]'
                      : 'border-[#292a2e] bg-[#0d0e12] text-[#958ea0] hover:text-[#e3e2e8]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[17px]">credit_card</span>
                  <span>Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('apple_pay')}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === 'apple_pay'
                      ? 'border-[#ffb4a3] bg-[#ffb4a3]/10 text-[#ffdad2]'
                      : 'border-[#292a2e] bg-[#0d0e12] text-[#958ea0] hover:text-[#e3e2e8]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[17px]">phone_iphone</span>
                  <span>Apple / GPay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('ach')}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === 'ach'
                      ? 'border-[#ffb4a3] bg-[#ffb4a3]/10 text-[#ffdad2]'
                      : 'border-[#292a2e] bg-[#0d0e12] text-[#958ea0] hover:text-[#e3e2e8]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[17px]">account_balance</span>
                  <span>ACH Direct</span>
                </button>
              </div>
            </div>

            {/* Payment Fields */}
            {paymentMethod === 'card' && (
              <div className="space-y-3 p-4 rounded-xl bg-[#0d0e12] border border-[#292a2e]">
                <div>
                  <label className="block text-[11px] font-space text-[#958ea0] uppercase font-semibold mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full bg-[#141519] border border-[#292a2e] rounded-lg px-3 py-2 text-xs text-[#e3e2e8] focus:outline-none focus:border-[#ffdad2]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-space text-[#958ea0] uppercase font-semibold mb-1">
                    Card Number
                  </label>
                  <div className="flex items-center bg-[#141519] border border-[#292a2e] rounded-lg px-3 py-2 focus-within:border-[#ffdad2]">
                    <span className="material-symbols-outlined text-[16px] text-[#958ea0] mr-2">credit_card</span>
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="flex-1 bg-transparent text-xs text-[#e3e2e8] font-mono focus:outline-none"
                    />
                    <span className="text-[10px] font-mono font-bold text-[#4edea3]">TEST VISA</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-space text-[#958ea0] uppercase font-semibold mb-1">
                      Expires
                    </label>
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full bg-[#141519] border border-[#292a2e] rounded-lg px-3 py-2 text-xs text-[#e3e2e8] font-mono focus:outline-none focus:border-[#ffdad2]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-space text-[#958ea0] uppercase font-semibold mb-1">
                      CVC / CVV
                    </label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="w-full bg-[#141519] border border-[#292a2e] rounded-lg px-3 py-2 text-xs text-[#e3e2e8] font-mono focus:outline-none focus:border-[#ffdad2]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-space text-[#958ea0] uppercase font-semibold mb-1">
                      Zip / Postal
                    </label>
                    <input
                      type="text"
                      required
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full bg-[#141519] border border-[#292a2e] rounded-lg px-3 py-2 text-xs text-[#e3e2e8] font-mono focus:outline-none focus:border-[#ffdad2]"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'apple_pay' && (
              <div className="p-6 rounded-xl bg-[#0d0e12] border border-[#292a2e] text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#1a1b20] border border-[#292a2e] flex items-center justify-center mx-auto text-[#ffdad2]">
                  <span className="material-symbols-outlined text-2xl">fingerprint</span>
                </div>
                <div className="font-space font-bold text-xs text-[#e3e2e8]">
                  Apple Pay &amp; Google Pay Ready
                </div>
                <p className="text-[11px] text-[#958ea0] font-sans max-w-sm mx-auto">
                  Clicking the button below will trigger your device biometric authentication (FaceID, TouchID, or Passkey).
                </p>
              </div>
            )}

            {paymentMethod === 'ach' && (
              <div className="p-4 rounded-xl bg-[#0d0e12] border border-[#292a2e] space-y-3">
                <div className="text-[11px] text-[#cbc3d7]">
                  Connect your business bank account via Plaid / Stripe Financial Connections for 0.8% ACH direct debit.
                </div>
                <div className="p-2.5 rounded-lg bg-[#141519] border border-[#292a2e] flex items-center justify-between text-xs font-mono">
                  <span className="text-[#958ea0]">Chase Checking •••• 8821</span>
                  <span className="text-[#4edea3]">Verified</span>
                </div>
              </div>
            )}

            {/* Total Due & Submit Button */}
            <div className="pt-2 border-t border-[#292a2e]/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-space text-[#958ea0] uppercase tracking-wider block">
                  Total Due Today
                </span>
                <span className="text-xl font-space font-bold text-[#ffdad2]">
                  ${totalBilled}.00
                </span>
                <span className="text-[10px] text-[#958ea0] block">
                  {billingCycle === 'annual' ? 'Billed annually (Save 20%)' : 'Billed monthly · Cancel anytime'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-[#292a2e] bg-[#1a1b20] text-xs font-space font-semibold text-[#cbc3d7] hover:bg-[#25262c] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-6 py-2.5 rounded-xl bg-[#ffb4a3] text-[#3a0900] hover:bg-[#ffdad2] text-xs font-space font-bold transition-all cursor-pointer shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <span className="w-4 h-4 border-2 border-[#3a0900] border-t-transparent rounded-full animate-spin" />
                      <span>Processing Stripe Vault…</span>
                    </>
                  ) : (
                    <>
                      <span>Pay ${totalBilled}.00 &amp; Activate</span>
                      <span className="material-symbols-outlined text-[16px]">lock</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
