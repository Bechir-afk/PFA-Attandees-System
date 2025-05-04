// SIMULATED DATA ONLY VERSION
// No Firebase connection required

// Chart instances
let attendanceTrendChart;
let punctualityDistributionChart;
let courseComparisonChart;
let weeklyPatternChart;
let timeOfDayChart;

// DOM Elements
const userMenuBtn = document.getElementById('user-menu-btn');
const userMenuDropdown = document.getElementById('user-menu-dropdown');
const logoutBtn = document.getElementById('logout-btn');
const menuLogout = document.getElementById('menu-logout');
const menuUserName = document.getElementById('menu-user-name');
const menuUserEmail = document.getElementById('menu-user-email');
const menuUserRole = document.getElementById('menu-user-role');
const userAvatar = document.getElementById('user-avatar');

// Date range selections
const dateRangeSelect = document.getElementById('date-range');
const customDateRange = document.getElementById('custom-date-range');
const dateFrom = document.getElementById('date-from');
const dateTo = document.getElementById('date-to');
const applyDateRange = document.getElementById('apply-date-range');

// Export and share buttons
const exportPdfBtn = document.getElementById('export-pdf');
const exportCsvBtn = document.getElementById('export-csv');
const shareReportBtn = document.getElementById('share-report');

// Toggle view button
const trendViewToggle = document.getElementById('trend-view-toggle');
const sortCoursesSelect = document.getElementById('sort-courses');

// Generate fake data with more realism
function generateFakeData(dateRange) {
  // Get the amount of data to generate based on the date range
  let dataPoints;
  switch(dateRange) {
    case 'week': dataPoints = 7; break;
    case 'month': dataPoints = 30; break;
    case 'semester': dataPoints = 120; break;
    case 'year': dataPoints = 365; break;
    default: dataPoints = 7;
  }
  
  // Generate dates
  const dates = [];
  const attendanceData = [];
  const currentDate = new Date();
  
  for (let i = dataPoints - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(currentDate.getDate() - i);
    
    // Skip weekends to simulate school days
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
      dates.push(formattedDate);
      
      // Generate attendance (1=present, 0=absent) with 85% attendance probability
      // Add some randomness but maintain a realistic pattern
      let isPresent;
      
      // Make Mondays have lower attendance
      if (date.getDay() === 1) { // Monday
        isPresent = Math.random() < 0.75 ? 1 : 0;
      } else {
        isPresent = Math.random() < 0.9 ? 1 : 0;
      }
      
      attendanceData.push(isPresent);
    }
  }
  
  // Generate course data with realistic course names
  const courses = [
    'Data Structures & Algorithms',
    'Web Development',
    'Database Systems',
    'Operating Systems',
    'Computer Networks',
    'AI Fundamentals',
    'Mobile App Development',
    'Software Engineering'
  ];
  
  const courseAttendance = courses.map(course => {
    // Generate random attendance rate between 75-98%
    return Math.floor(Math.random() * 23) + 75;
  });
  
  const courseArrival = courses.map(course => {
    // Generate random arrival time between -10 and +15 minutes
    return Math.floor(Math.random() * 25) - 10;
  });
  
  // Generate weekly pattern data
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const weeklyData = [
    Math.floor(Math.random() * 15) + 75, // Monday (75-90%)
    Math.floor(Math.random() * 10) + 85, // Tuesday (85-95%)
    Math.floor(Math.random() * 8) + 90,  // Wednesday (90-98%)
    Math.floor(Math.random() * 10) + 85, // Thursday (85-95%)
    Math.floor(Math.random() * 15) + 80  // Friday (80-95%)
  ];
  
  // Generate time of day data
  const timeSlots = ['8-10 AM', '10-12 PM', '12-2 PM', '2-4 PM', '4-6 PM'];
  const timeAttendance = timeSlots.map(() => Math.floor(Math.random() * 15) + 80); // 80-95%
  const timeArrival = [
    Math.floor(Math.random() * 10),      // 8-10 AM (0-10 mins late)
    Math.floor(Math.random() * 6) - 3,   // 10-12 PM (-3 to +3 mins)
    Math.floor(Math.random() * 8) - 8,   // 12-2 PM (-8 to 0 mins, early)
    Math.floor(Math.random() * 6) - 6,   // 2-4 PM (-6 to 0 mins, early)
    Math.floor(Math.random() * 4) - 2    // 4-6 PM (-2 to +2 mins)
  ];
  
  // Punctuality distribution
  const punctualityLabels = [
    'Very Early (>15 mins)',
    'Early (5-15 mins)',
    'On Time (±5 mins)',
    'Late (5-15 mins)',
    'Very Late (>15 mins)'
  ];
  const punctualityData = [
    Math.floor(Math.random() * 5) + 2,   // Very Early (2-7)
    Math.floor(Math.random() * 10) + 8,  // Early (8-18)
    Math.floor(Math.random() * 10) + 15, // On Time (15-25)
    Math.floor(Math.random() * 8) + 3,   // Late (3-11)
    Math.floor(Math.random() * 5) + 1    // Very Late (1-6)
  ];
  
  // Summary statistics
  const totalClasses = attendanceData.length;
  const presentCount = attendanceData.filter(d => d === 1).length;
  const attendanceRate = Math.round((presentCount / totalClasses) * 100);
  const absenceCount = totalClasses - presentCount;
  
  // Calculate average arrival time (negative is early, positive is late)
  // Weight by frequency of attendance for each time slot
  let totalMinutes = 0;
  timeArrival.forEach((arrival, index) => {
    totalMinutes += arrival * timeAttendance[index];
  });
  const avgArrival = Math.round(totalMinutes / timeAttendance.reduce((a, b) => a + b, 0));
  
  // Calculate consistency score based on attendance pattern and punctuality
  // Higher score for regular attendance and consistent arrival times
  const consistencyScore = Math.min(95, Math.round(attendanceRate * 0.7 + 
    (100 - Math.abs(avgArrival) * 3) * 0.3));
  
  return {
    dates,
    attendanceData,
    courses,
    courseAttendance,
    courseArrival,
    weekdays,
    weeklyData,
    timeSlots,
    timeAttendance,
    timeArrival,
    punctualityLabels,
    punctualityData,
    summaryStats: {
      attendanceRate,
      absenceCount,
      avgArrival,
      consistencyScore
    }
  };
}

