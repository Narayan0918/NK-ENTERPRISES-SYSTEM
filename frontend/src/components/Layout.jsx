import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Box, ReceiptText, BarChart3 } from 'lucide-react';

const Layout = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Parties', path: '/parties', icon: <Users size={20} /> },
    { name: 'Products', path: '/products', icon: <Box size={20} /> },
    { name: 'Invoices', path: '/invoices', icon: <ReceiptText size={20} /> },
    { name: 'Reports', path: '/reports', icon: <BarChart3 size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-900 tracking-wider">N.K. ENTERPRISES</h1>
          <p className="text-xs text-gray-500 mt-1">Textile ERP System</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 font-semibold' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        {/* The Outlet is where our specific page content will render based on the URL */}
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;