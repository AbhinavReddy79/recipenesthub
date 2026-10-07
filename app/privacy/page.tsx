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
      updated="October 7, 2026"
      keyPoints={[
        "Your profile and personal content are stored locally in your browser on your own device. We do not operate a database of user accounts.",
        "Passwords are salted and hashed on your device and are never stored in plain text or transmitted to us.",
        "We do not use advertising, analytics or tracking technologies, and we do not sell or share your personal information.",
        "You can delete your information at any time from Settings or by clearing your browser data.",
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
                <li>Create and maintain your profile and allow you to sign in on your device.</li>
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
                RecipeNest currently stores profile and personal content exclusively in your web browser&apos;s local
                storage on the device you use. This information is not transmitted to, or stored on, RecipeNest
                servers.
              </p>
              <p>As a result:</p>
              <ul>
                <li>Your information is available only on the browser and device where it was created.</li>
                <li>Other users, and RecipeNest, cannot access the information stored on your device.</li>
                <li>
                  Information is not synchronised between devices, and clearing your browser data permanently removes
                  it.
                </li>
              </ul>
              <p>
                If we introduce online accounts in the future, we will update this Privacy Policy before any
                information is stored on our servers.
              </p>
            </>
          ),
        },
        {
          title: "Sharing and disclosure",
          body: (
            <>
              <p>
                We do not sell, rent or trade your personal information. Because profile data remains on your device,
                RecipeNest does not hold it and therefore does not disclose it to third parties.
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
              RecipeNest does not use advertising, analytics or third-party tracking cookies. We use your browser&apos;s
              local storage only for essential functionality, such as keeping you signed in, saving your content and
              remembering preferences like your colour theme and region. Disabling browser storage will prevent these
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
              encrypted HTTPS connections with standard security headers, and passwords are salted and hashed before
              being stored on your device. However, no method of electronic storage or transmission is completely
              secure. You are responsible for keeping your device secure and for choosing a strong, unique password.
            </p>
          ),
        },
        {
          title: "Data retention and deletion",
          body: (
            <>
              <p>
                Information stored in your browser remains there until you delete it. You can remove it at any time:
              </p>
              <ul>
                <li>
                  <strong>Delete my profile</strong> in <Link href="/settings#account">Settings → Account</Link>{" "}
                  removes your profile and all associated content.
                </li>
                <li>
                  <strong>Clear all data in this browser</strong> removes every RecipeNest profile stored on the device.
                </li>
                <li>Clearing your browser&apos;s site data for RecipeNest has the same effect.</li>
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
              personal information. Because your profile data is stored on your own device, you can exercise these
              rights directly: view and edit your details in <Link href="/settings">Settings</Link>, and delete them
              as described in section 9. For requests relating to technical information processed by our hosting
              provider, please contact us using the details below.
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
              When we do, we will revise the &ldquo;Last updated&rdquo; date at the top of this page. Material changes,
              including the introduction of online accounts, will be communicated on the website before they take
              effect.
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
