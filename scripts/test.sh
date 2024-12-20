# Download the mock-telegram server
wget https://github.com/rxtech-lab/mock-telegram-server/releases/download/v1.3.7/mock-telegram-linux-x86_64 -O mock-telegram
chmod +x mock-telegram

# Add the mock-telegram server to the PATH
export PATH=$PATH:$(pwd)
mock-telegram serve --bind 0.0.0.0:9000 &

# Run tests
pnpm build --filter=rxbot-cli
pnpm install --no-frozen-lockfile  # Reinstall to update binaries
pnpm coverage
