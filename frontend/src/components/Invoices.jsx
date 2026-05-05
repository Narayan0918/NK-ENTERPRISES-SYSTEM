import { useState, useEffect } from 'react';
import { Plus, X, Trash2, Printer, Eye, Truck, Filter } from 'lucide-react';
import api from '../services/api';

const convertNumberToWords = (amount) => {
  const words = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  let num = Math.floor(amount);
  if (num === 0) return "ZERO ONLY";

  let result = "";
  const cro = Math.floor(num / 10000000);
  num %= 10000000;
  const lak = Math.floor(num / 100000);
  num %= 100000;
  const tho = Math.floor(num / 1000);
  num %= 1000;
  const hun = Math.floor(num / 100);
  const rem = num % 100;

  if (cro > 0) result += (cro < 20 ? words[cro] : tens[Math.floor(cro / 10)] + (cro % 10 !== 0 ? " " + words[cro % 10] : "")) + " Crore ";
  if (lak > 0) result += (lak < 20 ? words[lak] : tens[Math.floor(lak / 10)] + (lak % 10 !== 0 ? " " + words[lak % 10] : "")) + " Lakh ";
  if (tho > 0) result += (tho < 20 ? words[tho] : tens[Math.floor(tho / 10)] + (tho % 10 !== 0 ? " " + words[tho % 10] : "")) + " Thousand ";
  if (hun > 0) result += words[hun] + " Hundred ";
  if (rem > 0) {
      if (result !== "") result += "& ";
      result += (rem < 20 ? words[rem] : tens[Math.floor(rem / 10)] + (rem % 10 !== 0 ? " " + words[rem % 10] : ""));
  }

  return result.trim().toUpperCase() + " ONLY";
};

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [parties, setParties] = useState([]);
  const [products, setProducts] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewReceipt, setViewReceipt] = useState(null);

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    partyId: '',
    productId: '',
    billNo: ''
  });

  const defaultForm = {
    invoice_number: `INV-${Date.now().toString().slice(-6)}`,
    date_of_issue: new Date().toISOString().split('T')[0],
    party: '',
    items: [],
    total_taxable_amount: 0,
    cgst_amount: 0,
    sgst_amount: 0,
    igst_amount: 0,
    grand_total: 0
  };

  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invRes, partRes, prodRes] = await Promise.all([
        api.get('invoices/'),
        api.get('parties/'),
        api.get('products/')
      ]);
      const fetchedInvoices = invRes.data.results || invRes.data;
      setInvoices(fetchedInvoices);
      setFilteredInvoices(fetchedInvoices);
      setParties(partRes.data.results || partRes.data);
      setProducts(prodRes.data.results || prodRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    let result = [...invoices];

    if (filters.startDate) {
      result = result.filter(inv => new Date(inv.date_of_issue) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      result = result.filter(inv => new Date(inv.date_of_issue) <= new Date(filters.endDate));
    }
    if (filters.partyId) {
      result = result.filter(inv => inv.party === parseInt(filters.partyId));
    }
    if (filters.productId) {
      result = result.filter(inv => 
        inv.items.some(item => item.product === parseInt(filters.productId))
      );
    }
    if (filters.billNo) {
      result = result.filter(inv => 
        inv.invoice_number.toLowerCase().includes(filters.billNo.toLowerCase())
      );
    }

    setFilteredInvoices(result);
  }, [filters, invoices]);

  const clearFilters = () => {
    setFilters({ startDate: '', endDate: '', partyId: '', productId: '', billNo: '' });
  };

  const calculateTotals = (currentItems, selectedPartyId) => {
    let taxableAmount = 0;
    currentItems.forEach(item => {
      taxableAmount += parseFloat(item.amount || 0);
    });

    let cgst = 0, sgst = 0, igst = 0;
    const party = parties.find(p => p.id === parseInt(selectedPartyId));
    
    if (party && party.gst_number) {
      const stateCode = party.gst_number.substring(0, 2);
      const taxRate = 0.05; 
      if (stateCode === '09') {
        cgst = taxableAmount * (taxRate / 2);
        sgst = taxableAmount * (taxRate / 2);
      } else {
        igst = taxableAmount * taxRate;
      }
    }

    setFormData(prev => ({
      ...prev,
      items: currentItems,
      total_taxable_amount: taxableAmount.toFixed(2),
      cgst_amount: cgst.toFixed(2),
      sgst_amount: sgst.toFixed(2),
      igst_amount: igst.toFixed(2),
      grand_total: (taxableAmount + cgst + sgst + igst).toFixed(2)
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    if (field === 'quantity' || field === 'rate') {
      const qty = parseFloat(newItems[index].quantity || 0).toFixed(3);
      const rate = parseFloat(newItems[index].rate || 0);
      newItems[index].amount = (qty * rate).toFixed(2);
    }
    calculateTotals(newItems, formData.party);
  };

  const addItemRow = () => {
    const newItems = [...formData.items, { product: '', p_no: '', quantity: '', rate: '', amount: 0 }];
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const removeItemRow = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    calculateTotals(newItems, formData.party);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('invoices/', formData);
      setIsFormOpen(false);
      setFormData(defaultForm);
      fetchData();
    } catch (error) {
      console.error("Error saving invoice:", error);
      alert("Failed to save invoice. Ensure all fields are filled correctly.");
    }
  };

  const handleDeleteInvoice = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this invoice?")) {
      try {
        await api.delete(`invoices/${id}/`);
        fetchData();
      } catch (error) {
        console.error("Error deleting invoice:", error);
        alert("Failed to delete invoice.");
      }
    }
  };

  const formatBagString = (p_no) => {
    if (!p_no) return '-';
    const str = String(p_no).toUpperCase();
    return str.includes('/B') ? str : `${str}/B`;
  };

  // The Copies we want to generate
  const invoiceCopies = [
    { id: 1, title: 'ORIGINAL FOR RECIPIENT' },
    { id: 2, title: 'DUPLICATE' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      
      {/* BULLETPROOF PRINT CSS */}
      <style type="text/css" media="print">
        {`
          @page { size: A4 portrait; margin: 5mm; }
          body * { visibility: hidden; }
          .printable-area, .printable-area * { visibility: visible; }
          .printable-area { position: absolute; left: 0; top: 0; width: 100%; padding: 0; border: none !important; box-shadow: none !important; background: white; }
          .page-break { page-break-after: always; display: block; height: 0; }
        `}
      </style>

      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h2 className="text-2xl font-bold text-gray-800">Invoices & Receipts</h2>
        <button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          {isFormOpen ? <X size={20} /> : <Plus size={20} />}
          {isFormOpen ? 'Cancel' : 'Create New Invoice'}
        </button>
      </div>

      {/* FILTER BAR */}
      {!isFormOpen && !viewReceipt && (
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 print:hidden">
          <div className="flex items-center gap-2 mb-3 text-gray-700 font-semibold border-b pb-2">
            <Filter size={18} /> <span>Filter Invoices</span>
          </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">            <div className="col-span-1">
              <input type="text" placeholder="Search Bill No..." value={filters.billNo} onChange={e => setFilters({...filters, billNo: e.target.value})} className="w-full p-2 text-sm border border-gray-300 rounded-md" />
            </div>
            <div className="col-span-1">
              <input type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} className="w-full p-2 text-sm border border-gray-300 rounded-md" title="Start Date" />
            </div>
            <div className="col-span-1">
              <input type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} className="w-full p-2 text-sm border border-gray-300 rounded-md" title="End Date" />
            </div>
            <div className="col-span-1 md:col-span-1">
              <select value={filters.partyId} onChange={e => setFilters({...filters, partyId: e.target.value})} className="w-full p-2 text-sm border border-gray-300 rounded-md bg-white">
                <option value="">All Parties...</option>
                {parties.map(p => <option key={p.id} value={p.id}>{p.business_name}</option>)}
              </select>
            </div>
            <div className="col-span-1">
              <select value={filters.productId} onChange={e => setFilters({...filters, productId: e.target.value})} className="w-full p-2 text-sm border border-gray-300 rounded-md bg-white">
                <option value="">All Products...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="col-span-1">
              <button onClick={clearFilters} className="w-full flex items-center justify-center gap-1 bg-white hover:bg-gray-100 text-gray-600 p-2 rounded-md text-sm font-medium transition-colors border border-gray-300">
                <X size={16} /> Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW INVOICE FORM */}
      {isFormOpen && !viewReceipt && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg mb-6 border border-gray-200 print:hidden">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number *</label>
              <input required type="text" value={formData.invoice_number} onChange={e => setFormData({...formData, invoice_number: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input required type="date" value={formData.date_of_issue} onChange={e => setFormData({...formData, date_of_issue: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Party *</label>
              <select required value={formData.party} onChange={e => { setFormData({...formData, party: e.target.value}); calculateTotals(formData.items, e.target.value); }} className="w-full p-2 border border-gray-300 rounded-md bg-white">
                <option value="">-- Select Customer --</option>
                {parties.map(p => <option key={p.id} value={p.id}>{p.business_name} ({p.gst_number})</option>)}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Items</h3>
            {formData.items.map((item, index) => (
              <div key={index} className="flex gap-2 mb-2 items-center">
                <input required type="text" placeholder="Bags (e.g. 5)" value={item.p_no || ''} onChange={e => handleItemChange(index, 'p_no', e.target.value)} className="w-28 p-2 border border-gray-300 rounded-md font-medium text-gray-800" title="Number of bags" />
                <select required value={item.product} onChange={e => handleItemChange(index, 'product', e.target.value)} className="flex-1 p-2 border border-gray-300 rounded-md bg-white">
                  <option value="">Select Product...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (HSN: {p.hsn_code})</option>)}
                </select>
                <input required type="number" step="0.001" placeholder="Weight" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} className="w-24 p-2 border border-gray-300 rounded-md" />
                <input required type="number" step="0.01" placeholder="Rate" value={item.rate} onChange={e => handleItemChange(index, 'rate', e.target.value)} className="w-32 p-2 border border-gray-300 rounded-md" />
                <div className="w-32 p-2 bg-gray-100 rounded-md text-right font-medium text-gray-600">₹{item.amount || 0}</div>
                <button type="button" onClick={() => removeItemRow(index)} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={20} /></button>
              </div>
            ))}
            <button type="button" onClick={addItemRow} className="text-blue-600 text-sm font-medium mt-2 hover:underline">+ Add Item Row</button>
          </div>

          <div className="border-t border-gray-200 pt-4 flex justify-end">
            <div className="w-72 space-y-2 text-right">
              <div className="flex justify-between"><span>Taxable Amount:</span> <span>₹{formData.total_taxable_amount}</span></div>
              {parseFloat(formData.cgst_amount) > 0 && (
                <>
                  <div className="flex justify-between text-gray-500 text-sm"><span>C.GST (2.5%):</span> <span>₹{formData.cgst_amount}</span></div>
                  <div className="flex justify-between text-gray-500 text-sm"><span>S.GST (2.5%):</span> <span>₹{formData.sgst_amount}</span></div>
                </>
              )}
              {parseFloat(formData.igst_amount) > 0 && (
                <div className="flex justify-between text-gray-500 text-sm"><span>I.GST (5.0%):</span> <span>₹{formData.igst_amount}</span></div>
              )}
              <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-2"><span>Grand Total:</span> <span>₹{formData.grand_total}</span></div>
              <button type="submit" className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium">Save Invoice</button>
            </div>
          </div>
        </form>
      )}

      {/* FILTERED DATA TABLE */}
      {!viewReceipt && !isFormOpen && (
        <div className="overflow-x-auto print:hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase">
                <th className="p-3 font-bold">Date</th>
                <th className="p-3 font-bold">Bill No</th>
                <th className="p-3 font-bold">GST No.</th>
                <th className="p-3 font-bold">Party Name</th>
                <th className="p-3 font-bold">HSN</th>
                <th className="p-3 font-bold text-center">Weight</th>
                <th className="p-3 font-bold text-right">Amount</th>
                <th className="p-3 font-bold text-right">C.GST</th>
                <th className="p-3 font-bold text-right">S.GST</th>
                <th className="p-3 font-bold text-right">I.GST</th>
                <th className="p-3 font-bold text-right">G.Total</th>
                <th className="p-3 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => {
                const firstItem = inv.items?.[0] || {};
                return (
                  <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-3 whitespace-nowrap">{inv.date_of_issue}</td>
                    <td className="p-3 font-bold text-blue-900">{inv.invoice_number}</td>
                    <td className="p-3 text-gray-500">{inv.party_details?.gst_number}</td>
                    <td className="p-3 font-medium uppercase">{inv.party_details?.business_name}</td>
                    <td className="p-3">{firstItem.product_details?.hsn_code || '-'}</td>
                    <td className="p-3 text-center">{firstItem.quantity || '0.000'}</td>
                    <td className="p-3 text-right">₹{inv.total_taxable_amount}</td>
                    <td className="p-3 text-right text-red-600">{inv.cgst_amount > 0 ? `₹${inv.cgst_amount}` : '-'}</td>
                    <td className="p-3 text-right text-red-600">{inv.sgst_amount > 0 ? `₹${inv.sgst_amount}` : '-'}</td>
                    <td className="p-3 text-right text-red-600">{inv.igst_amount > 0 ? `₹${inv.igst_amount}` : '-'}</td>
                    <td className="p-3 text-right font-bold text-gray-900">₹{inv.grand_total}</td>
                    <td className="p-3">
                      <div className="flex justify-center items-center gap-2">
                        {parseFloat(inv.grand_total) > 50000 && (
                          <a href="https://ewaybillgst.gov.in/login.aspx" target="_blank" rel="noopener noreferrer" className="bg-orange-100 text-orange-700 p-1.5 rounded" title="E-Way Bill Required">
                            <Truck size={14} />
                          </a>
                        )}
                        <button onClick={() => setViewReceipt(inv)} className="text-blue-600 hover:text-blue-800 p-1.5" title="View/Print">
                          <Eye size={18} />
                        </button>
                        <button onClick={() => handleDeleteInvoice(inv.id)} className="text-red-500 hover:text-red-700 p-1.5" title="Delete">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* PRINTABLE RECEIPT SECTION (RENDERS 2 PAGES) */}
      {viewReceipt && (
        <div className="bg-gray-100 print:bg-transparent p-8 print:p-0 max-w-4xl mx-auto printable-area">
          
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-300 print:hidden bg-white p-4 rounded-lg shadow-sm">
            <button onClick={() => setViewReceipt(null)} className="text-gray-500 hover:text-gray-800 flex items-center gap-1 font-medium">
               &larr; Back to List
            </button>
            <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-md">
              <Printer size={20} /> Print Original & Duplicate
            </button>
          </div>

          {/* Map through copies to generate Page 1 and Page 2 */}
          {invoiceCopies.map((copy, index) => (
            <div key={copy.id}>
              <div className="border-2 border-black flex flex-col h-250 print:h-[285mm] bg-white text-black shadow-lg print:shadow-none mb-8 print:mb-0">
                
                {/* Header Section */}
                <div className="text-center p-4 pb-2">
                  <div className="flex justify-between text-sm font-bold border-b border-black pb-2 mb-2 items-start">
                    <div className="w-1/3 text-left pt-1">GSTIN: 09ANSPD6386R1ZT</div>
                    
                    {/* Fixed ORIGINAL/DUPLICATE Placement */}
                    <div className="w-1/3 text-center flex flex-col">
                      <span className="text-xl leading-tight font-serif font-bold tracking-wider">TAX INVOICE</span>
                      <span className="text-xs font-bold tracking-widest mt-1">{copy.title}</span>
                    </div>

                    <div className="w-1/3 text-right pt-1">Mob: 09794064449</div>
                  </div>
                  
                  <h1 className="text-4xl font-serif font-bold tracking-wider uppercase mb-1 text-black mt-2">N K Enterprises</h1>
                  <p className="text-sm font-medium">ALL KINDS OF WOOLLEN YARN & COMMISSION AGENTS</p>
                  <p className="text-sm">PIPARI RAYAN BHADOHI - 221401 (U.P) INDIA</p>
                  <p className="text-sm font-bold mt-1">STATE CODE: 09</p>
                </div>

                {/* Party Details */}
                <div className="flex border-t-2 border-black text-sm">
                  <div className="w-2/3 border-r-2 border-black p-3 leading-relaxed">
                    <p><strong>M/S:</strong> {viewReceipt.party_details?.business_name}</p>
                    <p><strong>ADD:</strong> {(viewReceipt.party_details?.address && viewReceipt.party_details?.address !== 'nan') ? viewReceipt.party_details.address : ''}</p>
                    <p><strong>PARTY GSTIN:</strong> {viewReceipt.party_details?.gst_number}</p>
                    <p><strong>PARTY MOB NO:</strong> {(viewReceipt.party_details?.phone_number && viewReceipt.party_details?.phone_number !== 'nan') ? viewReceipt.party_details.phone_number : ''}</p>
                  </div>
                  <div className="w-1/3 p-3 leading-relaxed">
                    <p><strong>INVOICE NO:</strong> <span className="font-bold">{viewReceipt.invoice_number}</span></p>
                    <p><strong>DATE OF ISSUE:</strong> {viewReceipt.date_of_issue}</p>
                  </div>
                </div>

                {/* Items Table - Perfectly Distributed Widths (75% Left / 25% Amount) */}
                <div className="flex-1 border-t-2 border-black flex flex-col">
                  <table className="w-full text-left border-collapse text-sm h-full">
                    <thead>
                      <tr className="border-b-2 border-black">
                        <th className="p-2 border-r-2 border-black text-center w-[8%]">P.NO</th>
                        <th className="p-2 border-r-2 border-black w-[35%]">DESCRIPTION OF GOODS</th>
                        <th className="p-2 border-r-2 border-black text-center w-[10%]">HSN CODE</th>
                        <th className="p-2 border-r-2 border-black text-center w-[11%]">QUANTITY</th>
                        <th className="p-2 border-r-2 border-black text-center w-[11%]">RATE</th>
                        <th className="p-2 text-right pr-4 w-[25%]">AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody className="align-top">
                      {viewReceipt.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2 border-r-2 border-black text-center font-bold">{formatBagString(item.p_no)}</td>
                          <td className="p-2 border-r-2 border-black font-medium">{item.product_details?.name}</td>
                          <td className="p-2 border-r-2 border-black text-center">{item.product_details?.hsn_code}</td>
                          <td className="p-2 border-r-2 border-black text-center">{item.quantity}</td>
                          <td className="p-2 border-r-2 border-black text-center">{item.rate}</td>
                          <td className="p-2 text-right pr-4">{item.amount}</td>
                        </tr>
                      ))}
                      {/* Empty Stretch Row */}
                      <tr className="h-full">
                        <td className="border-r-2 border-black"></td>
                        <td className="border-r-2 border-black"></td>
                        <td className="border-r-2 border-black"></td>
                        <td className="border-r-2 border-black"></td>
                        <td className="border-r-2 border-black"></td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Totals Block - Fixed Math Alignment */}
                <div className="flex border-t-2 border-black text-sm">
                  <div className="w-[75%] border-r-2 border-black p-3 flex flex-col justify-center">
                    <p><strong>(AMOUNT CHARGEABLE IN WORDS):</strong> {convertNumberToWords(viewReceipt.grand_total)}</p>
                  </div>
                  
                  {/* Totals Math Box - Increased width to prevent wrapping */}
                  <div className="w-[25%] p-0 flex flex-col font-medium">
                    <div className="flex justify-between border-b border-black p-1.5 px-3">
                      <span className="whitespace-nowrap">TOTAL=</span> 
                      <span className="whitespace-nowrap">{viewReceipt.total_taxable_amount}</span>
                    </div>
                    
                    {parseFloat(viewReceipt.sgst_amount) > 0 && (
                      <>
                        <div className="flex justify-between border-b border-black p-1.5 px-3">
                          <span className="whitespace-nowrap">S.GST= 2.5%</span> 
                          <span className="whitespace-nowrap">{viewReceipt.sgst_amount}</span>
                        </div>
                        <div className="flex justify-between border-b border-black p-1.5 px-3">
                          <span className="whitespace-nowrap">C.GST= 2.5%</span> 
                          <span className="whitespace-nowrap">{viewReceipt.cgst_amount}</span>
                        </div>
                      </>
                    )}
                    
                    {parseFloat(viewReceipt.igst_amount) > 0 && (
                       <div className="flex justify-between border-b border-black p-1.5 px-3">
                         <span className="whitespace-nowrap">I.GST= 5.0%</span> 
                         <span className="whitespace-nowrap">{viewReceipt.igst_amount}</span>
                       </div>
                    )}
                    
                    <div className="flex justify-between font-bold text-lg p-2 px-3 flex-1 items-end bg-gray-50 print:bg-transparent">
                      <span className="whitespace-nowrap">G.TOTAL</span> 
                      <span className="whitespace-nowrap">{viewReceipt.grand_total}</span>
                    </div>
                  </div>
                </div>

                {/* Bank Details & Perfect Signatures Block */}
                <div className="flex border-t-2 border-black text-sm">
                  
                  {/* Left Side: Bank Details & Buyer Sign */}
                  <div className="w-[75%] border-r-2 border-black p-4 flex flex-col justify-between">
                    <div>
                      <p className="font-bold underline mb-1">BANK DETAILS:</p>
                      <p>BANK NAME: <span className="font-bold">UCO BANK, BHADOHI</span></p>
                      <p>A/C NO.- <span className="font-bold">00830510002247</span></p>
                      <p>IFSC CODE- <span className="font-bold">UCBA0000083</span></p>
                      <div className="mt-4 text-xs space-y-1">
                        <p>1. Goods once sold will not be returned.</p>
                        <p>2. Payment should be made within ............days.</p>
                        <p>3. All disputes subject to Gyanpur jurisdiction.</p>
                      </div>
                    </div>
                    
                    {/* Centered Buyer Signature Line */}
                    <div className="mt-16 w-56 text-center">
                      <p className="border-t border-black pt-1 font-medium text-sm">Buyer's Signature</p>
                    </div>
                  </div>

                  {/* Right Side: NK Enterprises Signature */}
                  <div className="w-[25%] p-3 flex flex-col justify-between items-center text-center">
                    <p className="font-bold w-full text-right text-sm">FOR: N K ENTERPRISES</p>
                    
                    {/* Solid Bottom Signature Line */}
                    <div className="w-full border-t border-black pt-1 mt-28">
                      <p className="font-bold text-sm">PROPRIETOR / Auth.</p>
                    </div>
                  </div>

                </div>

              </div>
              
              {/* This invisible element forces the printer to print the Duplicate on a second page! */}
              {index === 0 && <div className="page-break"></div>}
            </div>
          ))}

        </div>
      )}
    </div>
  );
};

export default Invoices;