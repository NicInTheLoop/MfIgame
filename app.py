from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index_local.html')
# ⚠️ Remember to switch between "index_local.html" and "index_github.html" before pushing to GitHub!


@app.route('/statistics')
def statistics():
    return render_template('statistics.html')

if __name__ == '__main__':
    app.run(debug=True)
