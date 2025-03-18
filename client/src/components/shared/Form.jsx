import React from 'react';
import PropTypes from 'prop-types';
import './Form.css';

const Form = ({ 
  onSubmit, 
  children, 
  className = '',
  ...props 
}) => {
  return (
    <form 
      className={`form ${className}`}
      onSubmit={onSubmit}
      {...props}
    >
      {children}
    </form>
  );
};

const FormGroup = ({ 
  label, 
  children, 
  error, 
  className = '' 
}) => {
  return (
    <div className={`form-group ${className}`}>
      {label && <label>{label}</label>}
      {children}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

const FormInput = ({ 
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  ...props 
}) => {
  return (
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className={`form-input ${className}`}
      {...props}
    />
  );
};

Form.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

FormGroup.propTypes = {
  label: PropTypes.string,
  children: PropTypes.node.isRequired,
  error: PropTypes.string,
  className: PropTypes.string,
};

FormInput.propTypes = {
  type: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

Form.Group = FormGroup;
Form.Input = FormInput;

export default Form; 