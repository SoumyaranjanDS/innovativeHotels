import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#2C2C2C] text-white pt-16 pb-8 border-t-[6px] border-[#8A9A74]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Info */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-3">
              <img src="/inno-logo.jpeg" alt="Logo" className="h-16 object-contain rounded-xl" />
              <div>
                <p className="font-heading font-bold text-xl leading-tight">Innovative</p>
                <p className="text-accent text-[10px] tracking-widest uppercase">Hotel Solution</p>
              </div>
            </Link>
            
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-accent hover:text-primary-dark transition-all text-sm font-bold">FB</a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-accent hover:text-primary-dark transition-all text-sm font-bold">TW</a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-accent hover:text-primary-dark transition-all text-sm font-bold">IG</a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-accent hover:text-primary-dark transition-all text-sm font-bold">IN</a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-6 text-white border-b border-white/20 pb-2 inline-block">Quick Links</h3>
            <ul className="space-y-3">
              <li><Link to="/features" className="text-white/70 hover:text-accent transition-colors text-sm">Our Features</Link></li>
              <li><Link to="/about" className="text-white/70 hover:text-accent transition-colors text-sm">About Us</Link></li>
              <li><Link to="/faq" className="text-white/70 hover:text-accent transition-colors text-sm">FAQs</Link></li>
            </ul>
          </div>

          {/* Partner With Us */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-6 text-white border-b border-white/20 pb-2 inline-block">Partner With Us</h3>
            <ul className="space-y-3">
              <li><Link to="/register?role=provider" className="text-white/70 hover:text-accent transition-colors text-sm">List Your Hotel</Link></li>
              <li><Link to="/register?role=provider" className="text-white/70 hover:text-accent transition-colors text-sm">Register Cab Agency</Link></li>
              <li><Link to="/earning" className="text-white/70 hover:text-accent transition-colors text-sm">Earning Potential</Link></li>
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-6 text-white border-b border-white/20 pb-2 inline-block">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-accent shrink-0 mt-0.5" />
                <span className="text-white/70 text-sm">123 Innovation Drive, Tech Park, Business City, 10001</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-accent shrink-0" />
                <span className="text-white/70 text-sm">+1 (800) 123-4567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-accent shrink-0" />
                <span className="text-white/70 text-sm">support@innovativehotel.com</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-xs text-center md:text-left">
            &copy; {new Date().getFullYear()} Innovative Hotel Solution. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-white/40">
            <a href="#" className="hover:text-accent transition">Privacy Policy</a>
            <a href="#" className="hover:text-accent transition">Terms of Service</a>
            <a href="#" className="hover:text-accent transition">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
