import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/10 bg-black relative z-10 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-1 bg-gradient-to-r from-transparent via-accent-green/30 to-transparent"></div>
      <div className="container mx-auto px-6 py-12 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-3 group inline-flex mb-6">
              <img 
                src="https://i.ibb.co/Y7MMQR76/f06abe35-17e0-4185-96aa-eae12841c0f5-removalai-preview.png" 
                alt="Logo" 
                className="h-12 sm:h-14 w-auto object-contain transition-transform duration-500 group-hover:scale-105" 
                referrerPolicy="no-referrer"
              />
            </Link>
            <p className="text-gray-400 font-light max-w-sm mb-6">
              AI-gedreven autotaxaties en risico-analyses. Wij beschermen kopers tegen miskopen en verborgen gebreken met data.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-6">Product</h4>
            <ul className="space-y-4">
              <li><Link to="/hoe-het-werkt" className="text-gray-400 hover:text-accent-green transition-colors text-sm">Hoe het werkt</Link></li>
              <li><Link to="/prijzen" className="text-gray-400 hover:text-accent-green transition-colors text-sm">Prijzen</Link></li>
              <li><Link to="/blog" className="text-gray-400 hover:text-accent-green transition-colors text-sm">Blog</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Bedrijf & Juridisch</h4>
            <ul className="space-y-4">
              <li><Link to="/over-ons" className="text-gray-400 hover:text-white transition-colors text-sm">Over Ons</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors text-sm">Contact</Link></li>
              <li><Link to="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">Privacybeleid</Link></li>
              <li><Link to="/voorwaarden" className="text-gray-400 hover:text-white transition-colors text-sm">Algemene Voorwaarden</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">© {new Date().getFullYear()} OccasionScan. Alle rechten voorbehouden.</p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            KVK: 12345678
          </div>
        </div>
      </div>
    </footer>
  );
};
