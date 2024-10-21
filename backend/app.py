from flask import Flask, render_template

app = Flask(__name__)
app.config["TEMPLATES_AUTO_RELOAD"] = True


@app.route("/")
def home_page():
    return render_template("index.html")


@app.route("/draw")
def canvas_drawing():
    return render_template("canvas_drawing.html")


if __name__ == "__main__":
    app.run(debug=True)
