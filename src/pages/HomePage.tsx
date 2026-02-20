import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  ArrowRight,
  Upload,
  Palette,
  Download,
  Eye,
  BarChart3,
  FileImage
} from 'lucide-react'
import { GxLogo } from '@/components/ui/GxLogo'

// Styles moved to index.css
import featureDualPreview from '@/assets/images/features/dual-preview.png';
import featureLiveCount from '@/assets/images/features/live-count.png';
import featureHqOutput from '@/assets/images/features/hq-output.png';

// Gallery images
import jersey1 from '@/assets/gallery/jersey-1.png';
import jersey2 from '@/assets/gallery/jersey-2.png';
import jersey3 from '@/assets/gallery/jersey-3.png';
import jersey4 from '@/assets/gallery/jersey-4.png';
import jersey5 from '@/assets/gallery/jersey-5.png';
import jersey6 from '@/assets/gallery/jersey-6.png';

interface HomePageProps {
  onStart: () => void
}

export const HomePage = ({ onStart }: HomePageProps) => {

  const features = [
    {
      title: "Dual previewing.",
      description: "Easily view the front and back of your apparel designs. Ensure every detail is perfect before printing.",
      placeholder: "large",
      image: featureDualPreview,
      icon: Eye
    },
    {
      title: "Live design count.",
      description: "Track the number of custom designs being processed in real time as you create and refine your clothing prints.",
      placeholder: "medium",
      image: featureLiveCount,
      icon: BarChart3
    },
    {
      title: "High-quality output.",
      description: "Export print-ready images ready for manufacturing and professional garment production.",
      placeholder: "large",
      image: featureHqOutput,
      icon: FileImage
    }
  ]

  const stats = [
    { number: "2x", label: "Views per item" },
    { number: "153", label: "Designs processed" },
    { number: "300dpi", label: "Export quality" }
  ]

  const steps = [
    {
      icon: Upload,
      title: "Upload",
      description: "Add front and back images, player data, and assets."
    },
    {
      icon: Palette,
      title: "Design",
      description: "Preview both sides, refine placement, and personalize."
    },
    {
      icon: Download,
      title: "Export",
      description: "Download 300dpi, print-ready files for production."
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="w-10 h-10 bg-black flex items-center justify-center transition-transform group-hover:scale-105 border-2 border-black shadow-[2px_2px_0px_0px_rgba(100,100,100,1)]">
                <GxLogo className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black uppercase tracking-widest text-black" style={{ fontFamily: "'Inter', sans-serif" }}>GxStudio</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-black transition-colors">Home</a>
              <a href="#designs" className="text-gray-600 hover:text-black transition-colors">Gallery</a>
              <a href="#how" className="text-gray-600 hover:text-black transition-colors">Create</a>
              <a href="/pricing" className="text-gray-600 hover:text-black transition-colors">Pricing</a>
              <a href="/contact" className="text-gray-600 hover:text-black transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 border-b-4 border-black relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-block bg-black text-white px-4 py-1 font-bold text-sm tracking-widest uppercase mb-8 border-2 border-black shadow-[4px_4px_0px_0px_rgba(200,200,200,1)]">
            v2.0 Beta Live
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-black mb-4 uppercase tracking-tighter leading-none">
            START<br />DESIGNING.
          </h1>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-500 mb-16 uppercase tracking-wider">
            PRINT PERFECTION.
          </h2>

          {/* CTA Button */}
          <div className="mb-20">
            <Button
              onClick={onStart}
              size="lg"
              className="px-14 py-8 text-xl font-black tracking-widest uppercase bg-black text-white border-4 border-black hover:bg-white hover:text-black transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)]"
            >
              Get Started
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-black mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon

            return (
              <div key={index} className={`mb-32 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} flex flex-col md:flex items-center gap-12`}>
                <div className="flex-1">
                  <h3 className="text-4xl md:text-5xl font-bold text-black mb-6">
                    {feature.title}
                  </h3>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
                <div className="flex-1">
                  <div className={`rounded-2xl ${feature.placeholder === 'large' ? 'aspect-square' : 'aspect-video'} bg-gray-100 overflow-hidden shadow-2xl relative`}>
                    {/* Try to load image, fallback to icon */}
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Hide image on error, show icon instead
                        e.currentTarget.style.display = 'none';
                        const iconContainer = e.currentTarget.nextElementSibling;
                        if (iconContainer) {
                          iconContainer.classList.remove('hidden');
                        }
                      }}
                    />
                    <div className="hidden w-full h-full flex items-center justify-center absolute inset-0">
                      <Icon className="w-32 h-32 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tight text-black mb-4">How it Works</h2>
            <div className="h-1.5 w-24 bg-black mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 font-medium">Create print-ready apparel designs in three simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <Card key={index} className="border-0 shadow-none bg-white">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Icon className="w-8 h-8 text-black" />
                    </div>
                    <h3 className="text-2xl font-bold text-black mb-3">{index + 1}. {step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Designs Gallery */}
      <section id="designs" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tight text-black mb-4">Designs</h2>
            <div className="h-1.5 w-24 bg-black mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 font-medium">Front & back previews for pixel-perfect prints</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[jersey1, jersey2, jersey3, jersey4, jersey5, jersey6].map((jerseyImg, index) => (
              <div key={index + 1} className="group">
                <div className="aspect-[4/3] rounded-2xl bg-gray-100 overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 relative">
                  <img
                    src={jerseyImg}
                    alt={`Jersey Design ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-black text-white border-y-8 border-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter mb-6 relative">
            START<br /><span className="text-gray-500">DESIGNING.</span>
          </h2>
          <Button
            onClick={onStart}
            variant="outline"
            className="bg-white text-black hover:bg-gray-200 px-14 py-8 text-xl font-black uppercase tracking-widest border-4 border-white shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.3)] transition-all"
          >
            Get Started
            <ArrowRight className="w-6 h-6 ml-3" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-black mb-4">Print Design</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-600 hover:text-black transition-colors">Home</a></li>
                <li><a href="#designs" className="text-gray-600 hover:text-black transition-colors">Gallery</a></li>
                <li><a href="#how" className="text-gray-600 hover:text-black transition-colors">Create</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-black mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="/faq" className="text-gray-600 hover:text-black transition-colors">FAQ</a></li>
                <li><a href="/contact" className="text-gray-600 hover:text-black transition-colors">Contact</a></li>
                <li><a href="/help" className="text-gray-600 hover:text-black transition-colors">Help Center</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded"></div>
              </div>
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded-full"></div>
              </div>
              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-white transform rotate-45"></div>
              </div>
            </div>
            <p className="text-gray-500 text-sm">© 2025 GxStudio. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
