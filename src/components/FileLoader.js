import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { XMLParser } from "fast-xml-parser";

// This is an Electron app, so we can use the ipcRenderer
const { ipcRenderer } = window.require("electron");

const FileLoader = ({ onFileLoad }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState("");

  const handleFileSelect = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use Electron dialog to select file
      const filePath = await ipcRenderer.invoke("select-file");

      if (!filePath) {
        setLoading(false);
        return; // User cancelled
      }

      // Extract file name from path
      const pathParts = filePath.split(/[/\\]/);
      setFileName(pathParts[pathParts.length - 1]);

      // Read the file content
      const content = await ipcRenderer.invoke("read-file", filePath);

      if (!content) {
        throw new Error("Failed to read file content");
      }

      // Parse XML to extract track information
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
      });

      const parsedData = parser.parse(content);

      // Extract tracks from the XML
      const collection = parsedData.DJ_PLAYLISTS?.COLLECTION;
      let tracks = [];

      if (collection && collection.TRACK) {
        tracks = Array.isArray(collection.TRACK)
          ? collection.TRACK
          : [collection.TRACK];

        // Format track data for display
        tracks = tracks.map((track) => ({
          id: track["@_TrackID"],
          name: track["@_Name"],
          artist: track["@_Artist"],
          album: track["@_Album"],
          location: track["@_Location"],
          totalTime: track["@_TotalTime"],
          bpm: parseFloat(track["@_AverageBpm"] || "0"),
          key: track["@_Key"],
          // Extract existing cues
          hotCues: extractHotCues(track),
          memoryCues: extractMemoryCues(track),
        }));
      }

      // Pass data to parent component
      onFileLoad(filePath, content, tracks);
    } catch (err) {
      console.error("Error loading XML file:", err);
      setError(`Error loading XML file: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Extract hot cues from track data
  const extractHotCues = (track) => {
    const hotCues = [];
    if (track.POSITION_MARK) {
      const positions = Array.isArray(track.POSITION_MARK)
        ? track.POSITION_MARK
        : [track.POSITION_MARK];

      positions.forEach((pos) => {
        if (pos["@_Type"] === "0") {
          // Hot cue
          hotCues.push({
            type: "hot",
            num: pos["@_Num"],
            name: pos["@_Name"],
            start: pos["@_Start"],
            end: pos["@_End"],
            // Convert to time format (optional)
            timeFormatted: formatTime(pos["@_Start"]),
          });
        }
      });
    }
    return hotCues;
  };

  // Extract memory cues from track data
  const extractMemoryCues = (track) => {
    const memoryCues = [];
    if (track.POSITION_MARK) {
      const positions = Array.isArray(track.POSITION_MARK)
        ? track.POSITION_MARK
        : [track.POSITION_MARK];

      positions.forEach((pos) => {
        if (pos["@_Type"] === "4") {
          // Memory cue
          memoryCues.push({
            type: "memory",
            num: pos["@_Num"],
            name: pos["@_Name"],
            start: pos["@_Start"],
            end: pos["@_End"],
            // Convert to time format (optional)
            timeFormatted: formatTime(pos["@_Start"]),
          });
        }
      });
    }
    return memoryCues;
  };

  // Format milliseconds to MM:SS.ms format
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = ms % 1000;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`;
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h5" gutterBottom>
        Import Rekordbox XML
      </Typography>
      <Typography paragraph>
        Select your Rekordbox XML file to begin. You can export this from
        Rekordbox by going to File &gt; Export Collection in XML format.
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          p: 3,
          mt: 2,
          mb: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "200px",
          border: "2px dashed #555",
          backgroundColor: "rgba(0,0,0,0.05)",
        }}
      >
        {loading ? (
          <CircularProgress size={50} />
        ) : (
          <>
            <UploadFileIcon
              sx={{ fontSize: 60, mb: 2, color: "primary.main" }}
            />
            <Typography variant="h6" gutterBottom>
              {fileName || "No file selected"}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleFileSelect}
              sx={{ mt: 2 }}
            >
              Select Rekordbox XML
            </Button>
          </>
        )}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default FileLoader;
