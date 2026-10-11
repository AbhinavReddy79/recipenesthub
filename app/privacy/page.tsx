import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { LegalPage } from "@/components/shared/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How RecipeNest collects, uses, stores and protects your information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      icon={<ShieldCheck />}
      eyebrow="Legal"
      title="Privacy Policy"
      description="This Privacy Policy explains how RecipeNest collects, uses, stores and protects information when you use our website and services."
      updated="October 11, 2026"
      keyPoints={[
        "Your account and personal content are stored securely with our database provider, Supabase, so they sync across your devices.",
        "Passwords are handled by Supabase Authentication, stored only as salted hashes, and never visible to RecipeNest.",
        "We do not use advertising, analytics or tracking technologies, and we do not sell or share your personal information.",
        "You can permanently delete your account and everything in it at any time from Settings.",
      ]}
      sections={[
        {
          title: "Introduction",
          body: (
            <>
              <p>
                RecipeNest (&ldquo;RecipeNest&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo; or &ldquo;our&rdquo;) is
                committed to protecting your privacy. This Privacy Policy describes the information we handle when you
                visit or use the RecipeNest website (the &ldquo;Service&rdquo;), how that information is used, and the
                choices available to you.
              </p>
              <p>
                By using the Service, you acknowledge that you have read and understood this Privacy Policy. If you do
                not agree with it, please do not use the Service.
              </p>
            </>
          ),
        },
        {
          title: "Information we collect",
          body: (
            <>
              <h3>Information you provide</h3>
              <p>When you create a profile or use personalised features, you may provide:</p>
              <ul>
                <li>Account details: name, username, email address and password.</li>
                <li>Optional profile details: profile photo, short biography and location.</li>
                <li>
                  Content and preferences: saved recipes, collections, meal plans, shopping lists, reviews, recipes you
                  create, dietary preferences, region and display settings.
                </li>
                <li>
                  Launch notifications: if you leave your email in the &ldquo;Notify me&rdquo; box before launch, we keep only that
                  address and when you signed up, use it only to tell you RecipeNest has opened, and remove it on request through our
                  Contact page.
                </li>
              </ul>
              <h3>Information collected automatically</h3>
              <p>
                Our hosting provider automatically processes standard technical information needed to deliver the
                Service, such as IP address, browser type, device type, referring page, and the date and time of each
                request. RecipeNest does not use this information to identify or profile individual users.
              </p>
            </>
          ),
        },
        {
          title: "How we use your information",
          body: (
            <>
              <p>Information is used solely to provide and improve the Service, including to:</p>
              <ul>
                <li>Create and maintain your account, confirm your email address and let you sign in on any device.</li>
                <li>Save your recipes, collections, meal plans and shopping lists.</li>
                <li>Personalise recommendations based on your dietary and cuisine preferences.</li>
                <li>Display prices and pack sizes appropriate to your region.</li>
                <li>Maintain the security, availability and performance of the Service.</li>
              </ul>
              <p>We do not use your information for advertising, and we do not make automated decisions that affect you.</p>
            </>
          ),
        },
        {
          title: "Where your information is stored",
          body: (
            <>
              <p>
                Your account and personal content are stored in a database and file storage operated for RecipeNest by
                Supabase, Inc. This lets you sign in and see the same saved recipes, collections, meal plans and
                shopping lists on any device.
              </p>
              <ul>
                <li>
                  <strong>Private by default.</strong> Saved recipes, collections, meal plans, shopping lists, cooking
                  history and settings are visible only to you. Database access rules ensure that no other user can
                  read or change them.
                </li>
                <li>
                  <strong>Public when you choose.</strong> Your name, username, photo, bio and location appear on your
                  public profile, and recipes you publish and reviews you write are visible to everyone. Drafts stay
                  private.
                </li>
                <li>
                  <strong>On your device.</strong> A few preferences (colour theme, pricing region and unsaved recipe
                  drafts) are kept in your browser&apos;s local storage and never leave your device.
                </li>
              </ul>
            </>
          ),
        },
        {
          title: "Sharing and disclosure",
          body: (
            <>
              <p>
                We do not sell, rent or trade your personal information. We share it only with the service providers
                that run RecipeNest on our behalf (see section 7), and only as needed to provide the Service.
              </p>
              <p>
                Technical request information is processed by our service providers only as necessary to operate the
                Service (see section 7), and may be disclosed where required by applicable law.
              </p>
            </>
          ),
        },
        {
          title: "Cookies and similar technologies",
          body: (
            <p>
              RecipeNest does not use advertising, analytics or third-party tracking cookies. We use strictly necessary
              cookies to keep you signed in securely, and your browser&apos;s local storage to remember preferences such
              as your colour theme and region. Disabling cookies or browser storage will prevent sign-in and these
              features from working.
            </p>
          ),
        },
        {
          title: "Third-party services",
          body: (
            <>
              <p>The Service relies on the following third parties:</p>
              <ul>
                <li>
                  <strong>Supabase, Inc.</strong> provides authentication, the database and file storage for accounts,
                  personal content and uploaded photos, and sends account emails such as address confirmation and
                  password resets. See the{" "}
                  <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">
                    Supabase Privacy Policy
                  </a>
                  .
                </li>
                <li>
                  <strong>Vercel Inc.</strong> hosts the website and processes technical request data to deliver it.
                  See the{" "}
                  <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
                    Vercel Privacy Policy
                  </a>
                  .
                </li>
                <li>
                  <strong>Image providers</strong>: Unsplash, Wikimedia Commons and TheMealDB supply recipe and product
                  photographs, which are delivered to you through our hosting provider.
                </li>
                <li>
                  <strong>Retailer websites</strong>: shopping buttons open a retailer&apos;s own search page in a new
                  tab. RecipeNest is not affiliated with these retailers, and their own privacy policies apply once you
                  visit their sites.
                </li>
              </ul>
            </>
          ),
        },
        {
          title: "Data security",
          body: (
            <p>
              We take reasonable measures to protect your information. The Service is delivered exclusively over
              encrypted HTTPS connections with standard security headers. Passwords are stored only as salted hashes by
              Supabase Authentication, and row-level security rules in our database limit every account to its own
              personal data. However, no method of electronic storage or transmission is completely secure. Please
              choose a strong, unique password and keep it private.
            </p>
          ),
        },
        {
          title: "Data retention and deletion",
          body: (
            <>
              <p>We keep your account information for as long as your account exists. You can remove it at any time:</p>
              <ul>
                <li>
                  <strong>Delete my account</strong> in <Link href="/settings#account">Settings → Account</Link>{" "}
                  permanently deletes your account, sign-in, uploaded photos and all associated content.
                </li>
                <li>
                  <strong>Reset this device</strong> clears the preferences and drafts kept in your browser.
                </li>
              </ul>
              <p>Technical request logs are retained by our hosting provider in line with its own retention policies.</p>
            </>
          ),
        },
        {
          title: "Your rights and choices",
          body: (
            <p>
              Depending on where you live, you may have rights to access, correct, delete or restrict the use of your
              personal information. You can exercise most of these rights directly: view and edit your details in{" "}
              <Link href="/settings">Settings</Link>, and delete your account as described in section 9. For any other
              request, please contact us using the details below.
            </p>
          ),
        },
        {
          title: "Children's privacy",
          body: (
            <p>
              The Service is not directed to children under the age of 13, and we do not knowingly collect personal
              information from them. If you believe a child has provided personal information through the Service,
              please contact us and we will take appropriate steps.
            </p>
          ),
        },
        {
          title: "Changes to this policy",
          body: (
            <p>
              We may update this Privacy Policy from time to time to reflect changes to the Service or applicable law.
              When we do, we will revise the &ldquo;Last updated&rdquo; date at the top of this page. Material changes will
              be communicated on the website before they take effect.
            </p>
          ),
        },
        {
          title: "Contact us",
          body: (
            <p>
              If you have any questions or concerns about this Privacy Policy or how your information is handled,
              please contact the RecipeNest team. You may also review our{" "}
              <Link href="/terms">Terms of Use</Link>.
            </p>
          ),
        },
      ]}
    />
  );
}
