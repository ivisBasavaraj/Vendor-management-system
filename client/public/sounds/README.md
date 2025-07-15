# Sound Files Directory

This directory is intended for notification sound files used by the application.

## Expected Files

The sound service looks for the following files:
- `success.mp3` - Success notification sound
- `error.mp3` - Error notification sound  
- `warning.mp3` - Warning notification sound
- `info.mp3` - Information notification sound
- `notification.mp3` - Default notification sound

## Fallback Behavior

If these sound files are not present, the application will automatically fall back to using generated sounds via the Web Audio API. This ensures the application continues to work even without the sound files.

## Adding Sound Files

To add custom notification sounds:
1. Place your MP3 files in this directory with the exact names listed above
2. Ensure the files are web-optimized (small file size, appropriate bitrate)
3. Test that they load properly in the browser

## Volume Levels

All sounds should be normalized to a comfortable listening level as the application will apply additional volume controls.