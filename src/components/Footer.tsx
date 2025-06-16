import React from 'react';
import './Footer.css';

interface FooterProps {
  canisterId: string;
}

const Footer: React.FC<FooterProps> = ({ canisterId }) => {
  return (
    <footer className="footer">
      <p>
        <strong>Internet Computer</strong> 上で完全分散動作 | 
        Canister ID: <span className="canister-id">{canisterId}</span>
      </p>
    </footer>
  );
};

export default Footer; 