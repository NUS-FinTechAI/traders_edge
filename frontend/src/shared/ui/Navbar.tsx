import React from 'react';
import { Link } from 'react-router-dom';
import { LogOut, User, Gamepad2, Puzzle } from 'lucide-react';
import { THEME_CONFIG } from './config/themeConfig';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './Button';
import { useAuthContext } from '../../providers/AuthProvider';

interface NavbarProps {
  title?: string;
  children?: React.ReactNode;
  showThemeToggle?: boolean;
}

export function Navbar({ title = "Trader's Edge", children, showThemeToggle = true }: NavbarProps) {
  const navbarConfig = THEME_CONFIG.components.navbar;
  const { logout } = useAuthContext();
  
  return (
    <nav className={`${navbarConfig.background} shadow-sm border-b ${navbarConfig.border} fixed top-0 left-0 right-0 z-50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className={`text-xl font-semibold ${navbarConfig.text} hover:opacity-80`} aria-label="Go to Dashboard" title="Go to Dashboard">
              {title}
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/adventureMode" aria-label="Adventure Mode" title="Adventure Mode">
              <Button variant="icon" size="icon">
                <Gamepad2 className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/puzzleMode" aria-label="Puzzle Mode" title="Puzzle Mode">
              <Button variant="icon" size="icon">
                <Puzzle className="w-5 h-5" />
              </Button>
            </Link>
            {showThemeToggle && <ThemeToggle />}
            <Link to="/profile" aria-label="User profile" title="User profile">
              <Button variant="icon" size="icon">
                <User className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="icon" size="icon" onClick={logout} aria-label="Log out" title="Log out">
              <LogOut className="w-5 h-5" />
            </Button>
            {children}
          </div>
        </div>
      </div>
    </nav>
  );
}
