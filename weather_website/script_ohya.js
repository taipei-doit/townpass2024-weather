let map;
let marker;
let overlay;
const earthRadiusKm = 6371; // Earth's radius in kilometers

// Precalculate the bounds for each radar image
const radarData = {
  shulin: {
    jsonUrl: "https://opendata.cwa.gov.tw/fileapi/v1/opendataapi/O-A0084-001?Authorization=CWA-EAC5F54B-AD17-4E60-8715-38C2490AED66&downloadType=WEB&format=JSON",
    imageUrl: "https://cwaopendata.s3.ap-northeast-1.amazonaws.com/Observation/O-A0084-001.png",
    stationLat: 24.993,
    stationLon: 121.40070,
    radiusKm: 150,
    imageBounds: calculateBounds(24.993, 121.40070, 150)
  },
  nantun: {
    jsonUrl: "https://opendata.cwa.gov.tw/fileapi/v1/opendataapi/O-A0084-002?Authorization=CWA-EAC5F54B-AD17-4E60-8715-38C2490AED66&downloadType=WEB&format=JSON",
    imageUrl: "https://cwaopendata.s3.ap-northeast-1.amazonaws.com/Observation/O-A0084-002.png",
    stationLat: 24.135,
    stationLon: 120.585,
    radiusKm: 150,
    imageBounds: calculateBounds(24.135, 120.585, 150)
  },
  combined: {
    jsonUrl: "https://opendata.cwa.gov.tw/fileapi/v1/opendataapi/O-A0058-003?Authorization=CWA-EAC5F54B-AD17-4E60-8715-38C2490AED66&downloadType=WEB&format=JSON",
    imageUrl: "https://cwaopendata.s3.ap-northeast-1.amazonaws.com/Observation/O-A0058-003.png",
    stationLat: 24.0, // Approximated for combined radar image
    stationLon: 121.0, // Approximated for combined radar image
    radiusKm: 300, // Adjusted for a larger radar coverage
    imageBounds: [// to be finetuned
        [20.5, 118.0], // Southwest corner
        [26.5, 124.0]  // Northeast corner
    ]
  }
};

// Function to precalculate the image bounds
function calculateBounds(lat, lon, radiusKm) {
  const latDiff = (radiusKm / earthRadiusKm) * (180 / Math.PI);
  const lonDiff = (radiusKm / (earthRadiusKm * Math.cos(lat * Math.PI / 180))) * (180 / Math.PI);

  return [
    [lat - latDiff, lon - lonDiff], // Southwest corner
    [lat + latDiff, lon + lonDiff]  // Northeast corner
  ];
}

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition);
  } else {
    alert("此瀏覽器不支持地理位置服務。");
  }
}

function showPosition(position) {
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;
  displayMap(latitude, longitude);
  displayWeatherOverlay();
}

function displayMap(lat, lon) {
  if (!map) {
    map = L.map('map').setView([lat, lon], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
  } else {
    map.setView([lat, lon], 11);
  }

  if (marker) {
    marker.setLatLng([lat, lon]);
  } else {
    marker = L.marker([lat, lon]).addTo(map).bindPopup("You are here").openPopup();
  }
}

function displayWeatherOverlay() {
  const selectedRadar = document.getElementById('radarSelector').value;
  const radarInfo = radarData[selectedRadar];

  if (overlay) {
    overlay.setUrl(radarInfo.imageUrl);
    overlay.setBounds(radarInfo.imageBounds); // Use precomputed bounds
  } else {
    overlay = L.imageOverlay(radarInfo.imageUrl, radarInfo.imageBounds, { opacity: 0.8 }).addTo(map);
  }
}

function clearOverlay() {
  if (overlay) {
    map.removeLayer(overlay);
    overlay = null;
  }
}

function searchAddress() {
  const address = document.getElementById('addressInput').value;
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (data.length > 0) {
        const { lat, lon } = data[0];
        clearOverlay();
        displayMap(lat, lon);
        displayWeatherOverlay();
      } else {
        alert('無法找到地址');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('搜尋地址時出錯: ' + error.message);
    });
}

document.getElementById('toggleOverlay').addEventListener('change', function (event) {
  if (event.target.checked) {
    displayWeatherOverlay();
  } else {
    clearOverlay();
  }
});

document.getElementById('overlayOpacity').addEventListener('input', function (event) {
  const opacityValue = event.target.value / 100;
  if (overlay) {
    overlay.setOpacity(opacityValue);
  }
});

document.getElementById('radarSelector').addEventListener('change', function() {
  displayWeatherOverlay();
});
