import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    role: 'Customer',
  });
  const [showPassword, setShowPassword] = useState(false);

  const { register } = useContext(AuthContext);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      await register(payload);
      const searchParams = new URLSearchParams(window.location.search);
      const redirect = searchParams.get('redirect');

      if (payload.role === 'Provider') {
        navigate('/provider/onboarding/select-service');
      } else {
        navigate(redirect || '/');
      }
    } catch (err) {
      // toast already handled in AuthContext
    }
  };

  return (
    <div className="min-h-screen bg-[#24352B] flex overflow-hidden font-body selection:bg-[#70A99A] selection:text-white relative">
      
      {/* Decorative Background Bubbles */}
      <div className="absolute top-10 right-20 w-64 h-64 bg-[#70A99A]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 w-48 h-48 bg-[#70A99A]/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Left Side: Image with elliptical mask */}
      <div className="hidden lg:block lg:w-1/2 relative h-screen z-10">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/hero1.png')",
            clipPath: "ellipse(110% 100% at 0% 50%)"
          }}
        />
        <div className="absolute inset-0 bg-[#24352B]/40" style={{ clipPath: "ellipse(110% 100% at 0% 50%)" }} />
      </div>

      {/* Right Side: Form */}
      <div className="w-full lg:w-1/2 h-screen overflow-y-auto custom-scrollbar flex flex-col items-center justify-start p-6 sm:p-12 relative z-20">
        <div className="w-full max-w-md my-auto py-8">
          
          <div className="flex flex-col mb-10">
            <Link to="/">
              <img src="/inno-logo.jpeg" alt="Innovative Hotel Solution" className="h-16 object-contain mb-4 rounded-xl" />
            </Link>
            <p className="text-xs text-[#70A99A] font-semibold tracking-[0.2em] uppercase">
              Stay Comfortable, Stay Special
            </p>
          </div>

          <h2 className="text-4xl font-semibold text-white mb-10">
            Create an Account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-white/90 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-6 py-4 bg-[#304739] rounded-full text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-[#70A99A]/50 transition-all border-none"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm text-white/90 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-6 py-4 bg-[#304739] rounded-full text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-[#70A99A]/50 transition-all border-none"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-sm text-white/90 mb-2">
                Mobile Number
              </label>
              <input
                type="tel"
                name="mobile"
                required
                value={formData.mobile}
                onChange={handleChange}
                className="w-full px-6 py-4 bg-[#304739] rounded-full text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-[#70A99A]/50 transition-all border-none"
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <label className="block text-sm text-white/90 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-6 pr-14 py-4 bg-[#304739] rounded-full text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-[#70A99A]/50 transition-all border-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/90 mb-3">
                I want to register as a:
              </label>
              <div className="flex gap-4">
                <label className={`flex items-center justify-center cursor-pointer flex-1 py-4 border-2 rounded-full transition-all ${formData.role === 'Customer' ? 'border-[#70A99A] bg-[#70A99A]/10' : 'border-[#304739] hover:border-[#70A99A]/50'}`}>
                  <input
                    type="radio"
                    name="role"
                    value="Customer"
                    checked={formData.role === 'Customer'}
                    onChange={(e) => setFormData({ ...formData, role: 'Customer' })}
                    className="hidden"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${formData.role === 'Customer' ? 'border-[#70A99A]' : 'border-white/30'}`}>
                    {formData.role === 'Customer' && <div className="w-2 h-2 rounded-full bg-[#70A99A]" />}
                  </div>
                  <span className={`font-semibold text-sm ${formData.role === 'Customer' ? 'text-white' : 'text-white/60'}`}>Customer</span>
                </label>
                
                <label className={`flex items-center justify-center cursor-pointer flex-1 py-4 border-2 rounded-full transition-all ${formData.role === 'Provider' ? 'border-[#70A99A] bg-[#70A99A]/10' : 'border-[#304739] hover:border-[#70A99A]/50'}`}>
                  <input
                    type="radio"
                    name="role"
                    value="Provider"
                    checked={formData.role === 'Provider'}
                    onChange={(e) => setFormData({ ...formData, role: 'Provider' })}
                    className="hidden"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${formData.role === 'Provider' ? 'border-[#70A99A]' : 'border-white/30'}`}>
                    {formData.role === 'Provider' && <div className="w-2 h-2 rounded-full bg-[#70A99A]" />}
                  </div>
                  <span className={`font-semibold text-sm ${formData.role === 'Provider' ? 'text-white' : 'text-white/60'}`}>Provider</span>
                </label>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-[#70A99A] text-white py-4 rounded-full font-semibold hover:bg-[#5E9485] transition-all shadow-lg active:scale-[0.98]"
              >
                Register Account
              </button>
            </div>
          </form>

          <div className="mt-8 text-sm text-white/70">
            Already have an account?{' '}
            <Link to="/login" className="text-[#70A99A] font-medium hover:text-white transition-colors underline decoration-[#70A99A]">
              Log in here
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Register;
