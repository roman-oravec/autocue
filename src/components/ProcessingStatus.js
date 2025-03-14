import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DoneIcon from "@mui/icons-material/Done";
import HomeIcon from "@mui/icons-material/Home";

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

const ProcessingStatus = ({
  processing,
  processed,
  total,
  error,
  success,
  modifiedXmlContent,
  onDone,
}) => {
  const [exportError, setExportError] = useState(null);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportPath, setExportPath] = useState("");
  const autoExportedRef = useRef(false);

  // Calculate progress percentage
  const progress = total > 0 ? (processed / total) * 100 : 0;

  // Auto export when processing is complete
  useEffect(() => {
    if (success && modifiedXmlContent && !autoExportedRef.current) {
      autoExportedRef.current = true;
      handleExportClick();
    }
  }, [success]);

  // Reset the auto-export flag when processing starts again
  useEffect(() => {
    if (processing) {
      autoExportedRef.current = false;
    }
  }, [processing]);

  // Handle export button click - directly open the save dialog
  const handleExportClick = async () => {
    try {
      // Check if ipcRenderer is available
      if (!ipcRenderer) {
        throw new Error("Electron IPC is not available");
      }

      setExportError(null);
      setExportSuccess(false);

      // Use Electron dialog to select save location
      const savePath = await ipcRenderer.invoke(
        "save-file",
        "rekordbox_modified.xml"
      );

      if (!savePath) {
        return; // User cancelled
      }

      setExportPath(savePath);

      // Save the modified XML content to the selected file path
      const success = await ipcRenderer.invoke(
        "write-file",
        savePath,
        modifiedXmlContent
      );

      if (success) {
        setExportSuccess(true);
      } else {
        throw new Error("Failed to save file");
      }
    } catch (err) {
      console.error("Error exporting XML:", err);
      setExportError(`Error exporting XML: ${err.message}`);
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h5" gutterBottom>
        Process and Export
      </Typography>
      <Typography paragraph>
        When you click the "Process & Export" button, cue points will be added
        to your selected tracks, and then a save dialog will open automatically.
        Once you've saved the file, you can use the "Done" button at the bottom
        right to return to the start.
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Processing Status
        </Typography>

        {processing ? (
          <>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Box sx={{ width: "100%", mr: 1 }}>
                <LinearProgress variant="determinate" value={progress} />
              </Box>
              <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(progress)}%
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Processing track {processed} of {total}...
            </Typography>
          </>
        ) : success ? (
          <Alert
            severity="success"
            icon={<CheckCircleOutlineIcon fontSize="inherit" />}
            sx={{ mb: 2 }}
          >
            Successfully processed {processed} tracks!
            {exportSuccess && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                File saved to: {exportPath}
              </Typography>
            )}
          </Alert>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <Alert severity="info" sx={{ mb: 2 }}>
            Ready to process {total} tracks.
          </Alert>
        )}

        {exportError && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            {exportError}
          </Alert>
        )}

        {success && (
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveAltIcon />}
              onClick={handleExportClick}
              fullWidth
            >
              Export Modified XML
            </Button>
          </Box>
        )}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Import Instructions
        </Typography>
        <Typography paragraph>
          After exporting your modified XML file, follow these steps to import
          it into Rekordbox:
        </Typography>
        <ol>
          <Typography component="li" paragraph>
            Open Rekordbox and connect to your collection
          </Typography>
          <Typography component="li" paragraph>
            Go to File &gt; Import &gt; XML
          </Typography>
          <Typography component="li" paragraph>
            Select the exported XML file
          </Typography>
          <Typography component="li" paragraph>
            The tracks with new cue points will be imported as a new playlist
          </Typography>
          <Typography component="li" paragraph>
            You can then sync these changes to your DJ controller or USB drive
          </Typography>
        </ol>
      </Paper>
    </Box>
  );
};

export default ProcessingStatus;
