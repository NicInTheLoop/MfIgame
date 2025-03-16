from flask import Flask, render_template, request

app = Flask(__name__)

@app.route('/')
def home():
    course = request.args.get('course')
    session = request.args.get('session')
    if course and session:
        # This is a participant view
        return render_template('index_local.html', course=course, session=session)
    # This is the admin view
    return render_template('index_local.html')

@app.route('/statistics')
def statistics():
    return render_template('statistics.html')

if __name__ == '__main__':
    app.run(debug=True)
# ⚠️ Remember to switch between "index_local.html" and "index_github.html" before pushing to GitHub!
