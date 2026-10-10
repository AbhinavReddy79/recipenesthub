import type { Metadata } from "next";
import Link from "next/link";
import { ReceiptIndianRupee } from "lucide-react";
import { LegalPage } from "@/components/shared/legal-page";
import { formatRupees, FREE_RECIPES_PER_MONTH, PREMIUM_PRICES } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description: "How RecipeNest Premium billing, cancellations and refunds work.",
  alternates: { canonical: "/refund-policy" },
};

const monthly = formatRupees(PREMIUM_PRICES.monthly.amount);
const yearly = formatRupees(PREMIUM_PRICES.yearly.amount);

export default function RefundPolicyPage() {
  return (
    <LegalPage
      icon={<ReceiptIndianRupee />}
      eyebrow="Legal"
      title="Refund & Cancellation Policy"
      description="Plain answers about paying for Premium, cancelling and getting your money back."
      updated="October 10, 2026"
      keyPoints={[
        "Cancel auto-renew anytime: you keep Premium until the end of the period you paid for.",
        "Charged twice, charged after cancelling, or couldn't use Premium because of a fault on our side? Tell us within 7 days for a full refund.",
        "Approved refunds go back to your original payment method within 5–7 working days.",
      ]}
      sections={[
        {
          title: "Our plans",
          body: (
            <>
              <p>RecipeNest has two plans:</p>
              <ul>
                <li>
                  <strong>Free</strong>: costs nothing and includes publishing up to {FREE_RECIPES_PER_MONTH} recipes a month.
                </li>
                <li>
                  <strong>Premium</strong>: {monthly} a month or {yearly} a year. It adds unlimited recipe publishing and entry to
                  the weekly cooking contest.
                </li>
              </ul>
              <p>
                Premium is a digital subscription that renews automatically at the end of each period until you cancel.
                Payments are processed securely by Razorpay; RecipeNest never sees or stores your card or UPI details. Prices
                are in Indian rupees and are shown on the <Link href="/pricing">Pricing</Link> page before you pay.
              </p>
            </>
          ),
        },
        {
          title: "Cancelling",
          body: (
            <>
              <p>
                You can turn off auto-renew at any time from the <Link href="/pricing">Pricing</Link> page (“Turn off
                auto-renew”), or by <Link href="/contact?topic=billing">contacting us</Link>. After cancelling:
              </p>
              <ul>
                <li>You won&apos;t be charged again.</li>
                <li>Premium stays active until the end of the period you&apos;ve already paid for, then your account moves to Free.</li>
                <li>Your recipes, collections and data are kept. Recipes you published stay published.</li>
              </ul>
            </>
          ),
        },
        {
          title: "Refunds",
          body: (
            <>
              <p>
                Because Premium starts working the moment you pay, we don&apos;t refund the unused part of a month or year
                after you cancel. We <strong>will</strong> give a full refund if, within 7 days of the payment:
              </p>
              <ul>
                <li>you were charged more than once for the same period;</li>
                <li>you were charged after you had cancelled auto-renew; or</li>
                <li>a fault on our side meant you couldn&apos;t use Premium, and we couldn&apos;t fix it.</li>
              </ul>
              <p>
                To request a refund, <Link href="/contact?topic=refund">contact us</Link> with the email on your account, the
                payment date and the amount. We reply within 2 working days. Approved refunds are sent back to the original
                payment method through Razorpay and usually reach you within 5–7 working days, depending on your bank.
              </p>
            </>
          ),
        },
        {
          title: "Failed or pending payments",
          body: (
            <p>
              If money left your account but Premium didn&apos;t switch on, the payment usually completes or is reversed
              automatically by your bank within 5–7 working days. If Premium still isn&apos;t active after 24 hours,{" "}
              <Link href="/contact?topic=billing">contact us</Link> and we&apos;ll activate it or refund you.
            </p>
          ),
        },
        {
          title: "Price changes",
          body: (
            <p>
              If we change Premium prices, the new price applies only from your next renewal, and we&apos;ll tell you before
              it does so you can cancel if you prefer.
            </p>
          ),
        },
        {
          title: "Weekly contest prizes",
          body: (
            <>
              <p>
                The weekly contest is a benefit of Premium; there is no separate entry fee. Winners are chosen by member votes
                as described on the <Link href="/contests">contest page</Link>.
              </p>
              <ul>
                <li>Cash prizes are paid by RecipeNest to the winner&apos;s bank account or UPI within 15 days of the result, after we confirm their details.</li>
                <li>The free month of Premium is added to the winner&apos;s account automatically. It has no cash value and can&apos;t be transferred.</li>
                <li>Prizes may be subject to tax under Indian law, which may be deducted before payment where required.</li>
              </ul>
            </>
          ),
        },
        {
          title: "Contact",
          body: (
            <p>
              Questions about a payment or refund? <Link href="/contact?topic=billing">Send us a message</Link>. We reply
              within 2 working days.
            </p>
          ),
        },
      ]}
    />
  );
}
