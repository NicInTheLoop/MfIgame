from flask import Flask, render_template, request

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/MfIgame/')
def mfi_game():
    # Retrieve query parameters
    course = request.args.get('course')
    session = request.args.get('session')
    
    # Pass parameters to the template if they exist
    if course and session:
        return render_template('index.html', course=course, session=session)
    else:
        return "Course and session parameters are required.", 400

if __name__ == '__main__':
    app.run(debug=True)
