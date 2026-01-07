import React from "react";
import PropTypes from "prop-types";
import "./Layout.css";

const Layout = ({
  children,
  header,
  footer,
  sidebar,
  className = "",
  ...props
}) => {
  return (
    <div className={`layout ${className}`} {...props}>
      {header && <header className="layout-header">{header}</header>}
      <div className="layout-content">
        {sidebar && <aside className="layout-sidebar">{sidebar}</aside>}
        <main className="layout-main">{children}</main>
      </div>
      {footer && <footer className="layout-footer">{footer}</footer>}
    </div>
  );
};

const LayoutHeader = ({ children, className = "", ...props }) => (
  <header className={`layout-header ${className}`} {...props}>
    {children}
  </header>
);

const LayoutFooter = ({ children, className = "", ...props }) => (
  <footer className={`layout-footer ${className}`} {...props}>
    {children}
  </footer>
);

const LayoutSidebar = ({ children, className = "", ...props }) => (
  <aside className={`layout-sidebar ${className}`} {...props}>
    {children}
  </aside>
);

const LayoutMain = ({ children, className = "", ...props }) => (
  <main className={`layout-main ${className}`} {...props}>
    {children}
  </main>
);

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  header: PropTypes.node,
  footer: PropTypes.node,
  sidebar: PropTypes.node,
  className: PropTypes.string,
};

LayoutHeader.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

LayoutFooter.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

LayoutSidebar.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

LayoutMain.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

Layout.Header = LayoutHeader;
Layout.Footer = LayoutFooter;
Layout.Sidebar = LayoutSidebar;
Layout.Main = LayoutMain;

export default Layout;
