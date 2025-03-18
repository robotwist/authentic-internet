import React from 'react';
import PropTypes from 'prop-types';
import './Button.css';

const Button = ({ 
  children, 
  variant = 'primary', 
  type = 'button', 
  onClick, 
  disabled = false,
  className = '',
  as: Component = 'button',
  ...props 
}) => {
  const buttonProps = Component === 'button' ? { type } : {};
  
  return (
    <Component
      className={`button ${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...buttonProps}
      {...props}
    >
      {children}
    </Component>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'success', 'link']),
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  as: PropTypes.elementType,
};

export default Button; 