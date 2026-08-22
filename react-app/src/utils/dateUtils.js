export const generateDepartureDates = (availableWeekdays = [], exactDates = []) => {
  const finalDates = new Set();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Generate dates from available_weekdays for next 90 days
  if (Array.isArray(availableWeekdays) && availableWeekdays.length > 0) {
    const dayMap = {
      'Sunday': 0,
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6
    };
    
    const selectedDayIndexes = availableWeekdays.map(day => dayMap[day]).filter(i => i !== undefined);
    
    if (selectedDayIndexes.length > 0) {
      for (let i = 0; i <= 90; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        if (selectedDayIndexes.includes(d.getDay())) {
          // Format as YYYY-MM-DD local
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          finalDates.add(`${year}-${month}-${day}`);
        }
      }
    }
  }

  // 2. Add manual exact dates (>= today)
  if (Array.isArray(exactDates) && exactDates.length > 0) {
    exactDates.forEach(dateStr => {
      const d = new Date(dateStr);
      d.setHours(0, 0, 0, 0);
      if (d >= today) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        finalDates.add(`${year}-${month}-${day}`);
      }
    });
  }

  // 3. Sort ascending and return
  return Array.from(finalDates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
};
