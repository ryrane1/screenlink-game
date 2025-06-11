# Use official lightweight Python image
FROM python:3.11-slim

# Set environment vars
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /app

# Install dependencies
COPY server/requirements.txt .
RUN pip install -r requirements.txt

# Copy project code
COPY server/. .

# Expose Flask port
EXPOSE 5000

# Run the app
CMD ["python", "app.py"]

