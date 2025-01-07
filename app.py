from flask import Flask, request, render_template

app = Flask(__name__)

@app.route('/MfIgame/')
def mfi_game():
    # Retrieve query parameters
    course = request.args.get('course')
    session = request.args.get('session')
    
    # Validate parameters
    if course and session:
        print(f"Course: {course}, Session: {session}")  # Debug output
        return render_template('index.html', course=course, session=session)
    else:
        return "Course and session parameters are required.", 400

if __name__ == '__main__':
    app.run(debug=True)
