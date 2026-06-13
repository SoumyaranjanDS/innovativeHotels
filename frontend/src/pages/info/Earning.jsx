import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Earning = () => {
  return (
    <div className="pt-32 pb-24 bg-primary text-white min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-24">
          <motion.p 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="text-accent font-bold tracking-widest uppercase text-xs mb-4"
          >
            Partner With Us
          </motion.p>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-heading font-bold mb-8 leading-tight"
          >
            Maximize Your Earning Potential
          </motion.h2>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <Link to="/register?role=provider" className="inline-block px-10 py-5 bg-accent text-primary-dark font-bold hover:bg-white transition text-lg">
              Start Earning Today
            </Link>
          </motion.div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-32 border-t border-white/20 pt-16">
          <div>
            <h3 className="text-6xl md:text-8xl font-heading font-bold text-accent mb-4">0%</h3>
            <p className="text-xl font-light text-white/80">Onboarding Fee</p>
          </div>
          <div>
            <h3 className="text-6xl md:text-8xl font-heading font-bold text-accent mb-4">24h</h3>
            <p className="text-xl font-light text-white/80">Payout Processing</p>
          </div>
          <div>
            <h3 className="text-6xl md:text-8xl font-heading font-bold text-accent mb-4">50k</h3>
            <p className="text-xl font-light text-white/80">Monthly Active Users</p>
          </div>
        </div>

        {/* Roles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          >
            <h2 className="text-4xl font-heading font-bold mb-8">For Hotel Owners</h2>
            <ul className="space-y-6 text-xl font-light text-white/80">
              <li className="border-b border-white/10 pb-6">Fill empty rooms fast with our large user base.</li>
              <li className="border-b border-white/10 pb-6">Transparent 10% platform fee on successful bookings.</li>
              <li className="border-b border-white/10 pb-6">Complete control over pricing and availability.</li>
            </ul>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
          >
            <h2 className="text-4xl font-heading font-bold mb-8">For Cab Drivers</h2>
            <ul className="space-y-6 text-xl font-light text-white/80">
              <li className="border-b border-white/10 pb-6">Consistent ride requests from luxury hotel guests.</li>
              <li className="border-b border-white/10 pb-6">Accept Cash on Delivery (COD) directly from passengers.</li>
              <li className="border-b border-white/10 pb-6">Flexible working hours. Be your own boss.</li>
            </ul>
          </motion.div>
        </div>

      </div>
    </div>
  );
};

export default Earning;
