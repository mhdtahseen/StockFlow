import { NavLink } from 'react-router-dom';

const BottomNav = () => {
  const tabs = [
    { name: 'Home', path: '/', icon: 'home' },
    { name: 'Inventory', path: '/inventory', icon: 'inventory_2' },
    { name: 'Add', path: '/add', icon: 'add', isFab: true },
    { name: 'Wallet', path: '/wallet', icon: 'account_balance_wallet' },
    { name: 'Stats', path: '/analytics', icon: 'analytics' },
  ];

  return (
    <nav className="fixed bottom-0 w-full bg-white border-t border-gray-100 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
      <div className="flex justify-around items-center h-20 px-2">
        {tabs.map((tab) => {
          if (tab.isFab) {
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className="relative -top-6 flex items-center justify-center w-14 h-14 bg-primary-500 rounded-full shadow-lg text-white transform transition hover:scale-105 active:scale-95"
              >
                <span className="material-icons-round text-3xl">{tab.icon}</span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-16 h-16 transition-colors ${
                  isActive ? 'text-primary-500' : 'text-gray-400 hover:text-gray-600'
                }`
              }
            >
              <span className="material-icons-round text-2xl mb-1">{tab.icon}</span>
              <span className="text-[10px] font-medium">{tab.name}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
