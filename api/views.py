import os
import csv
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)

@csrf_exempt
def calculate_energy(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST allowed'}, status=405)

    try:
        data = json.loads(request.body)
        csv_file = data['csv_file']
        duration = float(data.get('duration', 1))  # User input, not from CSV
        # Extract all field keys except csv_file and duration
        field_keys = [k for k in data.keys() if k not in ('csv_file', 'duration')]
    except (KeyError, ValueError, json.JSONDecodeError) as e:
        logging.error(f"Invalid input: {e}")
        return JsonResponse({'error': 'Invalid input'}, status=400)

    csv_path = os.path.join('data', csv_file)
    logging.info(f"Attempting to load CSV file at: {csv_path}")
    if not os.path.exists(csv_path):
        logging.error(f"CSV file not found at {csv_path}")
        return JsonResponse({'error': f'CSV file not found at {csv_path}'}, status=404)

    match = None
    try:
        with open(csv_path, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Match all provided fields (field1, field2, ...) to their corresponding CSV columns
                if all(str(row.get(data[k], '')).strip() == str(data[k]).strip() for k in field_keys if k.startswith('field')):
                    match = row
                    break
    except Exception as e:
        logging.error(f"Error reading CSV at {csv_path}: {e}")
        return JsonResponse({'error': f'Failed to read CSV: {str(e)}'}, status=500)

    if not match:
        logging.warning(f"No matching row found in {csv_file} for fields: {field_keys}")
        return JsonResponse({'error': 'No matching row found'}, status=404)

    # Find the last field whose value contains 'power' (case-insensitive)
    power_col = None
    for k in reversed(field_keys):
        if 'power' in str(data[k]).lower():
            power_col = data[k]
            break
    if not power_col:
        logging.error("Power column not specified in input")
        return JsonResponse({'error': 'Power column not specified in input'}, status=400)

    try:
        power_kw = float(match.get(power_col, 0))
        cost_per_kwh = 0.135  # cost per kWh, adjust as needed
    except ValueError as e:
        logging.error(f"Invalid data in CSV for power column {power_col}: {e}")
        return JsonResponse({'error': 'Invalid data in CSV'}, status=500)

    energy_consumption_kwh = power_kw * duration
    energy_cost_eur = energy_consumption_kwh * cost_per_kwh

    return JsonResponse({
        'energy_consumption_kwh': energy_consumption_kwh,
        'energy_cost_eur': energy_cost_eur
    })
