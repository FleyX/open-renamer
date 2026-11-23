# open-renamer

![Preview](https://s3.fleyx.com/picbed/2022/11/18386180128d01eb1a59b8eacf652895.png)

Open Renamer is a batch file renamer built with a Node.js 24.x backend and Vue. The Electron desktop client and Docker/NAS version share the same business logic and SQLite data layer.

- Docker server deployment supports linux/amd64 and linux/arm64. Images are available at [hub.docker.com](https://hub.docker.com/r/fleyx/open-renamer).
- The Electron desktop client initially supports Linux x64, Windows x64, and macOS ARM64. Download it from [GitHub Releases](https://github.com/FleyX/open-renamer/releases).

Open source repository: [github.com/FleyX/open-renamer](https://github.com/FleyX/open-renamer)

Implemented processing rules:

- Insert (supports season number recognition, supports suffix filtering)
- Delete (supports regex)
- Replace (supports regex)
- Serialization
- Auto-recognition (developed for NAS users, automatically obtains season number, series/movie name)
- Simplified/Traditional Chinese conversion (supports Hong Kong/Macau Traditional Chinese, Taiwan Traditional Chinese)

Features:

- Unlimited number of rules
- Supports saving rules as templates for future use
- Docker/NAS supports amd64 and arm64 and can be accessed through a browser; the desktop client runs locally
- Special optimization for NAS video files, intelligently recognizes series name, season number, episode number, convenient for Jellyfin, Emby and other software recognition
- Supports hard link creation for renaming, BT/PT friendly

## Usage

For non-professionals, it is recommended to use the direct client startup method, no need to deploy server, just run locally. If you need to deploy in NAS, it is recommended to use server deployment method.

### Electron Desktop Client

Download the initial package for your platform from the [latest Release](https://github.com/FleyX/open-renamer/releases/latest):

| Platform | ZIP |
| --- | --- |
| Linux x64 | `open-renamer-linux-x64.zip` |
| Windows x64 | `open-renamer-win32-x64.zip` |
| macOS ARM64 | `open-renamer-darwin-arm64.zip` |

- Linux: extract the ZIP and run `open-renamer`.
- Windows: extract the ZIP and run `open-renamer.exe`.
- macOS: extract the ZIP and open the `.app`. The initial package is ad-hoc signed but not notarized. If macOS blocks it, allow it under System Settings -> Privacy & Security.

The desktop client stores its SQLite database in the `data` subdirectory of Electron's user-data directory. It does not import or reuse the old desktop data:

- Linux: `~/.config/Open Renamer/data`
- Windows: `%APPDATA%\Open Renamer\data`
- macOS: `~/Library/Application Support/Open Renamer/data`

To upgrade, download and extract the latest ZIP. The user-data directory is preserved. Linux ARM and macOS Intel are not included in this initial release; continue using their clients from historical Releases.

### Docker Deployment

- Direct docker run
```bash
# Manage files in /mnt/vdisk directory, access service through port 8089
docker run -itd  --name openRenamer -v /mnt/vdisk:/data -p 8089:8089 -e PORT="8089" -e TOKEN="123456" fleyx/open-renamer:latest
```

- docker-compose run (recommended):

```yaml
version: "3.6"
  openRenamer:
    container_name: openRenamer
    image: fleyx/open-renamer:latest
    # uid, gid of current user, can omit this item if using root
    #user: "1000:1000"
    environment:
      # Specify startup port
      - PORT=11004
      # Specify authentication token, no authentication required if not set
      - TOKEN=123456
    volumes:
      # Key point: map the folder you want to manage to the container's data directory, then you can select the data directory in the program for renaming operations
      - /mnt/vdisk:/data
      # Store template data, can omit mapping this directory
      - ./data/openRenamer:/app/data
    # Use host network, can access program via "host ip:11004"
    network_mode: host
```

Upgrade method:

1. If using latest version, update image via `docker pull fleyx/open-renamer:latest` command
2. If using version number, directly modify docker version number to the latest version number and rerun

## TODO

## Version Update Records
### 1.9.2

Backend refactored using Deno & supports hard link renaming

### 1.9.1

Client application optimization, removed startup script, double-click application to start directly

### 1.9.0

Added windows, linux, mac clients, select corresponding client for each platform

- **linux x64**: renamer-linux-x64-desktop.zip
- **linux arm64**: renamer-linux-arm-desktop.zip
- **windows x64**: renamer-win-x64-desktop.zip
- **mac arm**: renamer-mac-arm-desktop.zip
- **mac intel**: renamer-mac-x64-desktop.zip

### 1.8.0

- Delete and replace rules support regular expressions
- Fixed some issues with delete rules

### 1.7.1

- Added simplified/traditional conversion rule [issue 38](https://github.com/FleyX/open-renamer/issues/38)
- Select all supports folders [issue 39](https://github.com/FleyX/open-renamer/issues/39)
- Added loading effect when client opens

### 1.7

- Supports desktop via Electron technology, currently supports Windows

### 1.6.2

- Fixed bug with too many files [#35](https://github.com/FleyX/open-renamer/issues/35)

### 1.6.1

- Text too long display bug [#34](https://github.com/FleyX/open-renamer/issues/34)
  ![Fix text too long display](https://s3.fleyx.com/picbed/2023/05/4374cc1b43bfe1c670434317baeaf389.png)

### 1.6

- Added replace rule [#33](https://github.com/FleyX/open-renamer/issues/33)

  ![Replace rule](https://s3.fleyx.com/picbed/2023/05/f94d2a2579f728a5ff478f046ca4786e.png)

- Fixed some bugs

### 1.5

- Fixed template save bug [#31](https://github.com/FleyX/open-renamer/issues/31)
- Season recognition optimization, supports Chinese (一,二,三。。。十), up to ninety-nine [#29](https://github.com/FleyX/open-renamer/issues/29)
- Serialization rule supports grouping by suffix [#30](https://github.com/FleyX/open-renamer/issues/30)

### 1.4

- Season recognition optimization, added season.01, text 01 type support

### 1.3

- Add file supports checking folders to add all contents in the folder
  ![1](https://s3.fleyx.com/picbed/2023/03/bc3ee7aadf8fd2f3bfc1381b92b4bd89.png)
- Supports direct renaming and deletion of files in file list
  ![1](https://s3.fleyx.com/picbed/2023/03/24f29ad19885c3b8cff93be2b2f6e508.png)
  ![1](https://s3.fleyx.com/picbed/2023/03/0fe66150fc15b34e7005c74e3604eb48.png)
- Supports one-click selection of non-video, subtitle, nfo files, convenient for cleanup
- Added series renaming reference template

**Note: After this update, user usage will be collected through the interface (no private data will be collected)**
