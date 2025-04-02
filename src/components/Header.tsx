
import React from 'react';
import { Search, Shield } from 'lucide-react';

const Header = () => {
  return (
    <header className="border-b py-4 bg-brand-dark">
      <div className="container flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-brand-blue" />
          <h1 className="text-2xl font-bold text-brand-light uppercase">
            CopyProtect
          </h1>
        </div>
        <nav>
          <ul className="flex items-center space-x-6">
            <li>
              <a href="#" className="text-sm font-medium text-brand-light hover:text-brand-blue transition-colors">
                Dashboard
              </a>
            </li>
            <li>
              <a href="#" className="text-sm font-medium text-brand-light hover:text-brand-blue transition-colors">
                Documentation
              </a>
            </li>
            <li>
              <a href="#" className="text-sm font-medium text-brand-light hover:text-brand-blue transition-colors">
                Reports
              </a>
            </li>
            <li>
              <button className="bg-brand-blue text-brand-light px-4 py-2 rounded-md text-sm font-medium h-12">
                Get Started
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
