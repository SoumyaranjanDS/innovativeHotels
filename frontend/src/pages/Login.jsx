import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useContext(AuthContext);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(formData.email, formData.password);
      if (user.role === 'Admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'Provider') {
        if (user.providerType === 'Driver') {
          navigate('/provider/driver-dashboard');
        } else {
          navigate('/provider/dashboard');
        }
      } else {
        navigate('/');
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
            Login
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-white/90 mb-2">
                Username or Email
              </label>
              <input
                type="text"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-6 py-4 bg-[#304739] rounded-full text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-[#70A99A]/50 transition-all border-none"
                placeholder="Enter your username"
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
                  placeholder="Enter your password"
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

            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-[#70A99A] text-white py-4 rounded-full font-semibold hover:bg-[#5E9485] transition-all shadow-lg active:scale-[0.98]"
              >
                Login to Account
              </button>
            </div>
          </form>

          <div className="mt-8 text-sm text-white/70">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#70A99A] font-medium hover:text-white transition-colors underline decoration-[#70A99A]">
              Register Now
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
