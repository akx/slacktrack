# Slacktrack

Lazily archives Slack messages.

Run via Cron or something.

## Configuration

Configuration occurs via environment variables.

* `SLACK_TOKEN` - A Slack authentication token. Either your own or a bot's.
* `ARCHIVE_PATH` - Base path for archive files. Folders for every channel and month are created within.
* `MINUTES` - How many minutes back to request messages for. Defaults to 30 (so run every half an hour or more often).
