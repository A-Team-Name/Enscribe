#!/bin/sh

NETWORK_NAME="kernel_bridge"
BUILD_FLAG=false
NO_CACHE=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    --no-cache)
      BUILD_FLAG=true
      NO_CACHE=true
      shift
      ;;
    --build)
      BUILD_FLAG=true
      shift
      ;;
    *)
      echo "Unknown argument: $arg"
      echo "Usage: $0 [--no-cache] [--build]"
      exit 1
      ;;
  esac
done

echo "Stopping and removing containers..."
docker-compose down --volumes

ARCH=$(uname -m)

if [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
  export KERNEL_PLATFORM="linux/amd64"
  echo "Detected architecture: aarch64. Setting kernel platform to linux/amd64 for kernel."
else
  export KERNEL_PLATFORM=""
  echo "Detected architecture: $ARCH. No specific platform needed."
fi

# Function to check if all services have their images
are_images_available() {
  MISSING_IMAGES=0
  for service in $(docker-compose config --services); do
    image=$(docker-compose config | grep "image: " | awk '{print $2}')
    if [ -n "$image" ]; then
      if ! docker image inspect "$image" >/dev/null 2>&1; then
        echo "Image for service '$service' ($image) is missing."
        MISSING_IMAGES=1
      fi
    fi
  done
  return $MISSING_IMAGES
}

# Check if build is needed
if [ "$BUILD_FLAG" = true ]; then
  echo "Managing network..."
  if docker network ls | grep -q "$NETWORK_NAME"; then
    docker network rm "$NETWORK_NAME"
  fi

  docker network create "$NETWORK_NAME"
  if [ "$NO_CACHE" = true ]; then
    echo "Building (no-cache)..."
    docker-compose build --no-cache
  else
    echo "Building..."
    docker-compose build
  fi
  echo "Starting containers..."
  docker-compose up
else
  echo "No explicit build specified: checking for available images..."
  if are_images_available; then
    echo "All images available: starting containers without building..."
  else
    echo "Some images are missing: building before starting..."
  fi
  docker-compose up
fi
