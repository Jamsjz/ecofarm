import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Navbar() {
    const location = useLocation();
    const [hoveredPath, setHoveredPath] = useState(location.pathname);

    const isActive = (path) => location.pathname === path;

    const navItems = [
        { name: 'Home', path: '/', type: 'internal' },
        { name: 'Pathologer', path: 'http://localhost:5173', type: 'external' },
        { name: 'About Us', path: '/about', type: 'internal' }
    ];

    return (
        <div className="absolute top-6 left-0 right-0 z-50 flex justify-center">
            <nav
                className="inline-flex items-center justify-center p-1.5 rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
                onMouseLeave={() => setHoveredPath(location.pathname)}
            >
                {navItems.map((item) => {
                    const isHovered = hoveredPath === item.path;
                    const isCurrent = isActive(item.path);

                    const LinkComponent = item.type === 'internal' ? Link : 'a';
                    const props = item.type === 'internal' ? { to: item.path } : { href: item.path };

                    return (
                        <LinkComponent
                            key={item.name}
                            {...props}
                            className={`
                                relative px-5 py-2 rounded-full text-sm font-bold tracking-wide transition-colors duration-300
                                ${isCurrent ? 'text-white' : 'text-white/70 hover:text-white'}
                            `}
                            onMouseEnter={() => setHoveredPath(item.path)}
                        >
                            {isHovered && (
                                <motion.div
                                    layoutId="navbar-hover"
                                    className="absolute inset-0 bg-white/20 rounded-full"
                                    transition={{
                                        type: "spring",
                                        bounce: 0.2,
                                        duration: 0.6
                                    }}
                                    style={{ zIndex: -1 }}
                                />
                            )}
                            <span className="relative z-10">{item.name}</span>
                        </LinkComponent>
                    );
                })}
            </nav>
        </div>
    );
}
