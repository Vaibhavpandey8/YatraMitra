import React from "react";

const Footer = () => {
  return (
    <footer className="crm-app-footer">
      <div className="footer-content">
        &copy; {new Date().getFullYear()} <strong>YatraMitra CRM</strong>. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
