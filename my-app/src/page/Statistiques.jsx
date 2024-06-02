import React, { useState, useEffect } from 'react';
import Card from './Dashboard/Card';
import DatePicker from 'react-datepicker';
import ProfilePage from './ProfilePage';
import { useParams } from 'react-router-dom';
import { serviceGlobal } from '../services/http-client.service';
import { state } from '../states/global.state';
import PieChart from './Charts/PieChart';
import ColumnComponent from './Charts/ColumnChart';
import AreaComponent from './Charts/AreaChart';
import ExportPDFButton from './Charts/ExportPDFButton';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';

const Statistiques = () => {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [options, setOptions] = useState({});
  const [refetch, setRefetch] = useState(false);

  const { reference } = useParams();

  const [data, setData] = useState({
    history: {
      pieces: 0,
      pallets: 0,
      cobotOperatingTime: 0,
      palletizationTime: 0,
      timeToPickup: 7,
      timeToReturn: 0,
      productionOrder: ""
    },
    user: {},
    chartStats: {
      totalPieces: 0,
      palatizedPieces: 0,
      previousMonth: [0, 0, 0, 0, 0, 0, 0],
      currentMonth: [0, 0, 0, 0, 0, 0, 0],
      weeklyPreviousMonth: [0, 0, 0, 0],
      weeklyCurrentMonth: [0, 0, 0, 0]
    }
  });

  useEffect(() => {
    let localOptions = {};

    if (reference) {
      setOptions({ reference });
      localOptions = { reference };
    } else {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setOptions({ userId: user._id });
      localOptions = { userId: user._id };
    }

    fetchData({ ...localOptions, startDate, endDate });

    if (state) {
      state.wsClient.addMessageListener(() => handleMessage(localOptions));
      return () => {
        state.wsClient.removeMessageListener(() => handleMessage(localOptions));
      };
    }
  }, [reference, refetch, startDate, endDate]);

  const handleMessage = (dataSTR) => {
    try {
      fetchData(options);
      setRefetch(!refetch);
    } catch (error) {
      console.error('Error parsing JSON:', error);
    }
  };

  const fetchData = async (options) => {
    try {
      const { startDate, endDate } = options;

      const query = {};
      if (startDate && endDate) {
        query.startDate = moment(startDate).format('YYYY-MM-DD');
        query.endDate = moment(endDate).format('YYYY-MM-DD');
      }

      const jsonData = await serviceGlobal.getRobotStats({ ...options, ...query });
      if (jsonData) {
        setData(jsonData || {});
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <div>
      <h2>Statistiques</h2>
      <div className="search-bar">
        <div>
          <DatePicker
            selected={startDate}
            onChange={date => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            placeholderText="Date début"
          />
          <DatePicker
            selected={endDate}
            onChange={date => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            placeholderText="Date fin"
          />
        </div>
        <ExportPDFButton data={data.chartStats} />
      </div>

      <div className="row1">
        <div className="col-md-3" style={{ margin: "1%", width: "230px", height: "210px" }}>
          <Card icon="pieces" title=" Pièces totales" value={data.history?.totalPieces || 0} />
        </div>
        <div className="col-md-3" style={{ margin: "1%", width: "230px", height: "210px" }}>
          <Card icon="pieces" title="Pièces palettisées" value={data.history?.palatizedPieces || 0} />
        </div>
        <div className="col-md-3" style={{ margin: "1%", width: "230px", height: "210px" }}>
          <Card icon="pieces" title="Temps de fonctionnement" value={`${data.history?.totalExecutionDuration || 0} sec`} />
        </div>
        <div className="col-md-3" style={{ margin: "1%", width: "230px", height: "210px" }}>
          <Card icon="pieces" title=" palette complet" value={`${data.history?.completedPallets || 0}`} />
        </div>
        <div className="col-md-3" style={{ margin: "1%", width: "230px", height: "210px" }}>
          <Card icon="pieces" title="Temps de palettisation" value={`${data.history?.palatizeExecutionDuration || 0} sec`} />
        </div>
        <div className="col-md-3" style={{ margin: "1%", width: "230px", height: "210px" }}>
          <Card icon="pieces" title="Temps de prise" value={`${data.history?.timeToPickup || 7} sec`} />
        </div>
        <div className="col-md-3" style={{ margin: "1%", width: "230px", height: "210px" }}>
          <Card icon="pieces" title="Temps de retour" value={`${data.history?.timeToReturn || 3} sec`} />
        </div>
        <div className="col-md-3" style={{ margin: "1%", width: "230px", height: "210px" }}>
          <Card icon="pieces" title="Ordre de Fabrication" value={` OF-1000-10000`} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        <PieChart totalPieces={data.chartStats.totalPieces} palatizedPieces={data.chartStats.palatizedPieces} />
        <ColumnComponent data={{ previousMonth: data.chartStats.previousMonth, currentMonth: data.chartStats.currentMonth }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px' }}>
        <AreaComponent data={{ previousMonth: data.chartStats.weeklyPreviousMonth, currentMonth: data.chartStats.weeklyCurrentMonth }} />
        <ProfilePage user={data.user} />
      </div>
    </div>
  );
};

export default Statistiques;
