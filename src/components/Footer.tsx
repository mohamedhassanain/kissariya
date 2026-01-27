import { Link } from 'react-router-dom';
import Logo from './Logo';
import { Smartphone, MessageCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-16 px-4 relative overflow-hidden mt-20">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12 text-left">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <Logo className="h-8 w-8 rounded-lg" />
              <span className="font-display font-bold text-xl text-white">Kissariya</span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-400">
              La plateforme de référence pour les petites annonces au Maroc. 
              Simple, rapide et efficace.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">À propos</h4>
            <ul className="space-y-4 text-sm">
              <li><Link to="#" className="hover:text-primary transition-colors">Qui sommes-nous ?</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">Nous rejoindre</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">Impact écologique</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">Informations</h4>
            <ul className="space-y-4 text-sm">
              <li><Link to="#" className="hover:text-primary transition-colors">Conditions générales</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">Vie privée</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">Aide</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">Suivez-nous</h4>
            <div className="flex gap-4">
              <button 
                type="button"
                aria-label="Suivez-nous sur Smartphone"
                className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary transition-all cursor-pointer border-none"
              >
                <Smartphone className="h-5 w-5" />
              </button>
              <button 
                type="button"
                aria-label="Contactez-nous sur WhatsApp"
                className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary transition-all cursor-pointer border-none"
              >
                <MessageCircle className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8 text-center text-xs text-slate-500">
          <p>© 2026 KissariyaMaroc. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
