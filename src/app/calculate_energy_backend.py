from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import csv
import os
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)

FRONTEND_METHOD_TO_BACKEND = {
    "2-1: A": "2-1: A (Cold)",
    "2-2: B": "2-2: B (Dry Heat)",
    "2-14: Na": "2-14: Na (Thermal Shock)",
    "2-14: Nb": "2-14: Nb (Change of temp.)",
    "2-30: Db": "2-30: Db (Damp heat, cyclic)",
    "2-38: Z/AD": "2-38: Z/AD (Temp/humidity cyclic)",
    "2-78: Cab": "2-78: Cab (Damp heat, steady)",
}

METHOD_TO_CSV = {
    "2-1: A (Cold)": "2-1_test.csv",
    "2-2: B (Dry Heat)": "2-2_test.csv",
    "2-14: Na (Thermal Shock)": "2-14-Na_test.csv",
    "2-14: Nb (Change of temp.)": "2-14-Nb_test.csv",
    "2-30: Db (Damp heat, cyclic)": "2-30_test.csv",
    "2-38: Z/AD (Temp/humidity cyclic)": "2-38_test.csv",
    "2-78: Cab (Damp heat, steady)": "2-78_test.csv",
}

METHOD_TO_CSV_METHOD_VALUE = {
    "2-1: A (Cold)": "2-1 : Test A",
    "2-2: B (Dry Heat)": "2-2 : Test B",
    "2-14: Na (Thermal Shock)": "2-14 : Test Na",
    "2-14: Nb (Change of temp.)": "2-14 : Test Nb",
    "2-30: Db (Damp heat, cyclic)": "2-30 : Test Db",
    "2-38: Z/AD (Temp/humidity cyclic)": "2-38 : Test Z/AD",
    "2-78: Cab (Damp heat, steady)": "2-78 : Test Cab",
}

FRONTEND_TO_CSV_COLUMN = {
    "testType": "Test Type",
    "standard": "Standard",
    "method": "Method",
    "initialTemp": "Initial Temp (°C)",
    "recoveryTemp": "Recovery Temp (°C)",
    "lowTemp": "Low Temp (°C)",
    "highTemp": "High Temp (°C)",
    "humidity": "Humidity (%)",
    "variant": "Variant",
    "rateOfChange": "Rate of change (°C/min)",
}

@csrf_exempt
def calculate_energy(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            # Normalize and map method
            frontend_method = data.get('method')
            method_key = None
            if frontend_method:
                normalized_method = frontend_method.replace(" ", "").lower()
                for k in FRONTEND_METHOD_TO_BACKEND:
                    if k.replace(" ", "").lower() == normalized_method:
                        method_key = FRONTEND_METHOD_TO_BACKEND[k]
                        break
                if not method_key:
                    method_key = frontend_method  # fallback
            if not method_key or method_key not in METHOD_TO_CSV:
                return JsonResponse({'error': 'Invalid method', 'received_method': frontend_method}, status=400)
            csv_file = METHOD_TO_CSV[method_key]
            csv_method_value = METHOD_TO_CSV_METHOD_VALUE.get(method_key)
            if not csv_method_value:
                return JsonResponse({'error': f'No CSV method value for: {method_key}'}, status=400)
            # Use durationHours or duration, default to 0 if not present
            try:
                duration = float(data.get('durationHours') or data.get('duration') or 0)
            except Exception:
                duration = 0
            # Build CSV path (correct: use os.path.dirname(__file__))
            csv_path = os.path.join(os.path.dirname(__file__), 'data', csv_file)
            logging.info(f"Attempting to load CSV file at: {csv_path}")
            power_kw = None
            with open(csv_path, newline='') as f:
                reader = csv.reader(f)
                headers = next(reader)
                header_map = {h.strip(): i for i, h in enumerate(headers)}
                # Build search criteria: only use fields that exist in the CSV and are not None/empty/undefined
                search_criteria = {}
                for frontend_key, csv_col in FRONTEND_TO_CSV_COLUMN.items():
                    if csv_col in header_map:
                        v = data.get(frontend_key)
                        if v is not None and v != "" and v != "undefined":
                            search_criteria[csv_col] = str(v)
                # Always set the correct CSV "Method" value for matching
                if "Method" in header_map:
                    search_criteria["Method"] = csv_method_value
                print("Received data:", data)
                print("Search criteria:", search_criteria)
                # Find the power column
                power_col = None
                for h in headers:
                    if "power" in h.lower():
                        power_col = h
                        break
                if power_col is None:
                    return JsonResponse({'error': 'Power column not found', 'headers': headers}, status=400)
                power_index = header_map[power_col]
                # Search for the matching row
                for row in reader:
                    match = True
                    for col, val in search_criteria.items():
                        idx = header_map.get(col)
                        if idx is not None:
                            if str(row[idx]).strip() != str(val).strip():
                                match = False
                                break
                    if match:
                        try:
                            power_kw = float(row[power_index])
                        except Exception:
                            power_kw = None
                        break
            if power_kw is None:
                print("No matching row found for criteria:", search_criteria)
                return JsonResponse({
                    'error': 'No matching row found or invalid power value',
                    'search_criteria': search_criteria,
                    'received_data': data,
                    'csv_file': csv_file,
                    'headers': headers
                }, status=404)
            energy_kwh = power_kw * duration
            energy_cost = energy_kwh * 0.135
            return JsonResponse({
                'power_kw': power_kw,
                'energy_consumption_kwh': energy_kwh,
                'energy_cost_eur': energy_cost
            })
        except Exception as e:
            print("Exception:", str(e))
            return JsonResponse({
                'error': str(e),
                'received_data': data if 'data' in locals() else None
            }, status=400)
    return JsonResponse({'error': 'Invalid method'}, status=405)
