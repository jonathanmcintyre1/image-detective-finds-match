
import React from 'react';
import { Search } from 'lucide-react';

const Header = () => {
  return (
    <header className="border-b py-4">
      <div className="container flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Search className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-hero-gradient">
            ImageDetective
          </h1>
        </div>
        <nav>
          <ul className="flex items-center space-x-6">
            <li>
              <a href="#" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Dashboard
              </a>
            </li>
            <li>
              <a href="#" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Documentation
              </a>
            </li>
            <li>
              <a href="#" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Pricing
              </a>
            </li>
            <li>
              <button className="bg-hero-gradient text-white px-4 py-2 rounded-md text-sm font-medium">
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
