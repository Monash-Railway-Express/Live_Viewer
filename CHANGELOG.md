# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.4.1] - 2026-05-30

## Added

- od_location_counter on data dashboard.

## Changed

- Update sheet from CAN registry.

## [2.4.0] - 2026-05-23

## Added

- Dashboard to track key values.
- CAN message type highlighting.

## Changed

- Differentiate heartbeat display based on operation mode.

## [2.3.0] - 2026-05-12

## Changed

- Separate serial monitors for different nodes.

## [2.2.0] - 2026-05-07

## Added

- Serial dashboard page.
- Status symbol legend.

## [2.1.0] - 2026-05-01

## Added

- Disconnect button.
- Jump to now button.

## [2.0.1] - 2026-05-01

## Added

- Favicon.

### Changed

- Limit feed history to 1000 messages.
- Improve performance in the presence of frequent SSE events.
- Close the existing SSE connection before a new one is made.

## [2.0.0] - 2026-04-22

### Changed

- Switch from WebSockets to Server-Sent Events.