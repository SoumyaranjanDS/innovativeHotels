import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, ShieldCheck, CreditCard, Bell, Smartphone } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: <MapPin size={32} />,
      title: 'Premium Hotel Selection',
      desc: 'Browse through thousands of handpicked, verified luxury and comfort hotels. We ensure top-notch quality for every stay.',
    },
    {
      icon: <Navigation size={32} />,
      title: 'Real-time Cab Tracking',
      desc: 'Book a ride and track your driver in real-time. Know exactly when your cab will arrive with our live map integration.',
    },
    {
      icon: <CreditCard size={32} />,
      title: 'Flexible Payments',
      desc: 'Choose how you want to pay. We offer secure online payments and convenient Cash on Delivery (COD) options for cab rides.',
    },
    {
      icon: <Bell size={32} />,
      title: 'Instant Notifications',
      desc: 'Get immediate updates on your booking status, driver allocation, and check-in times directly to your device.',
    },
    {
      icon: <ShieldCheck size={32} />,
      title: 'Verified Partners',
      desc: 'Every hotel owner and cab driver undergoes a strict background verification process to guarantee your safety.',
    },
    {
      icon: <Smartphone size={32} />,
      title: 'Seamless Interface',
      desc: 'Enjoy a buttery-smooth, ad-free experience designed to get you from booking to traveling in seconds.',
    },
  ];

  return (
    <div className="pt-32 pb-24 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-24">
          <motion.p 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="text-accent font-bold tracking-widest uppercase text-xs mb-4"
          >
            Capabilities
          </motion.p>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-heading font-bold text-gray-900 mb-6 leading-tight"
          >
            Powerful Features for Modern Travelers
          </motion.h2>
        </div>

        <div className="space-y-24">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="flex flex-col md:flex-row gap-8 items-start md:items-center"
            >
              <div className="w-16 h-16 shrink-0 rounded-full flex items-center justify-center text-accent">
                {feature.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-3xl font-heading font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-xl text-gray-500 leading-relaxed font-light max-w-3xl">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Features;
