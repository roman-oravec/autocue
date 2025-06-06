import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Stack,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import HistoryIcon from "@mui/icons-material/History";
import { XMLParser } from "fast-xml-parser";

// Safe require for Electron modules
const safeRequire = (module) => {
  try {
    return window.require(module);
  } catch (error) {
    console.error(`Failed to require ${module}:`, error);
    return null;
  }
};

// This is an Electron app, so we can use the ipcRenderer
const { ipcRenderer } = safeRequire("electron") || { ipcRenderer: null };

// Import Store for persistency - with error handling
let store;
try {
  const Store = safeRequire("electron-store");
  store = Store ? new Store() : null;
} catch (error) {
  console.error("Failed to initialize electron-store:", error);
  store = null;
}

// Fallback if store initialization failed
if (!store) {
  store = {
    get: () => null,
    set: () => {},
    delete: () => {},
  };
}

const FileLoader = ({ onFileLoad }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState("");
  const [lastFilePath, setLastFilePath] = useState(null);

  // Check for last opened file on component mount
  useEffect(() => {
    try {
      const savedFilePath = store.get("lastXmlFilePath");
      if (savedFilePath) {
        // Extract file name from path
        const pathParts = savedFilePath.split(/[/\\]/);
        const lastFileName = pathParts[pathParts.length - 1];

        setLastFilePath(savedFilePath);
      }
    } catch (error) {
      console.error("Error retrieving last file path:", error);
      // Don't update the state if there's an error
    }
  }, []);

  const loadFile = async (filePath) => {
    try {
      // Check if ipcRenderer is available
      if (!ipcRenderer) {
        throw new Error("Electron IPC is not available");
      }

      setLoading(true);
      setError(null);

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
        isArray: (name) => {
          // These tags should always be treated as arrays
          return ["TRACK", "POSITION_MARK", "TEMPO", "NODE"].includes(name);
        },
      });

      const parsedData = parser.parse(content);

      // Extract tracks from the XML
      const collection = parsedData.DJ_PLAYLISTS?.COLLECTION;
      let tracks = [];

      if (collection && collection.TRACK) {
        // Format track data for display
        tracks = collection.TRACK.map((track) => ({
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

      // Extract playlists from the XML
      const playlists = extractPlaylists(parsedData);

      // Save file path for future use
      try {
        store.set("lastXmlFilePath", filePath);
        setLastFilePath(filePath);
      } catch (error) {
        console.error("Error saving last file path:", error);
        // Continue with file loading even if we couldn't save the path
      }

      // Pass data to parent component
      onFileLoad(filePath, content, tracks, playlists);
    } catch (err) {
      console.error("Error loading XML file:", err);
      setError(`Error loading XML file: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async () => {
    try {
      // Check if ipcRenderer is available
      if (!ipcRenderer) {
        throw new Error("Electron IPC is not available");
      }

      // Use Electron dialog to select file
      const filePath = await ipcRenderer.invoke("select-file");

      if (!filePath) {
        return; // User cancelled
      }

      await loadFile(filePath);
    } catch (err) {
      console.error("Error selecting XML file:", err);
      setError(`Error selecting XML file: ${err.message}`);
    }
  };

  const handleLastFileLoad = async () => {
    if (!ipcRenderer) {
      setError("Electron IPC is not available");
      return;
    }

    if (lastFilePath) {
      try {
        // Check if file exists
        const fileExists = await ipcRenderer.invoke(
          "check-file-exists",
          lastFilePath
        );
        if (!fileExists) {
          setError(`Last file not found: ${lastFilePath}`);
          // Remove the invalid path from store
          try {
            store.delete("lastXmlFilePath");
          } catch (error) {
            console.error("Error deleting last file path from store:", error);
          }
          setLastFilePath(null);
          return;
        }

        await loadFile(lastFilePath);
      } catch (err) {
        console.error("Error loading last file:", err);
        setError(`Error loading last file: ${err.message}`);
      }
    }
  };

  // Extract playlists from the parsed XML data
  const extractPlaylists = (parsedData) => {
    const playlists = [];
    const playlistsData = parsedData.DJ_PLAYLISTS?.PLAYLISTS;

    if (!playlistsData || !playlistsData.NODE) {
      return playlists;
    }

    // Process the root node to extract playlists
    const processNode = (node, parentPath = "") => {
      // Skip if not a valid node
      if (!node) return;

      const nodeType = node["@_Type"];
      const nodeName = node["@_Name"] || "Unnamed";
      const currentPath = parentPath ? `${parentPath} / ${nodeName}` : nodeName;

      // Type 1 is a playlist, Type 0 is a folder
      if (nodeType === "1") {
        // This is a playlist
        const tracks = node.TRACK || [];
        const trackIds = tracks.map((track) => track["@_Key"]);

        playlists.push({
          id: `playlist-${playlists.length}`,
          name: nodeName,
          path: currentPath,
          trackIds: trackIds,
        });
      }

      // Process child nodes (folders)
      if (node.NODE) {
        const childNodes = Array.isArray(node.NODE) ? node.NODE : [node.NODE];
        childNodes.forEach((childNode) => {
          processNode(childNode, currentPath);
        });
      }
    };

    // Start processing from the root nodes
    const rootNodes = Array.isArray(playlistsData.NODE)
      ? playlistsData.NODE
      : [playlistsData.NODE];

    rootNodes.forEach((node) => processNode(node));

    return playlists;
  };

  // Extract hot cues from track data
  const extractHotCues = (track) => {
    const hotCues = [];
    if (track.POSITION_MARK) {
      track.POSITION_MARK.forEach((pos) => {
        // For Rekordbox, Type="0" for all cues, but hot cues have Num>=0
        if (pos["@_Type"] === "0" && parseInt(pos["@_Num"]) >= 0) {
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
      track.POSITION_MARK.forEach((pos) => {
        // For Rekordbox, Type="0" for all cues, but memory cues have Num="-1"
        if (pos["@_Type"] === "0" && pos["@_Num"] === "-1") {
          memoryCues.push({
            type: "memory",
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

      {lastFilePath && !loading && !fileName && (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            mt: 2,
            mb: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <HistoryIcon color="primary" />
            <Typography variant="body1">
              Last opened file: {lastFilePath.split(/[/\\]/).pop()}
            </Typography>
          </Stack>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleLastFileLoad}
          >
            Load Last Used File
          </Button>
        </Paper>
      )}

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
              {lastFilePath
                ? "Select Different XML File"
                : "Select Rekordbox XML"}
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
