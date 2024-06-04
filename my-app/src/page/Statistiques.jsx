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

function convertSecondsToHHMM(seconds) {

  if (!seconds) {
    return 0
  }

  if (seconds < 60) {
    return [seconds, 'sec'].join(' ')
  }

  // Calculate the hours and minutes from seconds
  const duration = moment.duration(seconds, 'seconds');
  const hours = Math.floor(duration.asHours());
  const minutes = duration.minutes();

  // Format hours and minutes to HH:MM
  const formattedTime = moment({ hour: hours, minute: minutes }).format('HH:mm');

  return formattedTime
}

const Statistiques = () => {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [options, setOptions] = useState({});
  const [currentUser, setCurrentUser] = useState({});
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

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user)
    if (reference) {
      setOptions({ reference });
      localOptions = { reference };
    } else {
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
      {currentUser?.role === 'Admin' &&
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
      }

      <div className="row1">
        <div className="col-md-3" style={{ margin: "1%", width: "230px", height: "210px" }}>
          <Card icon="pieces" title=" Pièces totales" value={data.history?.totalPieces || 0} />
        </div>
        <div className="col-md-3" style={{ margin: "1%", width: "230px", height: "210px" }}>
          <Card icon="pieces" title="Pièces palettisées" value={data.history?.palatizedPieces || 0} />
        </div>
        <div className="col-md-3" style={{ margin: "1%", width: "230px", height: "210px" }}>
          <Card icon="pieces" title="Temps de fonctionnement" value={convertSecondsToHHMM(data.history?.totalExecutionDuration)} />
        </div>
        <div className="col-md-3" style={{ margin: "1%", width: "230px", height: "210px" }}>
          <Card icon="pieces" title=" palette complet" value={`${data.history?.completedPallets || 0}`} />
        </div>
        <div className="col-md-3" style={{ margin: "1%", width: "230px", height: "210px" }}>
          <Card icon="pieces" title="Temps de palettisation" value={convertSecondsToHHMM(data.history?.palatizeExecutionDuration)} />
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
      <div className='flex flex-col gap-5'>
        <div className='flex justify-center gap-5'>
          <div className='flex-1'>
            <PieChart totalPieces={data.chartStats.totalPieces} palatizedPieces={data.chartStats.palatizedPieces} />
          </div>
          <div className='flex-1'>
            <ColumnComponent data={{ previousMonth: data.chartStats.previousMonth, currentMonth: data.chartStats.currentMonth }} />
          </div>
        </div>
        <div className='flex justify-center gap-5'>
          <div className='flex-1'>
            <AreaComponent data={{ previousMonth: data.chartStats.weeklyPreviousMonth, currentMonth: data.chartStats.weeklyCurrentMonth }} />
          </div>
          <div className='flex-1'>
            <ProfilePage user={data.user} reference={reference} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistiques;
