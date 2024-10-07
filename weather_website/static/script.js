const mapZoom = 12;
const earthRadiusKm = 6371;
var marker;

// Initialize the map
var map = L.map('map').setView([25.1, 121.6], 11);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
}).addTo(map);

// Variables to hold map elements
var rectangles = [];
var overlay = null;

// Color and grid settings for rainfall
var colorlevel = [0, 1, 2, 3, 4, 5, 7, 10, 15, 20, 30, 40, 50, 70, 100, 150, 200, 300];
var cwb_data = ['None', '#9BFFFF', '#00CFFF', '#0198FF', '#0165FF', '#309901', '#32FF00', '#F8FF00', '#FFCB00', '#FF9A00', '#FA0300', '#CC0003', '#A00000', '#98009A', '#C304CC', '#F805F3', '#FECBFF'];

// Radar data for different locations with corresponding JSON URLs for time data
const radarData = {
  shulin: {
    imageUrl: "https://cwaopendata.s3.ap-northeast-1.amazonaws.com/Observation/O-A0084-001.png",
    stationLat: 24.993,
    stationLon: 121.40070,
    radiusKm: 150,
    imageBounds: calculateBounds(24.993, 121.40070, 150),
    jsonUrl: "https://opendata.cwa.gov.tw/fileapi/v1/opendataapi/O-A0084-001?Authorization=CWA-EAC5F54B-AD17-4E60-8715-38C2490AED66&downloadType=WEB&format=JSON" // JSON URL for radar
  },
  nantun: {
    imageUrl: "https://cwaopendata.s3.ap-northeast-1.amazonaws.com/Observation/O-A0084-002.png",
    stationLat: 24.135,
    stationLon: 120.585,
    radiusKm: 150,
    imageBounds: calculateBounds(24.135, 120.585, 150),
    jsonUrl: "https://opendata.cwa.gov.tw/fileapi/v1/opendataapi/O-A0084-002?Authorization=CWA-EAC5F54B-AD17-4E60-8715-38C2490AED66&downloadType=WEB&format=JSON" // JSON URL for radar
  },
  combined: {
    imageUrl: "https://cwaopendata.s3.ap-northeast-1.amazonaws.com/Observation/O-A0058-003.png",
    imageBounds: [[20.48, 118.01], [26.48, 124.0]],
    jsonUrl: "https://opendata.cwa.gov.tw/fileapi/v1/opendataapi/O-A0058-003?Authorization=CWA-EAC5F54B-AD17-4E60-8715-38C2490AED66&downloadType=WEB&format=JSON" // JSON URL for radar
  }
};

// Function to calculate image bounds based on radius
function calculateBounds(lat, lon, radiusKm) {
  const latDiff = (radiusKm / earthRadiusKm) * (180 / Math.PI);
  const lonDiff = (radiusKm / (earthRadiusKm * Math.cos(lat * Math.PI / 180))) * (180 / Math.PI);

  return [
    [lat - latDiff, lon - lonDiff], // Southwest corner
    [lat + latDiff, lon + lonDiff]  // Northeast corner
  ];
}

// Function to get color based on rainfall value
function getColorForRainfall(value) {
  for (var i = 0; i < colorlevel.length; i++) {
    if (value < colorlevel[i]) {
      return cwb_data[i];
    }
  }
  return cwb_data[cwb_data.length - 1];  // Use the last color if it exceeds the max value
}

// Clear existing rainfall grid
function clearGrid() {
  rectangles.forEach(function(rect) {
    map.removeLayer(rect);
  });
  rectangles = [];
}

// Draw the rainfall grid
function drawGrid(data) {
  var gridSizeLat = (data.Y[1][0] - data.Y[0][0]);  // Latitude grid size
  var gridSizeLng = (data.X[0][1] - data.X[0][0]);  // Longitude grid size
  //console.log("test")
  for (var i = 0; i < 441; i++) {
    //console.log(i)
    for (var j = 0; j < 561; j++) {
      var bounds = [
        [data.Y[j][i], data.X[j][i]],  // Top-left coordinate
        [data.Y[j][i] + gridSizeLat, data.X[j][i] + gridSizeLng]  // Bottom-right coordinate
      ];
      var color = getColorForRainfall(data.Z[j][i]);

      if (color !== 'None') {
        var rect = L.rectangle(bounds, { 
          color: color, 
          weight: 0,         
          fillOpacity: 0.5
        }).addTo(map);

        rectangles.push(rect);
      }
    }
  }
}

function createColorBar() {
  const colorBar = document.getElementById('colorBar');
  const totalLevels = colorlevel.length;

  colorBar.innerHTML = '';  // Clear previous content
  for (let i = totalLevels - 1; i >= 0; i--) {
    const colorSegment = document.createElement('div');
    colorSegment.style.backgroundColor = cwb_data[i];
    colorSegment.style.height = `${300 / (totalLevels+1)}px`;
    colorSegment.style.width = '100%';
    colorSegment.style.borderTop = '1px solid black';

    const label = document.createElement('span');
    label.style.fontSize = '10px';
    label.style.color = 'black';
    label.style.position = 'absolute';
    label.style.marginTop = `${300 / (totalLevels+1)-15}px`;  // Adjust based on segment height
    label.innerText = `${colorlevel[i]} mm`;

    colorSegment.appendChild(label);
    colorBar.appendChild(colorSegment);
  }
}

function toggleColorBar(shouldShow) {
  const colorBar = document.getElementById('colorBar');
  if (shouldShow) {
    colorBar.style.display = 'block';
    createColorBar();  // Create the color bar only if visible
  } else {
    colorBar.style.display = 'none';
  }
}


