const Refund = () => {
  return (
    <div className="min-h-screen bg-white py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-black mb-4">Refund Policy</h1>
        <p className="text-gray-500 text-sm mb-10">Last updated: April 2026</p>

        <div className="prose prose-lg space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-black mb-3">1. Points Purchases</h2>
            <p className="text-gray-700 leading-relaxed">
              All points purchases are final and non-refundable once you have used any of the purchased points. If you have not used any points from a purchase and believe you were charged in error, please contact us within 7 days of purchase.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black mb-3">2. Unused Points</h2>
            <p className="text-gray-700 leading-relaxed">
              Refunds for completely unused point packages may be considered on a case-by-case basis within 7 days of purchase. To request a refund, email <a href="mailto:support@gxstudio.in" className="text-black underline">support@gxstudio.in</a> with your account email and order details.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black mb-3">3. Technical Issues</h2>
            <p className="text-gray-700 leading-relaxed">
              If a technical error on our platform caused points to be deducted without a successful export, please contact us and we will restore the deducted points to your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black mb-3">4. Contact</h2>
            <p className="text-gray-700 leading-relaxed">
              For refund requests, contact us at <a href="mailto:support@gxstudio.in" className="text-black underline">support@gxstudio.in</a> with the subject line "Refund Request".
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Refund
