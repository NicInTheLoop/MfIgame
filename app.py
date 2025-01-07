from flask import Flask, request, render_template

app = Flask(__name__)

@app.route('/')
def home():
    # Default route for organizer view
    return render_template('index.html', course='', session='')

@app.route('/MfIgame/')
def mfi_game():
    # Route for player view
    course = request.args.get('course', '')
    session = request.args.get('session', '')

    return render_template('index.html', course=course, session=session)

if __name__ == '__main__':
    app.run(debug=True)