// Initialize with fake user data
function initializeFakeUserData() {
  // Set fake user data in the UI
  if (menuUserName) menuUserName.textContent = "Ahmed Bensalem";
  if (menuUserEmail) menuUserEmail.textContent = "a.bensalem@esi-sba.dz";
  if (menuUserRole) menuUserRole.textContent = "Student";
  if (userAvatar) userAvatar.src = "../src/fst.png"; // Default avatar
  
  // Load analytics data
  loadAnalyticsData();
}

// Toggle dropdown menu
if (userMenuBtn) {
  userMenuBtn.addEventListener('click', function() {
    userMenuDropdown.classList.toggle('hidden');
  });
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
  if (userMenuBtn && userMenuDropdown && 
      !userMenuBtn.contains(event.target) && 
      !userMenuDropdown.contains(event.target)) {
    userMenuDropdown.classList.add('hidden');
  }
});

// Logout function - just redirect to login page
function logoutUser() {
  window.location.href = 'login.html';
}

// Add event listeners for logout
if (logoutBtn) logoutBtn.addEventListener('click', logoutUser);
if (menuLogout) menuLogout.addEventListener('click', logoutUser);

// Date range change handler
if (dateRangeSelect) {
  dateRangeSelect.addEventListener('change', function() {
    if (this.value === 'custom') {
      customDateRange.classList.remove('hidden');
    } else {
      customDateRange.classList.add('hidden');
      loadAnalyticsData();
    }
  });
}

// Apply custom date range
if (applyDateRange) {
  applyDateRange.addEventListener('click', function() {
    if (dateFrom.value && dateTo.value) {
      loadAnalyticsData();
    } else {
      console.error("Please select both start and end dates");
    }
  });
}

// Course sorting handler
if (sortCoursesSelect) {
  sortCoursesSelect.addEventListener('change', function() {
    const dateRange = dateRangeSelect ? dateRangeSelect.value : 'week';
    const data = generateFakeData(dateRange);
    createCourseComparisonChart(data.courses, data.courseAttendance, data.courseArrival);
  });
}

// Toggle chart view
if (trendViewToggle) {
  trendViewToggle.addEventListener('click', function() {
    const currentType = attendanceTrendChart.config.type;
    const newType = currentType === 'bar' ? 'line' : 'bar';
    
    // Update button text
    this.textContent = newType === 'bar' ? 'Show as Line' : 'Show as Bar';
    
    // Get current data range
    const dateRange = dateRangeSelect ? dateRangeSelect.value : 'week';
    const data = generateFakeData(dateRange);
    
    // Update chart type
    createAttendanceTrendChart(newType, data.dates, data.attendanceData);
  });
}

