import React, { useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Button from "@mui/material/Button";

// Import components
import FileLoader from "./components/FileLoader";
import ConfigPanel from "./components/ConfigPanel";
import TrackSelector from "./components/TrackSelector";
import ProcessingStatus from "./components/ProcessingStatus";

// Import XmlProcessor at the top of the file
import XmlProcessor from "./utils/XmlProcessor";

// Create a dark theme for the app
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#1DB954", // Spotify green for a DJ-friendly look
    },
    secondary: {
      main: "#1976d2",
    },
    background: {
      default: "#121212",
      paper: "#1e1e1e",
    },
  },
});

// Steps in the process
const steps = [
  "Import XML",
  "Configure Cues",
  "Select Tracks",
  "Process & Export",
];

export default function App() {
  // State variables
  const [activeStep, setActiveStep] = useState(0);
  const [xmlContent, setXmlContent] = useState(null);
  const [xmlFilePath, setXmlFilePath] = useState("");
  const [tracks, setTracks] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [selectedTracks, setSelectedTracks] = useState([]);
  const [config, setConfig] = useState({
    beforeReference: "firstHotCue", // 'firstHotCue', 'specificHotCue', 'intro'
    afterReference: "lastHotCue", // 'lastHotCue', 'specificHotCue', 'outro'
    specificBeforeCue: "A", // if beforeReference is 'specificHotCue'
    specificAfterCue: "H", // if afterReference is 'specificHotCue'
    beforeCount: 2, // number of cues to add before
    afterCount: 4, // number of cues to add after
    beforeInterval: 8, // bars between cues (before)
    afterInterval: 16, // bars between cues (after)
    cueType: "memory", // 'memory' or 'hot'
  });
  const [processing, setProcessing] = useState(false);
  const [processedTracks, setProcessedTracks] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [modifiedXmlContent, setModifiedXmlContent] = useState(null);

  // Handle file loading
  const handleFileLoad = async (
    filePath,
    content,
    parsedTracks,
    parsedPlaylists
  ) => {
    setXmlFilePath(filePath);
    setXmlContent(content);
    setTracks(parsedTracks);
    setPlaylists(parsedPlaylists || []);
    setError(null);
  };

  // Handle configuration changes
  const handleConfigChange = (newConfig) => {
    setConfig({ ...config, ...newConfig });
  };

  // Handle track selection
  const handleTrackSelection = (selected) => {
    setSelectedTracks(selected);
  };

  // Handle moving to the next step
  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      // Process and export
      processAndExport();
    } else {
      setActiveStep(activeStep + 1);
    }
  };

  // Handle moving back to the previous step
  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  // Process and export the modified XML
  const processAndExport = async () => {
    setProcessing(true);
    setProcessedTracks(0);
    setError(null);
    setSuccess(false);

    try {
      // Use XmlProcessor to modify the XML content
      const modifiedXml = XmlProcessor.processXml(
        xmlContent,
        config,
        selectedTracks
      );

      // Store the modified XML for later export
      setModifiedXmlContent(modifiedXml);

      // Simulate track processing for UI feedback
      for (let i = 0; i < selectedTracks.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 50)); // Brief delay for visual feedback
        setProcessedTracks(i + 1);
      }

      // Show success message
      setSuccess(true);
    } catch (err) {
      console.error("Error processing XML:", err);
      setError(`Error processing XML: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // Render the current step
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return <FileLoader onFileLoad={handleFileLoad} />;
      case 1:
        return <ConfigPanel config={config} onChange={handleConfigChange} />;
      case 2:
        return (
          <TrackSelector
            tracks={tracks}
            selectedTracks={selectedTracks}
            onSelectionChange={handleTrackSelection}
            playlists={playlists}
          />
        );
      case 3:
        return (
          <ProcessingStatus
            processing={processing}
            processed={processedTracks}
            total={selectedTracks.length}
            error={error}
            success={success}
            modifiedXmlContent={modifiedXmlContent}
          />
        );
      default:
        return "Unknown step";
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Typography component="h1" variant="h3" align="center" gutterBottom>
            Autocue - Rekordbox Cue Editor
          </Typography>
          <Typography
            variant="h6"
            align="center"
            color="text.secondary"
            paragraph
          >
            Automatically add memory cues and hot cues to your Rekordbox tracks
          </Typography>

          <Paper sx={{ p: 4, mt: 4 }}>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {getStepContent(activeStep)}

            <Box
              sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}
            >
              <Button
                variant="contained"
                color="inherit"
                disabled={activeStep === 0}
                onClick={handleBack}
              >
                Back
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleNext}
                disabled={
                  (activeStep === 0 && !xmlContent) ||
                  (activeStep === 2 && selectedTracks.length === 0) ||
                  (activeStep === 3 && processing)
                }
              >
                {activeStep === steps.length - 1 ? "Process & Export" : "Next"}
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
