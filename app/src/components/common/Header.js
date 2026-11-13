// Legacy path: forwards to the design-system Header. Legacy default was no back button.
import React from 'react';
import UIHeader from '../ui/Header';

const Header = ({ showBack = false, ...props }) => <UIHeader showBack={showBack} {...props} />;

export default Header;
