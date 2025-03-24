import React from 'react';
import '../styles/Navbar.css';

const navItems = [
    {name: 'Café com Resenha'},
    {name: 'Jr Esportes'},
    {name: 'Jr Noticias'},
]

const Navbar = () => {
    return (
        <nav className="navbar">
            {navItems.map((item, index) => (
                <div className='nav-item' key={index}>
                    <h4 className='name-navbar'>{item.name}</h4>
                </div>
            ))}
        </nav>
    );
};


export default Navbar;