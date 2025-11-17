# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/generate-schedule', methods=['POST'])
def generate_schedule():
    try:
        data = request.json
        subjects = data.get('subjects', [])
        assignments = data.get('assignments', [])
        exams = data.get('exams', [])
        daily_hours = data.get('dailyHours', 3)
        user_id = data.get('userId')

        # Create a dynamic schedule based on the input data
        schedule_plan = []

        # Use loops to handle multiple subjects, assignments, and exams
        if subjects:
            for subject in subjects:
                schedule_plan.append({'date': '2025-10-01', 'task': f'Study {subject} for {daily_hours} hours'})

        if assignments:
            for assignment in assignments:
                schedule_plan.append({'date': '2025-10-02', 'task': f'Work on {assignment["name"]} for {assignment["subject"]}'})

        if exams:
            for exam in exams:
                schedule_plan.append({'date': exam['date'], 'task': f'Review for {exam["subject"]} exam on {exam["date"]}'})
        
        # If no data is provided, add a default message
        if not schedule_plan:
             schedule_plan.append({'date': 'N/A', 'task': 'No study plan data provided.'})

        schedule = {
            'message': 'Schedule generated successfully!',
            'plan': schedule_plan
        }

        return jsonify(schedule)

    except Exception as e:
        # Return a more descriptive error message
        return jsonify({'error': f'An internal server error occurred: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True)