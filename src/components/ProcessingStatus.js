import React, { useState } from "react";
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

// This is an Electron app, so we can use the ipcRenderer
const { ipcRenderer } = window.require("electron");

const ProcessingStatus = ({
  processing,
  processed,
  total,
  error,
  success,
  modifiedXmlContent,
}) => {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportPath, setExportPath] = useState("");
  const [exportError, setExportError] = useState(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Calculate progress percentage
  const progress = total > 0 ? (processed / total) * 100 : 0;

  // Handle export button click
  const handleExportClick = () => {
    setExportDialogOpen(true);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setExportDialogOpen(false);
  };

  // Handle file export
  const handleExport = async () => {
    try {
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
        Adding cue points to your selected tracks. Once completed, you can
        export the modified XML file.
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

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onClose={handleDialogClose}>
        <DialogTitle>Export Modified XML</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Your modified XML file will contain all your tracks with the new cue
            points added according to your configuration.
          </DialogContentText>
          {exportError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {exportError}
            </Alert>
          )}
          {exportSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Successfully exported to: {exportPath}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleExport} color="primary" autoFocus>
            Export
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProcessingStatus;
