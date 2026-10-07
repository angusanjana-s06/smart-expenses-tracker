# Smart Expense Tracker

A full-stack web application for managing personal expenses. Users can add, edit, delete, search, and filter expenses while viewing useful spending statistics through a dashboard.

## Features

- Add new expenses
- Edit existing expenses
- Delete expenses
- View all saved expenses
- Search expenses by name
- Filter expenses by category
- View total spending
- View number of expenses
- View highest expense
- View average expense
- View category-wise spending
- Persistent data storage using SQLite
- Responsive and user-friendly interface

## Technologies Used

### Frontend
- HTML
- CSS
- JavaScript

### Backend
- Python
- Flask

### Database
- SQLite

## How It Works

The application follows a simple full-stack architecture:

Frontend (HTML, CSS, JavaScript)
↓
Flask REST API
↓
SQLite Database

The frontend uses JavaScript `fetch()` to communicate with the Flask backend.

The Flask backend handles API requests and performs database operations.

SQLite stores the expense records permanently, so the data remains available even after refreshing the page.

## Project Structure

```text
smart-expenses-tracker/
│
├── backend/
│   └── app.py
│
├── index.html
├── style.css
├── script.js
├── .gitignore
└── README.md
