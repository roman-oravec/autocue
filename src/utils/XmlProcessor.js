import { XMLParser, XMLBuilder } from "fast-xml-parser";

class XmlProcessor {
  constructor() {
    // Configure XML parser with handling for attributes
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      isArray: (name) => {
        // These tags should always be treated as arrays
        return ["TRACK", "POSITION_MARK", "TEMPO", "NODE"].includes(name);
      },
    });

    // Configure XML builder with basic settings
    this.builder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      format: true,
      suppressEmptyNode: true,
    });

    // Define tags that should be self-closing in Rekordbox XML
    this.selfClosingTags = ["POSITION_MARK", "TEMPO"];

    // Define tags that should always have opening/closing pairs
    this.nonSelfClosingTags = [
      "TRACK",
      "DJ_PLAYLISTS",
      "COLLECTION",
      "PLAYLISTS",
      "NODE",
    ];
  }

  /**
   * Parse XML string content into JavaScript object
   * @param {string} xmlContent XML content as string
   * @returns {Object} Parsed XML as JavaScript object
   */
  parseXml(xmlContent) {
    try {
      return this.parser.parse(xmlContent);
    } catch (error) {
      throw new Error(`Error parsing XML: ${error.message}`);
    }
  }

  /**
   * Format XML to match Rekordbox's style
   * @param {string} xmlString Raw XML string
   * @returns {string} Formatted XML string
   */
  formatXmlForRekordbox(xmlString) {
    let formattedXml = xmlString;

    // Convert all specified tags to self-closing format
    this.selfClosingTags.forEach((tag) => {
      const regex = new RegExp(`<${tag}([^>]*)></${tag}>`, "g");
      formattedXml = formattedXml.replace(regex, `<${tag}$1/>`);
    });

    // Fix XML declaration if needed
    if (!formattedXml.startsWith("<?xml")) {
      formattedXml = '<?xml version="1.0" encoding="UTF-8"?>\n' + formattedXml;
    }

    // Fix empty TRACK tags (ensure they're not self-closing)
    formattedXml = formattedXml.replace(
      /<TRACK([^>]*)\/>/g,
      "<TRACK$1></TRACK>"
    );

    return formattedXml;
  }

  /**
   * Create Position Mark XML string directly
   * @param {Object} attrs Attributes for the position mark
   * @returns {string} XML string for a position mark
   */
  createPositionMarkXml(attrs) {
    const attrString = Object.entries(attrs)
      .map(([key, value]) => `${key.replace("@_", "")}="${value}"`)
      .join(" ");

    return `<POSITION_MARK ${attrString}/>`;
  }

  /**
   * Complete POSITION_MARK attributes to match Rekordbox format
   */
  completePositionMarkAttributes(positionMark) {
    // Make a copy to avoid modifying the original
    const mark = { ...positionMark };

    // Ensure all required attributes are present
    if (!mark["@_Name"]) {
      mark["@_Name"] = "";
    }

    // Ensure Type is always "0" for Rekordbox
    mark["@_Type"] = "0";

    // Ensure Start has 3 decimal places
    if (mark["@_Start"]) {
      const start = parseFloat(mark["@_Start"]);
      mark["@_Start"] = start.toFixed(3);
    }

    return mark;
  }

  /**
   * Convert JavaScript object back to XML string
   * @param {Object} jsObject JavaScript object to convert
   * @returns {string} Generated XML string
   */
  buildXml(jsObject) {
    try {
      // Process all POSITION_MARK entries
      this.processAllPositionMarks(jsObject);

      // Generate the XML
      const rawXml = this.builder.build(jsObject);

      // Post-process the XML to match Rekordbox format
      return this.formatXmlForRekordbox(rawXml);
    } catch (error) {
      console.error("Error building XML:", error);
      throw new Error(`Error building XML: ${error.message}`);
    }
  }

  /**
   * Process all POSITION_MARK entries in the XML object
   * @param {Object} data The XML data object
   */
  processAllPositionMarks(data) {
    if (!data.DJ_PLAYLISTS?.COLLECTION?.TRACK) {
      return;
    }

    const tracks = data.DJ_PLAYLISTS.COLLECTION.TRACK;

    tracks.forEach((track) => {
      if (!track.POSITION_MARK) {
        return;
      }

      // Complete all position marks
      track.POSITION_MARK = track.POSITION_MARK.map((mark) =>
        this.completePositionMarkAttributes(mark)
      );

      // Sort position marks by time
      track.POSITION_MARK.sort(
        (a, b) => parseFloat(a["@_Start"]) - parseFloat(b["@_Start"])
      );
    });
  }

  /**
   * Process XML content and add cues according to configuration
   * @param {string} xmlContent Original XML content
   * @param {Object} config Configuration for cue points
   * @param {Array<string>} selectedTrackIds IDs of tracks to process
   * @returns {string} Modified XML content
   */
  processXml(xmlContent, config, selectedTrackIds) {
    try {
      // Parse the XML to JavaScript object
      const parsedData = this.parseXml(xmlContent);

      // Check if the XML has the expected structure
      if (!parsedData.DJ_PLAYLISTS || !parsedData.DJ_PLAYLISTS.COLLECTION) {
        throw new Error("Invalid Rekordbox XML format");
      }

      // Access the collection of tracks
      const collection = parsedData.DJ_PLAYLISTS.COLLECTION;

      // Find selected tracks and process each one
      collection.TRACK.forEach((track) => {
        if (selectedTrackIds.includes(track["@_TrackID"])) {
          this.processSingleTrack(track, config);
        }
      });

      // Create a new playlist with the processed tracks
      this.createPlaylistWithProcessedTracks(parsedData, selectedTrackIds);

      // Convert back to XML string
      return this.buildXml(parsedData);
    } catch (error) {
      throw new Error(`Error processing XML: ${error.message}`);
    }
  }

  /**
   * Process a single track by adding cue points according to configuration
   * @param {Object} track The track object to process
   * @param {Object} config Configuration for cue points
   */
  processSingleTrack(track, config) {
    // Make sure POSITION_MARK is initialized as array
    if (!track.POSITION_MARK) {
      track.POSITION_MARK = [];
    } else if (!Array.isArray(track.POSITION_MARK)) {
      track.POSITION_MARK = [track.POSITION_MARK];
    }

    // Get total track time in seconds
    const totalTime = parseFloat(track["@_TotalTime"] || 0);

    // Get BPM from TEMPO tag (if exists)
    let bpm = 0;
    if (track.TEMPO) {
      // TEMPO might be a single object or an array
      const tempos = Array.isArray(track.TEMPO) ? track.TEMPO : [track.TEMPO];
      if (tempos.length > 0) {
        // Get the first tempo (for simplicity)
        bpm = parseFloat(tempos[0]["@_Bpm"] || 0);
      }
    }

    // If BPM isn't in TEMPO tag, try the AverageBpm attribute of the track
    if (bpm <= 0) {
      bpm = parseFloat(track["@_AverageBpm"] || 0);
    }

    // If we still don't have a valid BPM, cannot proceed
    if (bpm <= 0 || isNaN(bpm) || totalTime <= 0 || isNaN(totalTime)) {
      console.warn(
        `Skipping track ${track["@_Name"]} - invalid BPM or duration`
      );
      return;
    }

    // Find reference points for positioning new cues
    const beforeRefPoint = this.findReferencePoint(
      track,
      config.beforeReference,
      config.specificBeforeCue,
      "before"
    );
    const afterRefPoint = this.findReferencePoint(
      track,
      config.afterReference,
      config.specificAfterCue,
      "after"
    );

    // If we can't find reference points, don't proceed
    if (!beforeRefPoint || !afterRefPoint) {
      console.warn(
        `Skipping track ${track["@_Name"]} - couldn't find reference points`
      );
      return;
    }

    // Calculate bar duration (4 beats per bar)
    const beatDuration = 60 / bpm; // Duration of one beat in seconds
    const barDuration = beatDuration * 4; // Duration of one bar in seconds

    // Create arrays to store new cues
    const newCues = [];

    // Generate cues before reference point
    if (config.beforeCount > 0) {
      const cueBefore = this.generateCuesBeforeRef(
        track,
        beforeRefPoint,
        config.beforeCount,
        config.beforeInterval,
        barDuration,
        config.cueType
      );
      newCues.push(...cueBefore);
    }

    // Generate cues after reference point
    if (config.afterCount > 0) {
      const cueAfter = this.generateCuesAfterRef(
        track,
        afterRefPoint,
        config.afterCount,
        config.afterInterval,
        barDuration,
        config.cueType,
        totalTime
      );
      newCues.push(...cueAfter);
    }

    // Add new cues to the track
    track.POSITION_MARK = [...track.POSITION_MARK, ...newCues];

    // Sort position marks by time
    track.POSITION_MARK.sort(
      (a, b) => parseFloat(a["@_Start"]) - parseFloat(b["@_Start"])
    );
  }

  /**
   * Find reference point in the track based on configuration
   * @param {Object} track The track object to process
   * @param {string} refType Type of reference point ('firstHotCue', 'lastHotCue', 'specificHotCue', 'intro', 'outro')
   * @param {string} specificCue Letter of specific hot cue if refType is 'specificHotCue'
   * @param {string} position Whether this is 'before' or 'after' reference
   * @returns {Object|null} Reference point object or null if not found
   */
  findReferencePoint(track, refType, specificCue, position) {
    // Ensure POSITION_MARK is an array
    const positions = track.POSITION_MARK
      ? Array.isArray(track.POSITION_MARK)
        ? track.POSITION_MARK
        : [track.POSITION_MARK]
      : [];

    if (positions.length === 0) {
      return null;
    }

    // Convert specificCue letter to a number (A=0, B=1, etc.)
    const specificCueNum = specificCue ? specificCue.charCodeAt(0) - 65 : -1;

    // Filter hot cues (Type=0, Num>=0)
    // Note: For Rekordbox, all cues have Type=0, but hot cues have Num>=0
    const hotCues = positions.filter(
      (pos) => pos["@_Type"] === "0" && parseInt(pos["@_Num"]) >= 0
    );

    if (hotCues.length === 0) {
      return null;
    }

    // Sort by position
    hotCues.sort((a, b) => parseFloat(a["@_Start"]) - parseFloat(b["@_Start"]));

    switch (refType) {
      case "firstHotCue":
        return hotCues[0];

      case "lastHotCue":
        return hotCues[hotCues.length - 1];

      case "specificHotCue":
        // Find hot cue by number (Rekordbox uses 0 for A, 1 for B, etc.)
        return (
          hotCues.find((cue) => parseInt(cue["@_Num"]) === specificCueNum) ||
          null
        );

      case "intro":
        // For simplicity, let's use first hot cue as intro
        return hotCues[0];

      case "outro":
        // For simplicity, let's use last hot cue as outro
        return hotCues[hotCues.length - 1];

      default:
        return null;
    }
  }

  /**
   * Check if a time position is too close to existing cues
   * @param {Object} track The track object
   * @param {number} time Time position in seconds
   * @returns {boolean} True if the position is too close to an existing cue
   */
  isTooCloseToExistingCues(track, time) {
    // Don't allow cues within 500ms of each other
    const minDistance = 0.5; // 500ms in seconds

    const positions = track.POSITION_MARK
      ? Array.isArray(track.POSITION_MARK)
        ? track.POSITION_MARK
        : [track.POSITION_MARK]
      : [];

    return positions.some((pos) => {
      const posTime = parseFloat(pos["@_Start"]);
      return Math.abs(posTime - time) < minDistance;
    });
  }

  /**
   * Generate cue points before reference point
   * @param {Object} track The track object
   * @param {Object} refPoint Reference point object
   * @param {number} count Number of cues to generate
   * @param {number} interval Interval between cues in bars
   * @param {number} barDuration Duration of one bar in seconds
   * @param {string} cueType Type of cue to create ('memory' or 'hot')
   * @returns {Array} Array of new cue point objects
   */
  generateCuesBeforeRef(
    track,
    refPoint,
    count,
    interval,
    barDuration,
    cueType
  ) {
    const newCues = [];
    const refTime = parseFloat(refPoint["@_Start"]);

    for (let i = 1; i <= count; i++) {
      const time = Math.max(0, refTime - i * interval * barDuration);

      // Skip if time is negative or too close to the start
      if (time < 0.025) continue;

      // Skip if time is too close to an existing cue
      if (this.isTooCloseToExistingCues(track, time)) continue;

      // Create the new cue with all required attributes
      const cueNum =
        cueType === "memory"
          ? "-1"
          : this.getNextAvailableHotCueNumber(track).toString();

      // Create a new position mark with proper formatting
      newCues.push({
        "@_Name": `Auto ${count - i + 1}`,
        "@_Type": "0", // Always 0 for Rekordbox
        "@_Start": time.toFixed(3), // Format with 3 decimal places
        "@_Num": cueNum,
      });

      // If it's a hot cue (Num >= 0), add default RGB color attributes
      if (cueNum !== "-1") {
        // Use a color based on cue number (similar to Rekordbox defaults)
        const colors = [
          { r: 255, g: 55, b: 111 }, // Red (A)
          { r: 69, g: 172, b: 219 }, // Blue (B)
          { r: 125, g: 193, b: 61 }, // Green (C)
          { r: 237, g: 135, b: 0 }, // Orange (D)
          { r: 189, g: 94, b: 235 }, // Purple (E)
          { r: 32, g: 218, b: 181 }, // Turquoise (F)
          { r: 255, g: 204, b: 0 }, // Yellow (G)
          { r: 226, g: 82, b: 153 }, // Pink (H)
        ];

        const colorIndex = parseInt(cueNum);
        if (colorIndex >= 0 && colorIndex < colors.length) {
          const color = colors[colorIndex];
          newCues[newCues.length - 1]["@_Red"] = color.r.toString();
          newCues[newCues.length - 1]["@_Green"] = color.g.toString();
          newCues[newCues.length - 1]["@_Blue"] = color.b.toString();
        }
      }
    }

    return newCues;
  }

  /**
   * Generate cue points after reference point
   * @param {Object} track The track object
   * @param {Object} refPoint Reference point object
   * @param {number} count Number of cues to generate
   * @param {number} interval Interval between cues in bars
   * @param {number} barDuration Duration of one bar in seconds
   * @param {string} cueType Type of cue to create ('memory' or 'hot')
   * @param {number} totalTime Total track time in seconds
   * @returns {Array} Array of new cue point objects
   */
  generateCuesAfterRef(
    track,
    refPoint,
    count,
    interval,
    barDuration,
    cueType,
    totalTime
  ) {
    const newCues = [];
    const refTime = parseFloat(refPoint["@_Start"]);

    for (let i = 1; i <= count; i++) {
      const time = refTime + i * interval * barDuration;

      // Skip if time is beyond the track duration
      if (time >= totalTime) continue;

      // Skip if time is too close to an existing cue
      if (this.isTooCloseToExistingCues(track, time)) continue;

      // Get cue number (memory=-1, hot cues=0-7)
      const cueNum =
        cueType === "memory"
          ? "-1"
          : this.getNextAvailableHotCueNumber(track).toString();

      // Create a new position mark with proper formatting
      newCues.push({
        "@_Name": `Auto ${i}`,
        "@_Type": "0", // Always 0 for Rekordbox
        "@_Start": time.toFixed(3), // Format with 3 decimal places
        "@_Num": cueNum,
      });

      // If it's a hot cue (Num >= 0), add default RGB color attributes
      if (cueNum !== "-1") {
        // Use a color based on cue number (similar to Rekordbox defaults)
        const colors = [
          { r: 255, g: 55, b: 111 }, // Red (A)
          { r: 69, g: 172, b: 219 }, // Blue (B)
          { r: 125, g: 193, b: 61 }, // Green (C)
          { r: 237, g: 135, b: 0 }, // Orange (D)
          { r: 189, g: 94, b: 235 }, // Purple (E)
          { r: 32, g: 218, b: 181 }, // Turquoise (F)
          { r: 255, g: 204, b: 0 }, // Yellow (G)
          { r: 226, g: 82, b: 153 }, // Pink (H)
        ];

        const colorIndex = parseInt(cueNum);
        if (colorIndex >= 0 && colorIndex < colors.length) {
          const color = colors[colorIndex];
          newCues[newCues.length - 1]["@_Red"] = color.r.toString();
          newCues[newCues.length - 1]["@_Green"] = color.g.toString();
          newCues[newCues.length - 1]["@_Blue"] = color.b.toString();
        }
      }
    }

    return newCues;
  }

  /**
   * Get the next available hot cue number for a track
   * @param {Object} track The track object
   * @returns {number} Next available hot cue number (0=A, 1=B, etc.)
   */
  getNextAvailableHotCueNumber(track) {
    const positions = track.POSITION_MARK
      ? Array.isArray(track.POSITION_MARK)
        ? track.POSITION_MARK
        : [track.POSITION_MARK]
      : [];

    // Find all hot cue numbers currently in use
    const usedNumbers = positions
      .filter((pos) => pos["@_Type"] === "0" && parseInt(pos["@_Num"]) >= 0)
      .map((pos) => parseInt(pos["@_Num"]));

    // Find the next available number from 0-7 (Rekordbox supports 8 hot cues A-H, numbered 0-7)
    for (let i = 0; i < 8; i++) {
      if (!usedNumbers.includes(i)) {
        return i;
      }
    }

    // If all hot cue slots are used, default to a memory cue
    return -1;
  }

  /**
   * Create a new playlist with the processed tracks
   * @param {Object} parsedData Parsed XML object
   * @param {Array<string>} selectedTrackIds IDs of processed tracks
   */
  createPlaylistWithProcessedTracks(parsedData, selectedTrackIds) {
    // Ensure PLAYLISTS node exists
    if (!parsedData.DJ_PLAYLISTS.PLAYLISTS) {
      parsedData.DJ_PLAYLISTS.PLAYLISTS = {
        NODE: [],
      };
    }

    // Create playlists array if it doesn't exist
    if (!Array.isArray(parsedData.DJ_PLAYLISTS.PLAYLISTS.NODE)) {
      parsedData.DJ_PLAYLISTS.PLAYLISTS.NODE = [
        parsedData.DJ_PLAYLISTS.PLAYLISTS.NODE,
      ];
    }

    // Create a new playlist node
    const newPlaylist = {
      "@_Name": "Autocue Processed Tracks",
      "@_Type": "1",
      "@_KeyType": "0",
      TRACK: selectedTrackIds.map((id) => ({ "@_Key": id })),
    };

    // Add the playlist to the playlists array
    parsedData.DJ_PLAYLISTS.PLAYLISTS.NODE.push(newPlaylist);
  }
}

export default new XmlProcessor();
