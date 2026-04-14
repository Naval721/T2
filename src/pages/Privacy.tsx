const Privacy = () => {
  return (
    <div className="min-h-screen bg-white py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-black mb-4">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-10">Last updated: April 2026</p>

        <div className="prose prose-lg space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-black mb-3">1. Information We Collect</h2>
            <p className="text-gray-700 leading-relaxed">
              We collect information you provide directly to us, such as your name and email address when you create an account. We also collect usage data including design sessions, export history, and points transactions to provide and improve our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black mb-3">2. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed">
              We use the information we collect to operate and maintain GxStudio, process your export requests, manage your points balance, send transactional communications, and improve our platform. We do not sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black mb-3">3. Data Storage</h2>
            <p className="text-gray-700 leading-relaxed">
              Your account data is stored securely using Supabase infrastructure. Jersey images you upload are processed in your browser and are not stored on our servers unless you explicitly save a project. Exported files are downloaded directly to your device.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black mb-3">4. Cookies</h2>
            <p className="text-gray-700 leading-relaxed">
              We use session cookies strictly necessary for authentication. We do not use advertising or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black mb-3">5. Your Rights</h2>
            <p className="text-gray-700 leading-relaxed">
              You may request deletion of your account and associated data at any time by contacting us at <a href="mailto:support@gxstudio.in" className="text-black underline">support@gxstudio.in</a>. We will process deletion requests within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black mb-3">6. Contact</h2>
            <p className="text-gray-700 leading-relaxed">
              For any privacy-related questions, please contact us at <a href="mailto:support@gxstudio.in" className="text-black underline">support@gxstudio.in</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Privacy
