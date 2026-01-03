# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### What's Changed

- :bug: **Fixed Camera/Mic Access Issues**: Improved error handling for `getUserMedia`. Now displays specific error messages (e.g., "Permission denied", "Device not found") instead of a generic alert.
- :sparkles: **Media Fallback Strategy**: Implemented a robust fallback mechanism. If requesting both Video+Audio fails, the app now attempts to acquire Video-only or Audio-only streams, allowing users to join even with partial hardware availability.
