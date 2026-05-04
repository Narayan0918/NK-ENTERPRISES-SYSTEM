import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';  // <-- Import Dashboard
import Parties from './components/Parties';
import Products from './components/Products';
import Invoices from './components/Invoices';
import Reports from './components/Reports';      // <-- Import Reports

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />       {/* <-- Replaced placeholder */}
          <Route path="parties" element={<Parties />} />
          <Route path="products" element={<Products />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="reports" element={<Reports />} /> {/* <-- Replaced placeholder */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;