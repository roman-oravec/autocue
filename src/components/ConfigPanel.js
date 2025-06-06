import React from "react";
import {
  Box,
  Typography,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Radio,
  RadioGroup,
  Grid,
  Paper,
  Divider,
  Slider,
  Alert,
  Switch,
} from "@mui/material";

const ConfigPanel = ({ config, onChange }) => {
  // Handle simple input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

  // Handle numeric input changes with validation
  const handleNumericChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      onChange({ [name]: numValue });
    }
  };

  // Handle slider changes
  const handleSliderChange = (name) => (e, newValue) => {
    onChange({ [name]: newValue });
  };

  // Map slider index to actual bar values for intervals
  const barValues = [2, 4, 8, 16, 32, 64];

  // Convert bar value to slider index
  const getSliderIndex = (barValue) => {
    const index = barValues.indexOf(barValue);
    if (index >= 0) return index;

    // If the value is not in our array, find the closest value
    let bestIndex = 0;
    let minDiff = Math.abs(barValues[0] - barValue);

    for (let i = 1; i < barValues.length; i++) {
      const diff = Math.abs(barValues[i] - barValue);
      if (diff < minDiff) {
        minDiff = diff;
        bestIndex = i;
      }
    }

    return bestIndex;
  };

  // Create marks for the sliders
  const intervalMarks = barValues.map((value, index) => ({
    value: index,
    label: value.toString(),
  }));

  // Handle interval slider changes
  const handleIntervalChange = (name) => (e, sliderIndex) => {
    onChange({ [name]: barValues[sliderIndex] });
  };

  // Handle boolean switch changes
  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    onChange({ [name]: checked });
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h5" gutterBottom>
        Configure Cue Points
      </Typography>
      <Typography paragraph>
        Set up your cue point preferences. You can add cues before and after
        reference points.
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        A reference point can be the first/last hot cue, a specific hot cue, or
        the intro/outro point.
      </Alert>

      <Grid container spacing={4}>
        {/* Before Reference Configuration */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Cues Before Reference Point
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <FormControl fullWidth margin="normal">
              <InputLabel id="before-reference-label">
                Reference Point (Before)
              </InputLabel>
              <Select
                labelId="before-reference-label"
                name="beforeReference"
                value={config.beforeReference}
                label="Reference Point (Before)"
                onChange={handleInputChange}
              >
                <MenuItem value="firstHotCue">First Hot Cue</MenuItem>
                <MenuItem value="specificHotCue">Specific Hot Cue</MenuItem>
                <MenuItem value="intro">Intro Point</MenuItem>
              </Select>
            </FormControl>

            {config.beforeReference === "specificHotCue" && (
              <FormControl fullWidth margin="normal">
                <InputLabel id="specific-before-cue-label">
                  Specific Hot Cue
                </InputLabel>
                <Select
                  labelId="specific-before-cue-label"
                  name="specificBeforeCue"
                  value={config.specificBeforeCue}
                  label="Specific Hot Cue"
                  onChange={handleInputChange}
                >
                  {["A", "B", "C", "D", "E", "F", "G", "H"].map((letter) => (
                    <MenuItem key={letter} value={letter}>
                      Hot Cue {letter}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Box sx={{ mt: 3 }}>
              <Typography id="before-count-slider" gutterBottom>
                Number of Cues to Add: {config.beforeCount}
              </Typography>
              <Slider
                aria-labelledby="before-count-slider"
                value={config.beforeCount}
                onChange={handleSliderChange("beforeCount")}
                step={1}
                marks
                min={0}
                max={8}
                valueLabelDisplay="auto"
              />
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography id="before-interval-slider" gutterBottom>
                Interval Between Cues (bars): {config.beforeInterval}
              </Typography>
              <Slider
                aria-labelledby="before-interval-slider"
                value={getSliderIndex(config.beforeInterval)}
                onChange={handleIntervalChange("beforeInterval")}
                step={null}
                marks={intervalMarks}
                min={0}
                max={barValues.length - 1}
                valueLabelDisplay="auto"
                valueLabelFormat={(index) => barValues[index]}
              />
            </Box>
          </Paper>
        </Grid>

        {/* After Reference Configuration */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Cues After Reference Point
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <FormControl fullWidth margin="normal">
              <InputLabel id="after-reference-label">
                Reference Point (After)
              </InputLabel>
              <Select
                labelId="after-reference-label"
                name="afterReference"
                value={config.afterReference}
                label="Reference Point (After)"
                onChange={handleInputChange}
              >
                <MenuItem value="lastHotCue">Last Hot Cue</MenuItem>
                <MenuItem value="specificHotCue">Specific Hot Cue</MenuItem>
                <MenuItem value="outro">Outro Point</MenuItem>
              </Select>
            </FormControl>

            {config.afterReference === "specificHotCue" && (
              <FormControl fullWidth margin="normal">
                <InputLabel id="specific-after-cue-label">
                  Specific Hot Cue
                </InputLabel>
                <Select
                  labelId="specific-after-cue-label"
                  name="specificAfterCue"
                  value={config.specificAfterCue}
                  label="Specific Hot Cue"
                  onChange={handleInputChange}
                >
                  {["A", "B", "C", "D", "E", "F", "G", "H"].map((letter) => (
                    <MenuItem key={letter} value={letter}>
                      Hot Cue {letter}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Box sx={{ mt: 3 }}>
              <Typography id="after-count-slider" gutterBottom>
                Number of Cues to Add: {config.afterCount}
              </Typography>
              <Slider
                aria-labelledby="after-count-slider"
                value={config.afterCount}
                onChange={handleSliderChange("afterCount")}
                step={1}
                marks
                min={0}
                max={8}
                valueLabelDisplay="auto"
              />
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography id="after-interval-slider" gutterBottom>
                Interval Between Cues (bars): {config.afterInterval}
              </Typography>
              <Slider
                aria-labelledby="after-interval-slider"
                value={getSliderIndex(config.afterInterval)}
                onChange={handleIntervalChange("afterInterval")}
                step={null}
                marks={intervalMarks}
                min={0}
                max={barValues.length - 1}
                valueLabelDisplay="auto"
                valueLabelFormat={(index) => barValues[index]}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Cue Type Configuration */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Cue Type
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <FormControl component="fieldset">
              <RadioGroup
                row
                name="cueType"
                value={config.cueType}
                onChange={handleInputChange}
              >
                <FormControlLabel
                  value="memory"
                  control={<Radio />}
                  label="Memory Cues"
                />
                <FormControlLabel
                  value="hot"
                  control={<Radio />}
                  label="Hot Cues"
                />
              </RadioGroup>
            </FormControl>

            <Box sx={{ mt: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.addCueAtReference}
                    onChange={handleSwitchChange}
                    name="addCueAtReference"
                    color="primary"
                  />
                }
                label="Add memory cue at reference point"
              />
              <Typography variant="body2" color="text.secondary">
                This will place a memory cue exactly at the reference point
                position
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ConfigPanel;
