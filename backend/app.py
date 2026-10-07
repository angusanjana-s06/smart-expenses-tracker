import math
import sqlite3
from pathlib import Path

from flask import Flask, jsonify, request

app = Flask(__name__)
DATABASE_PATH = Path(__file__).with_name("expenses.db")


def initialize_database():
    """Create the expenses table when the application starts."""
    connection = sqlite3.connect(DATABASE_PATH)
    try:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                amount REAL NOT NULL,
                category TEXT NOT NULL,
                date TEXT NOT NULL
            )
            """
        )
        connection.commit()
    finally:
        connection.close()


initialize_database()


@app.get("/api/test")
def test_backend():
    return jsonify({"message": "Backend is working"})


@app.get("/api/expenses")
def get_expenses():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    try:
        rows = connection.execute(
            "SELECT id, name, amount, category, date FROM expenses ORDER BY id"
        ).fetchall()
        expenses = [dict(row) for row in rows]
        return jsonify(expenses)
    finally:
        connection.close()


@app.post("/api/expenses")
def add_expense():
    expense = request.get_json(silent=True)
    if not isinstance(expense, dict):
        return jsonify({"error": "Request body must be a JSON object"}), 400

    required_fields = ("name", "amount", "category", "date")
    missing_fields = [field for field in required_fields if field not in expense]
    if missing_fields:
        return jsonify(
            {"error": f"Missing required fields: {', '.join(missing_fields)}"}
        ), 400

    try:
        amount = float(expense["amount"])
    except (TypeError, ValueError):
        return jsonify({"error": "Amount must be a number"}), 400

    if not math.isfinite(amount):
        return jsonify({"error": "Amount must be a finite number"}), 400

    connection = sqlite3.connect(DATABASE_PATH)
    try:
        cursor = connection.execute(
            """
            INSERT INTO expenses (name, amount, category, date)
            VALUES (?, ?, ?, ?)
            """,
            (expense["name"], amount, expense["category"], expense["date"]),
        )
        connection.commit()
        new_expense = {
            "id": cursor.lastrowid,
            "name": expense["name"],
            "amount": amount,
            "category": expense["category"],
            "date": expense["date"],
        }
        return jsonify(new_expense), 201
    finally:
        connection.close()


@app.put("/api/expenses/<int:expense_id>")
def update_expense(expense_id):
    expense = request.get_json(silent=True)
    if not isinstance(expense, dict):
        return jsonify({"error": "Request body must be a JSON object"}), 400

    required_fields = ("name", "amount", "category", "date")
    missing_fields = [field for field in required_fields if field not in expense]
    if missing_fields:
        return jsonify(
            {"error": f"Missing required fields: {', '.join(missing_fields)}"}
        ), 400

    try:
        amount = float(expense["amount"])
    except (TypeError, ValueError):
        return jsonify({"error": "Amount must be a number"}), 400

    if not math.isfinite(amount) or amount <= 0:
        return jsonify({"error": "Amount must be a positive number"}), 400

    connection = sqlite3.connect(DATABASE_PATH)
    try:
        cursor = connection.execute(
            """
            UPDATE expenses
            SET name = ?, amount = ?, category = ?, date = ?
            WHERE id = ?
            """,
            (expense["name"], amount, expense["category"], expense["date"], expense_id),
        )
        connection.commit()

        if cursor.rowcount == 0:
            return jsonify({"error": "Expense not found"}), 404

        updated_expense = {
            "id": expense_id,
            "name": expense["name"],
            "amount": amount,
            "category": expense["category"],
            "date": expense["date"],
        }
        return jsonify(updated_expense)
    finally:
        connection.close()


@app.delete("/api/expenses/<int:expense_id>")
def delete_expense(expense_id):
    connection = sqlite3.connect(DATABASE_PATH)
    try:
        cursor = connection.execute(
            "DELETE FROM expenses WHERE id = ?",
            (expense_id,),
        )
        connection.commit()

        if cursor.rowcount == 0:
            return jsonify({"error": "Expense not found"}), 404

        return jsonify({"message": "Expense deleted successfully"})
    finally:
        connection.close()


if __name__ == "__main__":
    app.run(debug=True)
