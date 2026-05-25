from flask import Blueprint, render_template, current_app

transactions_bp = Blueprint("transactions", __name__, url_prefix="/transactions")

@transactions_bp.route("/")
def transaction_list(app):
    current_app.config["TRANSACTIONS"]
    return render_template("transactions.html", title="transactions")