// Load analytics data based on selected date range
function loadAnalyticsData() {
  const dateRange = dateRangeSelect ? dateRangeSelect.value : 'week';
  console.log("Loading analytics data for:", dateRange);
  
  // Generate fake data for the selected date range
  const data = generateFakeData(dateRange);
  
  // Update UI with the generated data
  updateSummaryStats(data.summaryStats);
  createAttendanceTrendChart('bar', data.dates, data.attendanceData);
  createPunctualityChart(data.punctualityLabels, data.punctualityData);
  createCourseComparisonChart(data.courses, data.courseAttendance, data.courseArrival);
  createWeeklyPatternChart(data.weekdays, data.weeklyData);
  createTimeOfDayChart(data.timeSlots, data.timeAttendance, data.timeArrival);
  
  // Generate insights and recommendations
  generateInsightsAndRecommendations(data);
}

// Update summary statistics
function updateSummaryStats(stats) {
  if (document.getElementById('attendance-rate')) {
    document.getElementById('attendance-rate').textContent = `${stats.attendanceRate}%`;
  }
  
  if (document.getElementById('absence-count')) {
    document.getElementById('absence-count').textContent = stats.absenceCount;
  }
  
  if (document.getElementById('avg-arrival')) {
    const arrivalText = stats.avgArrival <= 0 ? 
      `${stats.avgArrival}m` : `+${stats.avgArrival}m`;
    
    document.getElementById('avg-arrival').textContent = arrivalText;
    document.getElementById('avg-arrival').style.color = 
      stats.avgArrival <= 0 ? '#059669' : '#DC2626';
  }
  
  if (document.getElementById('consistency-score')) {
    document.getElementById('consistency-score').textContent = `${stats.consistencyScore}%`;
  }
}

// Create attendance trend chart
function createAttendanceTrendChart(type = 'bar', labels, data) {
  const ctx = document.getElementById('attendanceTrendChart');
  if (!ctx) return;
  
  const chartData = {
    labels: labels,
    datasets: [{
      label: 'Attendance',
      data: data,
      backgroundColor: data.map(value => value === 1 ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'),
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: type === 'line' ? 2 : 1,
      tension: 0.2,
      fill: type === 'line' ? false : true
    }]
  };
  
  if (attendanceTrendChart) {
    attendanceTrendChart.destroy();
  }
  
  attendanceTrendChart = new Chart(ctx, {
    type: type,
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 1,
          ticks: {
            stepSize: 1,
            callback: function(value) {
              return value === 0 ? 'Absent' : 'Present';
            }
          },
          grid: {
            color: 'rgba(156, 163, 175, 0.1)'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.raw === 1 ? 'Present' : 'Absent';
            }
          }
        }
      }
    }
  });
}

// Create punctuality distribution chart
function createPunctualityChart(labels, data) {
  const ctx = document.getElementById('punctualityDistributionChart');
  if (!ctx) return;
  
  const chartData = {
    labels: labels,
    datasets: [{
      data: data,
      backgroundColor: [
        'rgba(16, 185, 129, 0.7)',  // Very Early - Green
        'rgba(34, 197, 94, 0.7)',    // Early - Light Green
        'rgba(59, 130, 246, 0.7)',   // On Time - Blue
        'rgba(245, 158, 11, 0.7)',   // Late - Orange
        'rgba(239, 68, 68, 0.7)'     // Very Late - Red
      ],
      borderWidth: 1
    }]
  };
  
  if (punctualityDistributionChart) {
    punctualityDistributionChart.destroy();
  }
  
  punctualityDistributionChart = new Chart(ctx, {
    type: 'doughnut',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#E5E7EB' : '#4B5563'
          }
        }
      }
    }
  });
}

