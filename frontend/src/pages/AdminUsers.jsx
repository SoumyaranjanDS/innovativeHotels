import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { Users, Mail, Phone, Building2, UserCircle } from 'lucide-react';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.data);
    } catch (err) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  const providers = users.filter(u => u.role === 'Provider');
  const customers = users.filter(u => u.role === 'Customer');

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Users & Providers</h2>
          <p className="text-gray-500">Manage all registered accounts on the platform</p>
        </div>
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
          <Users size={18} />
          Total Active: {providers.length + customers.length}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Providers Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 border-b pb-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Building2 size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Providers</h3>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{providers.length} Registered</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-blue-50/50 text-gray-600 font-medium border-b border-gray-100">
                <tr>
                  <th className="py-3 px-5">Provider Details</th>
                  <th className="py-3 px-5 text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {providers.map(user => (
                  <tr key={user._id} className="hover:bg-blue-50/30 transition">
                    <td className="py-4 px-5">
                      <div className="font-bold text-gray-900 text-base">{user.name}</div>
                      <div className="text-xs text-gray-500 mt-1.5 flex flex-col gap-1">
                        <span className="flex items-center gap-1.5"><Mail size={12} /> {user.email}</span>
                        <span className="flex items-center gap-1.5"><Phone size={12} /> {user.mobile || 'No Mobile'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-xs text-gray-400 font-medium text-right align-top">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {providers.length === 0 && (
                  <tr>
                    <td colSpan="2" className="py-8 text-center text-gray-500">No providers found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customers Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 border-b pb-3">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <UserCircle size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Customers</h3>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{customers.length} Registered</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-emerald-50/50 text-gray-600 font-medium border-b border-gray-100">
                <tr>
                  <th className="py-3 px-5">Customer Details</th>
                  <th className="py-3 px-5 text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map(user => (
                  <tr key={user._id} className="hover:bg-emerald-50/30 transition">
                    <td className="py-4 px-5">
                      <div className="font-bold text-gray-900 text-base">{user.name}</div>
                      <div className="text-xs text-gray-500 mt-1.5 flex flex-col gap-1">
                        <span className="flex items-center gap-1.5"><Mail size={12} /> {user.email}</span>
                        <span className="flex items-center gap-1.5"><Phone size={12} /> {user.mobile || 'No Mobile'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-xs text-gray-400 font-medium text-right align-top">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan="2" className="py-8 text-center text-gray-500">No customers found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
