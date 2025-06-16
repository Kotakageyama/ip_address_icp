import React from 'react';
import './Header.css';

const Header: React.FC = () => {
  return (
    <header className="header">
      <h1>🌍 IP アドレス位置情報トラッカー</h1>
      <p className="subtitle">Internet Computer上で完全分散動作</p>
    </header>
  );
};

export default Header; 