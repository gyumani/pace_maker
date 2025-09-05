import React, { useState, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './App.css';

interface PaceRow {
  id: number;
  km: number;
  pace: string;
  sectionTime: string;
  cumulativeTime: string;
  runningAvg: string;
}

function App() {
  const [rows, setRows] = useState<PaceRow[]>([
    { id: 1, km: 1, pace: '', sectionTime: '00:00', cumulativeTime: '00:00', runningAvg: '00:00' }
  ]);
  const [totalDistance, setTotalDistance] = useState('1km');
  const [totalTime, setTotalTime] = useState('00:00');
  const [avgPace, setAvgPace] = useState('00:00');

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

  useEffect(() => {
    let cumulativeSeconds = 0;
    let validPaces = 0;
    
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
        
        // 값이 변경된 경우에만 업데이트
        if (row.sectionTime !== newSectionTime || 
            row.cumulativeTime !== newCumulativeTime || 
            row.runningAvg !== newRunningAvg) {
          return {
            ...row,
            sectionTime: newSectionTime,
            cumulativeTime: newCumulativeTime,
            runningAvg: newRunningAvg
          };
        }
        return row;
      } else {
        const newCumulativeTime = cumulativeSeconds > 0 ? formatSecondsToTime(cumulativeSeconds) : '00:00';
        if (row.sectionTime !== '00:00' || 
            row.cumulativeTime !== newCumulativeTime || 
            row.runningAvg !== '00:00') {
          return {
            ...row,
            sectionTime: '00:00',
            cumulativeTime: newCumulativeTime,
            runningAvg: '00:00'
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
  }, [rows, parseTimeToSeconds, formatSecondsToTime, validatePaceInput, totalDistance, totalTime, avgPace]);

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

  const exportToExcel = useCallback(() => {
    const data = [];
    
    // 헤더 추가
    data.push(['거리(km)', '페이스(분:초)', '구간시간', '누적시간', '평균페이스']);
    
    // 데이터 행 추가
    rows.forEach((row) => {
      data.push([row.km, row.pace, row.sectionTime, row.cumulativeTime, row.runningAvg]);
    });
    
    // 요약 정보 추가
    data.push([]);
    data.push(['요약 정보']);
    data.push(['총 거리', totalDistance]);
    data.push(['총 시간', totalTime]);
    data.push(['전체 평균 페이스', avgPace]);
    
    // Excel 파일 생성
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // 컬럼 너비 설정
    ws['!cols'] = [
      {wch: 10}, // 거리
      {wch: 15}, // 페이스
      {wch: 12}, // 구간시간
      {wch: 12}, // 누적시간
      {wch: 15}  // 평균페이스
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
  }, [rows, totalDistance, totalTime, avgPace]);

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
        <p>각 구간별 페이스를 입력하여 전체 런닝 전략을 계획하세요</p>
      </header>

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
          <li><strong>구간 추가:</strong> "구간 추가" 버튼 또는 Ctrl/Cmd+N</li>
          <li><strong>자동 계산:</strong> 누적시간과 평균페이스가 실시간으로 계산됩니다</li>
          <li><strong>엑셀 내보내기:</strong> 계산 결과를 Excel 파일로 다운로드 (Ctrl/Cmd+S)</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
