var map = L.map('map').setView([25.1, 121.6], 11);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
}).addTo(map);

// 定義顏色等級與對應顏色
var colorlevel = [0,1,2,6,10,15,20,30,40,50,70,90,110,130,150,200,300,400];
var cwb_data = ['None','#9BFFFF','#00CFFF','#0198FF','#0165FF','#309901','#32FF00','#F8FF00','#FFCB00','#FF9A00','#FA0300','#CC0003','#A00000','#98009A','#C304CC','#F805F3','#FECBFF'];

var rectangles = [];

// 根據雨量值找到對應的顏色
function getColorForRainfall(value) {
    for (var i = 0; i < colorlevel.length; i++) {
        if (value < colorlevel[i]) {
            return cwb_data[i];
        }
    }
    return cwb_data[cwb_data.length - 1];  // 超過最大值時用最後一個顏色
}

// 清除現有網格
function clearGrid() {
    rectangles.forEach(function(rect) {
        map.removeLayer(rect);
    });
    rectangles = [];
}

// 繪製網格
function drawGrid(data) {
    var gridSizeLat = (data.Y[1][0] - data.Y[0][0]);  // 計算緯度格子大小
    var gridSizeLng = (data.X[0][1] - data.X[0][0]);  // 計算經度格子大小
    for (var i = 0; i < 441; i++) {
        console.log(i)
        for (var j = 0; j < 561; j++) {
            var bounds = [
                [data.Y[j][i], data.X[j][i]],  // 左上角座標
                [data.Y[j][i] + gridSizeLat, data.X[j][i] + gridSizeLng]  // 右下角座標
            ];
            if (i==441)
                console.log(bounds)
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
    console.log("test")
}

// 從後端獲取數據並更新網格和時間戳
function updateGrid() {
    fetch('/rainfall_data')
        .then(response => response.json())
        .then(data => {
            clearGrid();  // 先清除現有網格
            drawGrid(data);  // 繪製新網格

            var timestampDiv = document.getElementById('timestamp');
            timestampDiv.innerText = '';  // 先清空
            timestampDiv.innerText = 'Data Time: ' + data.Datetime;  // 再次設置
            console.log('Fetched data:', data)
        });
}

updateGrid();

setInterval(updateGrid, 300000);