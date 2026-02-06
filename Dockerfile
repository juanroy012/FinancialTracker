# Financial Tracker — run app and dependencies in a container
# Build: docker build -t financial-tracker .
# Run:   docker run -p 5000:5000 financial-tracker

FROM python:3.12-slim

# Create app user (don't run as root)
RUN useradd --create-home appuser
WORKDIR /app

# Install dependencies first (better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY --chown=appuser:appuser . .

# Ensure appuser can create files in /app (e.g. instance/ and app.db)
RUN mkdir -p /app/instance && chown -R appuser:appuser /app

# Listen on all interfaces so the app is reachable from outside the container
ENV FLASK_RUN_HOST=0.0.0.0
EXPOSE 5000

USER appuser

# Same as: python -m app (Flask will read FLASK_RUN_HOST)
CMD ["python", "-m", "app"]
