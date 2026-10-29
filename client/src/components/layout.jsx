import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight, MapPin, Heart, LogOut, Home, UserRound, Settings, Trophy, Users, ShieldCheck, LayoutDashboard, Bell, Package } from 'lucide-react';
import { Brand, ThemeToggle, Button, Badge } from './ui';
import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery } from '@tanstack/react-query';
import { query } from '../lib/api';

function NotificationBell() {
  const { user } = useAuth();
  const notifications = useQuery(query('notifications', '/notifications', { enabled: !!user, refetchInterval: 30000 }));
  const unread = (notifications.data || []).filter(n => !n.read).length;

  if (!user) return null;
  return (
    <NavLink to="/orders" className="bell-button" aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}>
      <Bell size={17} />
      {unread > 0 && <span className="bell-pip">{unread > 9 ? '9+' : unread}</span>}
    </NavLink>
  );
}

export function Layout() {
  const location = useLocation(), navigate = useNavigate(), { user, logout } = useAuth();
  useEffect(() => { if (!location.hash) window.scrollTo(0, 0); }, [location.pathname, location.hash]);

  const role = user?.role;

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" aria-label="ShareBite home"><Brand /></Link>

          <nav className="desktop-nav" aria-label="Main navigation">
            <NavLink to="/discover">Explore food</NavLink>
            <NavLink to="/ngos">NGO directory</NavLink>
            <NavLink to="/leaderboard">Leaderboard</NavLink>
            {role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
          </nav>

          <div className="row header-actions">
            <span className="location-tag"><MapPin size={13} />Jaipur, India</span>
            <ThemeToggle />
            <NotificationBell />
            {user ? (
              <>
                <Link className="user-chip" to={role === 'admin' ? '/admin' : '/dashboard'}>
                  <span>
                    <strong>{user.name}</strong>
                    <small>{role} · {user.verificationStatus}</small>
                  </span>
                </Link>
                <Button variant="ghost" size="icon" aria-label="Sign out" onClick={() => { logout(); navigate('/'); }}>
                  <LogOut size={17} />
                </Button>
                <Button asChild size="sm" variant="secondary">
                  <Link to="/login">Switch role</Link>
                </Button>
              </>
            ) : (
              <Button asChild size="sm">
                <Link to="/login">Join the table<ArrowUpRight size={14} /></Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Workspace nav for donors/NGOs */}
      {role === 'donor' && (
        <div className="container workspace-nav">
          <NavLink to="/donate">Share food</NavLink>
          <NavLink to="/discover">Explore food</NavLink>
          <NavLink to="/orders">My orders</NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
        </div>
      )}
      {role === 'ngo' && (
        <div className="container workspace-nav">
          <NavLink to="/discover">Collect food</NavLink>
          <NavLink to="/orders">My orders</NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/ngos">Directory</NavLink>
        </div>
      )}

      <main id="main-content">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-top">
            <div>
              <Brand />
              <p>Good food. Good neighbours.<br />A little more good in the world.</p>
            </div>
            <div>
              <span className="eyebrow">Around the table</span>
              <Link to="/discover">Food being shared</Link>
              <Link to="/ngos">Community organisations</Link>
              <Link to="/leaderboard">Leaderboard</Link>
            </div>
            <div>
              <span className="eyebrow">Get involved</span>
              <Link to="/login">Join ShareBite</Link>
              <a href="/#how-it-works">How it works</a>
            </div>
            <div className="footer-note">
              <Heart size={23} />
              <h3>Made with care.<br />Shared with love.</h3>
              <p>Starting in Jaipur. Growing through kindness.</p>
            </div>
          </div>
          <div className="footer-bottom">
            <span>&copy; {new Date().getFullYear()} ShareBite</span>
            <span>Hackathon demo · Organisations and histories are illustrative.</span>
            <span>Every meal matters.</span>
          </div>
        </div>
      </footer>

      <nav className="mobile-tabs" aria-label="Mobile navigation">
        <NavLink to="/" end><Home size={19} />Home</NavLink>
        <NavLink to="/discover"><MapPin size={19} />Explore</NavLink>
        {role === 'donor' || role === 'ngo' ? (
          <NavLink to="/orders"><Package size={19} />Orders</NavLink>
        ) : null}
        {role === 'donor' || role === 'ngo' ? (
          <NavLink to="/dashboard"><LayoutDashboard size={19} />Impact</NavLink>
        ) : null}
        <NavLink to="/login"><UserRound size={19} />{user ? 'Switch' : 'Join'}</NavLink>
        {role === 'admin' && <NavLink to="/admin"><ShieldCheck size={19} />Admin</NavLink>}
      </nav>
    </>
  );
}
