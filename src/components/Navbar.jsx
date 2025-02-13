import React from 'react';
import '../styles/Navbar.css';

const navItems = [
    { name: 'Café com Resenha', image: '/img/dogras.png' },
    { name: 'Jr Esportes', image: '/img/feio.png' },
    { name: 'Jr Notícias', image: '/img/raniere.png' },
];

const Navbar = () => {
    return (
        <nav className="navbar">
            {navItems.map((item, index) => (
                <div className="nav-item" key={index}>
                    <span className='name-navbar'>{item.name}</span>
                    <img src={item.image} alt={item.name} />
                </div>
            ))}
        </nav>
    );
};

export default Navbar;
