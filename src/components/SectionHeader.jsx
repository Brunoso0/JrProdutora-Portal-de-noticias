import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/SectionHeader.css';

const SectionHeader = ({ title, linkText, linkTo, className = "" }) => {
    return (
        <div className={`section-header ${className}`}>
            <h2>{title}</h2>
            <Link to={linkTo}>{linkText}</Link>
        </div>
    );
};

export default SectionHeader;
