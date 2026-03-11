import React, { useState, useCallback, useEffect } from 'react';
import * as XLSX from 'sheetjs-style';
import RouteCalculation from './components/RouteCalculation';
import './App.css';

interface PaceRow {
  id: number;
  km: number;
  pace: string;
  sectionTime: string;
  cumulativeTime: string;
  runningAvg: string;
  targetHeartRate?: string;
  intensityZone?: string;
}

interface UserProfile {
  height: number;
  weight: number;
  age: number;
  vo2max: number;
  bmi?: number;
  maxHeartRate?: number;
  restingHR?: number;
}

type TabMode = 'general' | 'route';

function App() {
  const [tabMode, setTabMode] = useState<TabMode>('general');
  const [rows, setRows] = useState<PaceRow[]>([
    { id: 1, km: 1, pace: '', sectionTime: '00:00', cumulativeTime: '00:00', runningAvg: '00:00' }
  ]);
  const [totalDistance, setTotalDistance] = useState('1km');
  const [totalTime, setTotalTime] = useState('00:00');
  const [avgPace, setAvgPace] = useState('00:00');
  const [userProfile, setUserProfile] = useState<UserProfile>({
    height: 0,
    weight: 0,
    age: 0,
    vo2max: 0,
    restingHR: 60
  });
  const [showProfile, setShowProfile] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // 화면 크기 감지
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const parseTimeToSeconds = useCallback((timeStr: string): number => {
    if (!timeStr || timeStr.trim() === '') return 0;
    
    const [minutes, seconds] = timeStr.split(':').map(Number);
    return minutes * 60 + seconds;
  }, []);

  const formatSecondsToTime = useCallback((totalSeconds: number): string => {
    if (totalSeconds === 0) return '00:00';
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }, []);

  const validatePaceInput = useCallback((value: string): boolean => {
    if (value === '') return true;
    
    // 더 유연한 입력 허용: 1:30, 01:30, 4:05 등
    const paceRegex = /^\d{1,2}:\d{2}$/;
    if (!paceRegex.test(value)) return false;
    
    const [minutes, seconds] = value.split(':').map(Number);
    return seconds < 60 && minutes >= 0;
  }, []);

  const calculateBMI = useCallback((height: number, weight: number): number => {
    if (height === 0 || weight === 0) return 0;
    const heightInM = height / 100;
    return Math.round((weight / (heightInM * heightInM)) * 10) / 10;
  }, []);

  const calculateMaxHeartRate = useCallback((age: number): number => {
    return 220 - age;
  }, []);

  const calculateTargetHeartRate = useCallback((maxHR: number, vo2max: number, paceSeconds: number): { rate: number; zone: string } => {
    if (maxHR === 0 || vo2max === 0 || paceSeconds === 0) return { rate: 0, zone: '-' };
    
    // 페이스를 기반으로 운동 강도 추정 (매우 단순화된 방식)
    const restingHR = 60; // 기본 안정시 심박수
    let intensity = 0;
    
    // 페이스에 따른 강도 구간 (분:초당 km)
    if (paceSeconds <= 240) { // 4분 이하 - 최대 강도
      intensity = 0.9;
    } else if (paceSeconds <= 300) { // 4-5분 - 고강도
      intensity = 0.8;
    } else if (paceSeconds <= 360) { // 5-6분 - 중고강도
      intensity = 0.7;
    } else if (paceSeconds <= 420) { // 6-7분 - 중강도
      intensity = 0.6;
    } else { // 7분 이상 - 저중강도
      intensity = 0.5;
    }
    
    const targetHR = Math.round(restingHR + (maxHR - restingHR) * intensity);
    
    // 강도 구간 분류
    let zone = '';
    if (intensity >= 0.9) zone = 'Zone 5 (최대)';
    else if (intensity >= 0.8) zone = 'Zone 4 (고강도)';
    else if (intensity >= 0.7) zone = 'Zone 3 (중고강도)';
    else if (intensity >= 0.6) zone = 'Zone 2 (중강도)';
    else zone = 'Zone 1 (저강도)';
    
    return { rate: targetHR, zone };
  }, []);

  useEffect(() => {
    let cumulativeSeconds = 0;
    let validPaces = 0;
    const maxHR = userProfile.age > 0 ? calculateMaxHeartRate(userProfile.age) : 0;
    
    const updatedRows = rows.map((row, index) => {
      if (row.pace && validatePaceInput(row.pace)) {
        const sectionSeconds = parseTimeToSeconds(row.pace);
        cumulativeSeconds += sectionSeconds;
        validPaces++;
        
        const currentDistance = index + 1;
        const avgSeconds = Math.floor(cumulativeSeconds / currentDistance);
        
        const newSectionTime = formatSecondsToTime(sectionSeconds);
        const newCumulativeTime = formatSecondsToTime(cumulativeSeconds);
        const newRunningAvg = formatSecondsToTime(avgSeconds);
        
        // 심박수 계산
        const hrData = calculateTargetHeartRate(maxHR, userProfile.vo2max, sectionSeconds);
        const newTargetHeartRate = hrData.rate > 0 ? `${hrData.rate}bpm` : '-';
        const newIntensityZone = hrData.zone;
        
        // 값이 변경된 경우에만 업데이트
        if (row.sectionTime !== newSectionTime || 
            row.cumulativeTime !== newCumulativeTime || 
            row.runningAvg !== newRunningAvg ||
            row.targetHeartRate !== newTargetHeartRate ||
            row.intensityZone !== newIntensityZone) {
          return {
            ...row,
            sectionTime: newSectionTime,
            cumulativeTime: newCumulativeTime,
            runningAvg: newRunningAvg,
            targetHeartRate: newTargetHeartRate,
            intensityZone: newIntensityZone
          };
        }
        return row;
      } else {
        const newCumulativeTime = cumulativeSeconds > 0 ? formatSecondsToTime(cumulativeSeconds) : '00:00';
        if (row.sectionTime !== '00:00' || 
            row.cumulativeTime !== newCumulativeTime || 
            row.runningAvg !== '00:00' ||
            row.targetHeartRate !== '-' ||
            row.intensityZone !== '-') {
          return {
            ...row,
            sectionTime: '00:00',
            cumulativeTime: newCumulativeTime,
            runningAvg: '00:00',
            targetHeartRate: '-',
            intensityZone: '-'
          };
        }
        return row;
      }
    });
    
    // 실제로 변경된 경우에만 상태 업데이트
    const hasChanges = updatedRows.some((row, index) => row !== rows[index]);
    if (hasChanges) {
      setRows(updatedRows);
    }
    
    const newTotalDistance = `${rows.length}km`;
    const newTotalTime = formatSecondsToTime(cumulativeSeconds);
    const newAvgPace = validPaces > 0 ? formatSecondsToTime(Math.floor(cumulativeSeconds / validPaces)) : '00:00';
    
    if (totalDistance !== newTotalDistance) setTotalDistance(newTotalDistance);
    if (totalTime !== newTotalTime) setTotalTime(newTotalTime);
    if (avgPace !== newAvgPace) setAvgPace(newAvgPace);
  }, [rows, parseTimeToSeconds, formatSecondsToTime, validatePaceInput, totalDistance, totalTime, avgPace, userProfile, calculateMaxHeartRate, calculateTargetHeartRate]);

  const addRow = useCallback(() => {
    const newKm = rows.length + 1;
    const newRow: PaceRow = {
      id: newKm,
      km: newKm,
      pace: '',
      sectionTime: '00:00',
      cumulativeTime: '00:00',
      runningAvg: '00:00'
    };
    setRows([...rows, newRow]);
    
    // 새 행이 추가된 후 해당 입력 필드로 포커스 이동
    setTimeout(() => {
      const newRowInput = document.querySelector(`tr:nth-child(${newKm}) .pace-input`) as HTMLInputElement;
      if (newRowInput) {
        newRowInput.focus();
      }
    }, 10);
  }, [rows]);

  const deleteRow = (id: number) => {
    if (rows.length <= 1) {
      alert('최소 1개의 구간은 필요합니다.');
      return;
    }
    
    const filteredRows = rows.filter(row => row.id !== id);
    const renumberedRows = filteredRows.map((row, index) => ({
      ...row,
      id: index + 1,
      km: index + 1
    }));
    
    setRows(renumberedRows);
  };

  const clearAll = () => {
    if (window.confirm('모든 데이터를 삭제하시겠습니까?')) {
      setRows([
        { id: 1, km: 1, pace: '', sectionTime: '00:00', cumulativeTime: '00:00', runningAvg: '00:00' }
      ]);
    }
  };

  const updatePace = (id: number, value: string) => {
    // 입력값을 정리하고 포맷
    let formattedValue = value;
    
    // 숫자와 콜론만 허용
    formattedValue = formattedValue.replace(/[^\d:]/g, '');
    
    // 콜론이 없고 3-4자리 숫자인 경우 자동으로 콜론 추가
    if (!/:/.test(formattedValue) && /^\d{3,4}$/.test(formattedValue)) {
      if (formattedValue.length === 3) {
        // 330 -> 3:30
        formattedValue = formattedValue[0] + ':' + formattedValue.slice(1);
      } else if (formattedValue.length === 4) {
        // 1030 -> 10:30
        formattedValue = formattedValue.slice(0, 2) + ':' + formattedValue.slice(2);
      }
    }
    
    setRows(rows.map(row => 
      row.id === id ? { ...row, pace: formattedValue } : row
    ));
  };

  const updateUserProfile = (field: keyof UserProfile, value: number) => {
    const updatedProfile = { ...userProfile, [field]: value };
    
    // BMI 자동 계산
    if (field === 'height' || field === 'weight') {
      updatedProfile.bmi = calculateBMI(updatedProfile.height, updatedProfile.weight);
    }
    
    // 최대 심박수 자동 계산
    if (field === 'age') {
      updatedProfile.maxHeartRate = calculateMaxHeartRate(updatedProfile.age);
    }
    
    setUserProfile(updatedProfile);
  };

  const exportToExcel = useCallback(() => {
    const data = [];
    
    // 헤더 추가
    data.push(['거리(km)', '페이스(분:초)', '구간시간', '누적시간', '평균페이스', '목표심박수', '강도구간']);
    
    // 데이터 행 추가
    rows.forEach((row) => {
      data.push([
        row.km, 
        row.pace, 
        row.sectionTime, 
        row.cumulativeTime, 
        row.runningAvg,
        row.targetHeartRate || '-',
        row.intensityZone || '-'
      ]);
    });
    
    // 요약 정보 추가
    data.push([]);
    data.push(['요약 정보']);
    data.push(['총 거리', totalDistance]);
    data.push(['총 시간', totalTime]);
    data.push(['전체 평균 페이스', avgPace]);
    
    // 사용자 프로필 정보 추가 (있는 경우)
    if (userProfile.age > 0 || userProfile.height > 0 || userProfile.weight > 0 || userProfile.vo2max > 0) {
      data.push([]);
      data.push(['사용자 프로필']);
      if (userProfile.height > 0) data.push(['키', `${userProfile.height}cm`]);
      if (userProfile.weight > 0) data.push(['체중', `${userProfile.weight}kg`]);
      if (userProfile.age > 0) data.push(['나이', `${userProfile.age}세`]);
      if (userProfile.vo2max > 0) data.push(['VO2Max', userProfile.vo2max]);
      if (userProfile.bmi && userProfile.bmi > 0) data.push(['BMI', userProfile.bmi]);
      if (userProfile.maxHeartRate && userProfile.maxHeartRate > 0) data.push(['최대 심박수', `${userProfile.maxHeartRate}bpm`]);
    }
    
    // Excel 파일 생성
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // 컬럼 너비 설정
    ws['!cols'] = [
      {wch: 10}, // 거리
      {wch: 15}, // 페이스
      {wch: 12}, // 구간시간
      {wch: 12}, // 누적시간
      {wch: 15}, // 평균페이스
      {wch: 15}, // 목표심박수
      {wch: 20}  // 강도구간
    ];
    
    // 시트 추가
    XLSX.utils.book_append_sheet(wb, ws, 'Pace Calculator');
    
    // 파일명 생성
    const now = new Date();
    const dateStr = now.getFullYear() + 
                   String(now.getMonth() + 1).padStart(2, '0') + 
                   String(now.getDate()).padStart(2, '0');
    const filename = `pace_calculator_${dateStr}.xlsx`;
    
    // 파일 다운로드
    XLSX.writeFile(wb, filename);
  }, [rows, totalDistance, totalTime, avgPace, userProfile]);

  // 키보드 단축키 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
          case 's':
            e.preventDefault();
            exportToExcel();
            break;
          case 'n':
            e.preventDefault();
            addRow();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [addRow, exportToExcel]);

  return (
    <div className="container">
      <header>
        <h1>🏃‍♂️ Pace 전략 계산기</h1>
        <p>각 구간별 페이스를 입력하거나 경로를 선택하여 런닝 전략을 계획하세요</p>
      </header>

      {/* 공통 프로필 섹션 */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setShowProfile(!showProfile)}
          className="btn btn-secondary"
          style={{ marginBottom: '10px' }}
        >
          👤 프로필 {showProfile ? '숨기기' : '설정'}
        </button>

        {showProfile && (
          <div className="profile-section">
            <h3>🏃‍♂️ 사용자 프로필</h3>
            <div className="profile-inputs">
              <div className="input-group">
                <label>키 (cm):</label>
                <input
                  type="number"
                  value={userProfile.height || ''}
                  onChange={(e) => updateUserProfile('height', Number(e.target.value))}
                  placeholder="170"
                />
              </div>
              <div className="input-group">
                <label>체중 (kg):</label>
                <input
                  type="number"
                  value={userProfile.weight || ''}
                  onChange={(e) => updateUserProfile('weight', Number(e.target.value))}
                  placeholder="70"
                />
              </div>
              <div className="input-group">
                <label>나이:</label>
                <input
                  type="number"
                  value={userProfile.age || ''}
                  onChange={(e) => updateUserProfile('age', Number(e.target.value))}
                  placeholder="30"
                />
              </div>
              <div className="input-group">
                <label>VO2Max:</label>
                <input
                  type="number"
                  value={userProfile.vo2max || ''}
                  onChange={(e) => updateUserProfile('vo2max', Number(e.target.value))}
                  placeholder="45"
                />
              </div>
            </div>
            {userProfile.bmi && userProfile.bmi > 0 && (
              <div className="calculated-values">
                <div className="calc-item">
                  <strong>BMI:</strong> {userProfile.bmi}
                  {userProfile.bmi < 18.5 && <span className="bmi-status"> (저체중)</span>}
                  {userProfile.bmi >= 18.5 && userProfile.bmi < 25 && <span className="bmi-status"> (정상)</span>}
                  {userProfile.bmi >= 25 && userProfile.bmi < 30 && <span className="bmi-status"> (과체중)</span>}
                  {userProfile.bmi >= 30 && <span className="bmi-status"> (비만)</span>}
                </div>
                {userProfile.maxHeartRate && (
                  <div className="calc-item">
                    <strong>최대 심박수:</strong> {userProfile.maxHeartRate}bpm
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 탭 전환 UI */}
      <div style={{
        display: 'flex',
        gap: isMobile ? '8px' : '10px',
        marginBottom: isMobile ? '15px' : '20px',
        borderBottom: '2px solid #e9ecef',
        paddingBottom: '10px'
      }}>
        <button
          onClick={() => setTabMode('general')}
          className={`btn ${tabMode === 'general' ? 'btn-primary' : 'btn-secondary'}`}
          style={{
            flex: 1,
            padding: isMobile ? '12px' : '15px',
            fontSize: isMobile ? '1em' : '1.1em',
            fontWeight: 'bold',
            minHeight: isMobile ? '50px' : 'auto'
          }}
        >
          📊 일반계산
        </button>
        <button
          onClick={() => setTabMode('route')}
          className={`btn ${tabMode === 'route' ? 'btn-primary' : 'btn-secondary'}`}
          style={{
            flex: 1,
            padding: isMobile ? '12px' : '15px',
            fontSize: isMobile ? '1em' : '1.1em',
            fontWeight: 'bold',
            minHeight: isMobile ? '50px' : 'auto'
          }}
        >
          🗺️ 경로계산
        </button>
      </div>

      {tabMode === 'general' ? (
        <>
          <div className="controls">
        <button onClick={addRow} className="btn btn-primary">
          ➕ 구간 추가
        </button>
        <button onClick={exportToExcel} className="btn btn-secondary">
          📊 엑셀로 내보내기
        </button>
        <button onClick={clearAll} className="btn btn-danger">
          🗑️ 전체 삭제
        </button>
      </div>

      <div className="summary-cards">
        <div className="card">
          <div className="card-title">총 거리</div>
          <div className="card-value">{totalDistance}</div>
        </div>
        <div className="card">
          <div className="card-title">총 시간</div>
          <div className="card-value">{totalTime}</div>
        </div>
        <div className="card">
          <div className="card-title">평균 페이스</div>
          <div className="card-value">{avgPace}</div>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>거리(km)</th>
              <th>페이스(분:초)</th>
              <th>구간시간</th>
              <th>누적시간</th>
              <th>평균페이스</th>
              <th>목표심박수</th>
              <th>강도구간</th>
              <th>삭제</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="km-display">{row.km}</td>
                <td>
                  <input
                    type="text"
                    className={`pace-input ${!validatePaceInput(row.pace) && row.pace ? 'invalid' : ''}`}
                    placeholder="4:30 또는 430"
                    pattern="[0-9]{1,2}:[0-9]{2}"
                    value={row.pace}
                    onChange={(e) => updatePace(row.id, e.target.value)}
                    onKeyDown={(e) => {
                      // Enter 키를 누르면 다음 행의 입력 필드로 포커스 이동
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const nextRow = row.id + 1;
                        const nextInput = document.querySelector(`tr:nth-child(${nextRow}) .pace-input`) as HTMLInputElement;
                        if (nextInput) {
                          nextInput.focus();
                        } else if (row.id === rows.length) {
                          // 마지막 행에서 Enter를 누르면 새 행 추가
                          addRow();
                        }
                      }
                    }}
                    maxLength={5}
                  />
                </td>
                <td className="section-time">{row.sectionTime}</td>
                <td className="cumulative-time">{row.cumulativeTime}</td>
                <td className="running-avg">{row.runningAvg}</td>
                <td className="heart-rate">{row.targetHeartRate || '-'}</td>
                <td className="intensity-zone">{row.intensityZone || '-'}</td>
                <td>
                  <button 
                    className="btn-delete"
                    onClick={() => deleteRow(row.id)}
                  >
                    ❌
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="instructions">
        <h3>📋 사용법</h3>
        <ul>
          <li><strong>페이스 입력:</strong> "4:30" 또는 "430" 형식으로 입력 (4분 30초)</li>
          <li><strong>빠른 입력:</strong> Enter 키로 다음 구간으로 이동, 마지막에서 Enter시 구간 추가</li>
          <li><strong>프로필 설정:</strong> 키/체중/나이/VO2Max를 입력하면 BMI와 목표 심박수가 자동 계산됩니다</li>
          <li><strong>심박수 계산:</strong> 페이스에 따라 운동 강도별 목표 심박수가 자동으로 표시됩니다</li>
          <li><strong>구간 추가:</strong> "구간 추가" 버튼 또는 Ctrl/Cmd+N</li>
          <li><strong>자동 계산:</strong> 누적시간, 평균페이스, 심박수가 실시간으로 계산됩니다</li>
          <li><strong>엑셀 내보내기:</strong> 계산 결과를 Excel 파일로 다운로드 (Ctrl/Cmd+S)</li>
        </ul>
      </div>
        </>
      ) : (
        <>
          {/* 경로 계산 컴포넌트 */}
          {userProfile.age > 0 && userProfile.vo2max > 0 ? (
            <RouteCalculation userProfile={{
              age: userProfile.age,
              weight: userProfile.weight,
              height: userProfile.height,
              restingHR: userProfile.restingHR || 60,
              maxHR: userProfile.maxHeartRate || calculateMaxHeartRate(userProfile.age),
              vo2max: userProfile.vo2max
            }} />
          ) : (
            <div className="instructions">
              <h3>⚠️ 프로필 설정 필요</h3>
              <p>경로 계산을 사용하려면 위의 "프로필 설정" 버튼을 클릭하여 나이와 VO2Max를 입력해주세요.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
