import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    role: 'Customer',
  });

  const { register } = useContext(AuthContext);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      await register(payload);
      if (payload.role === 'Provider') {
        navigate('/provider/onboarding/select-service');
      } else {
        navigate('/');
      }
    } catch (err) {
      // toast already handled in AuthContext
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl max-w-md w-full border border-gray-100">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link to="/">
            <img src="/inno-logo.jpeg" alt="Innovative Hotel Solution" className="h-16 object-contain mb-3" />
          </Link>
          <p className="text-xs text-accent font-semibold tracking-[0.2em] uppercase">Stay Comfortable, Stay Special</p>
        </div>

        <h2 className="text-3xl font-heading font-bold text-primary mb-6 text-center">Create an Account</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
            <input
              type="tel"
              name="mobile"
              required
              value={formData.mobile}
              onChange={handleChange}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition"
              placeholder="+91 98765 43210"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">I want to register as a:</label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center cursor-pointer flex-1 p-3 border rounded-lg hover:border-primary transition has-checked:border-primary has-checked:bg-primary/5">
                <input
                  type="radio"
                  name="role"
                  value="Customer"
                  checked={formData.role === 'Customer'}
                  onChange={(e) => setFormData({ ...formData, role: 'Customer' })}
                  className="w-4 h-4 text-primary focus:ring-primary"
                />
                <span className="ml-2 text-gray-700 font-medium text-sm">Customer</span>
              </label>
              <label className="flex items-center cursor-pointer flex-1 p-3 border rounded-lg hover:border-primary transition has-checked:border-primary has-checked:bg-primary/5">
                <input
                  type="radio"
                  name="role"
                  value="Provider"
                  checked={formData.role === 'Provider'}
                  onChange={(e) => setFormData({ ...formData, role: 'Provider' })}
                  className="w-4 h-4 text-primary focus:ring-primary"
                />
                <span className="ml-2 text-gray-700 font-medium text-sm">Service Provider</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-light transition mt-4 shadow-md"
          >
            Register
          </button>
        </form>

        <p className="text-center text-gray-500 mt-6 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
