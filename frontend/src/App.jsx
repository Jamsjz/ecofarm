import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Landing from './components/Landing';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/game" element={<Home />} />
                <Route path="*" element={<Home />} />
            </Routes>
        </Router>
    );
}

export default App;