// Fetch rainfall data from the backend and update the grid
function updateGrid() {
  //console.log("start")
  fetch('/rainfall_data')
    .then(response => response.json())
    .then(data => {
      clearGrid();  // Clear current grid
      drawGrid(data);  // Draw new grid

      //var timestampDiv = document.getElementById('timestamp');
      //timestampDiv.innerText = 'Data Time: ' + data.Datetime;
    });
}

document.getElementById('radarSelector').addEventListener('change', function() {
  const selectedOption = document.getElementById('radarSelector').value;
  var opacityControl = document.getElementById('controls')
  if (selectedOption === "historical") {
    clearOverlay();  // Clear radar if it's active
    updateGrid();    // Display the historical rainfall grid
    toggleColorBar(true);  // Show the color bar
    opacityControl.style.display = 'none';
  } else {
    clearGrid();     // Clear the rainfall grid
    displayWeatherOverlay();  // Add radar overlay
    toggleColorBar(false);  // Hide the color bar
    opacityControl.style.display = 'block';
  }
});

// Function to display radar overlay and fetch DateTime from JSON
function displayWeatherOverlay() {
  const selectedRadar = document.getElementById('radarSelector').value;
  const radarInfo = radarData[selectedRadar];

  if (overlay) {
    overlay.setUrl(radarInfo.imageUrl);  // Update the radar image URL
    overlay.setBounds(radarInfo.imageBounds);  // Update the radar bounds
  } else {
    overlay = L.imageOverlay(radarInfo.imageUrl, radarInfo.imageBounds, { opacity: 0.8 }).addTo(map);
  }

  // Fetch the radar JSON to get the DateTime
  fetch(radarInfo.jsonUrl)
    .then(response => response.json())
    .then(data => {
      if (data && data.cwaopendata && data.cwaopendata.dataset && data.cwaopendata.dataset.DateTime) {
        const dateTime = data.cwaopendata.dataset.DateTime;
        console.log('Radar DateTime:', dateTime);
        var time_element = document.getElementById('update-time');
        time_element.innerText = '更新時間: ' + dateTime;
      } else {
        console.error('DateTime not found in the JSON response');
      }
    })
    .catch(error => {
      console.error('Error fetching radar JSON:', error);
    });
}

// Clear radar overlay
function clearOverlay() {
  if (overlay) {
    map.removeLayer(overlay);
    overlay = null;
  }
}

window.onload = function() {
  getLocation(); // Call your function to get the user's location

  // Trigger the 'change' event on the radarSelector element to initialize the default state
  var radarSelector = document.getElementById('radarSelector');
  var changeEvent = new Event('change');
  radarSelector.dispatchEvent(changeEvent);
};

document.getElementById('customLocation').addEventListener('change', function() {
  document.getElementById('customAddressSection').style.display = 'flex'; // joy: flex才能在同一排
});


// Handle grid and radar toggle
document.getElementById('radarSelector').addEventListener('change', function() {
  const selectedOption = document.getElementById('radarSelector').value;

  if (selectedOption === "historical") {
    clearOverlay();  // Clear radar if it's active
    updateGrid();  // Display the historical rainfall grid
  } else {
    clearGrid();  // Clear rainfall grid
    displayWeatherOverlay();
  }
});

// Handle slider for opacity control
document.getElementById('overlayOpacity').addEventListener('input', function(event) {
  const opacityValue = event.target.value / 100;
  if (overlay) {
    overlay.setOpacity(opacityValue);  // Adjust opacity of the radar overlay
  }
});

// Function to handle address search
function searchAddress() {
  const address = document.getElementById('addressInput').value;
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (data.length > 0) {
        const { lat, lon } = data[0];
        clearOverlay();  // Clear radar
        displayMap(lat, lon, mapZoom);
        displayWeatherOverlay();  // Add radar overlay
      } else {
        alert('無法找到地址');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('搜尋地址時出錯: ' + error.message);
    });
}

// Function to show current location
function getLocation() {
  const postInfo = JSON.stringify({name: 'location', data: null});
  flutterObject.postMessage(postInfo);
  flutterObject.addEventListener('message', (event) => 
  {
    const pos = JSON.parse(event.data);
    displayMap(pos.data.latitude, pos.data.longitude, mapZoom);
    displayWeatherOverlay();
  });
}

// Create a custom icon
var customIcon = L.icon({
  iconUrl: './static/marker_icon.svg', // Replace with your custom icon URL
  iconSize: [38, 38], // Size of the icon [width, height]
  iconAnchor: [22, 38], // Point of the icon that will correspond to the marker's location
  popupAnchor: [-3, -38], // Point from which the popup should open relative to the iconAnchor
  // shadowUrl: 'path_to_your_icon_shadow.png', // Optional: Add a shadow if needed
  // shadowSize: [50, 64],  // Optional: Size of the shadow
  // shadowAnchor: [22, 64] // Optional: Anchor for the shadow
});

function displayMap(lat, lon, zoomLevel) {
if (!map) {
  map = L.map('map').setView([lat, lon], zoomLevel);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Add or update marker with custom icon
  marker = L.marker([lat, lon], { icon: customIcon }).addTo(map);
} else {
  map.setView([lat, lon], zoomLevel);

  // If map already exists, update the marker with custom icon
  if (marker) {
    marker.setLatLng([lat, lon]);
    marker.setIcon(customIcon);  // Update marker to use custom icon
  } else {
    marker = L.marker([lat, lon], { icon: customIcon }).addTo(map);
  }
}
}
