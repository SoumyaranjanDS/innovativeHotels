import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { Car, Briefcase, Trash2 } from 'lucide-react';

const AdminExternalCabsView = () => {
  const [groupedCabs, setGroupedCabs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCabs();
  }, []);

  const fetchCabs = async () => {
    try {
      const res = await api.get('/admin/cabs/grouped');
      setGroupedCabs(res.data.data.externalCabs);
    } catch (err) {
      toast.error('Failed to fetch external cabs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (vehicleId) => {
    if (!window.confirm('Are you sure you want to completely remove this vehicle? This action cannot be undone.')) return;
    try {
      await api.delete(`/admin/cabs/${vehicleId}`);
      toast.success('Vehicle removed successfully');
      fetchCabs();
    } catch (err) {
      toast.error('Failed to remove vehicle');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">External Cabs & Agencies</h2>
        <p className="text-gray-500">View and manage all active independent cabs and fleet agencies on the platform.</p>
      </div>

      {groupedCabs.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-gray-100 text-gray-500">
          No external agencies or independent cabs found.
        </div>
      ) : (
        <div className="space-y-6">
          {groupedCabs.map((group, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Briefcase size={20} /></div>
                  <h3 className="text-lg font-bold text-gray-800">{group.groupName}</h3>
                </div>
                <span className="text-sm font-semibold bg-gray-200 text-gray-700 px-3 py-1 rounded-full">{group.cabs.length} Cabs</span>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-white text-gray-500 border-b border-gray-50">
                    <tr>
                      <th className="py-3 px-6 font-medium">Vehicle Details</th>
                      <th className="py-3 px-6 font-medium">Provider Name</th>
                      <th className="py-3 px-6 font-medium">Fuel / AC</th>
                      <th className="py-3 px-6 font-medium">Added On</th>
                      <th className="py-3 px-6 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {group.cabs.map(cab => (
                      <tr key={cab._id} className="hover:bg-gray-50/50 transition">
                        <td className="py-4 px-6">
                          <div className="font-semibold text-gray-800">{cab.details?.model || 'Unknown Model'} <span className="text-gray-400 font-normal ml-1">({cab.details?.vehicleType})</span></div>
                          <div className="text-xs text-gray-500 mt-0.5">{cab.details?.registrationNumber}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-medium text-gray-700">{cab.vendorId?.providerId?.name || 'Unknown Provider'}</div>
                          <div className="text-xs text-gray-500">{cab.vendorId?.providerId?.mobile}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium">{cab.details?.fuelType || 'N/A'}</span>
                            {cab.details?.isAC && <span className="text-xs bg-cyan-50 text-cyan-600 px-2 py-0.5 rounded font-medium">AC</span>}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-gray-500">
                          {new Date(cab.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button 
                            onClick={() => handleDelete(cab._id)}
                            className="p-2 text-red-500 hover:bg-red-50 hover:text-red-600 rounded transition"
                            title="Remove Vehicle"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminExternalCabsView;
