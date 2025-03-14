# Autocue - Rekordbox Cue Editor

Autocue is a desktop application that helps DJs using Rekordbox add memory cues and hot cues to their tracks automatically. The app allows you to set rules for placing cues at specific intervals relative to existing hot cues or memory points.

## Features

- Import Rekordbox XML collection files
- Configure cue placement rules:
  - Add cues before or after reference points (first/last hot cue, specific hot cue, intro/outro)
  - Set the number of cues and spacing between them in bars
  - Choose between memory cues or hot cues
- Select which tracks to process
- Export a modified XML file that can be imported back into Rekordbox
- Preserves all existing track metadata and cue points

## Installation

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)

### Install and Run

1. Clone this repository:

```
git clone https://github.com/your-username/autocue.git
cd autocue
```

2. Install dependencies:

```
npm install
```

3. Run the application in development mode:

```
npm run electron
```

### Building for Production

To build the app for production:

```
npm run package
```

This will create distributables in the `dist` folder.

## Usage

1. **Import XML**: Start by loading your Rekordbox XML collection file. You can export this from Rekordbox by going to File > Export Collection in XML format.

2. **Configure Cues**: Set up your preferences for cue placement:

   - Specify reference points (first hot cue, specific hot cue, etc.)
   - Define how many cues to add and at what interval (in bars)
   - Choose between memory cues and hot cues

3. **Select Tracks**: Choose which tracks in your collection should have cues added to them.

4. **Process & Export**: Generate the new cues and export a modified XML file.

5. **Import to Rekordbox**: Import the modified XML file back into Rekordbox to apply the changes.

## Workflow Example

1. You have a track with hot cue 'A' at the intro and hot cue 'B' at the drop
2. You want to add 4 memory cues every 16 bars after the drop (hot cue B)
3. Import your XML into Autocue
4. Configure: "Add 4 memory cues, every 16 bars, after hot cue B"
5. Select the tracks you want to apply this to
6. Process and export
7. Import the new XML into Rekordbox
8. Your tracks now have perfectly spaced memory cues!

## Development

This project uses:

- Electron for the desktop application framework
- React for the UI
- Material UI for the component library
- fast-xml-parser for XML handling

## License

MIT

## Acknowledgements

- Rekordbox is a trademark of Pioneer DJ Corporation
- This application is not affiliated with or endorsed by Pioneer DJ
