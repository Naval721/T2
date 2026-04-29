import { Header } from "@/components/Header"

const Terms = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-black mb-4">Terms of Service</h1>
          <p className="text-gray-500 text-sm mb-10">Last updated: April 2026</p>

          <div className="prose prose-lg space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-black mb-3">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By creating an account or using GxDrip, you agree to these Terms of Service. If you do not agree, please do not use our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-3">2. Service Description</h2>
              <p className="text-gray-700 leading-relaxed">
                GxDrip is a web-based jersey design and customization tool. You can upload jersey images, import player data, add customizations, and export high-resolution production-ready files. Export functionality requires a points balance; new accounts receive 5 free export credits.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-3">3. Points System</h2>
              <p className="text-gray-700 leading-relaxed">
                Points are the currency used to unlock export features. Points are non-transferable. Purchased points do not expire. Points are deducted at the time of each export operation. We reserve the right to adjust point costs with advance notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-3">4. Intellectual Property</h2>
              <p className="text-gray-700 leading-relaxed">
                You retain full ownership of the images and designs you upload. By using GxDrip, you grant us a limited license to process your uploaded images solely for the purpose of providing the service. You are responsible for ensuring you have the rights to any images or logos you upload.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-3">5. Prohibited Use</h2>
              <p className="text-gray-700 leading-relaxed">
                You may not use GxDrip to create designs that infringe third-party intellectual property, violate applicable laws, or circumvent our points system. We reserve the right to suspend accounts that violate these terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-3">6. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                GxDrip is provided "as is" without warranties of any kind. To the maximum extent permitted by law, we are not liable for any indirect, incidental, or consequential damages arising from your use of the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-3">7. Contact</h2>
              <p className="text-gray-700 leading-relaxed">
                For questions about these terms, contact us at <a href="mailto:support@gxdrip.in" className="text-black underline">support@gxdrip.in</a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Terms
