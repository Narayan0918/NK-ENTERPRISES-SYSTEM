import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, Package, FileText, Menu, X, BarChart2, LogOut } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Parties from './components/Parties';
import Products from './components/Products';
import Invoices from './components/Invoices';
import Reports from './components/Reports';
import Login from './components/Login'; // Import Login!

// Sidebar Link Helper
const NavLink = ({ to, icon: Icon, children, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
      <Icon size={20} className={isActive ? 'text-blue-600' : 'text-gray-400'} /> {children}
    </Link>
  );
};

function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Check if token exists on load
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('access_token'));

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsAuthenticated(false);
    setIsMobileMenuOpen(false);
  };

  // If NOT logged in, ONLY show the Login page
  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  // If LOGGED IN, show the full ERP interface
  return (
    <Router>
      <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
        
        {/* MOBILE TOP BAR */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-4">
          <div className="font-bold text-xl text-blue-900 tracking-tight">N.K. ENTERPRISES</div>
          <button onClick={toggleMobileMenu} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMobileMenuOpen && <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30" onClick={toggleMobileMenu}></div>}

        {/* SIDEBAR */}
        <aside className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} flex flex-col`}>
          <div className="h-16 md:h-20 flex flex-col justify-center px-6 border-b border-gray-100 bg-white">
            <h1 className="text-xl font-bold text-blue-900 tracking-tight">N.K. ENTERPRISES</h1>
            <p className="text-xs text-gray-500 font-medium">Textile ERP System</p>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            <NavLink to="/" icon={LayoutDashboard} onClick={() => setIsMobileMenuOpen(false)}>Dashboard</NavLink>
            <NavLink to="/parties" icon={Users} onClick={() => setIsMobileMenuOpen(false)}>Parties</NavLink>
            <NavLink to="/products" icon={Package} onClick={() => setIsMobileMenuOpen(false)}>Products</NavLink>
            <NavLink to="/invoices" icon={FileText} onClick={() => setIsMobileMenuOpen(false)}>Invoices</NavLink>
            <NavLink to="/reports" icon={BarChart2} onClick={() => setIsMobileMenuOpen(false)}>Reports</NavLink>
          </nav>

          {/* LOGOUT BUTTON */}
          <div className="p-4 border-t border-gray-100">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-red-600 hover:bg-red-50 transition-colors">
              <LogOut size={20} /> Logout
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden pt-16 md:pt-0">
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/parties" element={<Parties />} />
                <Route path="/products" element={<Products />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;