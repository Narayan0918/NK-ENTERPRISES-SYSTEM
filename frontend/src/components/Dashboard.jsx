import { useState, useEffect } from 'react';
import { IndianRupee, FileText, Users, Package } from 'lucide-react';
import api from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    revenue: 0,
    invoices: 0,
    parties: 0,
    products: 0,
    recentInvoices: [],
    catalog: []
  });

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
        const products = prodRes.data.results || prodRes.data;

        const totalRevenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.grand_total || 0), 0);

        setStats({
          revenue: totalRevenue,
          invoices: invoices.length,
          parties: parties.length,
          products: products.length,
          // We now load all invoices instead of just a slice
          recentInvoices: invoices.reverse(), 
          catalog: products
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Business Overview</h2>

      {/* STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">        <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="bg-green-100 p-3 md:p-4 rounded-lg shrink-0">
            <IndianRupee className="text-green-600" size={28} />
          </div>
          <div className="flex-1 min-w-0"> 
            <p className="text-sm font-medium text-gray-500">Total Revenue</p>
            {/* Removed truncate, added Indian number formatting and dynamic text sizing */}
            <h3 className="text-xl lg:text-2xl font-bold text-gray-800 tracking-tight break-all sm:break-normal">
              ₹{parseFloat(stats.revenue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="bg-blue-100 p-3 md:p-4 rounded-lg shrink-0">
            <FileText className="text-blue-600" size={28} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-500">Total Invoices</p>
            <h3 className="text-2xl lg:text-3xl font-bold text-gray-800">{stats.invoices}</h3>
          </div>
        </div>

        <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="bg-purple-100 p-3 md:p-4 rounded-lg shrink-0">
            <Users className="text-purple-600" size={28} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-500">Total Parties</p>
            <h3 className="text-2xl lg:text-3xl font-bold text-gray-800">{stats.parties}</h3>
          </div>
        </div>

        <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="bg-orange-100 p-3 md:p-4 rounded-lg shrink-0">
            <Package className="text-orange-600" size={28} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-500">Items Catalog</p>
            <h3 className="text-2xl lg:text-3xl font-bold text-gray-800">{stats.products}</h3>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTIONS - Now with internal scrolling! */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Transactions */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
          <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4 pb-2 border-b">Transactions</h3>
          {/* Added max-h-[400px] and overflow-y-auto for vertical scrolling */}
          <div className="space-y-3 max-h-100 overflow-y-auto pr-2">
            {stats.recentInvoices.map(inv => (
              <div key={inv.id} className="flex justify-between items-center p-3 md:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1 min-w-0 pr-4">
                  <p className="font-semibold text-gray-800 truncate">{inv.party_details?.business_name}</p>
                  <p className="text-xs md:text-sm text-gray-500">{inv.invoice_number} • {inv.date_of_issue}</p>
                </div>
                <div className="font-bold text-green-600 whitespace-nowrap">
                  +₹{parseFloat(inv.grand_total).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            ))}
            {stats.recentInvoices.length === 0 && <p className="text-gray-500 text-sm">No transactions yet.</p>}
          </div>
        </div>

        {/* Yarn Catalog */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
          <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4 pb-2 border-b">Yarn & Materials Catalog</h3>
          {/* Added max-h-[400px] and overflow-y-auto for vertical scrolling */}
          <div className="space-y-3 max-h-100 overflow-y-auto pr-2">
            {stats.catalog.map(prod => (
              <div key={prod.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                    {prod.name.substring(0, 2).toUpperCase()}
                  </div>
                  <p className="font-medium text-gray-800 truncate">{prod.name}</p>
                </div>
                <div className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded whitespace-nowrap">
                  HSN: {prod.hsn_code}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;