import React from 'react'
import LogoEnova from '../LogoEnova.jpg';
import { ADMIN_SIDE_BAR_DATA, USER_SIDE_BAR_DATA } from "../Data/Data";
import { UilSignOutAlt } from '@iconscout/react-unicons'
import './Sidebar.css'
import { useState } from 'react';
import { useNavigate } from "react-router-dom"
import { useEffect } from 'react';
import { serviceUser } from '../services/http-client.service';


const Sidebar = ({ user = {} }) => {
    const navigate = useNavigate();
    const [selected, setSelected] = useState(-1);

    const [sidebarData, setSideBarData] = useState([])

    const handleLogout = () => {
        serviceUser.clear()
        navigate('/login');
    };
    useEffect(() => {
        if (!user.role && !localStorage.getItem('user')) {
            localStorage.clear()
            window.location.href = '/login';
          }

        if (selected === 0) {
            navigate("/Dashboard");
        }
        else if (selected === 1) {
            navigate("/ListUsers");
        }
        else if (selected === 2) {
            navigate("/ListRobot");
        }
        else if (selected === 3) {
            navigate("/HistoriquePage");
        }
        else if (selected === 4) {
            navigate("/Statistiques");
        }

        if (user.role === 'Admin') {
            setSideBarData(ADMIN_SIDE_BAR_DATA)
        } else {
            setSideBarData(USER_SIDE_BAR_DATA)
        }

    }, [selected, localStorage.getItem('user'), user]);

    return (
        <div className='Sidebar'>
            <div className='Enova'>
                <img src={LogoEnova} alt="logoEnova" />
            </div>
            <div className='menu'>
                {sidebarData && sidebarData.map((item, index) => {
                    return (
                        <div className={selected === index ? 'menuItem active' : 'menuItem'}
                            key={index}
                            onClick={() => setSelected(index)}

                        >
                            <item.icon />
                            <span>
                                {item.heading}
                            </span>
                        </div>
                    )
                })}
           <div className='menuItem' onClick={() => {
    const isConfirmed = window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?');
    if (isConfirmed) {
      handleLogout();
    }
      }}>
      <UilSignOutAlt />
       <span>Deconnexion</span>
        </div>
            </div>

        </div>
    )
}

export default Sidebar