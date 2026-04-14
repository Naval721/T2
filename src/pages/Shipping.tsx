import { Header } from "@/components/Header"

const Shipping = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-black mb-4">Shipping Policy</h1>
          <p className="text-gray-500 text-sm mb-10">Last updated: April 2026</p>

          <div className="prose prose-lg space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-black mb-3">1. Digital Delivery Only</h2>
              <p className="text-gray-700 leading-relaxed">
                GxStudio is an entirely digital platform. All products — including exported jersey design files — are delivered electronically as direct downloads to your device. There is no physical shipping involved.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-3">2. Instant Delivery</h2>
              <p className="text-gray-700 leading-relaxed">
                Upon a successful export, your design files are downloaded immediately to your browser's default download folder. Bulk exports are packaged as a ZIP archive and downloaded in the same session.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-3">3. Points Activation</h2>
              <p className="text-gray-700 leading-relaxed">
                When you purchase a points package, your credits are applied to your account instantly after payment confirmation. No waiting period applies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-3">4. Contact</h2>
              <p className="text-gray-700 leading-relaxed">
                If you experience any issues receiving your downloaded files, contact us at <a href="mailto:support@gxstudio.in" className="text-black underline">support@gxstudio.in</a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Shipping
