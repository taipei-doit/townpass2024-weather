from flask import Flask, jsonify, render_template
import numpy as np
import json
import requests
import os
from datetime import datetime, timedelta

app = Flask(__name__)

cache_file = "F-B0046-001.json"

x = np.linspace(117.99375, 123.50625, 441)
y = np.linspace(19.99375, 27.00625, 561)
X, Y = np.meshgrid(x, y)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/rainfall_data', methods=['GET'])
def get_rainfall_data():
    with open("api.json", "r", encoding='utf-8') as api:
        fn = json.load(api)
        url = fn["F-B0046-001"]
    if os.path.exists(cache_file):
        # print("here")
        file_mod_time = datetime.fromtimestamp(os.path.getmtime(cache_file))
        current_time = datetime.now()
        time_diff = current_time - file_mod_time

        if time_diff < timedelta(minutes=10):
            # print("hhaha")
            with open(cache_file, 'r', encoding='utf-8') as f:
                forecast = json.load(f)
        else:
            forecast = fetch_new_data(url)
    else:
        # print("there")
        forecast = fetch_new_data(url)

    rainstr = forecast["cwaopendata"]["dataset"]["contents"]["content"].split(",")
    rain = np.array(rainstr, dtype=float).reshape(561, 441)

    Z = rain
    time = datetime.strptime(forecast["cwaopendata"]["dataset"]["datasetInfo"]["parameterSet"]["DateTime"], "%Y-%m-%dT%H:%M:%S+08:00")
    data = {'X': X.tolist(), 'Y': Y.tolist(), 'Z': Z.tolist(), "Datetime": time}
    # print("end python")
    return jsonify(data)

def fetch_new_data(url):
    try:
        response = requests.get(url)
        response.raise_for_status()
        forecast = response.json()
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump(forecast, f, indent=4)
        return forecast
    except requests.RequestException as e:
        print(f"An error occurred while fetching new data: {e}")
        if os.path.exists(cache_file):
            with open(cache_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            raise RuntimeError("無法獲取新的數據，且沒有可用的快取文件")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=54088)
