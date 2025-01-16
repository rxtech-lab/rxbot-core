# Define version variable
MOCK_TELEGRAM_VERSION="1.3.8"

# Download the mock-telegram server
wget "https://github.com/rxtech-lab/mock-telegram-server/releases/download/v${MOCK_TELEGRAM_VERSION}/mock-telegram-linux-x86_64" -O mock-telegram
chmod +x mock-telegram

# Add the mock-telegram server to the PATH
export PATH=$PATH:$(pwd)
mock-telegram serve --bind 0.0.0.0:9000 &

# Run tests
pnpm build --filter=rxbot-cli
pnpm install --no-frozen-lockfile  # Reinstall to update binaries
pnpm coverage
