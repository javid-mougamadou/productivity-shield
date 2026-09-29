FROM python:3.12-alpine

WORKDIR /app

# Copy extension source
COPY . .

EXPOSE 3457

CMD ["python3", "-m", "http.server", "3457", "--directory", "/app"]
