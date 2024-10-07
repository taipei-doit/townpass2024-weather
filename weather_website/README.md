# 即時雨晴！我不想淋雨

作者：張閔堯 官毓韋 廖禹喬 笪瑜庭

## 功能介紹
「即時雨晴」微服務提供程式通的使用者查看當前或所查詢地點經緯度為中心的即時雷達回波圖，除了來自樹林與南屯兩個氣象站，更新頻率約 1~2 分鐘的雷達回波圖外，另可選擇查看全臺灣範圍的整合雷達圖，或未來一小時雨量預測圖。

本服務期望提供使用者查看所在地或特定地點的即時或未來一小時之晴雨狀態，得到比一般天氣預報軟體更準確的晴雨判斷。

## Open Data

本服務所用之開放資料皆來自中央氣象署[氣象資料開放平台](https://opendata.cwa.gov.tw/index)，資料條列如下：

- 1小時雨量預測-QPESUMS 1小時定量降雨預報格點資料: https://opendata.cwa.gov.tw/dataset/forecast/F-B0046-001
    - 請先登入氣象會員之後，將檔案下載處的 JSON 檔案連結 url 複製到 api.json 內取代 YOUR_API_LINK

- 降雨雷達-樹林雷達回波圖
    - imgurl: https://cwaopendata.s3.ap-northeast-1.amazonaws.com/Observation/O-A0084-001.png
- 降雨雷達-南屯雷達回波圖
    - imgurl: https://cwaopendata.s3.ap-northeast-1.amazonaws.com/Observation/O-A0084-002.png
- 雷達整合回波圖-臺灣
    - imgurl: https://cwaopendata.s3.ap-northeast-1.amazonaws.com/Observation/O-A0058-003.png
