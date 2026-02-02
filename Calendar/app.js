const monthSelect = document.getElementById("month");
const yearInput = document.getElementById("year");
const generateButton = document.getElementById("generate");
const downloadButton = document.getElementById("download");
const calendarEl = document.getElementById("calendar");

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function populateMonthSelect() {
  monthNames.forEach((name, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = name;
    monthSelect.appendChild(option);
  });
}

function setDefaults() {
  const today = new Date();
  yearInput.value = today.getFullYear();
  monthSelect.value = today.getMonth();
}

function nthWeekdayOfMonth(year, monthIndex, weekday, nth) {
  const first = new Date(year, monthIndex, 1);
  const offset = (weekday - first.getDay() + 7) % 7;
  const day = 1 + offset + (nth - 1) * 7;
  return new Date(year, monthIndex, day);
}

function lastWeekdayOfMonth(year, monthIndex, weekday) {
  const last = new Date(year, monthIndex + 1, 0);
  const offset = (last.getDay() - weekday + 7) % 7;
  return new Date(year, monthIndex, last.getDate() - offset);
}

function observedDate(date) {
  const day = date.getDay();
  if (day === 0) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  }
  if (day === 6) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
  }
  return date;
}

function formatKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function federalHolidays(year) {
  const holidays = [];
  const pushHoliday = (name, date) => {
    const observed = observedDate(date);
    holidays.push({
      name,
      date,
      observed,
      key: formatKey(observed),
      type: "federal",
    });
  };

  pushHoliday("New Year's Day", new Date(year, 0, 1));
  pushHoliday("Martin Luther King Jr. Day", nthWeekdayOfMonth(year, 0, 1, 3));
  pushHoliday("Washington's Birthday", nthWeekdayOfMonth(year, 1, 1, 3));
  pushHoliday("Memorial Day", lastWeekdayOfMonth(year, 4, 1));
  pushHoliday("Juneteenth", new Date(year, 5, 19));
  pushHoliday("Independence Day", new Date(year, 6, 4));
  pushHoliday("Labor Day", nthWeekdayOfMonth(year, 8, 1, 1));
  pushHoliday("Columbus Day", nthWeekdayOfMonth(year, 9, 1, 2));
  pushHoliday("Veterans Day", new Date(year, 10, 11));
  pushHoliday("Thanksgiving Day", nthWeekdayOfMonth(year, 10, 4, 4));
  pushHoliday("Christmas Day", new Date(year, 11, 25));

  return holidays.reduce((map, holiday) => {
    map[holiday.key] = { name: holiday.name, type: holiday.type };
    return map;
  }, {});
}

function nonFederalObservances(year) {
  const observances = [];
  const pushObservance = (name, date) => {
    observances.push({
      name,
      date,
      key: formatKey(date),
      type: "casual",
    });
  };

  pushObservance("Valentine's Day", new Date(year, 1, 14));
  pushObservance("Groundhog Day", new Date(year, 1, 2));
  pushObservance("St. Patrick's Day", new Date(year, 2, 17));
  pushObservance("April Fools' Day", new Date(year, 3, 1));
  pushObservance("Earth Day", new Date(year, 3, 22));
  pushObservance("Tax Day", new Date(year, 3, 15));
  pushObservance("Cinco de Mayo", new Date(year, 4, 5));
  pushObservance("Mother's Day", nthWeekdayOfMonth(year, 4, 0, 2));
  pushObservance("Father's Day", nthWeekdayOfMonth(year, 5, 0, 3));
  pushObservance("Halloween", new Date(year, 9, 31));
  pushObservance("Christmas Eve", new Date(year, 11, 24));
  pushObservance("New Year's Eve", new Date(year, 11, 31));

  return observances.reduce((map, holiday) => {
    map[holiday.key] = { name: holiday.name, type: holiday.type };
    return map;
  }, {});
}

function buildHolidayMap(year) {
  const holidays = federalHolidays(year);
  const observances = nonFederalObservances(year);
  Object.keys(observances).forEach((key) => {
    if (!holidays[key]) {
      holidays[key] = observances[key];
    }
  });
  return holidays;
}

function buildCalendar(year, monthIndex, title) {
  calendarEl.innerHTML = "";
  const holidays = buildHolidayMap(year);

  const table = document.createElement("table");
  table.className = "calendar-table";

  const caption = document.createElement("caption");
  caption.className = "calendar-title";
  caption.textContent = title;
  table.appendChild(caption);

  const headerRow = document.createElement("tr");
  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach((day) => {
    const th = document.createElement("th");
    th.textContent = day;
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  const firstDay = new Date(year, monthIndex, 1);
  const startDay = firstDay.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  let currentDay = 1 - startDay;
  for (let week = 0; week < 5; week += 1) {
    const row = document.createElement("tr");
    for (let day = 0; day < 7; day += 1) {
      const cell = document.createElement("td");
      if (currentDay > 0 && currentDay <= daysInMonth) {
        const date = new Date(year, monthIndex, currentDay);
        const key = formatKey(date);
        cell.classList.add("day");

        const number = document.createElement("div");
        number.className = "day-number";
        number.textContent = currentDay;

        const holiday = holidays[key];
        if (holiday) {
          const note = document.createElement("div");
          note.className = "holiday";
          const icon = document.createElement("span");
          icon.className = `holiday-icon ${holiday.type}`;

          const label = document.createElement("span");
          label.className = "holiday-text";
          label.textContent = holiday.name;

          note.appendChild(icon);
          note.appendChild(label);
          cell.appendChild(note);
        }

        cell.appendChild(number);
      } else {
        cell.classList.add("empty");
      }

      row.appendChild(cell);
      currentDay += 1;
    }
    table.appendChild(row);
  }

  calendarEl.appendChild(table);
}


function updatePlanner() {
  const year = Number(yearInput.value);
  const monthIndex = Number(monthSelect.value);
  const title = `${monthNames[monthIndex]} ${year}`;
  buildCalendar(year, monthIndex, title);
}

populateMonthSelect();
setDefaults();
updatePlanner();

async function downloadPdf() {
  const planner = document.getElementById("planner-print");
  if (!planner || !window.html2canvas || !window.jspdf) {
    alert("PDF libraries failed to load. Please refresh the page and try again.");
    return;
  }

  const title = `${monthNames[Number(monthSelect.value)]}-${yearInput.value}`;
  const canvas = await window.html2canvas(planner, {
    scale: 2,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/png");
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "letter",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 36;
  const maxWidth = pageWidth - margin * 2;
  const maxHeight = pageHeight - margin * 2;
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
  const renderWidth = imgWidth * scale;
  const renderHeight = imgHeight * scale;
  const x = (pageWidth - renderWidth) / 2;
  const y = (pageHeight - renderHeight) / 2;

  pdf.addImage(imgData, "PNG", x, y, renderWidth, renderHeight);
  pdf.save(`${title}.pdf`);
}

generateButton.addEventListener("click", updatePlanner);
if (downloadButton) {
  downloadButton.addEventListener("click", downloadPdf);
}
