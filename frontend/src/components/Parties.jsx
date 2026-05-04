import { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, X } from 'lucide-react';
import api from '../services/api';

const Parties = () => {
  const [parties, setParties] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    business_name: '',
    gst_number: '',
    phone_number: '',
    address: ''
  });

  useEffect(() => {
    fetchParties();
  }, []);

  const fetchParties = async () => {
    try {
      const response = await api.get('parties/');
      setParties(response.data.results || response.data); 
    } catch (error) {
      console.error("Error fetching parties:", error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`parties/${editingId}/`, formData);
      } else {
        await api.post('parties/', formData);
      }
      setFormData({ business_name: '', gst_number: '', phone_number: '', address: '' });
      setEditingId(null);
      setIsFormOpen(false);
      fetchParties();
    } catch (error) {
      console.error("Error saving party:", error);
      alert("Failed to save. Make sure the GST number is unique!");
    }
  };

  const handleEdit = (party) => {
    setFormData(party);
    setEditingId(party.id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this party?")) {
      try {
        await api.delete(`parties/${id}/`);
        fetchParties();
      } catch (error) {
        console.error("Error deleting party:", error);
        alert("Cannot delete this party. They might be attached to an existing invoice.");
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manage Parties</h2>
        <button 
          onClick={() => {
            setIsFormOpen(!isFormOpen);
            setEditingId(null);
            setFormData({ business_name: '', gst_number: '', phone_number: '', address: '' });
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          {isFormOpen ? <X size={20} /> : <Plus size={20} />}
          {isFormOpen ? 'Cancel' : 'Add New Party'}
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
              <input required type="text" name="business_name" value={formData.business_name} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST Number / ID *</label>
              {/* UPDATED: Removed artificial constraints so it perfectly matches the new database limits */}
              <input required type="text" name="gst_number" value={formData.gst_number} onChange={handleInputChange} maxLength="50" className="w-full p-2 border border-gray-300 rounded-md uppercase" placeholder="GSTIN or Temp ID" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input type="text" name="phone_number" value={formData.phone_number || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input type="text" name="address" value={formData.address || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md" />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium">
              {editingId ? 'Update Party' : 'Save Party'}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
              <th className="p-3 font-semibold">Business Name</th>
              <th className="p-3 font-semibold">GST Number</th>
              <th className="p-3 font-semibold">Phone</th>
              <th className="p-3 font-semibold">Address</th>
              <th className="p-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {parties.map((party) => (
              <tr key={party.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-3 font-medium text-gray-800">{party.business_name}</td>
                <td className="p-3 text-gray-600">{party.gst_number}</td>
                <td className="p-3 text-gray-600">{party.phone_number || '-'}</td>
                <td className="p-3 text-gray-600 truncate max-w-xs">{party.address || '-'}</td>
                <td className="p-3 flex justify-end gap-3">
                  <button onClick={() => handleEdit(party)} className="text-blue-600 hover:text-blue-800">
                    <Pencil size={18} />
                  </button>
                  <button onClick={() => handleDelete(party.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Parties;