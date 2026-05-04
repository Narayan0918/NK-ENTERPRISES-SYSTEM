import { useState, useEffect } from 'react';
import { CalendarDays, CalendarClock, Calendar, Filter, X, Eye } from 'lucide-react';
import api from '../services/api';

const Reports = () => {
  // Data State
  const [allInvoices, setAllInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [parties, setParties] = useState([]);
  const [products, setProducts] = useState([]);

  // Aggregate Data State
  const [salesData, setSalesData] = useState({
    thisWeek: { count: 0, total: 0 },
    thisMonth: { count: 0, total: 0 },
    thisYear: { count: 0, total: 0 },
    allTime: { count: 0, total: 0 }
  });

  // Filter State
  const [activePeriod, setActivePeriod] = useState('all'); // 'week', 'month', 'year', 'all'
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    partyId: '',
    productId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch all necessary data once
  const fetchData = async () => {
    try {
      const [invRes, partRes, prodRes] = await Promise.all([
        api.get('invoices/'),
        api.get('parties/'),
        api.get('products/')
      ]);
      
      const invoices = invRes.data.results || invRes.data;
      setAllInvoices(invoices);
      setParties(partRes.data.results || partRes.data);
      setProducts(prodRes.data.results || prodRes.data);
      
      calculateAggregates(invoices);
      setFilteredInvoices(invoices); // Show all by default
    } catch (error) {
      console.error("Error fetching report data:", error);
    }
  };

  // Calculate the numbers for the top cards
  const calculateAggregates = (invoices) => {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())); 
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    let data = {
      thisWeek: { count: 0, total: 0 },
      thisMonth: { count: 0, total: 0 },
      thisYear: { count: 0, total: 0 },
      allTime: { count: invoices.length, total: 0 }
    };

    invoices.forEach(inv => {
      const invDate = new Date(inv.date_of_issue);
      const amount = parseFloat(inv.grand_total || 0);

      data.allTime.total += amount;

      if (invDate >= startOfYear) {
        data.thisYear.count += 1;
        data.thisYear.total += amount;
      }
      if (invDate >= startOfMonth) {
        data.thisMonth.count += 1;
        data.thisMonth.total += amount;
      }
      if (invDate >= startOfWeek) {
        data.thisWeek.count += 1;
        data.thisWeek.total += amount;
      }
    });

    setSalesData(data);
  };

  // Apply filters whenever filters or activePeriod changes
  useEffect(() => {
    let result = [...allInvoices];
    const now = new Date();

    // 1. Apply Period Card Filter
    if (activePeriod !== 'all') {
      const startOfWeek = new Date(new Date().setDate(now.getDate() - now.getDay())); 
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      result = result.filter(inv => {
        const invDate = new Date(inv.date_of_issue);
        if (activePeriod === 'week') return invDate >= startOfWeek;
        if (activePeriod === 'month') return invDate >= startOfMonth;
        if (activePeriod === 'year') return invDate >= startOfYear;
        return true;
      });
    }

    // 2. Apply Custom Date Filters
    if (filters.startDate) {
      result = result.filter(inv => new Date(inv.date_of_issue) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      result = result.filter(inv => new Date(inv.date_of_issue) <= new Date(filters.endDate));
    }

    // 3. Apply Party Filter
    if (filters.partyId) {
      result = result.filter(inv => inv.party === parseInt(filters.partyId));
    }

    // 4. Apply Product Filter (Checks if any item in the invoice matches)
    if (filters.productId) {
      result = result.filter(inv => 
        inv.items.some(item => item.product === parseInt(filters.productId))
      );
    }

    setFilteredInvoices(result);
  }, [filters, activePeriod, allInvoices]);

  const clearFilters = () => {
    setFilters({ startDate: '', endDate: '', partyId: '', productId: '' });
    setActivePeriod('all');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Sales Reports & Analysis</h2>
          <p className="text-gray-500">Click a card to filter, or use the advanced filters below.</p>
        </div>
        {activePeriod !== 'all' && (
          <button onClick={() => setActivePeriod('all')} className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-full transition-colors">
            Show All Time
          </button>
        )}
      </div>

      {/* CLICKABLE AGGREGATE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={() => setActivePeriod('week')}
          className={`cursor-pointer rounded-xl p-6 text-white shadow-md transition-all transform hover:-translate-y-1 ${activePeriod === 'week' ? 'bg-linear-to-br from-blue-600 to-blue-800 ring-4 ring-blue-300' : 'bg-linear-to-br from-blue-400 to-blue-500'}`}
        >
          <div className="flex justify-between items-start mb-4">
            <div><p className="text-blue-50 text-sm font-medium uppercase tracking-wider">This Week</p><h3 className="text-3xl font-bold mt-1">₹{salesData.thisWeek.total.toLocaleString('en-IN')}</h3></div>
            <CalendarDays size={28} className="text-blue-100" />
          </div>
          <p className="text-sm text-blue-100">{salesData.thisWeek.count} Invoices generated</p>
        </div>

        <div 
          onClick={() => setActivePeriod('month')}
          className={`cursor-pointer rounded-xl p-6 text-white shadow-md transition-all transform hover:-translate-y-1 ${activePeriod === 'month' ? 'bg-linear-to-br from-emerald-600 to-emerald-800 ring-4 ring-emerald-300' : 'bg-linear-to-br from-emerald-400 to-emerald-500'}`}
        >
          <div className="flex justify-between items-start mb-4">
            <div><p className="text-emerald-50 text-sm font-medium uppercase tracking-wider">This Month</p><h3 className="text-3xl font-bold mt-1">₹{salesData.thisMonth.total.toLocaleString('en-IN')}</h3></div>
            <CalendarClock size={28} className="text-emerald-100" />
          </div>
          <p className="text-sm text-emerald-100">{salesData.thisMonth.count} Invoices generated</p>
        </div>

        <div 
          onClick={() => setActivePeriod('year')}
          className={`cursor-pointer rounded-xl p-6 text-white shadow-md transition-all transform hover:-translate-y-1 ${activePeriod === 'year' ? 'bg-linear-to-br from-violet-600 to-violet-800 ring-4 ring-violet-300' : 'bg-linear-to-br from-violet-400 to-violet-500'}`}
        >
          <div className="flex justify-between items-start mb-4">
            <div><p className="text-violet-50 text-sm font-medium uppercase tracking-wider">This Financial Year</p><h3 className="text-3xl font-bold mt-1">₹{salesData.thisYear.total.toLocaleString('en-IN')}</h3></div>
            <Calendar size={28} className="text-violet-100" />
          </div>
          <p className="text-sm text-violet-100">{salesData.thisYear.count} Invoices generated</p>
        </div>
      </div>

      {/* DETAILED FILTER BAR */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-4 text-gray-700 font-semibold border-b pb-2">
          <Filter size={18} /> <span>Advanced Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="col-span-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
            <input type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} className="w-full p-2 text-sm border border-gray-300 rounded-md" />
          </div>
          <div className="col-span-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
            <input type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} className="w-full p-2 text-sm border border-gray-300 rounded-md" />
          </div>
          <div className="col-span-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Filter by Party</label>
            <select value={filters.partyId} onChange={e => setFilters({...filters, partyId: e.target.value})} className="w-full p-2 text-sm border border-gray-300 rounded-md bg-white">
              <option value="">All Parties...</option>
              {parties.map(p => <option key={p.id} value={p.id}>{p.business_name}</option>)}
            </select>
          </div>
          <div className="col-span-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Filter by Product</label>
            <select value={filters.productId} onChange={e => setFilters({...filters, productId: e.target.value})} className="w-full p-2 text-sm border border-gray-300 rounded-md bg-white">
              <option value="">All Products...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="col-span-1 flex items-end">
            <button onClick={clearFilters} className="w-full flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-md text-sm font-medium transition-colors border border-red-200">
              <X size={16} /> Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* FILTERED RESULTS TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-bold text-gray-700">Transactions List</h3>
          <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
            Showing {filteredInvoices.length} result(s)
          </span>
        </div>
        
        <div className="overflow-x-auto max-h-125 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white shadow-sm">
              <tr className="text-gray-600 text-sm border-b border-gray-200">
                <th className="p-4 font-semibold">Invoice #</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Party Name</th>
                <th className="p-4 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium text-gray-800">{inv.invoice_number}</td>
                  <td className="p-4 text-gray-600">{inv.date_of_issue}</td>
                  <td className="p-4 text-gray-600 font-medium">{inv.party_details?.business_name}</td>
                  <td className="p-4 text-right font-bold text-gray-800">₹{parseFloat(inv.grand_total).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">
                    No transactions found for these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Total of Current Filtered View */}
        {filteredInvoices.length > 0 && (
          <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-end">
            <div className="text-right">
              <span className="text-gray-500 text-sm mr-4">Total of Filtered Results:</span>
              <span className="text-xl font-bold text-gray-800">
                ₹{filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.grand_total), 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}
              </span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default Reports;