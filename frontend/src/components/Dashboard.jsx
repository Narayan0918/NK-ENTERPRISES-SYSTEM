import { useState, useEffect } from 'react';
import { IndianRupee, ReceiptText, Users, Box } from 'lucide-react';
import api from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({ revenue: 0, invoices: 0, parties: 0, products: 0 });
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [invRes, partRes, prodRes] = await Promise.all([
          api.get('invoices/'),
          api.get('parties/'),
          api.get('products/')
        ]);

        const invoices = invRes.data.results || invRes.data;
        const parties = partRes.data.results || partRes.data;
        const prods = prodRes.data.results || prodRes.data;

        // Calculate total revenue
        const totalRev = invoices.reduce((sum, inv) => sum + parseFloat(inv.grand_total || 0), 0);

        setStats({
          revenue: totalRev.toFixed(2),
          invoices: invoices.length,
          parties: parties.length,
          products: prods.length
        });

        // Get 5 most recent invoices
        setRecentInvoices(invoices.slice(0, 5));
        setProducts(prods);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Business Overview</h2>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg"><IndianRupee size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-800">₹{stats.revenue}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><ReceiptText size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Invoices</p>
            <p className="text-2xl font-bold text-gray-800">{stats.invoices}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg"><Users size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Parties</p>
            <p className="text-2xl font-bold text-gray-800">{stats.parties}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-lg"><Box size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Items Catalog</p>
            <p className="text-2xl font-bold text-gray-800">{stats.products}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions List */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Recent Transactions</h3>
          <div className="space-y-4">
            {recentInvoices.map(inv => (
              <div key={inv.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div>
                  <p className="font-semibold text-gray-800">{inv.party_details?.business_name}</p>
                  <p className="text-xs text-gray-500">{inv.invoice_number} • {inv.date_of_issue}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">+₹{inv.grand_total}</p>
                </div>
              </div>
            ))}
            {recentInvoices.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No recent transactions</p>}
          </div>
        </div>

        {/* Product HSN & Info List */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Yarn & Materials Catalog</h3>
          <div className="space-y-3">
            {products.map(prod => (
              <div key={prod.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-md transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                    {prod.name.substring(0,2).toUpperCase()}
                  </div>
                  <span className="font-medium text-gray-700">{prod.name}</span>
                </div>
                <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded">HSN: {prod.hsn_code}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;