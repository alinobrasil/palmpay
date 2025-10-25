FROM python:3.12-slim

# Install OpenCV and build dependencies
RUN apt-get update && apt-get install -y \
    libopencv-dev \
    cmake \
    build-essential \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy project files
COPY . .

# Build and install EDCC C++ library
RUN mkdir -p build && cd build && \
    cmake .. && \
    make && \
    make install && \
    ldconfig

# Install EDCC Python package
RUN cd pypackage && pip install --no-cache-dir .

# Install Flask and other Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Create directory for registered palmprints
RUN mkdir -p /app/registered_palms

# Expose port 8000
EXPOSE 8000

# Set environment variables
ENV REGISTERED_PALMS_DIR=/app/registered_palms
ENV SIMILARITY_THRESHOLD=0.15
ENV PYTHONUNBUFFERED=1

# Run the Flask server
CMD ["python3", "-u", "api/server.py"]
