import React, { useEffect, useState } from 'react';
import Header from './Header';
import 'antd/dist/antd.css';


const Layout = ({ children }) => {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        setVisible(true);
    }, []);

    return (
        <div className={`client-body-wrapper page-fade ${visible ? "show" : ""}`}>
            <Header />
            {children}
        </div>
    );
};

export default Layout;