// Create course comparison chart
function createCourseComparisonChart(courses, attendance, arrival) {
  const ctx = document.getElementById('courseComparisonChart');
  if (!ctx) return;
  
  // Get sort option if available
  const sortOption = sortCoursesSelect ? sortCoursesSelect.value : 'name';
  
  // Create arrays for sorting
  let sortedData = [];
  for (let i = 0; i < courses.length; i++) {
    sortedData.push({
      course: courses[i],
      attendance: attendance[i],
      arrival: arrival[i]
    });
  }
  
  // Sort based on selected option
  switch (sortOption) {
    case 'attendance':
      sortedData.sort((a, b) => b.attendance - a.attendance);
      break;
    case 'punctuality':
      sortedData.sort((a, b) => a.arrival - b.arrival); // Lower is better (early)
      break;
    default:
      // 'name' - default
      sortedData.sort((a, b) => a.course.localeCompare(b.course));
  }
  
  // Extract sorted arrays
  const sortedCourses = sortedData.map(item => item.course);
  const sortedAttendance = sortedData.map(item => item.attendance);
  const sortedArrival = sortedData.map(item => item.arrival);
  
  const chartData = {
    labels: sortedCourses,
    datasets: [
      {
        label: 'Attendance Rate',
        data: sortedAttendance,
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        order: 2
      },
      {
        label: 'Avg. Arrival (mins relative to start)',
        data: sortedArrival,
        type: 'line',
        borderColor: 'rgba(245, 158, 11, 1)',
        backgroundColor: 'rgba(245, 158, 11, 0.5)',
        borderWidth: 2,
        order: 1,
        yAxisID: 'y1'
      }
    ]
  };
  
  if (courseComparisonChart) {
    courseComparisonChart.destroy();
  }
  
  courseComparisonChart = new Chart(ctx, {
    type: 'bar',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Attendance Rate (%)'
          },
          grid: {
            color: 'rgba(156, 163, 175, 0.1)'
          }
        },
        y1: {
          position: 'right',
          beginAtZero: false,
          min: -15,
          max: 15,
          title: {
            display: true,
            text: 'Avg. Arrival Time (mins)'
          },
          grid: {
            display: false
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

// Create weekly pattern chart
function createWeeklyPatternChart(weekdays, data) {
  const ctx = document.getElementById('weeklyPatternChart');
  if (!ctx) return;
  
  const chartData = {
    labels: weekdays,
    datasets: [
      {
        label: 'Attendance Rate',
        data: data,
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      }
    ]
  };
  
  if (weeklyPatternChart) {
    weeklyPatternChart.destroy();
  }
  
  weeklyPatternChart = new Chart(ctx, {
    type: 'bar',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Attendance Rate (%)'
          },
          grid: {
            color: 'rgba(156, 163, 175, 0.1)'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

// Create time of day pattern chart
function createTimeOfDayChart(timeSlots, attendance, arrival) {
  const ctx = document.getElementById('timeOfDayChart');
  if (!ctx) return;
  
  const chartData = {
    labels: timeSlots,
    datasets: [
      {
        label: 'Attendance Rate',
        data: attendance,
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
        order: 2
      },
      {
        label: 'Avg. Arrival Time (mins)',
        data: arrival,
        type: 'line',
        borderColor: 'rgba(245, 158, 11, 1)',
        backgroundColor: 'rgba(245, 158, 11, 0.5)',
        borderWidth: 2,
        order: 1,
        yAxisID: 'y1'
      }
    ]
  };
  
  if (timeOfDayChart) {
    timeOfDayChart.destroy();
  }
  
  timeOfDayChart = new Chart(ctx, {
    type: 'bar',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Attendance Rate (%)'
          },
          grid: {
            color: 'rgba(156, 163, 175, 0.1)'
          }
        },
        y1: {
          position: 'right',
          beginAtZero: false,
          min: -10,
          max: 10,
          title: {
            display: true,
            text: 'Avg. Arrival (mins)'
          },
          grid: {
            display: false
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

// Generate insights and recommendations based on data analysis
function generateInsightsAndRecommendations(data) {
  // Find the best and worst weekday for attendance
  const bestWeekdayIndex = data.weeklyData.indexOf(Math.max(...data.weeklyData));
  const worstWeekdayIndex = data.weeklyData.indexOf(Math.min(...data.weeklyData));
  
  // Find the earliest and latest time slots
  const earliestTimeIndex = data.timeArrival.indexOf(Math.min(...data.timeArrival));
  const latestTimeIndex = data.timeArrival.indexOf(Math.max(...data.timeArrival));
  
  // Find best and worst courses
  const bestCourseIndex = data.courseAttendance.indexOf(Math.max(...data.courseAttendance));
  const worstCourseIndex = data.courseAttendance.indexOf(Math.min(...data.courseAttendance));
  
  // Generate insights
  const insights = [
    {
      type: 'blue',
      icon: 'insights',
      text: `Your attendance is highest on <strong>${data.weekdays[bestWeekdayIndex]}</strong> (${data.weeklyData[bestWeekdayIndex]}%) and lowest on <strong>${data.weekdays[worstWeekdayIndex]}</strong> (${data.weeklyData[worstWeekdayIndex]}%).`
    },
    {
      type: 'green',
      icon: 'trending_up',
      text: `Your overall attendance rate (${data.summaryStats.attendanceRate}%) is ${data.summaryStats.attendanceRate >= 90 ? 'excellent' : data.summaryStats.attendanceRate >= 80 ? 'good' : 'needs improvement'}.`
    },
    {
      type: 'yellow',
      icon: 'schedule',
      text: `You tend to arrive <strong>${Math.abs(data.timeArrival[latestTimeIndex])} minutes ${data.timeArrival[latestTimeIndex] > 0 ? 'late' : 'early'}</strong> to ${data.timeSlots[latestTimeIndex]} classes.`
    }
  ];
  
  // Generate recommendations
  const recommendations = [
    {
      type: 'purple',
      icon: 'lightbulb',
      text: `Consider leaving <strong>${Math.max(5, Math.abs(data.timeArrival[latestTimeIndex]) + 5)} minutes earlier</strong> for ${data.timeSlots[latestTimeIndex]} classes to improve punctuality.`
    },
    {
      type: 'indigo',
      icon: 'calendar_today',
      text: `Focus on improving <strong>${data.weekdays[worstWeekdayIndex]} attendance</strong> to reach your overall attendance target of 95%.`
    },
    {
      type: 'red',
      icon: 'warning',
      text: `Your <strong>${data.courses[worstCourseIndex]}</strong> course needs attention - attendance is ${(data.summaryStats.attendanceRate - data.courseAttendance[worstCourseIndex]).toFixed(1)}% below your average.`
    }
  ];
  
  // Update the DOM with insights
  const insightsList = document.getElementById('insights-list');
  if (insightsList) {
    insightsList.innerHTML = '';
    
    insights.forEach(insight => {
      const li = document.createElement('li');
      li.className = `bg-${insight.type}-50 dark:bg-${insight.type}-900/20 p-3 rounded-lg`;
      li.innerHTML = `
        <div class="flex">
          <span class="material-symbols-outlined text-${insight.type}-600 dark:text-${insight.type}-400 mr-2">${insight.icon}</span>
          <span class="text-sm text-gray-800 dark:text-gray-200">${insight.text}</span>
        </div>
      `;
      insightsList.appendChild(li);
    });
  }
  
  // Update the DOM with recommendations
  const recommendationsList = document.getElementById('recommendations-list');
  if (recommendationsList) {
    recommendationsList.innerHTML = '';
    
    recommendations.forEach(rec => {
      const li = document.createElement('li');
      li.className = `bg-${rec.type}-50 dark:bg-${rec.type}-900/20 p-3 rounded-lg`;
      li.innerHTML = `
        <div class="flex">
          <span class="material-symbols-outlined text-${rec.type}-600 dark:text-${rec.type}-400 mr-2">${rec.icon}</span>
          <span class="text-sm text-gray-800 dark:text-gray-200">${rec.text}</span>
        </div>
      `;
      recommendationsList.appendChild(li);
    });
  }
}

// Export PDF report
if (exportPdfBtn) {
  exportPdfBtn.addEventListener('click', function() {
    alert("This feature would generate a PDF report of your attendance analytics.");
  });
}

// Export CSV data
if (exportCsvBtn) {
  exportCsvBtn.addEventListener('click', function() {
    alert("This feature would export your raw attendance data as a CSV file.");
  });
}

// Share report
if (shareReportBtn) {
  shareReportBtn.addEventListener('click', function() {
    alert("This feature would allow you to share your analytics report with instructors or advisors.");
  });
}

// Initialize page when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log("Analytics page loaded");
  
  // Set default date range values for custom range
  const today = new Date();
  const lastMonth = new Date();
  lastMonth.setDate(lastMonth.getDate() - 30);
  
  if (dateFrom) dateFrom.valueAsDate = lastMonth;
  if (dateTo) dateTo.valueAsDate = today;
  
  // Initialize with fake data instead of Firebase connection
  initializeFakeUserData();
});

// Add this line to analytics.html to properly link the JavaScript file
document.addEventListener('DOMContentLoaded', function() {
  // Make sure we link the script to analytics.html
  const scriptLink = document.head.querySelector('script[src="../js/analytics.js"]');
  if (!scriptLink) {
    console.log("Adding analytics.js script to page");
    const script = document.createElement('script');
    script.src = "../js/analytics.js";
    document.body.appendChild(script);
  }
});