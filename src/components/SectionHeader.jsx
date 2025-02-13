import React from 'react';
import '../styles/SectionHeader.css';

const SectionHeader = ({ title, link }) => {
    return (
        <div className="section-header">
            <h2>{title}</h2>
            <a href="http://localhost:3000/admin">{link}</a>
        </div>
    );
};

export default SectionHeader;
