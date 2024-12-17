from flask import Flask, jsonify, render_template, request
from flask_seasurf import SeaSurf
from flask_talisman import Talisman
from markupsafe import escape
import numpy as np
import json
import requests
import os
from datetime import datetime, timedelta

app = Flask(__name__)
Talisman(app, force_https=True, strict_transport_security=True, strict_transport_security_max_age=31536000, strict_transport_security_include_subdomains=True)

app.config['SECRET_KEY'] = 'a-very-secure-and-random-key'

csrf = SeaSurf(app)
csrf.header_name = 'X-CSRFToken'

cache_file = "F-B0046-001.json"
x = np.linspace(117.99375, 123.50625, 441)
y = np.linspace(19.99375, 27.00625, 561)
X, Y = np.meshgrid(x, y)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/rainfall_data', methods=['POST'])
def get_rainfall_data():
    if not request.is_json:
        return jsonify({"error": "Invalid content type, JSON required"}), 400

    with open("api.json", "r", encoding='utf-8') as api:
        fn = json.load(api)
        url = fn.get("F-B0046-001")
        if not url:
            return jsonify({"error": "API URL not found"}), 400

    forecast = fetch_new_data(url)

    rainstr = forecast.get("cwaopendata", {}).get("dataset", {}).get("contents", {}).get("content", "").split(",")
    try:
        rain = np.array(rainstr, dtype=float).reshape(561, 441)
    except ValueError:
        return jsonify({"error": "Invalid forecast data"}), 400

    Z = rain
    time_str = forecast.get("cwaopendata", {}).get("dataset", {}).get("datasetInfo", {}).get("parameterSet", {}).get("DateTime", "")
    try:
        time = datetime.strptime(time_str, "%Y-%m-%dT%H:%M:%S+08:00")
    except ValueError:
        return jsonify({"error": "Invalid datetime format"}), 400

    data = {
        'X': X.tolist(),  # 保持原始數據結構
        'Y': Y.tolist(),
        'Z': Z.tolist(),
        'Datetime': escape(str(time))  # 僅對 Datetime 進行轉義
    }

    return jsonify(data)

def fetch_new_data(url):
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        forecast = response.json()
        if not isinstance(forecast, dict) or "cwaopendata" not in forecast:
            raise ValueError("Unexpected API response structure")
        forecast = escape_forecast(forecast)
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump(forecast, f, indent=4)
        return forecast
    except (requests.RequestException, ValueError) as e:
        if os.path.exists(cache_file):
            with open(cache_file, 'r', encoding='utf-8') as f:
                forecast = json.load(f)
                return escape_forecast(forecast)
        raise RuntimeError("Failed to fetch new data and no valid cache found")

def escape_forecast(forecast):
    if isinstance(forecast, dict):
        return {key: escape_forecast(value) for key, value in forecast.items()}
    elif isinstance(forecast, list):
        return [escape_forecast(item) for item in forecast]
    elif isinstance(forecast, str):
        return escape(forecast)
    elif isinstance(forecast, (int, float)):
        return forecast
    return str(forecast)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=54088)
