import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, ShieldCheck, CreditCard, Bell, Smartphone, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Features = () => {
  const features = [
    {
      icon: <MapPin size={24} />,
      title: 'Premium Hotel Selection',
      desc: 'Browse through thousands of handpicked, verified luxury and comfort hotels. We ensure top-notch quality for every stay.',
    },
    {
      icon: <Navigation size={24} />,
      title: 'Real-time Cab Tracking',
      desc: 'Book a ride and track your driver in real-time. Know exactly when your cab will arrive with our live map integration.',
    },
    {
      icon: <CreditCard size={24} />,
      title: 'Flexible Payments',
      desc: 'Choose how you want to pay. We offer secure online payments and convenient Cash on Delivery (COD) options for cab rides.',
    },
    {
      icon: <Bell size={24} />,
      title: 'Instant Notifications',
      desc: 'Get immediate updates on your booking status, driver allocation, and check-in times directly to your device.',
    },
    {
      icon: <ShieldCheck size={24} />,
      title: 'Verified Partners',
      desc: 'Every hotel owner and cab driver undergoes a strict background verification process to guarantee your safety.',
    },
    {
      icon: <Smartphone size={24} />,
      title: 'Seamless Interface',
      desc: 'Enjoy a buttery-smooth, ad-free experience designed to get you from booking to traveling in seconds.',
    },
  ];

  return (
    <div className="font-body overflow-x-hidden selection:bg-accent selection:text-white bg-[#FAF9F5] text-[#2C2C2C] min-h-screen pt-24 lg:pt-32 pb-16 lg:pb-24">
      <div className="max-w-[1400px] w-full mx-auto px-6 lg:px-12">
        
        {/* HEADER */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-24">
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-4 mb-6"
          >
            <div className="h-px w-8 bg-gray-300"></div>
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400">Capabilities</span>
            <div className="h-px w-8 bg-gray-300"></div>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-[72px] font-heading font-normal text-[#2C2C2C] leading-tight mb-4"
          >
            Uncompromising <br />
            <span className="font-script text-[#8A9A74] text-4xl md:text-6xl lg:text-[72px] capitalize">quality and comfort</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-gray-500 text-base md:text-lg font-light leading-relaxed mt-4 md:mt-6"
          >
            Everything you need for a perfect journey, elegantly packaged into one powerful platform.
          </motion.p>
        </div>

        {/* FEATURES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10 mb-20 lg:mb-32">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="bg-white rounded-[24px] lg:rounded-[30px] p-6 lg:p-10 shadow-sm border border-gray-100 flex flex-col hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group"
            >
              <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-[#F3F1EB] flex items-center justify-center text-[#8A9A74] mb-6 lg:mb-8 group-hover:bg-[#8A9A74] group-hover:text-white transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-[#2C2C2C] mb-3 lg:mb-4">{feature.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed flex-1">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* BOTTOM CTA */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="bg-[#8A9A74] rounded-[30px] lg:rounded-[40px] p-8 lg:p-20 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 md:gap-12 relative overflow-hidden"
        >
          {/* Abstract circles */}
          <div className="absolute -top-24 -right-24 w-64 h-64 border-[30px] border-white/10 rounded-full"></div>
          <div className="absolute -bottom-12 -left-12 w-40 h-40 border-[20px] border-white/10 rounded-full"></div>

          <div className="relative z-10 md:w-2/3">
            <h2 className="text-3xl md:text-5xl font-heading text-white leading-tight mb-3 lg:mb-4">
              Ready to experience <br/><span className="font-script text-white/90">the difference?</span>
            </h2>
            <p className="text-white/80 font-light text-base lg:text-lg">
              Join thousands of travelers who have already upgraded their journey.
            </p>
          </div>
          <div className="relative z-10 md:w-1/3 flex justify-start md:justify-end w-full md:w-auto mt-2 md:mt-0">
            <Link to="/hotels" className="bg-white text-[#8A9A74] hover:bg-[#F3F1EB] rounded-full px-6 lg:px-8 py-3 lg:py-4 font-bold text-sm transition-colors shadow-xl flex items-center justify-center gap-3 w-full md:w-auto">
              Book Now <ArrowRight size={16} />
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default Features;
