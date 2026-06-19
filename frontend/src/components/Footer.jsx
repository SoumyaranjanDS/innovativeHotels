import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#2C2C2C] text-white pt-16 pb-8 border-t-[6px] border-accent">
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
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-accent hover:text-primary-dark transition-all">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-accent hover:text-primary-dark transition-all">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-accent hover:text-primary-dark transition-all">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-accent hover:text-primary-dark transition-all">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
              </a>
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
