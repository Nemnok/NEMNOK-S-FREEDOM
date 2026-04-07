import { type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'PDF Tools', icon: '📄' },
  { to: '/image-to-pdf', label: 'Image → PDF', icon: '🖼️' },
];

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col h-full min-h-screen bg-dark-900">
      {/* Header */}
      <header className="bg-dark-800 border-b border-dark-600 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            PS
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            PDF <span className="text-blue-400">Studio</span>
          </h1>
        </div>
        <nav className="flex gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-dark-600'
                }`
              }
              end
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="text-xs text-gray-500 hidden sm:block">
          🔒 All processing in browser
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
