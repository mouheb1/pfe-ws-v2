import React, { useState, useEffect } from 'react';
import { Table } from 'react-bootstrap';
import { serviceHistory, serviceUser } from './services/http-client.service';
import { useLocation, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import 'react-datepicker/dist/react-datepicker.css';
import './HistoriquePage.css';

const HistoriquePage = () => {
  const [historyData, setHistoryData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [date, setDate] = useState(new Date());

  const navigate = useNavigate();
  const location = useLocation();
  const refirectPath = serviceUser.verifyConnectUser(location.pathname);
  if (!refirectPath.state) { navigate(refirectPath.path); }

  useEffect(() => {
    fetchHistoryData();
  }, [searchTerm, date]);

  const fetchHistoryData = async () => {
    try {
      const data = await serviceHistory.selectAll({ search: searchTerm, date });
      setHistoryData(data);
    } catch (error) {
      console.error('Error fetching history data', error);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  }

  const gotToStats = (item) => {
    navigate(`/Statistiques/${item?.robot?.reference}`)
  }

  return (
    <div className="history-list">
      <h2>Historique</h2>
      <div className="search-bar">
        <DatePicker
          selected={date}
          onChange={date => setDate(date)}
          selectsStart
          startDate={date}
          endDate={date}
          placeholderText="Date début"
        />
        <input
          type="text"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Ref Robot</th>
            <th>Debut d'execution</th>
            <th>Fin d'execution</th>
            <th>Nombre de pièces totales</th>
            <th>Nombre de pièces palettisées</th>
            <th>Utilisateurs</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {historyData.map(item => (
            <tr key={item._id}>
              <td className="text-center">{(item.robot ? item.robot.reference : "vide")}</td>
              <td className="text-center">{moment(item.startExecutionAt).format('YYYY-MM-DD HH:mm:ss')}</td>
              <td className="text-center">{moment(item.endExecutionAt).format('YYYY-MM-DD HH:mm:ss')}</td>
              <td className="text-center">{(item.robot ? item.robot.totalPieces : "vide")}</td>
              <td className="text-center">{item.palatizedPieces}</td>
              <td className="border px-4 py-2 text-center">{item.user ? `${item.user.nom} ${item.user.prenom}` : "vide"}</td>
              <td className='text-center' onClick={() => gotToStats(item)}>
                <i className="fas fa-eye cursor-pointer"></i>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default HistoriquePage;
