import { Link } from "react-router-dom";
import { Shirt } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="border-t bg-white">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <Link to="/" className="flex items-center gap-3 group mb-4">
            <div className="w-9 h-9 bg-black flex items-center justify-center shadow-[3px_3px_0px_0px_#9ca3af]">
              <span className="text-white text-sm" style={{ fontFamily: "'Press Start 2P', monospace", paddingTop: '3px', paddingLeft: '1px' }}>GX</span>
            </div>
            <span className="text-lg text-black" style={{ fontFamily: "'Press Start 2P', monospace", paddingTop: '4px' }}>GXDRIP</span>
          </Link>
          <p className="text-slate-600 mt-2">Professional sports customization platform.</p>
        </div>
        <div>
          <div className="font-semibold mb-3">Product</div>
          <ul className="space-y-2 text-slate-600">
            <li><Link to="/pricing" className="hover:text-slate-900">Pricing</Link></li>
            <li><Link to="/contact" className="hover:text-slate-900">Contact</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-3">Legal</div>
          <ul className="space-y-2 text-slate-600">
            <li><Link to="/privacy" className="hover:text-slate-900">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-slate-900">Terms of Service</Link></li>
            <li><Link to="/refund" className="hover:text-slate-900">Refund Policy</Link></li>
            <li><Link to="/shipping" className="hover:text-slate-900">Shipping Policy</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-3">Compliance (India)</div>
          <ul className="space-y-2 text-slate-600 text-sm">
            <li>IT Rules, 2021 compliance ready</li>
            <li>Consumer Protection Act notices</li>
            <li>GST invoicing on paid plans</li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between text-sm text-slate-600">
          <div>© {currentYear} GxDrip. All rights reserved.</div>
          <div>
            Design and copyrights by <span className="font-semibold">Gx developer</span>.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;



